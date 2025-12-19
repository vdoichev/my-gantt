import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {GanttTableComponent} from './gantt/gantt-table/gantt-table.component';

@Component({
  selector: 'app-root',
  imports: [GanttTableComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('my-gantt');
}
