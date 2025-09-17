import { Component, inject, OnInit, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-analytics',
  imports: [ CommonModule, BaseChartDirective, FormsModule, BreadcrumbComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit, OnDestroy {

  private taskService = inject(TaskService);
  private userService = inject(UserSevice)
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  projectId : any = '';
  userObject : any;
  usersList : any[] = [];
  selectedUserId : any;
  selectedUser : any;
  selectedUsersList :any[] = [];
  breadCrumbItems : any[] = [];
  authStatus: boolean = false;

  tasksByStatus: any[] =[];
  tasksByProgress: any[] =[];
  tasksByPriority: any[] =[];
  tasksByMonth: any[] =[];

  statusChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  progressChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  priorityChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  monthChartData: ChartData<'pie'> = { labels: [], datasets: [] };

  statusChartType: ChartType = 'pie';
  progressChartType: ChartType = 'pie';
  priorityChartType: ChartType = 'pie';
  monthChartType: ChartType = 'pie';

  allTasks: any[] = [];
  

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.projectId = params.get('projectId');
      if(this.projectId) {

        this.userService.getUserObject().pipe(takeUntil(this.destroy$)).subscribe({
        next:(user)=> {
          this.userObject = user;
          console.log(this.userObject);
          
          this.userService.getAuthStatus().pipe(takeUntil(this.destroy$)).subscribe({
            next:(status) => {
              this.authStatus = status;
              if(this.authStatus) {
                if(this.userObject.role === 'admin') {
                  this.getUsersList();
                } else {
                  this.selectedUser = {...this.userObject}
                  this.selectedUserId = this.userObject._id;
                  this.getAllTasksByUser();
                }
              }
            },error:(error)=> {
              this.authStatus = false;
            }
          })

          },
          error:(error)=> {
            this.userObject = null;
            this.taskService.showAlertMessage('error', error.message || 'Something went wrong', 3000);
          }
        });
          
      }
    });

    this.breadCrumbItems = [
      {label: 'Dashboard', route: '/dashboard', icon: 'fa fa-home'},
      {label: 'Analytics'}
    ];
    
  }

  getUsersList() {
    this.userService.getUsersByProject(this.projectId).pipe(takeUntil(this.destroy$)).subscribe({
      next:(users:any) => {
        if(users.success) {
          this.usersList = users.users;
          
          this.selectedUsersList = this.usersList.filter((item)=> {
            return item.role !== 'admin'
          });

          if(this.selectedUsersList.length > 0) {
            this.selectedUser = this.selectedUsersList[0];
            this.selectedUserId =  this.selectedUsersList[0]._id ? this.selectedUsersList[0]._id : this.usersList[0]._id;
            this.getAllTasksByUser();
          } else {
            this.taskService.showAlertMessage('info', 'No users found', 3000);
          }
        } else {
          this.usersList = [];
        }
      },error:(err)=> {
        this.usersList= [];
      }
    })
  }

  changeSelectedUser(event:Event) {
    this.selectedUserId = (event.target as HTMLSelectElement).value;
    if(this.selectedUserId) {
      this.getAllTasksByUser()
    }
  }

  getAllTasksByUser() {
    this.getTasksByStatus();
    this.getTasksByProgress();
    this.getTasksByPriority();
    this.getTasksByMonth();
    setTimeout(() => this.mergeAllTasks(), 1000);
  }

  getTasksByStatus() {
    let data = { projectId : this.projectId, userId: this.selectedUserId};

    this.taskService.getTasksByStatus(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => { 
        if(data.success) {
          this.taskService.showloading(false);
          this.tasksByStatus = data.result;

          this.statusChartData = {
          labels: this.tasksByStatus.map((item: any) => item._id),
          datasets: [
            {
              data: this.tasksByStatus.map((item: any) => item.count),
              backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC'],
            },
          ],
        };
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while fetching task', 3000);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while fetching task', 3000);
      }
    })
  }

  getTasksByProgress() {
    let data = { projectId : this.projectId, userId: this.selectedUserId};

    this.taskService.getTasksByProgress(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        
        if(data.success) {
          this.taskService.showloading(false);
          this.tasksByProgress = data.result;
          this.progressChartData = {
            labels: this.tasksByProgress.map((item: any) => item._id?.toString()),
            datasets: [
              {
                data: this.tasksByProgress.map((item: any) => item.count),
                backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC'],
              },
            ],
          };
          
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while fetching task', 3000);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while fetching task', 3000);
      }
    })
  }

  getTasksByPriority() {
    let data = { projectId : this.projectId, userId: this.selectedUserId};

    this.taskService.getTasksByPriority(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        
        if(data.success) {
          this.taskService.showloading(false);
          this.tasksByPriority = data.result;
          this.priorityChartData = {
            labels: this.tasksByPriority.map((item: any) => item._id),
            datasets: [
              {
                data: this.tasksByPriority.map((item: any) => item.count),
                backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726'],
              },
            ],
          };
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while fetching task', 3000);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while fetching task', 3000);
      }
    })
  }

  getTasksByMonth() {
    let data = { projectId : this.projectId, userId: this.selectedUserId};

    this.taskService.getTasksByMonth(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.tasksByMonth = data.result;
          this.monthChartData = {
            labels: this.tasksByMonth.map((item: any) => item.month ?? 'Unknown'),
            datasets: [{
              data: this.tasksByMonth.map((item: any) => item.count),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#81C784'],
            }]
          };
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while fetching task', 3000);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while fetching task', 3000);
      }
    })
  }

  getTotalTasks(): number {
    const statusTotal = this.tasksByStatus?.reduce((sum: number, s: any) => sum + (s.count || 0), 0) || 0;
    return statusTotal;
  }

  mergeAllTasks(): void {
    const tasksSet = new Set<string>();

    const extractTasks = (grouped: any[]): any[] =>
      grouped?.flatMap(group => group.tasks || []) || [];

    const merged = [
      ...extractTasks(this.tasksByStatus),
      ...extractTasks(this.tasksByProgress),
      ...extractTasks(this.tasksByPriority),
      ...extractTasks(this.tasksByMonth)
    ].filter(task => {
      if (!tasksSet.has(task._id)) {
        tasksSet.add(task._id);
        return true;
      }
      return false;
    });

    this.allTasks = merged;
  }

  generatePdf() {
    const data = { projectId: this.projectId, userId: this.selectedUserId };

    this.taskService.showloading(true);
    this.taskService.generatePdf(data).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        if (blob.type === 'application/json') {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result as string);
              this.taskService.showloading(false);
            } catch (e) {
              this.taskService.showloading(false);
              this.taskService.showAlertMessage('error', 'Unexpected error occurred while reading error blob', 3000);
            }
          };
          this.taskService.showloading(false);
          reader.readAsText(blob);
          return;
        }
        this.taskService.showloading(false);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'analytics_report.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while generating PDF', 3000);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
