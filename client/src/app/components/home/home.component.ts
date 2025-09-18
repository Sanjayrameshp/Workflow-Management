import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';
import { Subject, takeUntil } from 'rxjs';
import { CarouselModule } from 'primeng/carousel';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, CarouselModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {

  private userService = inject(UserSevice);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  userObject: any;
  authStatus : boolean = false;

  testimonials = [
    { text: 'Quantivio has transformed how our team collaborates.', name: 'Jane Smith', position: 'Project Manager' },
    { text: 'The analytics and reporting tools give us insights we never had before.', name: 'David Lee', position: 'Team Lead' },
    { text: 'The platform is intuitive, and our productivity has increased significantly.', name: 'Sarah Wilson', position: 'CEO' },
    { text: 'We love the simplicity and security features.', name: 'Michael Brown', position: 'Product Owner' },
    { text: 'Collaboration across teams has never been easier.', name: 'Emily Clark', position: 'Marketing Head' },
    { text: 'Quantivio helps us track everything in one place efficiently.', name: 'Robert Johnson', position: 'Operations Manager' }
  ];

  responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1
    }
  ];

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
