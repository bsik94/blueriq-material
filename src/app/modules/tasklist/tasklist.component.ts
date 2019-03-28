import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource, PageEvent } from '@angular/material';
import { BlueriqComponent, BlueriqSession } from '@blueriq/angular';
import { Button, Container, PresentationStyles } from '@blueriq/core';
import { BqContentStyles } from '../BqContentStyles';
import { BqPresentationStyles } from '../BqPresentationStyles';
import { Task } from './task_service';
import { ColumnDefinition, TaskList } from './tasklist';

@Component({
  selector: 'bq-tasklist',
  templateUrl: './tasklist.component.html',
  styleUrls: ['./tasklist.component.scss'],
  providers: [TaskList],
})
@BlueriqComponent({
  type: Container,
  selector: BqContentStyles.TASK_LIST,
})
export class TaskListComponent implements OnInit, AfterViewInit {

  displayedColumns: string[];

  @ViewChild(MatSort)
  sort: MatSort;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  taskDataSource: MatTableDataSource<Task>;

  tasksToHighlight: string[];

  constructor(public taskList: TaskList, private readonly session: BlueriqSession) {
    this.taskDataSource = new MatTableDataSource([]);
    this.displayedColumns = taskList.columnDefinitions.map(column => column.identifier);
    this.tasksToHighlight = [];
  }

  ngOnInit(): void {
    this.taskDataSource.sort = this.sort;
    this.taskDataSource.paginator = this.paginator;
    this.sort.sortChange.subscribe(() => {
      this.clearTasksToHighlight();
    });

    this.taskList.taskSubject.subscribe(tasks => this.taskDataSource.data = tasks);
    this.taskList.taskEventSubject.subscribe(taskEvent => {
      this.tasksToHighlight.push(taskEvent.taskModel.identifier);
    });
  }

  /** extracts the data that should be shown in the cell that is being rendered */
  getCellData(task: Task, column: ColumnDefinition): string {
    const identifier = column.identifier;
    switch (column.type) {
      case 'TASKDATA':
        let value = '';
        if (task[identifier]) {
          value = task[identifier] || '';
        } else {
          // identifier might be lowercased in runtime conversion
          for (const property in task) {
            if (property.toLowerCase() === identifier) {
              value = task[property] || '';
              break;
            }
          }
        }
        if (!!value && (column.dataType === 'date' || column.dataType === 'datetime')) {
          value = this.formatDateValue(value, column.dataType === 'datetime');
        }
        return value;
      case 'CUSTOMFIELD':
        if (task.customFields && task.customFields[column.identifier]) {
          return task.customFields[column.identifier];
        }
        return '';
    }
    return '';
  }

  isIconButton(styles: PresentationStyles): boolean {
    return styles.hasAny(BqPresentationStyles.ONLYICON, BqPresentationStyles.DEPRECATED_ONLYICON);
  }

  getColor(styles: PresentationStyles): string | null {
    if (styles.has(BqPresentationStyles.PRIMARY)) {
      return 'primary';
    } else if (styles.has(BqPresentationStyles.ACCENT)) {
      return 'accent';
    } else if (styles.has(BqPresentationStyles.TERTIARY)) {
      return 'tertiary';
    }
    return null;
  }

  /** sends a button pressed event to the backend */
  buttonPressed(button: Button, taskIdentifier: string): void {
    this.taskList.buttonPressed(button, taskIdentifier);
  }

  /** passes a new filter value to the datasource */
  applyFilter(filterValue: string): void {
    this.clearTasksToHighlight();
    this.taskDataSource.filter = filterValue.trim().toLowerCase();
  }

  ngAfterViewInit(): void {
    this.taskDataSource.sortingDataAccessor = (task: Task, columnIdentifier: string): string | number => {
      if (task[columnIdentifier]) {
        return task[columnIdentifier];
      }
      for (const property in task) {
        if (property.toLowerCase() === columnIdentifier) {
          return task[property];
        }
      }
      for (const property in task.customFields) {
        if (property === columnIdentifier) {
          return task.customFields[property];
        }
      }
      return '';
    };
  }

  pageChanged(event: PageEvent): void {
    this.clearTasksToHighlight();
  }

  private formatDateValue(dateString: string, includeTime = false): string {
    const date = new Date(dateString);
    return includeTime ? this.session.localization.dateFormats.dateTime.format(date) : this.session.localization.dateFormats.date.format(date);
  }

  private clearTasksToHighlight(): void {
    this.tasksToHighlight = [];
  }
}