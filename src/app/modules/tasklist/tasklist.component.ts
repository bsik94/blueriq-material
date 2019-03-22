import { Component, Host, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { BlueriqComponent } from '@blueriq/angular';
import { Button, Container } from '@blueriq/core';
import { Task } from './task_service';
import { ColumnDefinition, TaskList } from './tasklist';

@Component({
  selector: 'bq-tasklist',
  templateUrl: './tasklist.component.html',
  providers: [TaskList],
})
@BlueriqComponent({
  type: Container,
  selector: 'tasklist',
})
export class TaskListComponent implements OnInit {

  displayedColumns: string[];

  @ViewChild(MatSort)
  sort: MatSort;
  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  taskDataSource: MatTableDataSource<Task>;

  constructor(@Host() public taskList: TaskList) {
    this.taskDataSource = new MatTableDataSource([]);
    this.displayedColumns = taskList.columnDefinitions.map(column => column.identifier);
  }

  getCellData(task: Task, column: ColumnDefinition) {
    const identifier = column.identifier;
    switch (column.type) {
      case 'TASKDATA':
        if (task[identifier]) {
          return task[identifier];
        }
        // identifier might be lowercased in runtime conversion
        for (const property in task) {
          if (property.toLowerCase() === identifier) {
            return task[property];
          }
        }
        break;
    }
  }

  buttonPressed(button: Button, taskIdentifier: string) {
    this.taskList.buttonPressed(button, taskIdentifier);
  }

  applyFilter(filterValue: string) {
    this.taskDataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.taskDataSource.sort = this.sort;
    this.taskDataSource.paginator = this.paginator;
    this.taskList.taskSubject.subscribe(tasks => this.taskDataSource.data = tasks);
  }
}
