import {ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild} from '@angular/core';

export interface ScaleCell {
  id: number;
  label: string;
  width: number;
  date?: Date;
  isWeekend?: boolean;
  isWeekStart?: boolean;
}

export interface MonthCell {
  id: number;
  label: string;
  width: number;
}

@Component({
  selector: 'app-gantt-header',
  imports: [],
  templateUrl: './gantt-header.component.html',
  styleUrl: './gantt-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GanttHeaderComponent {
  @Input() projectStart!: Date;
  @Input() projectEnd!: Date;

  @Input() dayWidth = 32;
  @Input() weekWidth = 140;

  @ViewChild('scroll', { static: true })
  scroll!: ElementRef<HTMLDivElement>;

  /* ---------- SCALE (days ) ---------- */

  get scale(): ScaleCell[] {
    const res: ScaleCell[] = [];
    const cur = new Date(this.projectStart);

    let index = 0;
    while (cur <= this.projectEnd) {
      const dayOfWeek = cur.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isWeekStart = dayOfWeek === 1; // понеділок — початок тижня

      res.push({
        id: index++,
        label: cur.getDate().toString(),
        width: this.dayWidth,
        date: new Date(cur),
        isWeekend,
        isWeekStart
      });

      cur.setDate(cur.getDate() + 1);
    }

    return res;
  }

  /* ---------- MONTHS ---------- */

  get months(): MonthCell[] {
    const res: MonthCell[] = [];
    const cur = new Date(this.projectStart);

    let m = cur.getMonth();
    let y = cur.getFullYear();
    let width = 0;

    const unit = this.dayWidth
    const step = 1;
    let index = 0
    while (cur <= this.projectEnd) {
      if (cur.getMonth() !== m || cur.getFullYear() !== y) {
        res.push({
          id: index++,
          label: this.monthLabel(m, y),
          width
        });
        m = cur.getMonth();
        y = cur.getFullYear();
        width = 0;
      }

      width += unit;
      cur.setDate(cur.getDate() + step);
    }

    res.push({
      id: index++,
      label: this.monthLabel(m, y),
      width
    });

    return res;
  }

  private monthLabel(m: number, y: number): string {
    return new Intl.DateTimeFormat('ru', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(y, m, 1));
  }
}
