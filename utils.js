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
        return {
          name,
          rule,
          path: resolve(moduleRoot, moduleDefinition.browser)
        };
      }

      if (typeof moduleDefinition.browser === "object") {
        Object.keys(moduleDefinition.browser).forEach(repl => {
          const desired = moduleDefinition.browser[repl];
          replacements[resolve(moduleRoot, repl)] = resolve(
            moduleRoot,
            desired
          );
        });
      }

      if (typeof moduleDefinition.module === "string") {
        const modulePath = resolve(moduleRoot, moduleDefinition.module);
        return {
          name,
          rule,
          path: replacements[modulePath] || modulePath
        };
      }
    }

    const directPath = require.resolve(name, {
      paths: [targetDir]
    });
    return {
      name,
      rule,
      path: replacements[directPath] || directPath
    };
  } catch (ex) {
    console.warn(`Could not find module ${name}.`);
    return undefined;
  }
}

function resolvePackage(dir) {
  return resolve(dir, "package.json");
}

function provideSupportForExternals(proto, externalNames, targetDir) {
  const externals = externalNames
    .map(name => resolveModule(name, targetDir))
    .filter(m => !!m);
  const ra = proto.getLoadedAsset;
  proto.getLoadedAsset = function(path) {
    const [external] = externals.filter(m => m.path === path);

    if (external) {
      path = `/${external.rule}.${extension}`;
    }

    return ra.call(this, path);
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
        return externals.concat(plain);
      } else if (typeof externals === "object") {
        return Object.keys(externals)
          .filter(name => typeof externals[name] === 'string')
          .map(name => `${name} => ${externals[name]}`)
          .concat(plain);
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
