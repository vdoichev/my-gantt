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
  isWeekend?: boolean;
  isWeekStart?: boolean;
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

  @Input() dayWidth = 52;
  @Input() weekWidth = 140;

  @ViewChild('scroll', { static: true })
  scroll!: ElementRef<HTMLDivElement>;

  /* ---------- SCALE (days) ---------- */

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

  /* ---------- MONTHS (per-day cells, згруповані по тижнях) ---------- */

  get months(): MonthCell[] {
    const res: MonthCell[] = [];
    const cur = new Date(this.projectStart);

    let index = 0;
    while (cur <= this.projectEnd) {
      const currentDate = new Date(cur);

      // визначаємо тиждень для цього дня
      const weekStart = new Date(currentDate);
      const d = weekStart.getDay() || 7;       // 1..7, де 1 = понеділок, 7 = неділя
      weekStart.setDate(weekStart.getDate() - d + 1);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(0, 0, 0, 0);

      // тиждень може виходити за межі проекту, але для підпису це не критично

      const startMonth = weekStart.getMonth();
      const startYear = weekStart.getFullYear();
      const endMonth = weekEnd.getMonth();
      const endYear = weekEnd.getFullYear();

      // якщо тиждень повністю в одному місяці → повна назва
      // якщо перетинає межу → короткі назви "янв – фев"
      let label: string;
      if (startMonth === endMonth && startYear === endYear) {
        label = this.monthLabel(startMonth, startYear);
      } else {
        label = `${this.monthLabelShort(startMonth, startYear)} – ${this.monthLabelShort(endMonth, endYear)}`;
      }

      const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isWeekStart = dayOfWeek === 1; // понеділок — початок тижня

      res.push({
        id: index++,
        label,
        width: this.dayWidth,
        isWeekend,
        isWeekStart
      });

      cur.setDate(cur.getDate() + 1);
    }

    return res;
  }

  private monthLabel(m: number, y: number): string {
    return new Intl.DateTimeFormat('ru', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(y, m, 1));
  }

  private monthLabelShort(m: number, y: number): string {
    return new Intl.DateTimeFormat('ru', {
      month: 'short'
    }).format(new Date(y, m, 1));
  }
}
