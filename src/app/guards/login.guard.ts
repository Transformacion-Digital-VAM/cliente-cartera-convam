// import { CanActivateFn } from '@angular/router';

// export const loginGuard: CanActivateFn = (route, state) => {
//   return true;
// };
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, take } from 'rxjs/operators';
import { of } from 'rxjs';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) return true; // Permitir acceso al login
      
      // Redirigir según rol
      const redirectUrl = authService.isAdmin() ? '/admin-control' : '/login';
      router.navigate([redirectUrl], { replaceUrl: true });
      return false;
    }),
    catchError(() => of(true)) // En error, permitir acceso
  );
};