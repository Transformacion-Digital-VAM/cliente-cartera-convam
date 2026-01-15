import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.getCurrentUser();
  console.log('LoginGuard - Usuario:', user);

  if (!user) {
    return true; // permitir acceso a /login
  }

  // Ya autenticado → devolver UrlTree hacia la ruta por rol
  const redirect = authService.getRouteByRole();
  return router.createUrlTree([redirect]);
};

