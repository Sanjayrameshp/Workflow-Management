import { Component, OnInit, inject, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { RouterLink } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-my-account',
  imports: [CommonModule, RouterLink, BreadcrumbComponent],
  templateUrl: './my-account.component.html',
  styleUrl: './my-account.component.css'
})
export class MyAccountComponent implements OnInit, OnDestroy {

  private taskService = inject(TaskService);
  private userService = inject(UserSevice)
  private destroy$ = new Subject<void>();

  userObject: any;
  authStatus : boolean = false;
  userDetails : any;
  breadCrumbItems : any[] = [];

  ngOnInit(): void {
    this.breadCrumbItems = [
      {label: 'Dashboard', route: '/dashboard', icon: 'fa fa-home'},
      {label: 'My Account'}
    ];
    this.userService.getUserObject().pipe(takeUntil(this.destroy$)).subscribe({
        next:(user)=> {
          this.userObject = user;
          this.userService.getAuthStatus().subscribe({
            next:(status) => {
              this.authStatus = status;
              if(this.authStatus) {
                this.getUserDetails();
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

  getUserDetails() {
    this.taskService.showloading(true);
    this.userService.getUserDetails().pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.userDetails = data.user;
          this.taskService.showloading(false);
        } else {
          this.taskService.showloading(false);
          this.userDetails = null;
          this.taskService.showAlertMessage('error', data.message || 'Error while fetching user', 3000);
        }
      },
      error:(error) => {
        this.userDetails = null;
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while fetching user', 3000);
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
