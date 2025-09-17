import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {

  private userService = inject(UserSevice);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  userObject: any;
  authStatus : boolean = false;

  ngOnInit(): void {
    this.userService.getUserObject().pipe(takeUntil(this.destroy$)).subscribe({
        next:(user)=> {
          this.userObject = user;
          this.userService.getAuthStatus().pipe(takeUntil(this.destroy$)).subscribe({
            next:(status) => {
              this.authStatus = status;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
