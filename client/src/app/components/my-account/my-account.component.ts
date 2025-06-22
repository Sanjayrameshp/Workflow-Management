import { Component, OnInit, inject, ViewChild, ElementRef} from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-my-account',
  imports: [CommonModule, RouterLink, BreadcrumbComponent],
  templateUrl: './my-account.component.html',
  styleUrl: './my-account.component.css'
})
export class MyAccountComponent implements OnInit {

  private taskService = inject(TaskService);
  private userService = inject(UserSevice)
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  userObject: any;
  authStatus : boolean = false;
  userDetails : any;
  breadCrumbItems : any[] = [];

  ngOnInit(): void {
    this.breadCrumbItems = [
      {label: 'Home', route: '/', icon: 'fa fa-home'},
      {label: 'My Account'}
    ];
    this.userService.getUserObject().subscribe({
        next:(user)=> {
          this.userObject = user;
          this.getUserDetails();
          
        },
        error:(error)=> {
          this.userObject = null;
      }
    });
    
  }

  getUserDetails() {
    this.taskService.showloading(true);
    this.userService.getUserDetails().subscribe({
      next:(data:any) => {
        if(data.success) {
          console.log("pro <", JSON.stringify(data));
          this.userDetails = data.user;
          this.taskService.showloading(false);
          // this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
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

}
