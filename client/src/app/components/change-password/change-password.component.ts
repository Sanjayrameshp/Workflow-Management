import { Component, inject, OnInit, OnDestroy  } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UserRole } from '../../common/interfaces/user-role.interface';
import { UserSevice } from '../../services/user/user-sevice.service';
import { TaskService } from '../../services/task/task.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, CommonModule, BreadcrumbComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit, OnDestroy {

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private userService = inject(UserSevice);
  private taskService = inject(TaskService);
  private destroy$ = new Subject<void>();

  breadCrumbItems : any[] = [];
  userObject: any;
  authStatus: boolean = false;

  changePasswordForm!: FormGroup;

  ngOnInit(): void {
    this.changePasswordForm = new FormGroup({
      email: new FormControl({value :null, disabled :true}, [Validators.required, Validators.email]),
      currentPassword : new FormControl(null, [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]),
      confirmPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordMatchValidator });
    
    this.breadCrumbItems = [
      {label: 'Dashboard', route: '/dashboard', icon: 'fa fa-home'},
      {label: 'Change Password'}
    ];

    this.userService.getUserObject().pipe(takeUntil(this.destroy$)).subscribe({
        next:(user)=> {
          this.userObject = user;
          this.userService.getAuthStatus().pipe(takeUntil(this.destroy$)).subscribe({
            next:(status) => {
              this.authStatus = status;
              if(this.authStatus) {
                this.changePasswordForm.patchValue({
                email: this.userObject.email
              })
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
    let data = this.changePasswordForm.value;
    this.taskService.showloading(true);
    console.log("DATA > ", data);
    

    this.userService.changePassword(data).pipe(takeUntil(this.destroy$)).subscribe({
      next:(data:any) => {
        if(data.success) {
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
