declare module 'segmentit' {
  export interface SegmentOptions {
    simple?: boolean;
    stripPunctuation?: boolean;
    stripStopword?: boolean;
    convertSynonym?: boolean;
  }

  export class Segment {
    doSegment(text: string, options?: SegmentOptions): string[];
  }

  export function useDefault(segment: Segment): Segment;

  // CJS 模块经 ESM 互操作后，默认导出为整个 exports 对象
  const segmentit: {
    Segment: typeof Segment;
    useDefault: typeof useDefault;
  };
  export default segmentit;
}