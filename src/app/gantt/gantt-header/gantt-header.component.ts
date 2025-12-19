import {ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild} from '@angular/core';

export interface ScaleCell {
  label: string;
  width: number;
}

export interface MonthCell {
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

  @Input() view: 'day' | 'week' = 'day';
  @Input() dayWidth = 32;
  @Input() weekWidth = 140;

  @ViewChild('scroll', { static: true })
  scroll!: ElementRef<HTMLDivElement>;

  /* ---------- SCALE (days / weeks) ---------- */

  get scale(): ScaleCell[] {
    const res: ScaleCell[] = [];
    const cur = new Date(this.projectStart);

    if (this.view === 'day') {
      while (cur <= this.projectEnd) {
        res.push({
          label: cur.getDate().toString(),
          width: this.dayWidth
        });
        cur.setDate(cur.getDate() + 1);
      }
    }

    if (this.view === 'week') {
      while (cur <= this.projectEnd) {
        res.push({
          label: `W${this.getWeek(cur)}`,
          width: this.weekWidth
        });
        cur.setDate(cur.getDate() + 7);
      }
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

    const unit = this.view === 'day' ? this.dayWidth : this.weekWidth;
    const step = this.view === 'day' ? 1 : 7;

    while (cur <= this.projectEnd) {
      if (cur.getMonth() !== m || cur.getFullYear() !== y) {
        res.push({
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

  private getWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
