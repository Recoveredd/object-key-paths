import { formatPath } from './format.js';
import type {
  KeyPathEntry,
  KeyPathOptions,
  KeyPathSegment,
  ResolvedKeyPathOptions,
  TraversalContext
} from './types.js';

export type {
  CircularHandling,
  KeyPathEntry,
  KeyPathOptions,
  KeyPathSegment,
  PathStyle,
  TraversalContext
} from './types.js';

export { formatBracketPath, formatDotPath, formatPath } from './format.js';

export function getKeyPaths(value: unknown, options: KeyPathOptions = {}): string[] {
  return getPathEntries(value, {
    includeIntermediate: true,
    ...options
  }).map((entry) => entry.path);
}

export function getLeafPaths(value: unknown, options: KeyPathOptions = {}): string[] {
  return getPathEntries(value, {
    includeIntermediate: false,
    includeLeaves: true,
    ...options
  }).map((entry) => entry.path);
}

export function getKeySegments(
  value: unknown,
  options: KeyPathOptions = {}
): KeyPathSegment[][] {
  return getPathEntries(value, {
    includeIntermediate: true,
    ...options
  }).map((entry) => [...entry.segments]);
}

export function getPathEntries(value: unknown, options: KeyPathOptions = {}): KeyPathEntry[] {
  const resolved = resolveOptions(options);
  const entries: KeyPathEntry[] = [];

  walk(value, [], undefined, [], resolved, entries);

  return entries;
}

function walk(
  value: unknown,
  path: KeyPathSegment[],
  parent: unknown,
  ancestors: object[],
  options: ResolvedKeyPathOptions,
  entries: KeyPathEntry[]
): void {
  if (entries.length >= options.limit) {
    return;
  }

  const depth = path.length;
  const circular = isCircular(value, ancestors);

  if (circular && options.onCircular === 'throw') {
    throw new TypeError(`Circular reference found at path "${formatPath(path, options.pathStyle, options.separator)}".`);
  }

  const childKeys = circular ? [] : getChildKeys(value, path, parent, options);
  const isAtMaxDepth = depth >= options.maxDepth;
  const isLeaf = circular || isAtMaxDepth || childKeys.length === 0;
  const includeEntry =
    (depth > 0 || options.includeRoot) &&
    ((isLeaf && options.includeLeaves) || (!isLeaf && options.includeIntermediate));

  if (includeEntry) {
    entries.push({
      path: formatPath(path, options.pathStyle, options.separator),
      segments: [...path],
      value,
      depth,
      isLeaf,
      isCircular: circular
    });

    if (entries.length >= options.limit) {
      return;
    }
  }

  if (circular || isAtMaxDepth || childKeys.length === 0) {
    return;
  }

  const nextAncestors = isObjectLike(value) ? [...ancestors, value] : ancestors;

  for (const key of childKeys) {
    const child = readChild(value, key);
    walk(child, [...path, key], value, nextAncestors, options, entries);

    if (entries.length >= options.limit) {
      break;
    }
  }
}

function resolveOptions(options: KeyPathOptions): ResolvedKeyPathOptions {
  const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;
  const limit = options.limit ?? Number.POSITIVE_INFINITY;
  const pathStyle = options.pathStyle ?? 'dot';
  const separator = options.separator ?? '.';
  const onCircular = options.onCircular ?? 'skip';

  if (!Number.isInteger(maxDepth) && maxDepth !== Number.POSITIVE_INFINITY) {
    throw new TypeError('maxDepth must be an integer.');
  }

  if (maxDepth < 0) {
    throw new RangeError('maxDepth must be greater than or equal to 0.');
  }

  if (!Number.isInteger(limit) && limit !== Number.POSITIVE_INFINITY) {
    throw new TypeError('limit must be an integer.');
  }

  if (limit < 0) {
    throw new RangeError('limit must be greater than or equal to 0.');
  }

  if (pathStyle !== 'dot' && pathStyle !== 'bracket') {
    throw new TypeError('pathStyle must be "dot" or "bracket".');
  }

  if (typeof separator !== 'string' || separator.length === 0) {
    throw new TypeError('separator must be a non-empty string.');
  }

  if (onCircular !== 'skip' && onCircular !== 'throw') {
    throw new TypeError('onCircular must be "skip" or "throw".');
  }

  if (options.isTraversable !== undefined && typeof options.isTraversable !== 'function') {
    throw new TypeError('isTraversable must be a function.');
  }

  return {
    includeIntermediate: options.includeIntermediate ?? true,
    includeLeaves: options.includeLeaves ?? true,
    includeArrays: options.includeArrays ?? true,
    includeRoot: options.includeRoot ?? false,
    maxDepth,
    limit,
    pathStyle,
    separator,
    onCircular,
    ...(options.isTraversable ? { isTraversable: options.isTraversable } : {})
  };
}

function getChildKeys(
  value: unknown,
  path: readonly KeyPathSegment[],
  parent: unknown,
  options: ResolvedKeyPathOptions
): KeyPathSegment[] {
  if (!shouldTraverse(value, path, parent, options)) {
    return [];
  }

  if (Array.isArray(value)) {
    return Object.keys(value).map((key) => (isArrayIndexKey(key) ? Number(key) : key));
  }

  return Object.keys(value as Record<string, unknown>);
}

function shouldTraverse(
  value: unknown,
  path: readonly KeyPathSegment[],
  parent: unknown,
  options: ResolvedKeyPathOptions
): boolean {
  const context: TraversalContext = {
    path,
    depth: path.length,
    parent
  };

  if (options.isTraversable) {
    return options.isTraversable(value, context);
  }

  if (Array.isArray(value)) {
    return options.includeArrays;
  }

  return isPlainObject(value);
}

function readChild(value: unknown, key: KeyPathSegment): unknown {
  return (value as Record<string, unknown> | unknown[])[key as keyof typeof value];
}

function isCircular(value: unknown, ancestors: object[]): boolean {
  return isObjectLike(value) && ancestors.includes(value);
}

function isObjectLike(value: unknown): value is object {
  return Boolean(value) && typeof value === 'object';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObjectLike(value) || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isArrayIndexKey(value: string): boolean {
  if (value === '') {
    return false;
  }

  const index = Number(value);
  return Number.isSafeInteger(index) && index >= 0 && String(index) === value;
}
