const { readFileSync, existsSync, realpathSync } = require("fs");
const logger = require("@parcel/logger");
const { dirname, resolve } = require("path");
const { extension, splitRule } = require("./common");

function makeFullName(scope, name) {
  return scope ? `${scope}/${name}` : name;
}

function makePackagePath(fullName) {
  return `${fullName}/package.json`;
}

function inspect(name, alias) {
  let scope = "";
  let path = "";

  if (alias[name] !== undefined) {
    name = alias[name];
  }

  if (name.startsWith("@")) {
    scope = name.substr(0, name.indexOf("/"));
    name = name.replace(`${scope}/`, "");
  }

  if (name.indexOf("/") !== -1) {
    const full = makeFullName(scope, name);

    try {
      require.resolve(makePackagePath(full));
    } catch (ex) {
      path = name.substr(name.indexOf("/") + 1);
      name = name.replace(`/${path}`, "");
    }
  }

  return {
    scope,
    name,
    path,
    fullName: makeFullName(scope, name),
  };
}

function resolveModule(rule, targetDir, alias) {
  const { name } = splitRule(rule);
  const { fullName, path } = inspect(name, alias);

  if (fullName.startsWith("./") || fullName.startsWith("/")) {
    return [
      {
        name,
        rule,
        path: resolve(targetDir, fullName),
      },
    ];
  }

  try {
    const moduleDefinitionFile = makePackagePath(fullName);
    const moduleDefinition = require(moduleDefinitionFile);
    const replacements = {};

    if (moduleDefinition) {
      const moduleRoot = dirname(require.resolve(moduleDefinitionFile));

      if (!path && typeof moduleDefinition.browser === "string") {
        return [
          {
            name,
            rule,
            path: resolve(moduleRoot, moduleDefinition.browser),
          },
        ];
      }

      if (typeof moduleDefinition.browser === "object") {
        Object.keys(moduleDefinition.browser).forEach((repl) => {
          const desired = moduleDefinition.browser[repl];

          if (desired) {
            replacements[resolve(moduleRoot, repl)] = resolve(
              moduleRoot,
              desired
            );
          }
        });
      }

      if (!path && typeof moduleDefinition.module === "string") {
        const modulePath = resolve(moduleRoot, moduleDefinition.module);
        return [
          {
            name,
            rule,
            path: replacements[modulePath] || modulePath,
          },
        ];
      }
    }

    const packageName = path ? `${fullName}/${path}` : fullName;
    const directPath = require.resolve(packageName, {
      paths: [targetDir],
    });

    return [
      ...Object.keys(replacements).map((r) => ({
        name,
        rule,
        path: replacements[r],
      })),
      {
        name,
        rule,
        path: directPath,
      },
    ];
  } catch (ex) {
    logger.warn(`Could not find module ${name}.`);
    return [];
  }
}

function resolvePackage(dir) {
  return resolve(dir, "package.json");
}

function wrapFactory(ruleFactory) {
  return (path) => {
    const rule = ruleFactory(path);

    if (rule !== undefined) {
      return `/${rule}.${extension}`;
    }

    return path;
  };
}

function extendBundlerWithExternals(bundler, externals) {
  provideSupportForExternals(bundler.__proto__, externals);

  bundler.addAssetType(extension, require.resolve("./ExternalAsset"));
  bundler.addPackager(extension, require.resolve("./ExternalPackager"));
}

function findRealPath(path) {
  try {
    return realpathSync(path);
  } catch (ex) {
    return path;
  }
}

function makeResolver(targetDir, externalNames, alias) {
  const externals = [];

  for (const name of externalNames) {
    const modules = resolveModule(name, targetDir, alias);
    externals.push(
      ...modules.map((m) => ({
        ...m,
        path: realpathSync(m.path),
      }))
    );
  }

  return (path) => {
    const normalizedPath = findRealPath(path);
    const [external] = externals.filter((m) => m.path === normalizedPath);

    if (external) {
      path = `/${external.rule}.${extension}`;
    }

    return path;
  };
}

let original;

function provideSupportForExternals(proto, resolver) {
  const ra = original || (original = proto.getLoadedAsset);
  proto.getLoadedAsset = function (path) {
    const result = resolver(path);
    return ra.call(this, result);
  };
}

function combineExternalsPrimitive(rootDir, plain, externals, alias) {
  if (Array.isArray(externals)) {
    const values = externals.concat(plain);
    return makeResolver(rootDir, values, alias);
  } else if (typeof externals === "object") {
    const values = Object.keys(externals)
      .filter((name) => typeof externals[name] === "string")
      .map((name) => `${name} => ${externals[name]}`)
      .concat(plain);
    return makeResolver(rootDir, values, alias);
  } else if (typeof externals === "function") {
    return wrapFactory(externals);
  } else {
    return undefined;
  }
}

function combineExternals(rootDir, plain, externals, alias) {
  const result = combineExternalsPrimitive(rootDir, plain, externals, alias);

  if (result !== undefined) {
    return result;
  } else if (typeof externals === "string") {
    const externalPath = resolve(rootDir, externals);

    if (!existsSync(externalPath)) {
      logger.warn(
        `Could not find "${externals}". Looked in "${externalPath}".`
      );
    } else {
      const resolver = require(externalPath);
      const newResult = combineExternalsPrimitive(
        rootDir,
        plain,
        resolver,
        alias
      );

      if (newResult !== undefined) {
        return newResult;
      }

      logger.warn(
        `Did not find a function or array. Expected to find something like "module.exports = function() {}".`
      );
    }
  }

  logger.warn(
    `"externals" seem to be of wrong type. Expected <Array | object> but found <${typeof externals}>`
  );

  return plain;
}

function retrieveExternals(rootDir) {
  const path = resolvePackage(rootDir);

  if (existsSync(path)) {
    try {
      const content = readFileSync(path, "utf8");
      const data = JSON.parse(content);
      const plain = Object.keys(data.peerDependencies || {});
      const externals = data.externals || [];
      const alias = data.alias || {};
      return combineExternals(rootDir, plain, externals, alias);
    } catch (ex) {
      logger.error(ex);
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
  extendBundlerWithExternals,
  provideSupportForExternals,
  retrieveExternals,
  combineExternals,
  findTarget,
};
