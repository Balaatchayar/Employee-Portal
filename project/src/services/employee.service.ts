import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfileResponse, LeaveResponse } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getProfile(employeeId: string): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(`${this.apiUrl}/employee/profile`, { employeeId });
  }

  getLeaveData(employeeId: string): Observable<LeaveResponse> {
    return this.http.post<LeaveResponse>(`${this.apiUrl}/employee/leave`, { employeeId });
  }

  getPayslip(): Observable<Blob> {
    return this.http.get('http://localhost:3000/test-payslip', { 
      responseType: 'blob' 
    });
  }
}