import { Routes } from '@angular/router';
import { HomeComponent } from './features/dashboard/pages/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ResetPasswComponent } from './features/auth/reset-passw/reset-passw.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminControlComponent } from './features/dashboard/admin-control/admin-control.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full'},
    
    // RUTAS PÚBLICAS
    { path: 'login', component: LoginComponent },
    
    // RUTAS PROTEGIDAS PARA ADMINISTRADORES
    { 
        path: 'register', 
        component: RegisterComponent,
        canActivate: [adminGuard]
    },
    { 
        path: 'reset-passw', 
        component: ResetPasswComponent,
        canActivate: [adminGuard] 
    },
    { 
        path: 'admin-control', 
        component: AdminControlComponent,
        canActivate: [adminGuard] 
    },

    // RUTA DASHBOARD
    { path: 'dashboard', component: HomeComponent },
    
    // Ruta para redirigir a login si no encuentra la ruta
    { path: '**', redirectTo: 'login' }
];
