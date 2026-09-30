import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.getCurrentUser();
  
  // console.log('AdminGuard - Verificando acceso administrativo');
  // console.log('AdminGuard - Usuario:', user);
  
  if (!user) {
    // console.log('AdminGuard - No hay usuario, redirigiendo a login');
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
    // console.log('AdminGuard - Acceso administrativo permitido');
    return true;
  }

  // console.log('AdminGuard - Acceso denegado, no es administrador');
  
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