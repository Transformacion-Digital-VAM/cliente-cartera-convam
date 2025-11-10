import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, take } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url }
        });
        return false;
      }

      if (authService.isAdmin()) {
        return true;
      }

      router.navigate(['/dashboard'], {
        queryParams: { error: 'admin-access-required' }
      });
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};

// export const adminGuard: CanActivateFn = (route, state) => {
//   const authService = inject(AuthService);
//   const router = inject(Router);

//   return authService.currentUser$.pipe(
//     take(1),
//     map(user => {
//       // Definir qué roles son administradores
//       const adminRoles = [ 4];
      
//       const isAdmin = user && adminRoles.includes(user.rol_id);
      
//       if (isAdmin) {
//         console.log('Acceso permitido: Usuario administrador, Rol:', user.rol_id);
//         return true;
//       } else {
//         console.warn('Acceso denegado: Se requiere rol de administrador. Rol actual:', user?.rol_id);
        
//         // Redirigir al dashboard
//         router.navigate(['/dashboard'], {
//           queryParams: { 
//             returnUrl: state.url,
//             error: 'admin-access-required'
//           }
//         });
//         return false;
//       }
//     })
//   );
// };