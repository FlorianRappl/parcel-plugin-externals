export interface PathAliasResolver {
  (path: string): string;
}

export function findTarget(root: string): string;

export function retrieveExternals(root: string): PathAliasResolver;

export function combineExternals(
  rootDir: string,
  plain: Array<string>,
  externals:
    | Array<string>
    | Record<string, string>
    | ((path: string) => string),
  alias: Record<string, string>
): PathAliasResolver;

export function extendBundlerWithExternals(
  bundler: any,
  externals: PathAliasResolver
): void;

export function provideSupportForExternals(
  bundler: any,
  resolver: PathAliasResolver
): void;
