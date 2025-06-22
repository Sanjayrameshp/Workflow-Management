import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { UserSevice } from '../../services/user/user-sevice.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  private userService = inject(UserSevice);
  private router = inject(Router)
  userObject: any;
  authStatus : boolean = false;

  ngOnInit(): void {
    this.userService.getUserObject().subscribe({
        next:(user)=> {
          this.userObject = user;
          console.log("home-user > ", this.userObject);
          
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
}
