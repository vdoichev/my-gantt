import { Component, signal } from '@angular/core';
import {PortCallGanttComponent} from './gantt/port-call-gantt/port-call-gantt.component';

@Component({
  selector: 'app-root',
  imports: [PortCallGanttComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('my-gantt');
}
