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
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {FormsModule} from '@angular/forms';
import {GanttHeaderComponent} from '../gantt-header/gantt-header.component';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule} from '@angular/material/tree';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

export interface GanttTask {
  id: number;
  name: string;
  owner: string;
  status: string;
  priority: string;
  start: Date;
  end: Date;
}

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
    MatButtonToggleGroup,
    FormsModule,
    MatButtonToggle,
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

  view: 'day' | 'week' = 'day';

  dayWidth = 32;
  weekWidth = 140;

  projectStart = new Date('2025-01-01');
  projectEnd   = new Date('2026-01-01');

  rowHeaderHeight = 66;

  leftColumns = ['id', 'name', 'owner', 'status', 'priority'];
  rightColumns = ['gantt'];

  EXAMPLE_DATA: TaskNode[] = [
    {
      id: 1,
      name: 'Design',
      owner: 'Alex',
      status: 'In Progress',
      priority: 'High',
      start: new Date('2025-01-02'),
      end: new Date('2025-01-10'),
      children: [
        { id: 21, name: 'Design 1', owner: 'Alex', status: 'In Progress', priority: 'High', start: new Date('2025-01-02'), end: new Date('2025-01-05') },
        { id: 22, name: 'Design 2', owner: 'Alex', status: 'In Progress', priority: 'High', start: new Date('2025-01-07'), end: new Date('2025-01-10') },
      ]
    },
    {
      id: 2,
      name: 'Development',
      owner: 'Kate',
      status: 'Open',
      priority: 'Medium',
      start: new Date('2025-01-08'),
      end: new Date('2025-02-05'),
      children: [
        { id: 31, name: 'Development 1', owner: 'Kate', status: 'Open', priority: 'Medium', start: new Date('2025-01-08'), end: new Date('2025-01-15') },
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

    this.buildParentMap();

    this.treeControl.expansionModel.changed.subscribe(() => {
      this.updateTableData();
    });

    this.updateTableData();
  }

  @ViewChild(GanttHeaderComponent, { read: ElementRef })
  headerEl!: ElementRef<HTMLElement>;

  @ViewChildren('timeline')
  timelines!: QueryList<ElementRef<HTMLElement>>;

  @ViewChildren('leftRow', { read: ElementRef })
  leftRows!: QueryList<ElementRef<HTMLElement>>;

  rowHeights: number[] = [];
  private ro = new ResizeObserver(() => this.syncRowHeights());
  ngAfterViewInit() {
    this.syncRowHeights();

    this.leftRows.forEach(r =>
      this.ro.observe(r.nativeElement)
    );
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
  }

  offset(task: any): number {
    const days =
      (task.start.getTime() - this.projectStart.getTime()) / 86400000;
    return days * this.dayWidth;
  }

  width(task: any): number {
    const days =
      (task.end.getTime() - task.start.getTime()) / 86400000 + 1;
    return days * this.dayWidth;
  }
}
