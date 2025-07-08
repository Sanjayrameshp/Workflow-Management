import { Component, OnInit, inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";
import { CalendarModule } from 'primeng/calendar';
import { Subject, takeUntil } from 'rxjs';


@Component({
  selector: 'app-task-details',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, BreadcrumbComponent, CalendarModule],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.css'
})
export class TaskDetailsComponent implements OnInit, OnDestroy {

  private taskService = inject(TaskService);
  private userService = inject(UserSevice)
  private activatedRoute = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  taskId:any = '';
  task : any;
  updateForm!: FormGroup;
  progerssOptions = [0,10,20,30,40,50,60,70,80,90,100];
  breadCrumbItems : any[] = [];
  minDate!: Date;
  usersList : any[] = [];
  userObject: any;
  authStatus: boolean = false;

  @ViewChild('editTaskModalClose') editTaskModalClose!: ElementRef;

  ngOnInit(): void {
    this.minDate = new Date();

    this.updateForm = new FormGroup({
      status: new FormControl('', Validators.required),
      progress: new FormControl('', [Validators.required, Validators.min(0), Validators.max(100)]),
      endDate: new FormControl('', Validators.required),
      assignedTo: new FormControl(''),
      customMessage: new FormControl('')
    });

    this.userService.getUserObject().pipe(takeUntil(this.destroy$)).subscribe({
        next:(user)=> {
          this.userObject = user;
          this.userService.getAuthStatus().subscribe({
            next:(status) => {
              this.authStatus = status;
              this.activatedRoute.paramMap.subscribe((params) => {
                this.taskId = params.get('taskid');
                if(this.taskId && this.authStatus) {
                  this.getTaskDetails();
                }
              });
              
            },error:(error)=> {
              this.authStatus = false;
            }
          })
        },
        error:(error)=> {
          this.userObject = null;
      }
    });

  }

  getTaskDetails() {
    let taskId = this.taskId;
    this.taskService.showloading(true);
    this.taskService.getTaskDetails(taskId).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.task = data.task;
          this.breadCrumbItems = [
            {label: 'Dashboard', route: '/dashboard', icon: 'fa fa-home'},
            {label: 'Project', route: '/project/' + this.task.project},
            {label: this.task.title}
          ];
          this.getUsersList();
          
          this.setEditFormField();
        } else {
          this.task = null
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while fetching task details', 3000);
        }
      },
      error:(error) => {
        this.task = null;
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while fetching task details', 3000);
      }
    })
  }

  setEditFormField() {
    this.updateForm.get('progress')?.setValue(this.task.progress);
    this.updateForm.get('status')?.setValue(this.task.status);
    this.updateForm.get('endDate')?.setValue(this.task.endDate ? new Date(this.task.endDate) : null);
    this.updateForm.get('customMessage')?.setValue(this.task.customMessage);
  }

  updateTask() {
    if (this.updateForm.invalid) return;
    const updatedData = this.updateForm.value;  

    this.taskService.showloading(true);
    this.taskService.updateTask(this.taskId, updatedData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.taskService.showloading(false);
        if (res.success) {
          this.taskService.showAlertMessage('success', res.message || 'Task updated', 3000);
          this.updateForm.reset();
          this.editTaskModalClose.nativeElement.click();
          this.getTaskDetails();
        }
      },
      error: (err:any) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', err.message || 'Failed to update', 3000);
        this.updateForm.reset();
        this.editTaskModalClose.nativeElement.click();
        this.getTaskDetails();
      }
    });
  }

  getUsersList() {
    this.userService.getUsersByProject(this.task.project).pipe(takeUntil(this.destroy$)).subscribe({
      next:(users:any) => {
        
        if(users.success) {
          this.usersList.push(...users.users);
          
          if(this.task.assignedTo) {
            this.updateForm.get('assignedTo')?.setValue(this.task.assignedTo._id);
          } else if(this.usersList.length > 0) {
            this.updateForm.get('assignedTo')?.setValue(this.usersList[0]._id);
          } else{

          }
        } else {
          this.usersList = [];
        }
      },error:(err)=> {
        this.usersList= [];
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
