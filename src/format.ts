import type { KeyPathSegment, PathStyle } from './types.js';

export function formatPath(
  segments: readonly KeyPathSegment[],
  style: PathStyle = 'dot',
  separator = '.'
): string {
  if (style === 'bracket') {
    return formatBracketPath(segments);
  }

  return formatDotPath(segments, separator);
}

export function formatDotPath(segments: readonly KeyPathSegment[], separator = '.'): string {
  return segments
    .map((segment) =>
      typeof segment === 'number'
        ? String(segment)
        : escapeDotSegment(segment, separator)
    )
    .join(separator);
}

export function formatBracketPath(segments: readonly KeyPathSegment[]): string {
  return segments
    .map((segment, index) => {
      if (typeof segment === 'number') {
        return `[${segment}]`;
      }

      if (index === 0 && isIdentifier(segment)) {
        return segment;
      }

      return `[${JSON.stringify(segment)}]`;
    })
    .join('');
}

function escapeDotSegment(segment: string, separator: string): string {
  return segment
    .replaceAll('\\', '\\\\')
    .replaceAll(separator, `\\${separator}`);
}

function isIdentifier(value: string): boolean {
  return /^[$A-Z_a-z][$\w]*$/.test(value);
}
