import {AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {
  MatCell, MatCellDef,
  MatColumnDef, MatFooterCell, MatFooterCellDef, MatFooterRow, MatFooterRowDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from '@angular/material/table';
import {FormsModule} from '@angular/forms';
import {GanttHeaderComponent} from '../gantt-header/gantt-header.component';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule} from '@angular/material/tree';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

export interface TaskNode {
  id: number;
  name: string;
  owner: string;
  status: string;
  priority: string;
  start: Date;
  end: Date;
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

@Component({
  selector: 'app-gantt',
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderRowDef,
    MatRowDef,
    FormsModule,
    GanttHeaderComponent,
    MatFooterCell,
    MatFooterCellDef,
    MatFooterRow,
    MatFooterRowDef,
    SplitComponent,
    SplitAreaComponent,
    MatTreeModule,
    MatIconButton,
    MatIcon
  ],
  templateUrl: './gantt-table.component.html',
  styleUrl: './gantt-table.component.css',
})
export class GanttTableComponent implements OnInit, AfterViewInit{

  dayWidth = 52;
  weekWidth = 140;

  today = new Date();
  todayOffset = 0;

  projectStart = new Date(2026, 0, 1);
  projectEnd   = new Date(2027, 0, 1);

  rowHeaderHeight = 66;

  leftColumns = ['name', 'owner', 'status', 'priority'];
  rightColumns = ['gantt'];

  private scrollTry = 0;
  private readonly maxScrollTries = 60; // ~1 сек при rAF

  EXAMPLE_DATA: TaskNode[] = [
    {
      id: 1,
      name: 'Причал № 1',
      owner: '125',
      status: '',
      priority: '',
      start: new Date('2026-01-02'),
      end: new Date('2026-01-10'),
      children: [
        { id: 21, name: 'LADY JAMILA, 9316983, Балкер', owner: '110', status: 'In Progress', priority: 'High', start: new Date('2026-01-02'), end: new Date('2026-01-05') },
        { id: 22, name: 'HIGHLAND-A, 9194452, Суховантаж', owner: '78', status: 'In Progress', priority: 'High', start: new Date('2026-01-07'), end: new Date('2026-01-10') },
      ]
    },
    {
      id: 2,
      name: 'Причал № 34',
      owner: '225,7',
      status: '',
      priority: '',
      start: new Date('2026-01-08'),
      end: new Date('2026-02-05'),
      children: [
        { id: 31, name: 'KAVO ALKYON, 9291121, Балкер', owner: '300', status: 'Open', priority: 'Medium', start: new Date('2026-01-08'), end: new Date('2026-01-15') },
      ]
    }
  ];

  private _transformer = (node: TaskNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      id: node.id,
      name: node.name,
      owner: node.owner,
      status: node.status,
      priority: node.priority,
      start: node.start,
      end: node.end,
      level,
    };
  };

  treeControl = new FlatTreeControl<TaskFlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  tableDataSource = new MatTableDataSource<TaskFlatNode>();
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  private parentMap = new Map<TaskFlatNode, TaskFlatNode | null>();

  updateTableData() {
    this.tableDataSource.data = this.treeControl.dataNodes.filter(node =>
      this.isVisible(node)
    );
  }

  buildParentMap() {
    this.parentMap.clear();

    const stack: TaskFlatNode[] = [];

    for (const node of this.treeControl.dataNodes) {
      while (stack.length && stack[stack.length - 1].level >= node.level) {
        stack.pop();
      }

      const parent = stack.length
        ? stack[stack.length - 1]
        : null;

      this.parentMap.set(node, parent);
      stack.push(node);
    }
  }

  isVisible(node: TaskFlatNode): boolean {
    if (node.level === 0) return true;

    let parent = this.getParent(node);
    while (parent) {
      if (!this.treeControl.isExpanded(parent)) {
        return false;
      }
      parent = this.getParent(parent);
    }
    return true;
  }

  getParent(node: TaskFlatNode): TaskFlatNode | null {
    return this.parentMap.get(node) ?? null;
  }

  ngOnInit(): void {
    this.dataSource.data = this.EXAMPLE_DATA;
    this.applyProjectRangeFromData();
    this.buildParentMap();

    this.treeControl.expansionModel.changed.subscribe(() => {
      this.updateTableData();
      requestAnimationFrame(() => {
        const currentLeft = this.xScroll?.nativeElement?.scrollLeft ?? 0;
        this.onGanttScroll(currentLeft);
      });
    });

    this.updateTableData();
    this.updateTodayOffset();
  }

  @ViewChild(GanttHeaderComponent, { read: ElementRef })
  headerEl!: ElementRef<HTMLElement>;

  @ViewChildren('timeline')
  timelines!: QueryList<ElementRef<HTMLElement>>;

  @ViewChildren('leftRow', { read: ElementRef })
  leftRows!: QueryList<ElementRef<HTMLElement>>;

  @ViewChild('todayLine', { read: ElementRef })
  todayLine!: ElementRef<HTMLElement>;

  @ViewChild('xScroll', { read: ElementRef })
  xScroll!: ElementRef<HTMLDivElement>;

  @ViewChild('rightArea', { read: ElementRef })
  rightArea!: ElementRef<HTMLDivElement>;

  rowHeights: number[] = [];
  private ro = new ResizeObserver(() => this.syncRowHeights());

  ngAfterViewInit() {
    this.syncRowHeights();

    this.leftRows.forEach(r =>
      this.ro.observe(r.nativeElement)
    );

    this.timelines.changes.subscribe(() => {
      requestAnimationFrame(() => {
        const currentLeft = this.xScroll?.nativeElement?.scrollLeft ?? 0;
        this.onGanttScroll(currentLeft);
      });
    });

    this.updateTodayOffset();

    this.scrollTry = 0;
    requestAnimationFrame(() => this.waitForScrollableAndScrollToToday());
  }

  private waitForScrollableAndScrollToToday() {
    const el = this.xScroll?.nativeElement;
    const rt = this.rightArea?.nativeElement;

    if (!el || !rt) return;

    const viewport = rt.clientWidth;
    const scrollWidth = el.scrollWidth;

    if (viewport <= 0 || scrollWidth <= 0) {
      if (this.scrollTry++ < this.maxScrollTries) {
        requestAnimationFrame(() => this.waitForScrollableAndScrollToToday());
      }
      return;
    }

    if (scrollWidth > viewport + 1) {
      // ✅ today у левого края при загрузке
      this.scrollToToday('start');
      return;
    }

    if (this.scrollTry++ < this.maxScrollTries) {
      requestAnimationFrame(() => this.waitForScrollableAndScrollToToday());
    }
  }

  syncRowHeights() {
    requestAnimationFrame(() => {
      this.rowHeights =
        this.leftRows.map(r =>
          r.nativeElement.getBoundingClientRect().height
        );
    });
  }

  onGanttScroll(left: number) {
    const x = -left;

    this.headerEl.nativeElement.style.transform =
      `translateX(${x}px)`;

    this.timelines.forEach(t =>
      t.nativeElement.style.transform =
        `translateX(${x}px)`
    );

    // ✅ ВАЖНО: линия "сегодня" должна двигаться вместе со шкалой
    if (this.todayLine) {
      this.todayLine.nativeElement.style.transform = `translateX(${x}px)`;
    }
  }

  private toUtcDay(d: Date): number {
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private diffDays(a: Date, b: Date): number {
    return (this.toUtcDay(a) - this.toUtcDay(b)) / 86400000;
  }

  offset(task: TaskFlatNode): number {
    const days = this.diffDays(task.start, this.projectStart);
    return days * (this.dayWidth);
  }

  width(task: TaskFlatNode): number {
    const days =
      this.diffDays(task.end, task.start) + 1;
    return days * (this.dayWidth);
  }

  startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  startOfWeek(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private startOfYear(d: Date): Date {
    return new Date(d.getFullYear(), 0, 1);
  }

  private startOfNextYear(d: Date): Date {
    return new Date(d.getFullYear() + 1, 0, 1);
  }

  private applyProjectRangeFromData() {
    const today = this.startOfDay(this.today);

    const all: TaskNode[] = [];
    const walk = (nodes: TaskNode[]) => {
      for (const n of nodes) {
        all.push(n);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(this.EXAMPLE_DATA);

    const dates: Date[] = [today];
    for (const t of all) {
      if (t.start) dates.push(this.startOfDay(t.start));
      if (t.end) dates.push(this.startOfDay(t.end));
    }

    let min = dates[0];
    let max = dates[0];
    for (const d of dates) {
      if (d < min) min = d;
      if (d > max) max = d;
    }

    // расширяем до границ года для красивой шкалы
    this.projectStart = this.startOfYear(min);
    this.projectEnd = this.startOfNextYear(max);

    this.updateTodayOffset();
  }


  updateTodayOffset() {
    const msPerDay = 86400000;

    const today = this.startOfDay(this.today);
    const start = this.startOfDay(this.projectStart);
    const end = this.startOfDay(this.projectEnd);

    if (today <= start) {
      this.todayOffset = 0;
      return;
    }

    if (today >= end) {
      this.todayOffset = ((end.getTime() - start.getTime()) / msPerDay) * (this.dayWidth);
      return;
    }

    const days = (today.getTime() - start.getTime()) / msPerDay;
    this.todayOffset = days * (this.dayWidth) + this.dayWidth / 2;
  }


  private get stepPx(): number {
    return (this.dayWidth)
  }

  scrollToToday(align: 'center' | 'start' = 'center') {
    if (!this.xScroll) return;

    const el = this.xScroll.nativeElement;
    const rt = this.rightArea?.nativeElement;
    if (!rt) return;

    if (el.scrollWidth <= rt.clientWidth) return;

    const viewport = rt.clientWidth;

    // todayOffset у нас в центре клетки → чтобы показать клетку с today в начале,
    // смещаемся на половину шага влево и добавляем небольшой отступ
    const leftPadding = 8; // можно 0/8/16 как нравится

    let target =
      align === 'start'
        ? (this.todayOffset - this.stepPx / 2 - leftPadding)
        : (this.todayOffset - viewport / 2);

    target = Math.max(0, Math.min(target, el.scrollWidth - viewport));

    el.scrollLeft = target;
    this.onGanttScroll(target);
  }


  get ganttContentWidth(): number {
    const days =
      (this.projectEnd.getTime() - this.projectStart.getTime()) / 86400000;

    return days * (this.dayWidth)
  }
}
