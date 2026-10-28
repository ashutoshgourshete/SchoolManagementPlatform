import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const expectedRoles = route.data?.['roles'] as string[];
  if (expectedRoles && expectedRoles.length > 0) {
    const userRole = String(authService.userRole());
    const hasRole = expectedRoles.some(r => r.toLowerCase() === userRole.toLowerCase());
    if (!hasRole) {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};
