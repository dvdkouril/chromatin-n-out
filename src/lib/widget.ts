export type Widget = {
    id: number;
    level: number;
    binsNum: number;
    domain: { start: number; end: number };
    selections: { start: number; end: number; color: string }[];
    widgets: Widget[];
  };