import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UserRole } from '../../common/interfaces/user-role.interface';
import { UserSevice } from '../../services/user/user-sevice.service';
import { TaskService } from '../../services/task/task.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-register-user',
  imports: [ReactiveFormsModule, CommonModule, BreadcrumbComponent],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.css'
})
export class RegisterUserComponent implements OnInit {

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private userService = inject(UserSevice);
  private taskService = inject(TaskService);
  breadCrumbItems : any[] = [];

  userRegForm!: FormGroup;
  role = UserRole.User;
  showForm = false;
  userToken : any

  ngOnInit(): void {
    this.breadCrumbItems = [
      {label: 'Home', route: '/', icon: 'fa fa-home'},
      {label: 'Register user'}
    ];

    this.activatedRoute.queryParamMap.subscribe((params) => {
      this.userToken = params.get('token');
      if(this.userToken) {
        this.validateUserToken(this.userToken);
      }
    });

    this.userRegForm = new FormGroup({
      firstname: new FormControl(null, Validators.required),
      lastname: new FormControl(null, Validators.required),
      email: new FormControl(null, [Validators.required, Validators.email]),
      phone : new FormControl(null, [Validators.required, Validators.minLength(6)]),
      password: new FormControl('', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]),
      confirmPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordMatchValidator });
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
    
    const control = this.userRegForm.get(controlName);
    
    return control ? control.touched && control.invalid && (!errorType || control.hasError(errorType)) : false;
  }

  isPasswordValid(controlName: string, errorType: string): boolean {
    const control = this.userRegForm.get(controlName);
    return control ? control.touched && !control.hasError(errorType) : false;
  }

  get passwordControl() {
    return this.userRegForm.get('password');
  }

  validateUserToken(token :any) {
    this.taskService.showloading(true)
    if(!token) {
      this.taskService.showloading(false);
      this.taskService.showAlertMessage('info', 'Invitation link expired', 3000);
    }

    this.userService.validateInvitationToken(token).subscribe({
      next:(data:any)=> {
        if(data.success) {
          this.taskService.showloading(false);
          this.showForm = true;
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('info', 'Invitation link expired', 3000);
          this.showForm = false;
        }
      },error:(error)=> {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('info', 'Invitation link expired', 3000);
        this.showForm = false;
      }
    })
  }


  registerUser() {
    if(!this.userRegForm.valid) return

    let userData = {
      firstname : this.userRegForm.value.firstname,
      lastname : this.userRegForm.value.lastname,
      email : this.userRegForm.value.email,
      phone : this.userRegForm.value.phone,
      password : this.userRegForm.value.password,
      role : this.role,
      token : this.userToken ? this.userToken : null
    }

    this.taskService.showloading(true);
    this.userService.signUpUser(userData).subscribe({
      next:(data:any)=> {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'User registered successfully', 3000);
          this.router.navigate(['/login']);
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Something went wrong', 3000);
        }
      },error:(error) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Something went wrong', 3000);
      }
    })
  }

}
