import { describe, expect, test } from 'vitest';
import {
  formatBracketPath,
  formatDotPath,
  getKeyPaths,
  getKeySegments,
  getLeafPaths,
  getPathEntries
} from '../src/index.js';

describe('object-key-paths', () => {
  test('lists intermediate and leaf paths by default', () => {
    const data = {
      user: {
        name: 'Ada',
        address: {
          city: 'Paris'
        }
      },
      active: true
    };

    expect(getKeyPaths(data)).toEqual([
      'user',
      'user.name',
      'user.address',
      'user.address.city',
      'active'
    ]);
  });

  test('lists only leaf paths', () => {
    const data = {
      user: {
        name: 'Ada',
        tags: ['admin', 'ops']
      }
    };

    expect(getLeafPaths(data)).toEqual(['user.name', 'user.tags.0', 'user.tags.1']);
  });

  test('returns segment arrays', () => {
    expect(getKeySegments({ users: [{ name: 'Ada' }] })).toEqual([
      ['users'],
      ['users', 0],
      ['users', 0, 'name']
    ]);
  });

  test('returns path entries with values and leaf metadata', () => {
    const entries = getPathEntries({ user: { name: 'Ada' } });

    expect(entries).toEqual([
      {
        path: 'user',
        segments: ['user'],
        value: { name: 'Ada' },
        depth: 1,
        isLeaf: false,
        isCircular: false
      },
      {
        path: 'user.name',
        segments: ['user', 'name'],
        value: 'Ada',
        depth: 2,
        isLeaf: true,
        isCircular: false
      }
    ]);
  });

  test('supports bracket paths', () => {
    const paths = getLeafPaths(
      {
        users: [{ 'full.name': 'Ada' }]
      },
      { pathStyle: 'bracket' }
    );

    expect(paths).toEqual(['users[0]["full.name"]']);
  });

  test('escapes separators and backslashes in dot paths', () => {
    expect(formatDotPath(['a.b', 'c\\d'])).toBe('a\\.b.c\\\\d');
  });

  test('supports custom dot separators', () => {
    expect(getLeafPaths({ a: { b: 1 } }, { separator: '/' })).toEqual(['a/b']);
  });

  test('formats bracket paths with identifiers and quoted keys', () => {
    expect(formatBracketPath(['user', 'full.name', 0, 'city'])).toBe(
      'user["full.name"][0].city'
    );
  });

  test('treats arrays as leaves when array traversal is disabled', () => {
    expect(getLeafPaths({ tags: ['admin'] }, { includeArrays: false })).toEqual(['tags']);
  });

  test('handles sparse arrays without generating undefined paths', () => {
    const rows = ['first', , 'third'];

    expect(getLeafPaths({ rows })).toEqual(['rows.0', 'rows.2']);
  });

  test('includes enumerable custom array keys', () => {
    const rows: string[] & { meta?: string } = ['first'];
    rows.meta = 'source';

    expect(getLeafPaths({ rows })).toEqual(['rows.0', 'rows.meta']);
  });

  test('respects maxDepth', () => {
    expect(getKeyPaths({ a: { b: { c: 1 } } }, { maxDepth: 2 })).toEqual(['a', 'a.b']);
  });

  test('can include the root entry', () => {
    expect(getPathEntries({ a: 1 }, { includeRoot: true })[0]).toMatchObject({
      path: '',
      segments: [],
      depth: 0,
      isLeaf: false
    });
  });

  test('marks circular references and skips descending by default', () => {
    const data: { name: string; self?: unknown } = { name: 'Ada' };
    data.self = data;

    expect(getPathEntries(data).at(-1)).toMatchObject({
      path: 'self',
      isLeaf: true,
      isCircular: true
    });
  });

  test('can throw on circular references', () => {
    const data: { self?: unknown } = {};
    data.self = data;

    expect(() => getKeyPaths(data, { onCircular: 'throw' })).toThrow(
      'Circular reference found at path "self".'
    );
  });

  test('allows custom traversable values', () => {
    const date = new Date('2026-05-12T00:00:00Z');
    const data = { date };

    expect(
      getKeyPaths(data, {
        isTraversable: (value) => Boolean(value) && typeof value === 'object'
      })
    ).toEqual(['date']);
  });

  test('validates maxDepth', () => {
    expect(() => getKeyPaths({}, { maxDepth: -1 })).toThrow('maxDepth');
    expect(() => getKeyPaths({}, { maxDepth: 1.5 })).toThrow('maxDepth');
  });

  test('validates runtime option values', () => {
    expect(() => getKeyPaths({}, { pathStyle: 'slash' as never })).toThrow('pathStyle');
    expect(() => getKeyPaths({}, { separator: '' })).toThrow('separator');
    expect(() => getKeyPaths({}, { onCircular: 'keep' as never })).toThrow('onCircular');
    expect(() => getKeyPaths({}, { isTraversable: true as never })).toThrow('isTraversable');
  });
});
