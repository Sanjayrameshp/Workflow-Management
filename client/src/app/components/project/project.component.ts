import { Component, OnInit, inject, ViewChild, ElementRef, OnDestroy} from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { CalendarModule } from 'primeng/calendar';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";
import { ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-project',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterLink, CalendarModule, BreadcrumbComponent, BaseChartDirective, PaginatorModule],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit, OnDestroy {

  private taskService = inject(TaskService);
  private userService = inject(UserSevice);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  @ViewChild('inviteClose') inviteClose!: ElementRef;
  @ViewChild('taskFormClose') taskFormClose!: ElementRef;
  @ViewChild('editModalCloseBtn') editModalCloseBtn!: ElementRef;

  userObject: any;
  authStatus: boolean = false;

  projectId:any = '';
  usersList : any[] = [];
  tasks : any[] = [];
  project: any;
  breadCrumbItems : any[] = [];
  searchUserText: string = '';

  filteredUsers: any[] = [];
  selectedUser: any = null;

  taskForm!: FormGroup;

  currentPage:number = 1;
  limit: number = 10;
  totalPages: number = 0;
  totalTasks: number = 0;

  search = '';
  selectedStatus = '';

  sortBy = 'startDate';
  sortOrder: 'asc' | 'desc' = 'asc';
  statusOptions = ['started', 'inprogress', 'blocked', 'completed'];

  editForm!: FormGroup;
  minDate!: Date;
  taskSearchDebounce: any;
  userSearchDebounce:any;

  tasksByStatus: any[] = [];
  tasksByProgress: any[] = [];
  tasksByPriority: any[] = [];
  tasksByUser: any[] = [];

  statusChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  progressChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  priorityChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  userChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  statusChartType: ChartType = 'pie';
  progressChartType: ChartType = 'pie';
  priorityChartType: ChartType = 'pie';
  userChartType: ChartType = 'bar';

  userChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' }
  },
  scales: {
    x: {
      title: { display: true, text: 'Users' }
    },
    y: {
      title: { display: true, text: 'Number of Tasks' },
      beginAtZero: true
    }
  }
};


  ngOnInit(): void {
    this.minDate = new Date();

    this.userService.getUserObject().pipe(takeUntil(this.destroy$)).subscribe({
        next:(user)=> {
          this.userObject = user;
          this.userService.getAuthStatus().pipe(takeUntil(this.destroy$)).subscribe({
            next:(status) => {
              this.authStatus = status;

              this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
                this.projectId = params.get('projectid');
                if(this.projectId) {
                  if(this.authStatus) {
                    this.getProjectDetails();
                    this.getProjectAnalytics();
                  }
                  if(this.userObject && this.userObject.role === 'admin') {
                    this.getUsersList();
                  }
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

    this.taskForm = new FormGroup({
      title: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      status: new FormControl('started', Validators.required),
      priority: new FormControl('medium', Validators.required),
      endDate: new FormControl('', Validators.required),
      startDate: new FormControl('', Validators.required),
      assignedTo: new FormControl('', Validators.required),
      customMessage: new FormControl('')
    });

    this.editForm = new FormGroup({
      name: new FormControl({ value: '', disabled: true }, Validators.required),
      description: new FormControl(''),
      startDate: new FormControl({ value: '', disabled: true }, Validators.required),
      endDate: new FormControl(''),
      status: new FormControl(''),
    });
  }

  getProjectDetails() {
    this.taskService.showloading(true);
    this.taskService.getProjectDetails(this.projectId).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.project = data.project;
          this.breadCrumbItems = [
            {label: 'Dashboard', route: '/dashboard', icon: 'fa fa-home'},
            {label: this.project.name}
          ];
          
          this.setEditFormField(this.project);
          this.getTasks();
          this.taskService.showloading(false);
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
      customMessage: this.taskForm.value.customMessage ? this.taskForm.value.customMessage : '',
      projectId: this.projectId
    }

    this.taskService.showloading(true);

    this.taskService.createTask(taskData).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'Task created successfully', 3000);
          this.taskFormClose.nativeElement.click();
          this.getProjectDetails();
          this.getProjectAnalytics();
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

    this.taskService.getTasks(options).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        this.taskService.showloading(false);
        this.tasks = data.tasks;
        this.totalPages = data.meta.totalPages;
        this.totalTasks = data.meta.total;
        
      },error:(error)=> {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('success', error.message || 'Failed to fetch projects', 3000);
        
      }
    })

  }

  searchTasks() {
    console.log("serarck q-> ", this.search);
    clearTimeout(this.taskSearchDebounce)
    this.taskSearchDebounce = setTimeout(()=> {
      this.getTasks();
    }, 300)
    
  }

  onPageChange(event: any): void {
    this.limit = event.rows;
    this.currentPage = Math.floor(event.first / this.limit) + 1;
    this.getTasks();
  }

  getUsersList() {
    this.userService.getUsersByProject(this.projectId).pipe(takeUntil(this.destroy$)).subscribe({
      next:(users:any) => {

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

  onSearchUser(query: string) {
    if (query && query.length >= 2) {
      let data = {
        searchText: query,
        projectId: this.projectId
      }
      this.userSearchDebounce = setTimeout(()=> {
        this.userService.searchUserByProject(data).pipe(takeUntil(this.destroy$)).subscribe({
          next:(data:any) => {

          if(data.success) {
            this.filteredUsers = data.users;
          } else {
            this.filteredUsers = [];
          }
        },
        error:(error) => {
          this.filteredUsers = [];
        }
        })
      }, 300) 
    } else {
      this.filteredUsers = [];
    }
  }

  selectUser(user:any) {
    this.selectedUser = user;
    this.searchUserText = `${user.firstname} ${user.lastname} (${user.email})`; // Set in input
    this.filteredUsers = [];
  }

  addUserToProject() {
    if(this.selectedUser) {
      let data = {
        userId : this.selectedUser._id,
        email: this.selectedUser.email,
        projectId: this.projectId,
        org: this.selectedUser.organization
      }
      this.taskService.addUserToProject(data).pipe(takeUntil(this.destroy$)).subscribe({
        next:(data:any) => {
          if(data.success) {
            this.taskService.showloading(false);
            this.taskService.showAlertMessage('success', data.message || 'Successfully assigned projects', 3000);
            this.inviteClose.nativeElement.click();
            this.getProjectDetails();
            this.getUsersList();
          } else {
            this.getProjectDetails();
            this.taskService.showloading(false);
            this.taskService.showAlertMessage('error', data.message || 'Error while assigning project', 3000);
            this.inviteClose.nativeElement.click();
            this.getUsersList();
          }
        },
        error:(error) => {
          this.getProjectDetails();
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', error.message || 'Error while assigning project', 3000);
          this.inviteClose.nativeElement.click();
          this.getUsersList();
        }
      })
    }
  }

  submitUpdateForm() {
    let data = {
      description : this.editForm.value.description,
      endDate : this.editForm.value.endDate,
      status : this.editForm.value.status,
      projectId : this.projectId
    }

    this.taskService.updateProject(data).pipe(takeUntil(this.destroy$)).subscribe({
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

  getProjectAnalytics() {
    this.projectTasksByStatus();
    this.projectTasksByProgress();
    this.projectTasksByPriority();
    this.groupTasksByAssignedUser();
  }

  projectTasksByStatus() {
    let data = {
      projectId : this.projectId
    }
    this.taskService.projectTasksByStatus(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {

        if(data.success) {
          this.taskService.showloading(false);
          this.tasksByStatus = data.result?.result || [];

          this.statusChartData = {
            labels: this.tasksByStatus.map((item: any) => item._id.toString()),
            datasets: [
              {
                data: this.tasksByStatus.map((item: any) => item.count),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8BC34A', '#FF9800', '#9C27B0', '#00BCD4'],
              },
            ],
          };
          
        } else {
          this.taskService.showloading(false);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
      }
    })
  }

  projectTasksByProgress() {
    let data = {
      projectId : this.projectId
    }
    this.taskService.projectTasksByProgress(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.tasksByProgress = data.result?.result || [];

          this.progressChartData = {
            labels: this.tasksByProgress.map((item: any) => item._id?.toString()),
            datasets: [
              {
                data: this.tasksByProgress.map((item: any) => item.count),
              },
            ],
          };
        } else {
          this.taskService.showloading(false);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
      }
    })
  }

  projectTasksByPriority() {
    let data = {
      projectId : this.projectId
    }
    this.taskService.projectTasksByPriority(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.tasksByPriority = data.result?.result || [];

          this.priorityChartData = {
            labels: this.tasksByPriority.map((item: any) => item._id),
            datasets: [
              {
                data: this.tasksByPriority.map((item: any) => item.count),
                backgroundColor: ['#2196F3', '#FF9800', '#F44336'], // medium, low, high or any order
              },
            ],
          };
        } else {
          this.taskService.showloading(false);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
      }
    })
  }

  groupTasksByAssignedUser() {
    let data = {
      projectId : this.projectId
    }
    this.taskService.groupTasksByAssignedUser(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.tasksByUser = data.result?.result || [];

          this.userChartData = {
            labels: this.tasksByUser.map((item: any) => item.name || 'Unassigned'),
            datasets: [
              {
                label: 'Number of Tasks',
                data: this.tasksByUser.map((item: any) => item.taskCount),
                backgroundColor: '#42A5F5'
              }
            ]
          };

        } else {
          this.taskService.showloading(false);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


}
