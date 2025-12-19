import { Routes } from '@angular/router';
import { HomeComponent } from './features/dashboard/pages/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ResetPasswComponent } from './features/auth/reset-passw/reset-passw.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminControlComponent } from './features/dashboard/admin-control/admin-control.component';
import { adminGuard } from './guards/admin.guard';
import { EnrollCustomerComponent } from './features/dashboard/pages/enroll-customer/enroll-customer.component';
import { ClientListComponent } from './features/dashboard/pages/client-list/client-list.component';
import { MinistracionComponent } from './features/dashboard/pages/ministracion/ministracion.component';
import { CreditRequestComponent } from './features/dashboard/pages/credit-request/credit-request.component';
import { FinancialHistoryComponent } from './features/dashboard/pages/financial-history/financial-history.component';


export const routes: Routes = [
    { 
        path: '', 
        redirectTo: 'dashboard', 
        pathMatch: 'full'
    },
    
    // RUTAS PÚBLICAS
    { 
        path: 'login', 
        component: LoginComponent,
        data: { breadcrumb: 'Login' }
    },
    
    // RUTAS PROTEGIDAS PARA ADMINISTRADORES
    { 
        path: 'register', 
        component: RegisterComponent,
        data: { breadcrumb: 'Alta de un usuario' }
    },
    { 
        path: 'reset-passw', 
        component: ResetPasswComponent,
        canActivate: [adminGuard],
        data: { breadcrumb: 'Resetear Contraseña' } 
    },
    { 
        path: 'admin-control', 
        component: AdminControlComponent,
        data: { breadcrumb: 'Control de administrador' } 
    },

    // RUTA DASHBOARD
    { 
        path: 'dashboard', 
        component: HomeComponent,
        data: { breadcrumb: 'Dashboard de cartera' }
    },
    { 
        path: 'enroll-customer', 
        component: EnrollCustomerComponent,
        data: { breadcrumb: 'Alta de Cliente' }
    },
    { 
        path: 'clientes', 
        component: ClientListComponent,
        data: { breadcrumb: 'Clientes' }
    },
    { 
        path: 'ministracion', 
        component: MinistracionComponent,
        data: { breadcrumb: 'Ministracion de Creditos' }
    },
    { 
        path: 'cartera', 
        component: FinancialHistoryComponent,
        data: { breadcrumb: 'Cartera' }
    },
    { 
        path: 'solicitud', 
        component: CreditRequestComponent,
        data: { breadcrumb: 'Solicitudes' }
    },
    

    // Ruta para redirigir a login si no encuentra la ruta
    { 
        path: '**', 
        redirectTo: 'dashboard'
    }
];


// export const routes: Routes = [
//     { path: '', redirectTo: 'login', pathMatch: 'full'},
    
//     // RUTAS PÚBLICAS
//     { path: 'login', component: LoginComponent },
    
//     // RUTAS PROTEGIDAS PARA ADMINISTRADORES
//     { 
//         path: 'register', 
//         component: RegisterComponent
//     },
//     { 
//         path: 'reset-passw', 
//         component: ResetPasswComponent,
//         canActivate: [adminGuard] 
//     },
//     { 
//         path: 'admin-control', 
//         component: AdminControlComponent,
//         canActivate: [adminGuard] 
//     },

//     // RUTA DASHBOARD
//     { path: 'dashboard', component: HomeComponent },
//     { path: 'enroll-customer', component: EnrollCustomerComponent },
//     { path: 'clientes', component: ClientListComponent },
    
//     // Ruta para redirigir a login si no encuentra la ruta
//     { path: '**', redirectTo: 'dashboard' }
// ];



