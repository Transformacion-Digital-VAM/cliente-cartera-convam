import { Routes } from '@angular/router';
import { HomeComponent } from './features/dashboard/pages/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ResetPasswComponent } from './features/auth/reset-passw/reset-passw.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminControlComponent } from './features/dashboard/admin-control/admin-control.component';
import { adminGuard } from './guards/admin.guard';
import { RoleGuard } from './guards/role.guard';
import { EnrollCustomerComponent } from './features/dashboard/pages/enroll-customer/enroll-customer.component';
import { ClientListComponent } from './features/dashboard/pages/client-list/client-list.component';
import { MinistracionComponent } from './features/dashboard/pages/ministracion/ministracion.component';
import { CreditRequestComponent } from './features/dashboard/pages/credit-request/credit-request.component';
import { FinancialHistoryComponent } from './features/dashboard/pages/financial-history/financial-history.component';
import { CreditAddressComponent } from './features/dashboard/pages/credit-address/credit-address.component';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: 'login', component: LoginComponent, canActivate: [loginGuard], data: { breadcrumb: 'Login' } },

  // Admin
  { path: 'register', component: RegisterComponent, canActivate: [adminGuard], data: { breadcrumb: 'Alta de usuario' } },
  { path: 'reset-passw', component: ResetPasswComponent, canActivate: [adminGuard], data: { breadcrumb: 'Resetear Contraseña' } },
  { path: 'admin-control', component: AdminControlComponent, canActivate: [adminGuard], data: { breadcrumb: 'Control de administrador' } },

  // Rutas con acceso por roles
  { path: 'dashboard', component: HomeComponent, canActivate: [RoleGuard],
    data: { expectedRoles: ['ejecutiva','tesoreria','coordinador','administrador'], breadcrumb: 'Dashboard de cartera' } },

  { path: 'enroll-customer', component: EnrollCustomerComponent, canActivate: [RoleGuard],
    data: { expectedRoles: ['ejecutiva','coordinador','administrador'], breadcrumb: 'Alta de Cliente' } },

  { path: 'clientes', component: ClientListComponent, canActivate: [RoleGuard],
    data: { expectedRoles: ['ejecutiva','tesoreria','coordinador','administrador'], breadcrumb: 'Clientes' } },

  { path: 'solicitud', component: CreditRequestComponent, canActivate: [RoleGuard],
    data: { expectedRoles: ['tesoreria','coordinador','administrador'], breadcrumb: 'Solicitudes' } },

  { path: 'ministracion', component: MinistracionComponent, canActivate: [RoleGuard],
    data: { expectedRoles: ['ejecutiva','tesoreria','coordinador','administrador'], breadcrumb: 'Ministración de Créditos' } },

  { path: 'domiciliacion', component: CreditAddressComponent, canActivate: [RoleGuard],
    data: { expectedRoles: ['coordinador','administrador'], breadcrumb: 'Domiciliación' } },

  { path: 'cartera', component: FinancialHistoryComponent, canActivate: [RoleGuard],
    data: { expectedRoles: ['ejecutiva','tesoreria','coordinador','administrador'], breadcrumb: 'Cartera' } },

  { path: '**', redirectTo: 'dashboard' }
];
