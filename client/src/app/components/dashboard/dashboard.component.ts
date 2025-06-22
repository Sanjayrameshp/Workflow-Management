import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { CalendarModule } from 'primeng/calendar';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";


@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterLink, CalendarModule, BreadcrumbComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  projectForm!: FormGroup;
  taskService = inject(TaskService);
  userService = inject(UserSevice)
  @ViewChild('closeBtn') closeBtn!: ElementRef;
  @ViewChild('editModalCloseBtn') editModalCloseBtn!: ElementRef;
  projects: any = [];
  userObject : any;
  authStatus : any;
  // statusOptions = ['Active','On Hold', 'Cancelled', 'Completed'];
  currentPage:number = 1;
  limit: number = 10;
  totalPages: number = 0;

  search = '';
  selectedStatus = '';

  // Sorting
  sortBy = 'startDate';
  sortOrder: 'asc' | 'desc' = 'asc';

  statusOptions = ['active', 'cancelled', 'onhold', 'completed'];
  
  editForm!: FormGroup;
  selectedProjectId: string = '';
  minDate!: Date;
  breadCrumbItems : any[] = [];

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
      status: new FormControl('active'),
    });

    this.editForm = new FormGroup({
      name: new FormControl({ value: '', disabled: true }, Validators.required),
      description: new FormControl(''),
      startDate: new FormControl({ value: '', disabled: true }),
      endDate: new FormControl(''),
      status: new FormControl(''),
    });

    this.userService.getUserObject().subscribe({
        next:(user)=> {
          this.userObject = user;
          console.log("header-user > ", this.userObject);
          
          this.userService.getAuthStatus().subscribe({
            next:(status) => {
              this.authStatus = status;
              this.fetchProjects();
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
    console.log("inside");
    
    let options = {
      page: this.currentPage,
      limit: this.limit,
      search: this.search,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      status: this.selectedStatus
    }
    this.taskService.showloading(true);

    this.taskService.getProjects(options).subscribe({
      next:(data:any) => {
        this.taskService.showloading(false);
        console.log("projects > ", JSON.stringify(data));
        this.projects = data.projects;
        this.totalPages = data.meta.totalPages;
        
      },error:(error)=> {
        this.projects = [];
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('success', error.message || 'Failed to fetch projects', 3000);
        
      }
    })
  }

  submitForm() {
    if (!this.projectForm.valid) return;

    const projectData = this.projectForm.value;
    console.log("projectData, ", projectData);

    this.taskService.createProject(projectData).subscribe({
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

  onPageChange(page: number): void {
    this.currentPage = page;
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

  onSearchChange(): void {
    this.currentPage = 1;
    this.fetchProjects();
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

    this.taskService.updateProject(data).subscribe({
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
}
