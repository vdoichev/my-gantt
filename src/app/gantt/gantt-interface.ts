export interface TaskNode {
  id: number;
  name: string;
  owner: string;
  status: string;
  priority: string;
  start: Date;
  end: Date;
  childrenDate?: Date[];
  children?: TaskNode[];
}

export interface TaskFlatNode {
  id: number;
  name: string;
  owner: string;
  status: string;
  priority: string;
  start: Date;
  end: Date;
  level: number;
  expandable: boolean;
}

export interface TimelineDayCell {
  id: number;
  left: number;
  width: number;
  isWeekend: boolean;
  isWeekStart: boolean;
}

export type ParentMarkerKind = 'start' | 'end';

export interface ParentMarker {
  id: string;
  date: Date;
  dayIndex: number;
  title: string;
  kind: ParentMarkerKind;
}
