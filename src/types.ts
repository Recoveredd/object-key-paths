export type KeyPathSegment = string | number;

export type PathStyle = 'dot' | 'bracket';

export type CircularHandling = 'skip' | 'throw';

export interface TraversalContext {
  readonly path: readonly KeyPathSegment[];
  readonly depth: number;
  readonly parent: unknown;
}

export interface KeyPathOptions {
  /**
   * Include non-leaf containers such as `user` and `user.address`.
   *
   * Defaults to `true` for `getKeyPaths` and `getPathEntries`, and `false` for
   * `getLeafPaths`.
   */
  includeIntermediate?: boolean;

  /**
   * Include leaves such as primitive values and empty containers.
   *
   * @default true
   */
  includeLeaves?: boolean;

  /**
   * Walk into arrays and include numeric indexes in paths.
   *
   * @default true
   */
  includeArrays?: boolean;

  /**
   * Include an explicit root entry with an empty path.
   *
   * @default false
   */
  includeRoot?: boolean;

  /**
   * Maximum number of path segments to traverse.
   */
  maxDepth?: number;

  /**
   * Maximum number of entries to return.
   */
  limit?: number;

  /**
   * String formatting for returned paths.
   *
   * @default 'dot'
   */
  pathStyle?: PathStyle;

  /**
   * Separator used by dot-style paths.
   *
   * @default '.'
   */
  separator?: string;

  /**
   * How circular references should be handled.
   *
   * @default 'skip'
   */
  onCircular?: CircularHandling;

  /**
   * Override whether a value should be traversed.
   */
  isTraversable?: (value: unknown, context: TraversalContext) => boolean;
}

export interface KeyPathEntry {
  readonly path: string;
  readonly segments: readonly KeyPathSegment[];
  readonly value: unknown;
  readonly depth: number;
  readonly isLeaf: boolean;
  readonly isCircular: boolean;
}

export interface ResolvedKeyPathOptions {
  includeIntermediate: boolean;
  includeLeaves: boolean;
  includeArrays: boolean;
  includeRoot: boolean;
  maxDepth: number;
  limit: number;
  pathStyle: PathStyle;
  separator: string;
  onCircular: CircularHandling;
  isTraversable?: (value: unknown, context: TraversalContext) => boolean;
}
