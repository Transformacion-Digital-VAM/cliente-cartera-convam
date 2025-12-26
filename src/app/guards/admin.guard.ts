// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';
// import { catchError, map, take } from 'rxjs/operators';
// import { of } from 'rxjs';

// export const adminGuard: CanActivateFn = (route, state) => {
//   const authService = inject(AuthService);
//   const router = inject(Router);

//   return authService.currentUser$.pipe(
//     take(1),
//     map(user => {
//       if (!user) {
//         router.navigate(['/login'], { 
//           queryParams: { returnUrl: state.url }
//         });
//         return false;
//       }

//       if (authService.isAdmin()) {
//         return true;
//       }

//       router.navigate(['/login'], {
//         queryParams: { error: 'admin-access-required' }
//       });
//       return false;
//     }),
//     catchError(() => {
//       router.navigate(['/login']);
//       return of(false);
//     })
//   );
// };

// // export const adminGuard: CanActivateFn = (route, state) => {
// //   const authService = inject(AuthService);
// //   const router = inject(Router);

// //   return authService.currentUser$.pipe(
// //     take(1),
// //     map(user => {
// //       // Definir qué roles son administradores
// //       const adminRoles = [ 4];
      
// //       const isAdmin = user && adminRoles.includes(user.rol_id);
      
// //       if (isAdmin) {
// //         console.log('Acceso permitido: Usuario administrador, Rol:', user.rol_id);
// //         return true;
// //       } else {
// //         console.warn('Acceso denegado: Se requiere rol de administrador. Rol actual:', user?.rol_id);
        
// //         // Redirigir al dashboard
// //         router.navigate(['/dashboard'], {
// //           queryParams: { 
// //             returnUrl: state.url,
// //             error: 'admin-access-required'
// //           }
// //         });
// //         return false;
// //       }
// //     })
// //   );
// // };





// admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.getCurrentUser();
  
  console.log('AdminGuard - Verificando acceso administrativo');
  console.log('AdminGuard - Usuario:', user);
  
  if (!user) {
    console.log('AdminGuard - No hay usuario, redirigiendo a login');
    router.navigate(['/login'], { 
      queryParams: { 
        returnUrl: state.url,
        error: 'login-required' 
      }
    });
    return false;
  }

  // Verificar si es administrador (rol_id = 4)
  if (user.rol_id === 4) {
    console.log('AdminGuard - Acceso administrativo permitido');
    return true;
  }

  console.log('AdminGuard - Acceso denegado, no es administrador');
  
  // Redirigir según el rol del usuario
  const userRoute = authService.getRouteByRoleId(user.rol_id);
  router.navigate([userRoute], {
    queryParams: { 
      error: 'admin-access-required',
      message: 'Se requieren permisos de administrador' 
    }
  });
  return false;
};