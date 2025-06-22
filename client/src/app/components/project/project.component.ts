import { Component, OnInit, inject, ViewChild, ElementRef} from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { CalendarModule } from 'primeng/calendar';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-project',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterLink, CalendarModule, BreadcrumbComponent],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit {

  private taskService = inject(TaskService);
  private userservice = inject(UserSevice);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('inviteClose') inviteClose!: ElementRef;
  @ViewChild('taskFormClose') taskFormClose!: ElementRef;
  @ViewChild('editModalCloseBtn') editModalCloseBtn!: ElementRef;

  projectId:any = '';
  usersList : any[] = [];
  tasks : any[] = [];
  project: any;
  breadCrumbItems : any[] = [];

  inviteForm!: FormGroup;
  taskForm!: FormGroup;

  currentPage:number = 1;
  limit: number = 10;
  totalPages: number = 0;

  search = '';
  selectedStatus = '';

  // Sorting
  sortBy = 'startDate';
  sortOrder: 'asc' | 'desc' = 'asc';
  statusOptions = ['started', 'inprogress', 'blocked', 'completed'];

  editForm!: FormGroup;
  minDate!: Date;

  ngOnInit(): void {
    this.minDate = new Date();

    this.activatedRoute.paramMap.subscribe((params) => {
      this.projectId = params.get('projectid');
      if(this.projectId) {
        this.getProjectDetails();
        this.getUsersList();
      }
    });

    this.inviteForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });

    this.taskForm = new FormGroup({
      title: new FormControl('', Validators.required),
      description: new FormControl(''),
      status: new FormControl('started'),
      priority: new FormControl('medium'),
      endDate: new FormControl(''),
      startDate: new FormControl(''),
      assignedTo: new FormControl('')
    });

    this.editForm = new FormGroup({
      name: new FormControl({ value: '', disabled: true }, Validators.required),
      description: new FormControl(''),
      startDate: new FormControl({ value: '', disabled: true }),
      endDate: new FormControl(''),
      status: new FormControl(''),
    });
  }

  getProjectDetails() {
    this.taskService.showloading(true);
    this.taskService.getProjectDetails(this.projectId).subscribe({
      next:(data:any) => {
        console.log("pro <", JSON.stringify(data));
        if(data.success) {
          this.project = data.project;
          console.log("PROJECT >> ", this.project);
          this.breadCrumbItems = [
            {label: 'Home', route: '/', icon: 'fa fa-home'},
            {label: 'dashboard', route: '/dashboard'},
            {label: this.project.name}
          ];
          
          this.setEditFormField(this.project);
          this.getTasks();
          this.taskService.showloading(false);
          // this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while fetching projects', 3000);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while fetching projects', 3000);
      }
    })
  }

  setEditFormField(projectdata:any) {
    this.editForm.patchValue({
      name: projectdata.name,
      description: projectdata.description,
      startDate: projectdata.startDate ? new Date(projectdata.startDate) : null,
      endDate: projectdata.endDate ? new Date(projectdata.endDate) : null,
      status: projectdata.status
    });
  }

  inviteUser() {
    console.log("user invite > ", this.inviteForm.value);
    if(!this.inviteForm.valid) return;

    this.taskService.showloading(true);
    this.userservice.inviteUser({email : this.inviteForm.value.email, projectId : this.projectId}).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
          this.inviteClose.nativeElement.click();
          this.inviteForm.reset();
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while sending invite mail', 3000);
          this.inviteClose.nativeElement.click();
          this.inviteForm.reset();
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while sending invite mail', 3000);
        this.inviteClose.nativeElement.click();
        this.inviteForm.reset();
      }
    })
    
  }

  submitTaskForm() {
    console.log("task > ", this.taskForm.value);
    const taskData = {
      title: this.taskForm.value.title,
      description: this.taskForm.value.description,
      status: this.taskForm.value.status,
      priority: this.taskForm.value.priority,
      endDate: this.taskForm.value.endDate,
      startDate: this.taskForm.value.startDate,
      assignedTo: this.taskForm.value.assignedTo,
      projectId: this.projectId
    }

    this.taskService.showloading(true);

    this.taskService.createTask(taskData).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'Task created successfully', 3000);
          this.taskFormClose.nativeElement.click();
          this.getProjectDetails();
          this.taskForm.reset();
        } else {
          this.getProjectDetails();
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while creating task', 3000);
          this.taskFormClose.nativeElement.click();
          this.taskForm.reset()
        }
      },
      error:(error) => {
        this.getProjectDetails();
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while creating task', 3000);
        this.taskFormClose.nativeElement.click();
        this.taskForm.reset()
      }
    })
    

  }

  getTasks() {
    let options = {
      page: this.currentPage,
      limit: this.limit,
      search: this.search,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      projectId: this.projectId,
      status : this.selectedStatus
    }

    this.taskService.showloading(true);

    this.taskService.getTasks(options).subscribe({
      next:(data:any) => {
        this.taskService.showloading(false);
        console.log("tasks > ", data);
        // this.projects = data.projects;
        this.tasks = data.tasks;
        // this.totalPages = data.meta.totalPages;
        
      },error:(error)=> {
        // this.projects = [];
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('success', error.message || 'Failed to fetch projects', 3000);
        
      }
    })

  }

  getUsersList() {
    this.userservice.getUsersByProject(this.projectId).subscribe({
      next:(users:any) => {
        console.log("USERS LIST > ", users);
        
        if(users.success) {
          this.usersList = users.users;
          if (this.usersList.length > 0) {
            this.taskForm.get('assignedTo')?.setValue(this.usersList[0]._id);
          }
        } else {
          this.usersList = [];
        }
      },error:(err)=> {
        this.usersList= [];
      }
    })
  }

  submitUpdateForm() {
    let data = {
      description : this.editForm.value.description,
      endDate : this.editForm.value.endDate,
      status : this.editForm.value.status,
      projectId : this.projectId
    }

    this.taskService.updateProject(data).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'Project updated successfully', 3000);
          this.editModalCloseBtn.nativeElement.click();
          this.editForm.reset();
          this.getProjectDetails();
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while updating project', 3000);
          this.editModalCloseBtn.nativeElement.click();
          this.editForm.reset();
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while updating project', 3000);
        this.editModalCloseBtn.nativeElement.click();
        this.editForm.reset(); 
      }
    })


  }

}
