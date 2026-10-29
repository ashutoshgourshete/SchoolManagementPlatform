import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LoginResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'edu_auth_token';
  private readonly USER_KEY = 'edu_auth_user';

  // Reactive State Signals
  currentUser = signal<LoginResponse | null>(this.getStoredUser());
  isLoggedIn = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role);
  tenantName = computed(() => this.currentUser()?.tenantName || 'Platform');
  institutionName = computed(() => this.currentUser()?.institutionName || 'Main Institution');

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  registerTenant(payload: any): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/register-tenant`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<{ message: string; resetToken?: string }>> {
    return this.http.post<ApiResponse<{ message: string; resetToken?: string }>>(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(payload: { email: string; token: string; newPassword: string }): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/reset-password`, payload);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getSelectedInstitutionId(): string | null {
    return this.currentUser()?.institutionId || null;
  }

  switchInstitution(institutionId: string): void {
    const user = this.currentUser();
    if (!user) return;
    const found = user.availableInstitutions.find(i => i.institutionId === institutionId);
    if (found) {
      const updated: LoginResponse = {
        ...user,
        institutionId: found.institutionId,
        institutionName: found.name
      };
      this.setSession(updated);
      window.location.reload();
    }
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResult));
    this.currentUser.set(authResult);
  }

  private getStoredUser(): LoginResponse | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}
