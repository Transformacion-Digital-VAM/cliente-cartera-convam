import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  correo: string = '';
  password: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  // Mapeo de roles por ID
  private roleMap: { [key: number]: { nombre: string; ruta: string } } = {
    1: { nombre: 'ejecutiva', ruta: '/dashboard' },
    2: { nombre: 'tesoreria', ruta: '/solicitud' },
    3: { nombre: 'coordinador', ruta: '/domiciliacion' },
    4: { nombre: 'administrador', ruta: '/admin-control' }
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  async login(): Promise<void> {
    if (!this.correo || !this.password) {
      Swal.fire('Error', 'Por favor, completa todos los campos', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.correo)) {
      Swal.fire('Error', 'Por favor, ingresa un correo electrónico válido', 'error');
      return;
    }

    this.isLoading = true;

    try {
      await this.authService.loginWithEmail(this.correo, this.password);

      const currentUser = this.authService.getCurrentUser();
      console.log('Usuario después del login:', currentUser);

      if (currentUser) {
        // Obtener información del rol
        const rolInfo = this.getRolInfo(currentUser.rol_id);
        const redirectRoute = rolInfo.ruta;
        const nombreRol = rolInfo.nombre;

        // console.log(`Redirigiendo a: ${redirectRoute}, Rol ID: ${currentUser.rol_id}, Nombre Rol: ${nombreRol}`);

        Swal.fire({
          title: '¡Bienvenido!',
          text: `Has iniciado sesión como ${nombreRol}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate([redirectRoute]);
        });
      } else {
        console.warn('No se pudo obtener el usuario después de la sincronización');
        Swal.fire('Error', 'No se pudo sincronizar la sesión con el servidor. Por favor, intenta de nuevo.', 'error');
      }

    } catch (error: any) {
      console.error('Error en login:', error);

      let errorMessage = error.message || 'Error al iniciar sesión';

      if (errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/wrong-password')) {
        errorMessage = 'Correo o contraseña incorrectos';
      } else if (errorMessage.includes('auth/user-not-found')) {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (errorMessage.includes('auth/too-many-requests')) {
        errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
      } else if (errorMessage.includes('auth/user-disabled')) {
        errorMessage = 'Esta cuenta ha sido deshabilitada';
      }

      Swal.fire('Error', errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.isLoading = true;

    try {
      await this.authService.loginWithGoogle();

      const currentUser = this.authService.getCurrentUser();
      console.log('Usuario después del login con Google:', currentUser);

      if (currentUser) {
        const rolInfo = this.getRolInfo(currentUser.rol_id);
        const redirectRoute = rolInfo.ruta;
        const nombreRol = rolInfo.nombre;

        // console.log(`Redirigiendo a: ${redirectRoute}, Rol ID: ${currentUser.rol_id}, Nombre Rol: ${nombreRol}`);

        Swal.fire({
          title: '¡Bienvenido!',
          text: `Has iniciado sesión con Google como ${nombreRol}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate([redirectRoute]);
        });
      } else {
        console.warn('No se pudo obtener el usuario después de la sincronización con Google');
        Swal.fire('Error', 'No se pudo sincronizar la sesión de Google con el servidor.', 'error');
      }

    } catch (error: any) {
      console.error('Error en login con Google:', error);
      Swal.fire('Error', error.message || 'Error al iniciar sesión con Google', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Método para obtener información del rol por ID
  private getRolInfo(rolId: number): { nombre: string; ruta: string } {
    return this.roleMap[rolId] || { nombre: 'Usuario', ruta: '/dashboard' };
  }

  // Método para verificar si es administrador 
  private isUserAdmin(user: any): boolean {
    return user.rol_id === 4; // Solo rol_id 1 es administrador
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToRecovery(): void {
    this.router.navigate(['/reset-passw']);
  }
}