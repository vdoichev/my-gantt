import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {GanttComponent} from './gantt/gantt.component';

@Component({
  selector: 'app-root',
  imports: [GanttComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('my-gantt');
}
