// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router';
// import { AuthService } from '../../../services/auth.service';
// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.css']
// })
// export class LoginComponent {
//   correo: string = '';
//   password: string = '';
//   isLoading: boolean = false;
//   showPassword: boolean = false;

//   constructor(
//     private authService: AuthService,
//     private router: Router
//   ) {}

//   // Login con email y password
//   async login(): Promise<void> {
//     if (!this.correo || !this.password) {
//       Swal.fire('Error', 'Por favor, completa todos los campos', 'error');
//       return;
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(this.correo)) {
//       Swal.fire('Error', 'Por favor, ingresa un correo electrónico válido', 'error');
//       return;
//     }

//     this.isLoading = true;

//     try {
//       await this.authService.loginWithEmail(this.correo, this.password);
      
//       Swal.fire({
//         title: '¡Bienvenido!',
//         text: 'Has iniciado sesión correctamente',
//         icon: 'success',
//         timer: 2000,
//         showConfirmButton: false
//       }).then(() => {
//         this.router.navigate(['/dashboard']);
//       });

//     } catch (error: any) {
//       console.error('Error en login:', error);
      
//       let errorMessage = error.message || 'Error al iniciar sesión';
      
//       // Mensajes más específicos
//       if (errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/wrong-password')) {
//         errorMessage = 'Correo o contraseña incorrectos';
//       } else if (errorMessage.includes('auth/user-not-found')) {
//         errorMessage = 'No existe una cuenta con este correo electrónico';
//       } else if (errorMessage.includes('auth/too-many-requests')) {
//         errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
//       } else if (errorMessage.includes('auth/user-disabled')) {
//         errorMessage = 'Esta cuenta ha sido deshabilitada';
//       }
      
//       Swal.fire('Error', errorMessage, 'error');
//     } finally {
//       this.isLoading = false;
//     }
//   }

//   // Login con Google
//   async loginWithGoogle(): Promise<void> {
//     this.isLoading = true;

//     try {
//       await this.authService.loginWithGoogle();
      
//       Swal.fire({
//         title: '¡Bienvenido!',
//         text: 'Has iniciado sesión con Google correctamente',
//         icon: 'success',
//         timer: 2000,
//         showConfirmButton: false
//       }).then(() => {
//         this.router.navigate(['/dashboard']);
//       });

//     } catch (error: any) {
//       console.error('Error en login con Google:', error);
//       Swal.fire('Error', error.message || 'Error al iniciar sesión con Google', 'error');
//     } finally {
//       this.isLoading = false;
//     }
//   }

//   togglePasswordVisibility(): void {
//     this.showPassword = !this.showPassword;
//   }

//   // Método para redirigir a registro
//   goToRegister(): void {
//     this.router.navigate(['/register']);
//   }

  
//   goToRecovery(): void {
//     this.router.navigate(['/reset-passw']);
//   }
// }

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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Login con email y password
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
      
      // Esperar un momento para que se sincronice el usuario con el backend
      setTimeout(() => {
        const currentUser = this.authService.getCurrentUser();
        console.log('Usuario después del login:', currentUser);
        
        if (currentUser) {
          // Verificar si es administrador (rol_id 1 o 4)
          const isAdmin = this.isUserAdmin(currentUser);
          const redirectRoute = isAdmin ? '/admin-control' : '/dashboard';
          
          console.log(`Redirigiendo a: ${redirectRoute}, Rol: ${currentUser.rol_id}`);
          
          Swal.fire({
            title: '¡Bienvenido!',
            text: 'Has iniciado sesión correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate([redirectRoute]);
          });
        } else {
          // Fallback si no se puede obtener el usuario
          console.warn('No se pudo obtener el usuario, redirigiendo a dashboard');
          this.router.navigate(['/dashboard']);
        }
      }, 1000);

    } catch (error: any) {
      console.error('Error en login:', error);
      
      let errorMessage = error.message || 'Error al iniciar sesión';
      
      // Mensajes más específicos
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

  // Login con Google
  async loginWithGoogle(): Promise<void> {
    this.isLoading = true;

    try {
      await this.authService.loginWithGoogle();
      
      // Esperar un momento para que se sincronice el usuario con el backend
      setTimeout(() => {
        const currentUser = this.authService.getCurrentUser();
        console.log('Usuario después del login con Google:', currentUser);
        
        if (currentUser) {
          // Verificar si es administrador (rol_id 1 o 4)
          const isAdmin = this.isUserAdmin(currentUser);
          const redirectRoute = isAdmin ? '/admin-control' : '/dashboard';
          
          console.log(`Redirigiendo a: ${redirectRoute}, Rol: ${currentUser.rol_id}`);
          
          Swal.fire({
            title: '¡Bienvenido!',
            text: 'Has iniciado sesión con Google correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate([redirectRoute]);
          });
        } else {
          // Fallback si no se puede obtener el usuario
          console.warn('No se pudo obtener el usuario, redirigiendo a dashboard');
          this.router.navigate(['/dashboard']);
        }
      }, 1000);

    } catch (error: any) {
      console.error('Error en login con Google:', error);
      Swal.fire('Error', error.message || 'Error al iniciar sesión con Google', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Método para verificar si el usuario es administrador
  private isUserAdmin(user: any): boolean {
    // Roles que se consideran administradores (ajusta según tu sistema)
    const adminRoles = [1, 4];
    return adminRoles.includes(user.rol_id);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Método para redirigir a registro
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToRecovery(): void {
    this.router.navigate(['/reset-passw']);
  }
}