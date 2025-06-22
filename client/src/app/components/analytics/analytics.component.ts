import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-analytics',
  imports: [ CommonModule, BaseChartDirective, FormsModule, BreadcrumbComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {

  private taskService = inject(TaskService);
  private userservice = inject(UserSevice)
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  projectId : any = '';
  userObject : any;
  usersList : any[] = [];
  selectedUserId : any;
  selectedUser : any;
  selectedUsersList :any[] = [];
  breadCrumbItems : any[] = [];

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
    this.activatedRoute.paramMap.subscribe((params) => {
      this.projectId = params.get('projectId');
      if(this.projectId) {

        this.userservice.getUserObject().subscribe({
        next:(user)=> {
          console.log('user > ', user );
          this.userObject = user;
          if(this.userObject.role === 'admin') {
            this.getUsersList();
          } else {
            this.selectedUser = {...this.userObject}
            this.selectedUserId = this.userObject._id;
            this.getAllTasksByUser();
          }

          },
          error:(error)=> {
            this.userObject = null;
            this.taskService.showAlertMessage('error', error.message || 'Something went wrong', 3000);
          }
        });
          
      }
    });

    this.breadCrumbItems = [
      {label: 'Home', route: '/', icon: 'fa fa-home'},
      {label: 'Dashboard', route: '/dashboard'},
      {label: 'Analytics'}
    ];
    
  }

  getUsersList() {
    this.userservice.getUsersByProject(this.projectId).subscribe({
      next:(users:any) => {
        if(users.success) {
          this.usersList = users.users;
          console.log("user list-analyt > ", this.usersList);
          
          this.selectedUsersList = this.usersList.filter((item)=> {
            return item.role !== 'admin'
          });

          console.log("selected usr list > ", this.selectedUsersList);
          

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

  getAllTasksByUser() {
    this.getTasksByStatus();
    this.getTasksByProgress();
    this.getTasksByPriority();
    this.getTasksByMonth();
    setTimeout(() => this.mergeAllTasks(), 1000);
  }

  getTasksByStatus() {
    let data = { projectId : this.projectId, userId: this.selectedUserId};

    this.taskService.getTasksByStatus(data).subscribe({
      next:(data:any) => {
        console.log("res > ", JSON.stringify(data));
        
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
          // this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
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

    this.taskService.getTasksByProgress(data).subscribe({
      next:(data:any) => {
        console.log("res > ", JSON.stringify(data));
        
        if(data.success) {
          this.taskService.showloading(false);
          this.tasksByProgress = data.result;
          this.progressChartData = {
            labels: this.tasksByProgress.map((item: any) => item._id),
            datasets: [
              {
                data: this.tasksByProgress.map((item: any) => item.count),
                backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC'],
              },
            ],
          };
          
          // this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
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

    this.taskService.getTasksByPriority(data).subscribe({
      next:(data:any) => {
        console.log("res > ", JSON.stringify(data));
        
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
          // this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
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

    this.taskService.getTasksByMonth(data).subscribe({
      next:(data:any) => {
        console.log("res > ", JSON.stringify(data));
        
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
          // this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
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
    // avoid duplicates
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
  this.taskService.generatePdf(data).subscribe({
    next: (blob: Blob) => {
      // Step 1: Check if the blob is really a PDF or an error JSON disguised as blob
      if (blob.type === 'application/json') {
        // Read JSON error blob
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

      // Step 2: Valid PDF - download
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


}
