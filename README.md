# object-key-paths

[![CI](https://github.com/Recoveredd/object-key-paths/actions/workflows/ci.yml/badge.svg)](https://github.com/Recoveredd/object-key-paths/actions/workflows/ci.yml)

List nested key paths from JavaScript objects and arrays.

`object-key-paths` is a small TypeScript utility for JSON tooling, admin dashboards, docs generators, table builders, import/export mapping and schema inspection. It is a modern, typed alternative to older deep key listing packages.

## Package quality

- TypeScript types are generated from the source.
- ESM-only package with no runtime dependencies.
- Marked as side-effect free for bundlers.
- Tested on Node.js 20 and 22 with GitHub Actions.
- Handles arrays, empty containers and circular references deliberately.

## Install

```bash
npm install object-key-paths
```

## Quick Start

```ts
import { getKeyPaths, getLeafPaths, getPathEntries } from 'object-key-paths';

const data = {
  user: {
    name: 'Ada',
    address: {
      city: 'Paris'
    }
  },
  tags: ['admin', 'ops']
};

getKeyPaths(data);
// ['user', 'user.name', 'user.address', 'user.address.city', 'tags', 'tags.0', 'tags.1']

getLeafPaths(data);
// ['user.name', 'user.address.city', 'tags.0', 'tags.1']

getPathEntries(data);
// [
//   { path: 'user', segments: ['user'], value: { ... }, depth: 1, isLeaf: false },
//   { path: 'user.name', segments: ['user', 'name'], value: 'Ada', depth: 2, isLeaf: true },
//   ...
// ]
```

## API

### `getKeyPaths(value, options?)`

Returns string paths for both intermediate containers and leaves.

```ts
getKeyPaths({
  order: {
    customer: {
      city: 'Paris'
    }
  }
});
// ['order', 'order.customer', 'order.customer.city']
```

### `getLeafPaths(value, options?)`

Returns only paths that point to leaves. Empty objects and empty arrays are treated as leaves.

```ts
getLeafPaths({
  order: {
    id: 'A-001',
    lines: []
  }
});
// ['order.id', 'order.lines']
```

### `getKeySegments(value, options?)`

Returns paths as segment arrays instead of formatted strings.

```ts
getKeySegments({ users: [{ name: 'Ada' }] });
// [['users'], ['users', 0], ['users', 0, 'name']]
```

### `getPathEntries(value, options?)`

Returns metadata for each path.

```ts
const [entry] = getPathEntries({ user: { name: 'Ada' } });

entry;
// {
//   path: 'user',
//   segments: ['user'],
//   value: { name: 'Ada' },
//   depth: 1,
//   isLeaf: false,
//   isCircular: false
// }
```

### `formatDotPath(segments, separator?)`

Formats a segment array as a dot path. Separators and backslashes inside keys are escaped.

```ts
formatDotPath(['user.profile', 'name']);
// 'user\\.profile.name'
```

### `formatBracketPath(segments)`

Formats a segment array as a bracket path.

```ts
formatBracketPath(['users', 0, 'full.name']);
// 'users[0]["full.name"]'
```

## Options

```ts
interface KeyPathOptions {
  includeIntermediate?: boolean;
  includeLeaves?: boolean;
  includeArrays?: boolean;
  includeRoot?: boolean;
  maxDepth?: number;
  pathStyle?: 'dot' | 'bracket';
  separator?: string;
  onCircular?: 'skip' | 'throw';
  isTraversable?: (value: unknown, context: TraversalContext) => boolean;
}
```

### `pathStyle`

Use bracket paths when keys may contain dots or when the output should be compatible with JavaScript-like path notation.

```ts
getLeafPaths(
  {
    users: [{ 'full.name': 'Ada' }]
  },
  { pathStyle: 'bracket' }
);
// ['users[0]["full.name"]']
```

### `maxDepth`

Stop traversal after a fixed number of path segments.

```ts
getKeyPaths({ a: { b: { c: 1 } } }, { maxDepth: 2 });
// ['a', 'a.b']
```

### `includeArrays`

Disable array traversal when arrays should be treated as values.

```ts
getLeafPaths({ tags: ['admin', 'ops'] }, { includeArrays: false });
// ['tags']
```

### `onCircular`

Circular references are included as leaf entries and not descended into by default.

```ts
const data: { self?: unknown } = {};
data.self = data;

getPathEntries(data);
// [{ path: 'self', segments: ['self'], value: data, depth: 1, isLeaf: true, isCircular: true }]
```

Use `{ onCircular: 'throw' }` when circular data should fail fast.

## Ecosystem recipes

Use with `object-path-kit` to inspect a JSON object and then safely read values from the discovered paths:

```ts
import { getLeafPaths } from 'object-key-paths';
import { getPath } from 'object-path-kit';

const paths = getLeafPaths(report, {
  pathStyle: 'bracket'
});

const values = paths.map((path) => ({
  path,
  value: getPath(report, path)
}));
```

Use with `array-table-kit` to turn discovered paths into a Markdown inventory:

```ts
import { arrayToMarkdownTable } from 'array-table-kit';
import { getPathEntries } from 'object-key-paths';

const markdown = arrayToMarkdownTable(getPathEntries(report), {
  columns: [
    { key: 'path', header: 'Path' },
    { key: 'depth', header: 'Depth' },
    { key: 'isLeaf', header: 'Leaf' }
  ]
});
```

## Notes

- Only own enumerable string keys are traversed.
- Arrays are traversed by numeric index unless `includeArrays` is disabled.
- `Date`, `Map`, `Set`, functions and class instances are treated as leaf values by default.
- Circular references are not followed.

## License

MIT
