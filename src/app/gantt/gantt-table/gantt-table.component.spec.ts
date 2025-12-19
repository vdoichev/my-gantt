import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GanttTableComponent } from './gantt-table.component';

describe('Gantt', () => {
  let component: GanttTableComponent;
  let fixture: ComponentFixture<GanttTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GanttTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GanttTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
