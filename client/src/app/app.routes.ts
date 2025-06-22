import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RegisterAdminComponent } from './components/register-admin/register-admin.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { adminGuard, authGuard } from './guards/auth.guard';
import { ProjectComponent } from './components/project/project.component';
import { RegisterUserComponent } from './components/register-user/register-user.component';
import { TaskDetailsComponent } from './components/task-details/task-details.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { MyAccountComponent } from './components/my-account/my-account.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { UsersListComponent } from './components/users-list/users-list.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';

export const routes: Routes = [
    { path : '', component :HomeComponent},
    { path : 'register-admin', component : RegisterAdminComponent},
    { path : 'login', component: LoginComponent},
    { path : 'dashboard', component: DashboardComponent, canActivate:[authGuard]},
    { path : 'project/:projectid', component : ProjectComponent, canActivate:[authGuard]},
    { path : 'register-user', component : RegisterUserComponent},
    { path : 'task/:taskid', component : TaskDetailsComponent, canActivate:[authGuard]},
    { path : 'analytics/:projectId', component : AnalyticsComponent, canActivate:[authGuard]},
    { path : 'my-account', component : MyAccountComponent, canActivate:[authGuard]},
    { path : 'change-password', component : ChangePasswordComponent, canActivate:[authGuard]},
    { path : 'forgot-password', component : ForgotPasswordComponent},
    { path : 'users-list', component : UsersListComponent, canActivate:[adminGuard]},
    { path : 'users-details/:userid', component : UserDetailsComponent, canActivate:[adminGuard]},

];
