import { Component, inject, OnInit } from '@angular/core';
import { UserSevice } from '../../services/user/user-sevice.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  private userService = inject(UserSevice);
  private router = inject(Router)
  userObject: any;
  authStatus : boolean = false;

  ngOnInit(): void {
    this.userService.getUserObject().subscribe({
        next:(user)=> {
          this.userObject = user;
          
          this.userService.getAuthStatus().subscribe({
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

  logOut() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
