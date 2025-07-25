import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardComponent } from './dashboard.component';
import { TaskService } from '../../services/task/task.service';
import { UserSevice } from '../../services/user/user-sevice.service';

describe('AdminDashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let taskService: TaskService;
  let userService: UserSevice;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{provide: TaskService},
                  {provide: UserSevice}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService);
    userService = TestBed.inject(UserSevice);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should create user service', () => {
    expect(userService).toBeTruthy();
  });
  it('should create task service', () => {
    expect(taskService).toBeTruthy();
  });

  it('should fetch projects', () => {
    
  })
});
