import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./components/header/header.component";
import { FooterComponent } from "./components/footer/footer.component";
import { TaskService } from './services/task/task.service';
import { MessagesModule } from 'primeng/messages';
import { CommonModule } from '@angular/common';
import { UserSevice } from './services/user/user-sevice.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MessagesModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  private taskService = inject(TaskService);
  private userservice = inject(UserSevice);
  messages = computed(() => this.taskService.getAlertMessages());
  isLoading = computed(() => this.taskService.isLoading());

  ngOnInit(): void {
    const user = this.userservice.getUserObject().subscribe({
      next:(data)=> {
        console.log(data);
        
      }
    });
    console.log(user);
    
  }
}
