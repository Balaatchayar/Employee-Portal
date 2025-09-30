import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, Session } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<Session | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSession();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/employee/login`, credentials)
      .pipe(
        tap(response => {
          if (response.status === 'X') {
            const session: Session = {
              employeeId: credentials.employeeId,
              isAuthenticated: true,
              loginTime: Date.now()
            };
            this.setSession(session);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('employeeSession');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const session = this.getSession();
    return session?.isAuthenticated || false;
  }

  getCurrentEmployeeId(): string | null {
    const session = this.getSession();
    return session?.employeeId || null;
  }

  private setSession(session: Session): void {
    localStorage.setItem('employeeSession', JSON.stringify(session));
    this.currentUserSubject.next(session);
  }

  private getSession(): Session | null {
    const sessionStr = localStorage.getItem('employeeSession');
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  private loadSession(): void {
    const session = this.getSession();
    if (session) {
      this.currentUserSubject.next(session);
    }
  }
}