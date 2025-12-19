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
import {GanttHeaderComponent} from '../gantt-header/gantt-header.component';

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
    MatFooterRowDef
  ],
  templateUrl: './gantt-table.component.html',
  styleUrl: './gantt-table.component.css',
})
export class GanttTableComponent {

  view: 'day' | 'week' = 'day';

  dayWidth = 32;
  weekWidth = 140;

  projectStart = new Date('2025-01-01');
  projectEnd   = new Date('2025-02-15');

  rowHeight = 48;

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

  @ViewChild('splitter', { read: ElementRef })
  splitterEl!: ElementRef<HTMLElement>;

  private startX = 0;
  private startWidth = 0;
  dragging = false;

  onGanttScroll(left: number) {
    const x = -left;

    this.headerEl.nativeElement.style.transform =
      `translateX(${x}px)`;

    this.timelines.forEach(t =>
      t.nativeElement.style.transform =
        `translateX(${x}px)`
    );
  }

  tableWidth = 320;

  private resizing = false;

  startResize(e: MouseEvent) {
    e.preventDefault();

    this.dragging = true;
    this.startX = e.clientX;
    this.startWidth = this.tableWidth;

    this.splitterEl.nativeElement.classList.add('dragging');
    document.body.style.cursor = 'col-resize';

    const move = (ev: MouseEvent) => {
      if (!this.dragging) return;

      const delta = ev.clientX - this.startX;

      /* 1️⃣ визуально двигаем splitter */
      this.splitterEl.nativeElement.style.transform =
        `translateX(${delta}px)`;
    };

    const up = (ev: MouseEvent) => {
      if (!this.dragging) return;

      this.dragging = false;
      document.body.style.cursor = '';

      const delta = ev.clientX - this.startX;

      /* 2️⃣ фиксируем ширину */
      this.tableWidth = Math.max(200, this.startWidth + delta);

      /* 3️⃣ сбрасываем transform */
      this.splitterEl.nativeElement.style.transform = '';

      this.splitterEl.nativeElement.classList.remove('dragging');

      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
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
