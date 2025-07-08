import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { expressapi } from '../../expressapi.config';
import { BehaviorSubject, Observable,of,pipe,tap, switchMap } from 'rxjs';
import { Alert } from '../../common/interfaces/alert.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private http = inject(HttpClient)
  private alertMessage = signal<Alert[]>([]);
  private loading = signal<boolean>(false);

  constructor() { }

  createProject(data:any) {
    return this.http.post(expressapi.createProject, data)
  }

  getProjects(options:any) {
    let httpParams = new HttpParams();

    for (const key in options) {
      if (options[key]) {
        httpParams = httpParams.set(key, options[key]!);
      }
    }
    return this.http.get(expressapi.getProjects, { params: httpParams})
  }

  getProjectDetails(projectId :any) {
    return this.http.post(expressapi.getProjectDetails, {projectId});
  }

  createTask(taskData :any) {
    return this.http.post(expressapi.createTask, {taskData});
  }

  getTasks(options: any): Observable<any> {
    let httpParams = new HttpParams();

    for (const key in options) {
      if (options[key]) {
        httpParams = httpParams.set(key, options[key]!);
      }
    }

    return this.http.get(expressapi.getTasks, { params: httpParams});
  }

  getTaskDetails(taskData :any) {
    return this.http.post(expressapi.getTaskDetails, { taskData });
  }

  updateTask(taskId:string, taskData :any) {
    return this.http.post(expressapi.updateTask, { taskId, taskData });
  }

  updateProject(projectData :any) {
    return this.http.post(expressapi.updateProject, { projectData });
  }
  
  getTasksByStatus(data :any) {
    return this.http.post(expressapi.getTasksByStatus, data);
  }

  getTasksByProgress(data :any) {
    return this.http.post(expressapi.getTasksByProgress, data);
  }

  getTasksByPriority(data :any) {
    return this.http.post(expressapi.getTasksByPriority, data);
  }

  getTasksByMonth(data :any) {
    return this.http.post(expressapi.getTasksByMonth, data);
  }

  generatePdf(data: any) {
    return this.http.post(expressapi.generatePdf, data, {
      responseType: 'blob'
    });
  }

  projectTasksByStatus(data :any) {
    return this.http.post(expressapi.projectTasksByStatus, data);
  }

  projectTasksByProgress(data :any) {
    return this.http.post(expressapi.projectTasksByProgress, data);
  }

  projectTasksByPriority(data :any) {
    return this.http.post(expressapi.projectTasksByPriority, data);
  }

  groupTasksByAssignedUser(data :any) {
    return this.http.post(expressapi.groupTasksByAssignedUser, data);
  }

  addUserToProject(data :any) {
    return this.http.post(expressapi.addUserToProject, data);
  }

  showAlertMessage(type:Alert['severity'], message: string, duration: number) {
    const messageModel = {
      severity: type,
      summary: message,
      life: duration
    }
    this.alertMessage.set([messageModel]);
  }

  get getAlertMessages() {
    return this.alertMessage.asReadonly();
  }
  clearMessages() {
    this.alertMessage.set([]);
  }

  showloading(value: boolean) {
    this.loading.set(value)
  }

  isLoading () {
    return this.loading();
  }
}
