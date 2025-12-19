import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GanttComponent } from './gantt.component';

describe('Gantt', () => {
  let component: GanttComponent;
  let fixture: ComponentFixture<GanttComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GanttComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GanttComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
