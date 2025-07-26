import { Component, OnInit, inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { CalendarModule } from 'primeng/calendar';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Subject, takeUntil } from 'rxjs';


@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterLink, CalendarModule, BreadcrumbComponent, PaginatorModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {

  projectForm!: FormGroup;
  inviteForm!: FormGroup;
  taskService = inject(TaskService);
  userService = inject(UserSevice);
  private destroy$ = new Subject<void>();

  @ViewChild('closeBtn') closeBtn!: ElementRef;
  @ViewChild('editModalCloseBtn') editModalCloseBtn!: ElementRef;
  @ViewChild('inviteClose') inviteClose!: ElementRef;
  projects: any = [];
  userObject : any;
  authStatus : any;
  // statusOptions = ['Active','On Hold', 'Cancelled', 'Completed'];
  currentPage:number = 1;
  limit: number = 10;
  totalPages: number = 0;
  totalProjects: number = 0;

  search = '';
  selectedStatus = '';

  // Sorting
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'asc';

  // statusOptions = ['active', 'cancelled', 'onhold', 'completed'];
  statusOptions = [{label: 'Active', value: 'active'}, {label: 'Cancelled', value: 'cancelled'}, {label: 'On Hold', value: 'onhold'}, {label: 'Completed', value: 'completed'}]
  
  editForm!: FormGroup;
  selectedProjectId: string = '';
  minDate!: Date;
  breadCrumbItems : any[] = [];
  searchDebounceTimer: any;

  ngOnInit(): void {
    this.minDate = new Date();
    this.breadCrumbItems = [
      {label: 'Home', route: '/', icon: 'fa fa-home'},
      {label: 'Dashboard'}
    ];

    this.projectForm = new FormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl('',Validators.required),
      startDate: new FormControl('',Validators.required),
      endDate: new FormControl('',Validators.required),
      status: new FormControl('active')
    });

    this.inviteForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });

    this.editForm = new FormGroup({
      name: new FormControl({ value: '', disabled: true }, Validators.required),
      description: new FormControl(''),
      startDate: new FormControl({ value: '', disabled: true }),
      endDate: new FormControl(''),
      status: new FormControl(''),
    });

    this.userService.getUserObject().pipe(takeUntil(this.destroy$)).subscribe({
        next:(user)=> {
          this.userObject = user;
          
          this.userService.getAuthStatus().subscribe({
            next:(status) => {
              this.authStatus = status;
              
              if(this.authStatus) {
                this.fetchProjects();
              }
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

  fetchProjects() {
    let options = {
      page: this.currentPage,
      limit: this.limit,
      search: this.search,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      status: this.selectedStatus
    }
    
    this.taskService.showloading(true);

    this.taskService.getProjects(options).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        this.taskService.showloading(false);
        this.projects = data.projects;
        this.totalPages = data.meta.totalPages;
        this.totalProjects = data.meta.total;
        
      },error:(error)=> {
        this.projects = [];
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('success', error.message || 'Failed to fetch projects', 3000);
        
      }
    })
  }

  submitProjectForm() {
    if (!this.projectForm.valid) return;

    const projectData = this.projectForm.value;
    console.log("projectData, ", projectData);
    this.taskService.showloading(true);
    this.taskService.createProject(projectData).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'Project created successfully', 3000);
          this.closeBtn.nativeElement.click();
          this.projectForm.reset();
          this.fetchProjects();
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while creating project', 3000);
          this.closeBtn.nativeElement.click();
          this.projectForm.reset();
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while creating project', 3000);
        this.closeBtn.nativeElement.click();
        this.projectForm.reset(); 
      }
    })
  }

  inviteUser() {
    if(!this.inviteForm.valid) return;

    this.taskService.showloading(true);
    this.userService.inviteUser({email : this.inviteForm.value.email}).pipe(takeUntil(this.destroy$)).subscribe({
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

  onPageChange(event: any): void {
    this.limit = event.rows;
    this.currentPage = Math.floor(event.first / this.limit) + 1;
    this.fetchProjects();
  }
  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.fetchProjects();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.fetchProjects();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    clearTimeout(this.searchDebounceTimer);

    this.searchDebounceTimer = setTimeout(()=> {
      this.fetchProjects();
    }, 500)
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.fetchProjects();
  }

  editProject(project: any) {
    this.selectedProjectId = project._id;
    this.editForm.patchValue({
      name: project.name,
      description: project.description,
      startDate: project.startDate?.substring(0, 10),
      endDate: project.endDate?.substring(0, 10),
      status: project.status
    });
  }

  submitUpdateForm() {
    let data = {
      description : this.editForm.value.description,
      endDate : this.editForm.value.endDate,
      status : this.editForm.value.status,
      projectId : this.selectedProjectId
    }

    this.taskService.updateProject(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'Project updated successfully', 3000);
          this.editModalCloseBtn.nativeElement.click();
          this.editForm.reset();
          this.fetchProjects();
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

  deleteProject(projectId: string) {
    
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
