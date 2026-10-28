import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const instId = authService.getSelectedInstitutionId();

  let headers = req.headers;
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  if (instId) {
    headers = headers.set('X-Institution-Id', instId);
  }

  const cloned = req.clone({ headers });
  return next(cloned);
};
