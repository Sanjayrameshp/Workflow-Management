import { Component,inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserRole } from '../../common/interfaces/user-role.interface';
import { UserSevice } from '../../services/user/user-sevice.service';
import { TaskService } from '../../services/task/task.service';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-register-admin',
  imports: [ReactiveFormsModule, CommonModule, BreadcrumbComponent],
  templateUrl: './register-admin.component.html',
  styleUrl: './register-admin.component.css'
})
export class RegisterAdminComponent implements OnInit {

  router = inject(Router);
  adminRegForm!: FormGroup;
  role = UserRole.Admin;
  otpForm!: FormGroup;
  otpSent = false;
  private userService = inject(UserSevice);
  private taskService = inject(TaskService);
  breadCrumbItems : any[] = [];

  ngOnInit(): void {
    this.breadCrumbItems = [
      {label: 'Home', route: '/', icon: 'fa fa-home'},
      {label: 'Register Account'}
    ];

    this.otpForm = new FormGroup({
      otp: new FormArray(
        Array.from({ length: 6 }, () => new FormControl('', [Validators.required]))
      )
    });

    this.adminRegForm = new FormGroup({
      orgname: new FormControl(null, Validators.required),
      description: new FormControl(null, Validators.required),
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
    
    const control = this.adminRegForm.get(controlName);
    
    return control ? control.touched && control.invalid && (!errorType || control.hasError(errorType)) : false;
  }

  isPasswordValid(controlName: string, errorType: string): boolean {
    const control = this.adminRegForm.get(controlName);
    return control ? control.touched && !control.hasError(errorType) : false;
  }

  get passwordControl() {
    return this.adminRegForm.get('password');
  }

  get otpControls() {
    return (this.otpForm.get('otp') as FormArray).controls;
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value.length === 1 && index < 5) {
      const nextInput = input.parentElement?.children[index + 1] as HTMLInputElement;
      nextInput?.focus();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = input.parentElement?.children[index - 1] as HTMLInputElement;
      prevInput?.focus();
    }
  }

  sendSignupOTP() {
    if(!this.adminRegForm.valid) return

    const email = this.adminRegForm.value.email;

    this.taskService.showloading(true);
    this.userService.sendSignupOTP(email).subscribe({
      next:(data:any)=> {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'An OTP has been sent to your email', 4000);
          this.otpSent = true;
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Error while sending OTP', 4000);
          this.otpSent = false;
        }
      },
      error:(error)=> {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Error while sending OTP', 4000);
        this.otpSent = false;
      }
    })

  }

  submitAdminRegForm() {

    if(!this.adminRegForm.valid) return

    let orgData = {
      orgname : this.adminRegForm.value.orgname,
      desc : this.adminRegForm.value.description,
    }

    let userData = {
      firstname : this.adminRegForm.value.firstname,
      lastname : this.adminRegForm.value.lastname,
      email : this.adminRegForm.value.email,
      phone : this.adminRegForm.value.phone,
      password : this.adminRegForm.value.password,
      role : this.role
    }

    const otp = (this.otpForm.get('otp') as FormArray).value.join(''); 
    this.taskService.showloading(true);

    this.userService.signUpOrgAndAdmin(orgData, userData, otp).subscribe({
      next:(data:any)=> {
        if(data.success) {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', data.message || 'User Created successfully, Please login to continue', 4000);
          this.router.navigate(['/login'])
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', data.message || 'Something went wrong', 4000);
        }
      }, error:(error)=> {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', error.message || 'Something went wrong', 4000);
      }
    })
    
  }
}
