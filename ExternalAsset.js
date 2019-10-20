const { Asset } = require("parcel-bundler");
const { createHash } = require("crypto");
const { extension, splitRule } = require("./common");

function computeMd5(content) {
  return createHash("md5")
    .update(content || "")
    .digest("hex");
}

class ExternalAsset extends Asset {
  constructor(path, options) {
    super(path, options);
    const rest = path.length - extension.length - 2;
    const rule = path.substr(1, rest);
    const { alias } = splitRule(rule);
    this.content = `module.exports=${alias};`;
  }

  load() {}

  generate() {
    return {
      js: this.content
    };
  }

  generateHash() {
    return Promise.resolve(computeMd5(this.content));
  }
}

module.exports = ExternalAsset;
