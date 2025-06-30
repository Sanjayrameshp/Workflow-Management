import { Component, OnInit, inject, ViewChild, ElementRef} from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-users-list',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {

  private taskService = inject(TaskService);
  private userService = inject(UserSevice);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  userObject : any;
  authStatus: boolean = false;
  usersList: any[]= [];
  breadCrumbItems : any[] = [];

  ngOnInit(): void {
    this.breadCrumbItems = [
      {label: 'Home', route: '/', icon: 'fa fa-home'},
      {label: 'Dashboard', route: '/dashboard'},
      {label: 'Users List'}
    ];
    this.userService.getUserObject().subscribe({
        next:(user)=> {
          this.userObject = user;
          console.log("comp-user > ", this.userObject);
          
          this.userService.getAuthStatus().subscribe({
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
    this.userService.getUsersByAdmin().subscribe({
      next:(data:any) => {
        console.log("pro <", JSON.stringify(data));
        if(data.success) {
          this.usersList = data.users;
          this.taskService.showloading(false);
          // this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
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

}
