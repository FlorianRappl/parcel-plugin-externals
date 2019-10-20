const { Packager } = require('parcel-bundler');

class ExternalPackager extends Packager {
  static shouldAddAsset() {
    return false;
  }

  setup() {}

  async addAsset() {}

  getSize() {
    return 0;
  }

  end() {}
}

module.exports = ExternalPackager;
