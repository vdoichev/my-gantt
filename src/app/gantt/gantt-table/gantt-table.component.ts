import {AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {
  MatCell, MatCellDef,
  MatColumnDef, MatFooterCell, MatFooterCellDef, MatFooterRow, MatFooterRowDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {FormsModule} from '@angular/forms';
import {GanttHeaderComponent} from '../gantt-header/gantt-header.component';
import {SplitAreaComponent, SplitComponent} from 'angular-split';

export interface GanttTask {
  id: number;
  name: string;
  owner: string;
  status: string;
  priority: string;
  start: Date;
  end: Date;
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
    SplitAreaComponent
  ],
  templateUrl: './gantt-table.component.html',
  styleUrl: './gantt-table.component.css',
})
export class GanttTableComponent implements AfterViewInit{

  view: 'day' | 'week' = 'day';

  dayWidth = 32;
  weekWidth = 140;

  projectStart = new Date('2025-01-01');
  projectEnd   = new Date('2026-01-01');

  rowHeaderHeight = 66;

  leftColumns = ['id', 'name', 'owner', 'status', 'priority'];
  rightColumns = ['gantt'];

  dataSource = [
    {
      id: 1,
      name: 'Design',
      owner: 'Alex',
      status: 'In Progress',
      priority: 'High',
      start: new Date('2025-01-02'),
      end: new Date('2025-01-10')
    },
    {
      id: 2,
      name: 'Development',
      owner: 'Kate',
      status: 'Open',
      priority: 'Medium',
      start: new Date('2025-01-08'),
      end: new Date('2025-02-05')
    }
  ];

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
