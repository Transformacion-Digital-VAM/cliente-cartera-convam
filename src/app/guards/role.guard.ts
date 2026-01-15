import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const user = this.authService.getCurrentUserSync();
    if (!user) return this.router.createUrlTree(['/login']);

    const expectedRoles: string[] | undefined = route.data['expectedRoles'];
    const expectedRole: string | undefined = route.data['expectedRole'];
    const userRole = this.mapRoleIdToName(user.rol_id); // 'ejecutiva'|'tesoreria'|'coordinador'|'administrador'

    if (expectedRoles && expectedRoles.length) {
      const allowed = expectedRoles.map(r => r.toLowerCase());
      if (allowed.includes(userRole)) return true;
      return this.router.createUrlTree([this.authService.getRouteByRoleId(user.rol_id)]);
    }

    if (expectedRole) {
      if (userRole === expectedRole.toLowerCase()) return true;
      return this.router.createUrlTree([this.authService.getRouteByRoleId(user.rol_id)]);
    }

    // Si no hay restricción, permitir
    return true;
  }

  private mapRoleIdToName(rolId: number): string {
    switch (rolId) {
      case 1: return 'ejecutiva';
      case 2: return 'tesoreria';
      case 3: return 'coordinador';
      case 4: return 'administrador';
      default: return '';
    }
  }
}
