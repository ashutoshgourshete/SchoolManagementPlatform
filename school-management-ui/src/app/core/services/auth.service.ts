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
  tenantLogoUrl = computed(() => this.currentUser()?.tenantLogoUrl || null);
  customLogo = signal<string | null>(typeof window !== 'undefined' ? localStorage.getItem('institution_custom_logo') : null);
  isLogoModalOpen = signal<boolean>(false);
  isMobileSidebarOpen = signal<boolean>(false);

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  openLogoModal(): void {
    this.isLogoModalOpen.set(true);
  }

  closeLogoModal(): void {
    this.isLogoModalOpen.set(false);
  }

  removeCustomLogo(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('institution_custom_logo');
    }
    this.customLogo.set(null);
  }

  institutionLogoUrl = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    const currentInst = user.availableInstitutions?.find(i => i.institutionId === user.institutionId);
    return currentInst?.logoUrl || user.institutionLogoUrl || user.tenantLogoUrl || null;
  });

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

  forgotPassword(identifier: string, method: 'email' | 'mobile' = 'email'): Observable<ApiResponse<{ message: string; resetToken?: string; maskedDestination?: string; resolvedEmail?: string }>> {
    const payload = {
      identifier,
      email: identifier,
      method: method === 'email' ? 1 : 2
    };
    return this.http.post<ApiResponse<{ message: string; resetToken?: string; maskedDestination?: string; resolvedEmail?: string }>>(`${this.baseUrl}/forgot-password`, payload);
  }

  resetPassword(payload: { identifier: string; email?: string; token: string; newPassword: string }): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/reset-password`, {
      identifier: payload.identifier,
      email: payload.email || payload.identifier,
      token: payload.token,
      newPassword: payload.newPassword
    });
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
        institutionName: found.name,
        institutionLogoUrl: found.logoUrl || user.institutionLogoUrl
      };
      this.setSession(updated);
      window.location.reload();
    }
  }

  setCustomLogo(logoUrl: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('institution_custom_logo', logoUrl);
    }
    this.customLogo.set(logoUrl);
    this.updateCurrentInstitutionLogo(logoUrl);
  }

  getEffectiveLogo(): string | null {
    return this.customLogo() || (typeof window !== 'undefined' ? localStorage.getItem('institution_custom_logo') : null) || this.institutionLogoUrl() || this.tenantLogoUrl() || null;
  }

  updateCurrentInstitutionLogo(logoUrl: string): void {
    const user = this.currentUser();
    if (!user) return;
    const updated: LoginResponse = {
      ...user,
      institutionLogoUrl: logoUrl,
      availableInstitutions: user.availableInstitutions.map(i => 
        i.institutionId === user.institutionId ? { ...i, logoUrl } : i
      )
    };
    this.setSession(updated);
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
