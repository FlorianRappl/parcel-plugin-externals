const { readFileSync, existsSync } = require("fs");
const { dirname, resolve } = require("path");
const { extension, splitRule } = require("./common");

function resolveModule(rule, targetDir) {
  const { name } = splitRule(rule);

  try {
    const moduleDefinitionFile = `${name}/package.json`;
    const moduleDefinition = require(moduleDefinitionFile);
    const replacements = {};

    if (moduleDefinition) {
      const moduleRoot = dirname(require.resolve(moduleDefinitionFile));

      if (typeof moduleDefinition.browser === "string") {
        return [
          {
            name,
            rule,
            path: resolve(moduleRoot, moduleDefinition.browser)
          }
        ];
      }

      if (typeof moduleDefinition.browser === "object") {
        Object.keys(moduleDefinition.browser).forEach(repl => {
          const desired = moduleDefinition.browser[repl];

          if (desired) {
            replacements[resolve(moduleRoot, repl)] = resolve(
              moduleRoot,
              desired
            );
          }
        });
      }

      if (typeof moduleDefinition.module === "string") {
        const modulePath = resolve(moduleRoot, moduleDefinition.module);
        return [
          {
            name,
            rule,
            path: replacements[modulePath] || modulePath
          }
        ];
      }
    }

    const directPath = require.resolve(name, {
      paths: [targetDir]
    });

    return [
      ...Object.keys(replacements).map(r => ({
        name,
        rule,
        path: replacements[r]
      })),
      {
        name,
        rule,
        path: directPath
      }
    ];
  } catch (ex) {
    console.warn(`Could not find module ${name}.`);
    return [];
  }
}

function resolvePackage(dir) {
  return resolve(dir, "package.json");
}

function wrapFactory(ruleFactory) {
  return path => {
    const rule = ruleFactory(path);

    if (rule !== undefined) {
      return `/${rule}.${extension}`;
    }

    return path;
  };
}

function makeResolver(targetDir, externalNames) {
  const externals = [];

  for (const name of externalNames) {
    const modules = resolveModule(name, targetDir);
    externals.push(...modules);
  }

  return path => {
    const [external] = externals.filter(m => m.path === path);

    if (external) {
      path = `/${external.rule}.${extension}`;
    }

    return path;
  };
}

function provideSupportForExternals(proto, resolver) {
  const ra = proto.getLoadedAsset;
  proto.getLoadedAsset = function(path) {
    const result = resolver(path);
    return ra.call(this, result);
  };
}

function retrieveExternals(rootDir) {
  const path = resolvePackage(rootDir);

  if (existsSync(path)) {
    try {
      const content = readFileSync(path, "utf8");
      const data = JSON.parse(content);
      const plain = Object.keys(data.peerDependencies || {});
      const externals = data.externals || [];

      if (Array.isArray(externals)) {
        const values = externals.concat(plain);
        return makeResolver(rootDir, values);
      } else if (typeof externals === "object") {
        const values = Object.keys(externals)
          .filter(name => typeof externals[name] === "string")
          .map(name => `${name} => ${externals[name]}`)
          .concat(plain);
        return makeResolver(rootDir, values);
      } else if (typeof externals === "string") {
        const externalPath = resolve(rootDir, externals);

        if (!existsSync(externalPath)) {
          console.warn(
            `Could not find "${externals}". Looked in "${externalPath}".`
          );
        } else {
          const resolver = require(externalPath);

          if (typeof resolver === "function") {
            return wrapFactory(resolver);
          }

          console.warn(
            `Did not find a function. Expected to find something like "module.exports = function() {}".`
          );
        }
      }

      console.warn(
        `"externals" seem to be of wrong type. Expected <Array | object> but found <${typeof externals}>`
      );
      return plain;
    } catch (ex) {
      console.error(ex);
    }
  }

  return [];
}

function findTarget(rootDir) {
  let parent = rootDir;

  do {
    const path = resolvePackage(parent);

    if (existsSync(path)) {
      return parent;
    }

    const grandParent = resolve(parent, "..");

    if (grandParent === parent) {
      return rootDir;
    }

    parent = grandParent;
  } while (true);
}

module.exports = {
  provideSupportForExternals,
  retrieveExternals,
  findTarget
};
