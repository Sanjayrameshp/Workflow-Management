import { Component, OnInit, inject, ViewChild, ElementRef} from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task/task.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-user-details',
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {

  private taskService = inject(TaskService);
  private userService = inject(UserSevice);
  private activatedRoute = inject(ActivatedRoute);

  @ViewChild('deleteUserClose') deleteUserClose!: ElementRef;
  @ViewChild('removeProjectClose') removeProjectClose!: ElementRef;
  
  userId :any;
  userData: any;
  selectedProjectId: string | null = null;
  breadCrumbItems : any[] = [];
  loggedUser : any;
  authStatus: boolean = false;

  ngOnInit(): void {
    this.breadCrumbItems = [
      {label: 'Home', route: '/', icon: 'fa fa-home'},
      {label: 'Dashboard', route: '/dashboard'},
      {label: 'User Details'}
    ];

    this.userService.getUserObject().subscribe({
        next:(user)=> {
          this.loggedUser = user;
          
          this.userService.getAuthStatus().subscribe({
            next:(status) => {
              this.authStatus = status;
              this.activatedRoute.paramMap.subscribe((params) => {
              this.userId = params.get('userid');
                if(this.userId && this.authStatus) {
                  this.getUserDetails();
                }
              });
            },error:(error)=> {
              this.authStatus = false;
            }
          })
        },
        error:(error)=> {
          this.loggedUser = null;
      }
    });
  }

  getUserDetails() {
    this.userService.getUserDetailsForAdmin(this.userId).subscribe({
      next:(data:any) => {
        console.log("pro <", JSON.stringify(data));
        if(data.success) {
          this.userData = data.user;
          this.taskService.showloading(false);
          // this.taskService.showAlertMessage('success', data.message || 'invite successfully', 3000);
        } else {
          this.userData = null;
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while fetching projects', 3000);
        }
      },
      error:(error) => {
        this.userData = null;
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while fetching projects', 3000);
      }
    })

  }

  removeFromProject(projectId: any) {
    console.log("Remove project:", projectId);
    if(!this.userData) {
      this.taskService.showAlertMessage('info', 'You have no authorization to remove this project', 3000);
      return;
    }
    let data = {
      userId: this.userId,
      projectId
    }

    this.userService.removeFromProject(data).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'Project removed successfully', 3000);
          this.removeProjectClose.nativeElement.click();
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while removing projects', 3000);
          this.removeProjectClose.nativeElement.click();
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while removing projects', 3000);
        this.removeProjectClose.nativeElement.click();
      }
    })
  }

  deleteUser() {
    console.log("Delete user:", this.userId);

    if(!this.userData) {
      this.taskService.showAlertMessage('info', 'You have no authorization to delete this user', 3000);
      return;
    }

    this.userService.deleteUser(this.userId).subscribe({
      next:(data:any) => {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'User deleted successfully', 3000);
          this.deleteUserClose.nativeElement.click();
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while deleting user', 3000);
          this.deleteUserClose.nativeElement.click();
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while deleting user', 3000);
        this.deleteUserClose.nativeElement.click();
      }
    })
  }


}
