import { Injectable,inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { expressapi } from '../../expressapi.config';
import { BehaviorSubject, Observable,of,pipe,tap, switchMap, map, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserSevice {

  private http = inject(HttpClient);
  jwtToken = new BehaviorSubject<string | null>(null);
  authStatus = new BehaviorSubject<boolean>(false);
  userRole = new BehaviorSubject<string | null>(null);

  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() { }

  sendSignupOTP(email :string) {
    return this.http.post(expressapi.sendSignupOTP, {email});
  }

  signUpOrgAndAdmin(orgData :any, userData :any, otp:string) {
    return this.http.post(expressapi.signUpOrgAndAdmin, {orgData,userData,otp});
  }

  checkForMultipleOrgs(email: string) {
    return this.http.post(expressapi.checkForMultipleOrgs, {email});
  }

  onLogin(loginData: { email: string, password: string, organization?: string}) {
    return this.http.post(expressapi.onLogin, loginData).pipe(
      tap((res: any) => {
        if (res.success) {
          localStorage.setItem('jw_token', res.token);
          this.jwtToken.next(res.token);
          this.authStatus.next(true);
          this.userRole.next(res.user?.role ?? null);
          this.currentUserSubject.next(res.user);
        }
      })
    );
  }

  getAuthStatus() {
    return this.authStatus.asObservable();
  }

  getUserObject(): Observable<any> {
    if (this.currentUserSubject.value) {
      return of(this.currentUserSubject);
    }
    const token = localStorage.getItem('jw_token');
    if (!token) {
      this.currentUserSubject.next(null);
      return of(null);
    }
    return this.http.post(expressapi.getUser, { token }).pipe(
      tap((res: any) => {
        if (res.success) {
          this.authStatus.next(true);
          this.userRole.next(res.user.role);
          this.currentUserSubject.next(res.user);
        } else {
          this.currentUserSubject.next(null);
        }
      }),
      map((res: any) => res.success ? res.user : null),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

 inviteUser(data: {email: string}) {
  return this.http.post(expressapi.inviteUser,data)
 }

 validateInvitationToken(token:any) {
  return this.http.post(expressapi.validateInvitationToken, { token })
 }

 signUpUser(data:any) {
  return this.http.post(expressapi.signUpUser, data);
 }

 getUsersByProject(projectId : any) {
  return this.http.post(expressapi.getUsersByProject, {projectId});
 }

 getUserDetails() {
  return this.http.get(expressapi.getUserDetails);
 }

 changePassword(data : any) {
  return this.http.post(expressapi.changePassword, {passwordData : data})
 }

 sendForgotPasswordOTP(email :string) {
    return this.http.post(expressapi.sendForgotPasswordOTP, {email});
  }

  submitForgotPassword(userData :any, otp:string) {
    return this.http.post(expressapi.submitForgotPassword, {userData,otp});
  }

  getUsersByAdmin(projectId:any) {
    return this.http.post(expressapi.getUsersByAdmin, projectId);
  }

  getUserDetailsForAdmin(userId:any) {
    return this.http.post(expressapi.getUserDetailsForAdmin, {userId});
  }

  deleteUser(userId:any) {
    return this.http.post(expressapi.deleteUser, {userId});
  }

  removeFromProject(data:any) {
    return this.http.post(expressapi.removeFromProject, data);
  }

  searchUserByProject(data:any) {
    return this.http.post(expressapi.searchUserByProject, data);
  }

  logout(): void {
    localStorage.removeItem('jw_token');
    this.jwtToken.next(null);
    this.authStatus.next(false);
    this.userRole.next(null);
    this.currentUserSubject.next(null);
}

}
