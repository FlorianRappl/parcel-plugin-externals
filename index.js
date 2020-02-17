const {
  extendBundlerWithExternals,
  retrieveExternals,
  findTarget
} = require("./utils");

module.exports = function(bundler) {
  const target = findTarget(bundler.options.rootDir);
  const externals = retrieveExternals(target);
  extendBundlerWithExternals(bundler, externals);
};
