import {Component, ElementRef, QueryList, ViewChild, ViewChildren} from '@angular/core';
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
import {GanttHeaderComponent} from './gantt-header/gantt-header.component';

export interface GanttTask {
  id: number;
  name: string;
  owner: string;
  status: string;
  priority: string;
  start: Date;
  end: Date;
}

interface ScaleCell {
  label: string;
  width: number;
}

interface MonthCell {
  label: string;
  width: number;
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
    MatFooterRowDef
  ],
  templateUrl: './gantt.component.html',
  styleUrl: './gantt.component.css',
})
export class GanttComponent {
  @ViewChild('headerScroll') headerScroll!: ElementRef<HTMLDivElement>;
  @ViewChildren('bodyScroll')
  bodyScroll!: QueryList<ElementRef<HTMLElement>>;

  syncScroll(scrollLeft: number) {
    const x = -scrollLeft;

    /* HEADER */
    this.headerScroll.nativeElement.style.transform =
      `translateX(${x}px)`;
    /* BODY (все строки) */
    // this.bodyScroll.forEach(tl => {
    //   tl.nativeElement.style.transform =
    //     `translateX(${x}px)`;
    // });
  }

  leftColumns = ['id', 'name', 'owner', 'status', 'priority'];
  displayedColumns = [...this.leftColumns, 'gantt'];
  rowHeight = 48;
  dataSource: GanttTask[] = [
    {
      id: 1,
      name: 'Design',
      owner: 'Alex',
      status: 'dwqw',
      priority: '5',
      start: new Date('2025-01-01'),
      end: new Date('2025-01-05')
    },
    {
      id: 2,
      name: 'Development',
      owner: 'Kate',
      status: 'dwqw',
      priority: '5',
      start: new Date('2025-01-04'),
      end: new Date('2025-01-12')
    }
  ];

  view: 'day' | 'week' = 'day';
  dayWidth = 32;
  weekWidth = 140;

  projectStart = new Date('2025-01-01');
  projectEnd   = new Date('2026-01-31');

  offset(task: GanttTask): number {
    return (
      (task.start.getTime() - this.projectStart.getTime()) /
      86400000
    ) * this.dayWidth;
  }

  width(task: GanttTask): number {
    return (
      (task.end.getTime() - task.start.getTime()) /
      86400000 + 1
    ) * this.dayWidth;
  }

}
