declare module 'segmentit' {
  export class Segment {
    doSegment(text: string, options?: { simple?: boolean }): string[];
  }

  export function useDefault(segment: Segment): Segment;
}
