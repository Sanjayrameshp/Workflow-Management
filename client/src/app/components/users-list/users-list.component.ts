import { Component, OnInit, inject, OnDestroy} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-users-list',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit, OnDestroy {

  private taskService = inject(TaskService);
  private userService = inject(UserSevice);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  userObject : any;
  authStatus: boolean = false;
  usersList: any[]= [];
  breadCrumbItems : any[] = [];

  ngOnInit(): void {
    this.breadCrumbItems = [
      {label: 'Dashboard', route: '/dashboard', icon: 'fa fa-home'},
      {label: 'Users List'}
    ];
    this.userService.getUserObject().pipe(takeUntil(this.destroy$)).subscribe({
        next:(user)=> {
          this.userObject = user;
          this.userService.getAuthStatus().pipe(takeUntil(this.destroy$)).subscribe({
            next:(status) => {
              this.authStatus = status;
              if(this.authStatus) {
                this.getUsersByAdmin();
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

  getUsersByAdmin() {
    this.taskService.showloading(true);
    this.userService.getUsersByAdmin().pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.usersList = data.users;
          this.taskService.showloading(false);
        } else {
          this.usersList = [];
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while fetching projects', 3000);
        }
      },
      error:(error) => {
        this.usersList = [];
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while fetching projects', 3000);
      }
    })
  }

  viewUser(user:any) {
    this.router.navigate(['/users-details', user._id])
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
