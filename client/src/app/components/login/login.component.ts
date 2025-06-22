import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TaskService } from '../../services/task/task.service';
import { UserSevice } from '../../services/user/user-sevice.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink, BreadcrumbComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  router = inject(Router);
  taskService = inject(TaskService);
  userService = inject(UserSevice);
  loginForm!: FormGroup;
  breadCrumbItems : any[] = [];

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

  onLogin() {
    const loginData = this.loginForm.value
    this.taskService.showloading(true);

    this.userService.onLogin(loginData).subscribe({
      next:(response:any)=> {
        if(response.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', response.message || 'Logged In successfully', 3000);
          this.navigateTo()
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', response.message || 'Logged In successfully', 3000);
        }
      }, error:(error)=> {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Logged In successfully', 3000);
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
