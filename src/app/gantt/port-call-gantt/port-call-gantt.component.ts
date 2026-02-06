import {AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from '@angular/material/table';
import {FormsModule} from '@angular/forms';
import {PortCallGanttCalendarHeaderComponent} from '../port-call-gantt-calendar-header/port-call-gantt-calendar-header.component';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule} from '@angular/material/tree';
import {FlatTreeControl} from '@angular/cdk/tree';
import {ParentMarker, TaskFlatNode, TaskNode, TimelineDayCell} from '../gantt-interface';
import {EXAMPLE_DATA} from '../gant-data';
import {PortCallGanttTable} from '../port-call-gantt-table/port-call-gantt-table';

@Component({
  selector: 'app-port-call-gantt',
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
    SplitComponent,
    SplitAreaComponent,
    MatTreeModule,
    PortCallGanttCalendarHeaderComponent,
    PortCallGanttTable
  ],
  templateUrl: './port-call-gantt.component.html',
  styleUrl: './port-call-gantt.component.css',
})
export class PortCallGanttComponent implements OnInit, AfterViewInit{

  dayWidth = 48;
  weekWidth = 140;

  today = new Date();
  todayOffset = 0;
  private EXAMPLE_DATA = EXAMPLE_DATA;

  private dayIndexForDate(d: Date): number {
    return this.diffDays(this.startOfDay(d), this.projectStart);
  }

  projectStart = new Date(2026, 0, 1);
  projectEnd   = new Date(2027, 0, 1);

  rowHeaderHeight = 64;


  rightColumns = ['gantt'];

  private scrollTry = 0;
  private readonly maxScrollTries = 60; // ~1 сек при rAF



  private readonly nodeById = new Map<number, TaskNode>();

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
    this.indexNodesById();

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

  private indexNodesById() {
    this.nodeById.clear();

    const walk = (nodes: TaskNode[]) => {
      for (const n of nodes) {
        this.nodeById.set(n.id, n);
        if (n.children?.length) walk(n.children);
      }
    };

    walk(this.EXAMPLE_DATA);
  }

  private getTreeNode(flat: TaskFlatNode): TaskNode | undefined {
    return this.nodeById.get(flat.id);
  }

  private formatDate(d: Date): string {
    // компактно, без локалей (чтобы не прыгало)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  isParentRow(node: TaskFlatNode): boolean {
    return node.expandable;
  }

  parentMarkers(node: TaskFlatNode): ParentMarker[] {
    const treeNode = this.getTreeNode(node);
    const children = treeNode?.children ?? [];

    const res: ParentMarker[] = [];

    for (const ch of children) {
      if (ch.start) {
        const date = this.startOfDay(ch.start);
        const dayIndex = this.dayIndexForDate(date);
        res.push({
          id: `${node.id}:${ch.id}:start:${this.toUtcDay(date)}`,
          date,
          dayIndex,
          kind: 'start',
          title: `${ch.name}\nStart: ${this.formatDate(date)}`,
        });
      }

      if (ch.end) {
        const date = this.startOfDay(ch.end);
        const dayIndex = this.dayIndexForDate(date);
        res.push({
          id: `${node.id}:${ch.id}:end:${this.toUtcDay(date)}`,
          date,
          dayIndex,
          kind: 'end',
          title: `${ch.name}\nEnd: ${this.formatDate(date)}`,
        });
      }
    }

    res.sort((a, b) => a.dayIndex - b.dayIndex || (a.kind === 'start' ? -1 : 1));
    return res;
  }

  @ViewChild(PortCallGanttCalendarHeaderComponent, { read: ElementRef })
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
    if (!el) return;

    const viewport = el.clientWidth;
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
    console.log('onGanttScroll', left);
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

    const viewport = el.clientWidth;
    if (viewport <= 0) return;

    if (el.scrollWidth <= viewport) return;

    // todayOffset у нас в центре клетки → чтобы показать клетку с today в начале,
    // смещаемся на половину шага влево и добавляем небольшой отступ
    const leftPadding = 0; // можно 0/8/16 как нравится

    let target =
      align === 'start'
        ? (this.todayOffset - this.stepPx / 2 - leftPadding)
        : (this.todayOffset - viewport / 2);

    target = Math.max(0, Math.min(target, el.scrollWidth - viewport));

    el.scrollLeft = target;

    // оставляем, если ти продовжуєш використовувати transform-синхронізацію
    this.onGanttScroll(target);
  }

  get ganttContentWidth(): number {
    const days =
      (this.projectEnd.getTime() - this.projectStart.getTime()) / 86400000;

    return days * (this.dayWidth)
  }

  /** Сітка по днях для кожного рядка Gantt (фон під барами) */
  get timelineDays(): TimelineDayCell[] {
    const res: TimelineDayCell[] = [];
    const cur = new Date(this.projectStart);
    let index = 0;

    while (cur <= this.projectEnd) {
      const dayOfWeek = cur.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isWeekStart = dayOfWeek === 1; // понеділок

      res.push({
        id: index,
        left: index * this.dayWidth,
        width: this.dayWidth,
        isWeekend,
        isWeekStart
      });

      index++;
      cur.setDate(cur.getDate() + 1);
    }

    return res;
  }
}
