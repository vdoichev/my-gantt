import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortCallGanttComponent } from './port-call-gantt.component';

describe('Gantt', () => {
  let component: PortCallGanttComponent;
  let fixture: ComponentFixture<PortCallGanttComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortCallGanttComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortCallGanttComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
