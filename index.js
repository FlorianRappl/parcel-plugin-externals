const { extension } = require("./common");
const {
  provideSupportForExternals,
  retrieveExternals,
  findTarget
} = require("./utils");

module.exports = function(bundler) {
  const target = findTarget(bundler.options.rootDir);
  const externals = retrieveExternals(target);
  provideSupportForExternals(bundler.__proto__, externals, target);

  bundler.addAssetType(extension, require.resolve("./ExternalAsset"));
  bundler.addPackager(extension, require.resolve("./ExternalPackager"));
};
