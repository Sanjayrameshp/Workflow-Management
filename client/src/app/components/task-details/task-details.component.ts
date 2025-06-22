import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";
import { CalendarModule } from 'primeng/calendar';


@Component({
  selector: 'app-task-details',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, BreadcrumbComponent, CalendarModule],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.css'
})
export class TaskDetailsComponent implements OnInit {

  private taskService = inject(TaskService);
  private userservice = inject(UserSevice)
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  taskId:any = '';
  task : any;
  updateForm!: FormGroup;
  progerssOptions = [0,10,20,30,40,50,60,70,80,90,100];
  breadCrumbItems : any[] = [];
  minDate!: Date;

  @ViewChild('editTaskModalClose') editTaskModalClose!: ElementRef;

  ngOnInit(): void {
    this.minDate = new Date();

    this.updateForm = new FormGroup({
      status: new FormControl('', Validators.required),
      progress: new FormControl('', [Validators.required, Validators.min(0), Validators.max(100)]),
      endDate: new FormControl('', Validators.required)
    });

    this.activatedRoute.paramMap.subscribe((params) => {
      this.taskId = params.get('taskid');
      if(this.taskId) {
        this.getTaskDetails();
      }
    });

  }

  getTaskDetails() {
    let taskId = this.taskId;
    this.taskService.showloading(true);
    this.taskService.getTaskDetails(taskId).subscribe({
      next:(data:any) => {
        console.log("task > ", data);
        
        if(data.success) {
          this.taskService.showloading(false);
          this.task = data.task;
          this.breadCrumbItems = [
            {label: 'Home', route: '/', icon: 'fa fa-home'},
            {label: 'Dashboard', route: '/dashboard'},
            {label: 'Project', route: '/project/' + this.task.project},
            {label: this.task.title}
          ];
          
          this.setEditFormField();
          // this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
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
  }

  updateTask() {
    if (this.updateForm.invalid) return;
    const updatedData = this.updateForm.value;
    console.log("this.updateForm.value >", this.updateForm.value);
    

    this.taskService.showloading(true);
    this.taskService.updateTask(this.taskId, updatedData).subscribe({
      next: (res: any) => {
        console.log("res- update > ", res);
        
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
      }
    });
  }
}
