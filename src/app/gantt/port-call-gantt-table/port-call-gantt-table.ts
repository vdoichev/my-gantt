import {Component, EventEmitter, Input, Output} from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {TaskFlatNode} from '../gantt-interface';
import {FlatTreeControl} from '@angular/cdk/tree';

@Component({
  selector: 'app-port-call-gantt-table',
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatRow,
    MatRowDef,
    MatTable,
    MatHeaderCellDef
  ],
  templateUrl: './port-call-gantt-table.html',
  styleUrl: './port-call-gantt-table.css',
})
export class PortCallGanttTable {
  @Input() tableDataSource =  new MatTableDataSource<TaskFlatNode>();
  @Input() rowHeaderHeight: number = 64;
  @Input() treeControl = new FlatTreeControl<TaskFlatNode>(
    node => node.level,
    node => node.expandable,
  );
  @Output() hasGanttScroll = new EventEmitter<boolean>();
  leftColumns = ['name', 'owner', 'status', 'priority'];

}
