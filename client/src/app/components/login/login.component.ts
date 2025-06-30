import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TaskService } from '../../services/task/task.service';
import { UserSevice } from '../../services/user/user-sevice.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink, BreadcrumbComponent, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  router = inject(Router);
  taskService = inject(TaskService);
  userService = inject(UserSevice);
  loginForm!: FormGroup;
  breadCrumbItems : any[] = [];
  orgsList: any[] = [];
  isMutipleOrg : boolean = false;
  selectedOrg: any = null;

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl(null, Validators.required),
      password: new FormControl(null, Validators.required)
    });

    this.breadCrumbItems = [
      {label: 'Home', route: '/', icon: 'fa fa-home'},
      {label: 'Login'}
    ];
  }

  isInvalid(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.touched && control.invalid : false;
  }

  checkForMultipleOrgs() {
    const loginData = this.loginForm.value;
    if(loginData.email && loginData.email.length > 4) {
      this.taskService.showloading(true);
      this.userService.checkForMultipleOrgs(loginData.email).subscribe({
        next:(response:any)=> {
          this.taskService.showloading(false);
          let data = response.organizations;
          console.log("org data > ", data);
          
          if(data && data.length > 1) {
            this.isMutipleOrg = true;
            for(let org of data) {
              this.orgsList.push(org.organization);
              console.log("org list > ", this.orgsList);
            }
          } else {
            this.taskService.showloading(false);
            this.selectedOrg = null;
            this.isMutipleOrg = false;
            this.orgsList = [];
          }
        }, error:(error)=> {
          this.taskService.showloading(false);
          this.selectedOrg = null;
          this.orgsList = [];
          console.log("login error > ", error);
        }
      })
    }

  }

  onLogin() {
    console.log("selested org < ", this.selectedOrg);
    
    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      organization: this.selectedOrg ?  this.selectedOrg : null
    };
    console.log("login data > ", loginData);
    
    this.userService.onLogin(loginData).subscribe({
      next:(response:any)=> {
        if(response.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', response.message || 'Logged In successfully', 3000);
          this.navigateTo()
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', response.message || 'Unable to login', 3000);
        }
      }, error:(error)=> {
        this.taskService.showloading(false);
        console.log("login error > ", error);
        
        this.taskService.showAlertMessage('error', error.message || 'Unable to login', 3000);
      }
    })
  }

  navigateTo() {
    const role = this.userService.userRole.value;
    const authStatus = this.userService.authStatus.value;

    if(!authStatus) return;

    this.router.navigate(['/dashboard'])
  }
}
