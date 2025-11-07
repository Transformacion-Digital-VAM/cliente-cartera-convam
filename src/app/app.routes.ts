import { Routes } from '@angular/router';
import { HomeComponent } from './features/dashboard/pages/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { VerifyCodeComponent } from './features/auth/verify-code/verify-code.component';
import { ResetPasswComponent } from './features/auth/reset-passw/reset-passw.component';
import { RegisterComponent } from './features/auth/register/register.component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full'},
    //RUTAS DASHBOARD > PÁGINAS PRIVADAS, GENERACIÓN DE REPORTES, ÉTC.
    { path: 'dashboard', component: HomeComponent },

    //RUTAS INICIAR SESIÓN Y VERIFICAR TOKEN
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'verify-code', component: VerifyCodeComponent },
    { path: 'reset-passw', component: ResetPasswComponent},
    
];

