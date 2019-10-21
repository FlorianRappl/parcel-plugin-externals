# parcel-plugin-externals

[![Build Status](https://florianrappl.visualstudio.com/parcel-plugin-externals/_apis/build/status/FlorianRappl.parcel-plugin-externals?branchName=master)](https://florianrappl.visualstudio.com/parcel-plugin-externals/_build/latest?definitionId=14&branchName=master)
[![npm](https://img.shields.io/npm/v/parcel-plugin-externals.svg)](https://www.npmjs.com/package/parcel-plugin-externals)
[![GitHub tag](https://img.shields.io/github/tag/FlorianRappl/parcel-plugin-externals.svg)](https://github.com/FlorianRappl/parcel-plugin-externals/releases)
[![GitHub issues](https://img.shields.io/github/issues/FlorianRappl/parcel-plugin-externals.svg)](https://github.com/FlorianRappl/parcel-plugin-externals/issues)

Parcel plugin for declaring externals. These externals will not be bundled. :package:

## Usage

As with any other Parcel plugin you should make sure to have the Parcel bundler installed and the plugin referenced from the *package.json* of your project.

The *package.json* has to be changed to either contain `peerDependencies` or `externals`. The latter is more flexible.

Consider the following snippet (from *package.json*):

```json
{
  "peerDependencies": {
    "react": "*"
  }
}
```

This plugin will omit React from your bundle. Instead, a call to `require('react')` will be left over. If the global require inserted by Parcel does not know how to resolve it you will face an error.

Potentially, instead you want to hint Parcel that you already have a global available coming from another script. The `externals` definition can help you.

Consider the following snippet (from *package.json*):

```json
{
  "externals": {
    "react": "React"
  }
}
```

Here we tell the plugin to alias the `react` module with `React`. In this case we reference a global variable `React`, which obviously must exist.

**Note**: Don't confuse this with the abilities coming from [parcel-plugin-html-externals](https://github.com/stoically/parcel-plugin-html-externals). Values that are non-string instances will be ignored. So you can actually use both plugins, `parcel-plugin-externals` and `parcel-plugin-html-externals` if you want to (or just one of the two).

The object syntax is a shorthand for combining the keys and values for a replacement expression. The snippet above is acutally equalivant to:

```json
{
  "externals": [
    "react => React"
  ]
}
```

Expressions could be more complex:

```json
{
  "externals": [
    "react => window.dependencies.React"
  ]
}
```

In this case `dependencies` must exist globally with `React` being one of its properties.

Alternatively, you could forward one module to another with `require`:

```json
{
  "externals": [
    "react => require('preact')"
  ]
}
```

**Important**: This is an early version of the plugin. Please give feedback [on GitHub](https://github.com/FlorianRappl/parcel-plugin-externals/issues), especially regarding configuration and syntax. The idea is to keep the plugin simple and the options straight and to the point.

## Changelog

This project adheres to [semantic versioning](https://semver.org).

You can find the changelog in the [CHANGELOG.md](CHANGELOG.md) file.

## License

This plugin is released using the MIT license. For more information see the [LICENSE file](LICENSE).
