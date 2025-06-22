import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UserRole } from '../../common/interfaces/user-role.interface';
import { UserSevice } from '../../services/user/user-sevice.service';
import { TaskService } from '../../services/task/task.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, CommonModule, BreadcrumbComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private userService = inject(UserSevice);
  private taskService = inject(TaskService);
  breadCrumbItems : any[] = [];

  changePasswordForm!: FormGroup;

  ngOnInit(): void {
    this.changePasswordForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      currentPassword : new FormControl(null, [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]),
      confirmPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordMatchValidator });
    
    this.breadCrumbItems = [
      {label: 'Home', route: '/', icon: 'fa fa-home'},
      {label: 'Change Password'}
    ];
  }

  passwordMatchValidator(formGroup: AbstractControl): { [key: string]: boolean } | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { 'passwordMismatch': true };
  }

  passwordStrengthValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (!value) return null;

    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$*]).+$/;

    return pattern.test(value) ? null : { weakPassword: true };
  }

  isInvalid(controlName: string, errorType?: string): boolean {
    
    const control = this.changePasswordForm.get(controlName);
    
    return control ? control.touched && control.invalid && (!errorType || control.hasError(errorType)) : false;
  }

  isPasswordValid(controlName: string, errorType: string): boolean {
    const control = this.changePasswordForm.get(controlName);
    return control ? control.touched && !control.hasError(errorType) : false;
  }

  get passwordControl() {
    return this.changePasswordForm.get('password');
  }


  changePassword() {
    if(!this.changePasswordForm.valid) return;
    console.log("pass-data > ", this.changePasswordForm.value);
    let data = this.changePasswordForm.value;
    this.taskService.showloading(true);

    this.userService.changePassword(data).subscribe({
      next:(data:any) => {
        if(data.success) {
          console.log("changed pass <", data);
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'Password changed successfully', 3000);
        } else {
          this.taskService.showloading(false);

          this.taskService.showAlertMessage('error', data.message || 'Unable to update password', 3000);
        }
      },
      error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Unable to update password', 3000);
      }
    })
    

  }

}
