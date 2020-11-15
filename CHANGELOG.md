# parcel-plugin-externals Changelog

## 0.5.2

- Fixed failed to bundle when external does not exist (#24)

## 0.5.1

- Changed to use `@parcel/logger` for logging (#21)

## 0.5.0

- Improved path resolution for submodules
- Fixed Node.js 8 compatibility for catch blocks (#17)
- Enhanced documentation for production / development (#19)
- Added alternative return type from factory module (#19)

## 0.4.0

- Improved the documentation
- Added support for fake (virtual) modules (#9)

## 0.3.3

- Fixed symlink resolution of externals

## 0.3.2

- Support symlinks

## 0.3.1

- Allow more flexible use as library
- Typed exports of `utils`

## 0.3.0

- Implemented a way to dynamically choose what (and how) to externalize (#4)
- Fixed exception on browser property set to false (#6)
- Added support for referencing modules directly (#7)

## 0.2.0

- Allow `externals` definition via object (#1)
- Ignore `externals` with `false` or other non-`string` values (#2)

## 0.1.0

- Initial release
