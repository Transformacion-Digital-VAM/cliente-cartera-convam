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

//   // Mapeo de roles por ID
//   private roleMap: { [key: number]: { nombre: string; ruta: string } } = {
//     1: { nombre: 'ejecutiva', ruta: '/dashboard' },
//     2: { nombre: 'tesoreria', ruta: '/solicitud' },
//     3: { nombre: 'coordinador', ruta: '/domiciliacion' },
//     4: { nombre: 'administrador', ruta: '/admin-control' }
//   };

//   constructor(
//     private authService: AuthService,
//     private router: Router
//   ) {}

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

//       // Esperar a que se sincronice el usuario
//       setTimeout(() => {
//         const currentUser = this.authService.getCurrentUser();
//         console.log('Usuario después del login:', currentUser);

//         if (currentUser) {
//           // Obtener información del rol
//           const rolInfo = this.getRolInfo(currentUser.rol_id);
//           const redirectRoute = rolInfo.ruta;
//           const nombreRol = rolInfo.nombre;

//           console.log(`Redirigiendo a: ${redirectRoute}, Rol ID: ${currentUser.rol_id}, Nombre Rol: ${nombreRol}`);

//           Swal.fire({
//             title: '¡Bienvenido!',
//             text: `Has iniciado sesión como ${nombreRol}`,
//             icon: 'success',
//             timer: 2000,
//             showConfirmButton: false
//           }).then(() => {
//             this.router.navigate([redirectRoute]);
//           });
//         } else {
//           console.warn('No se pudo obtener el usuario, redirigiendo a dashboard');
//           this.router.navigate(['/dashboard']);
//         }
//       }, 1000);

//     } catch (error: any) {
//       console.error('Error en login:', error);

//       let errorMessage = error.message || 'Error al iniciar sesión';

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

//   async loginWithGoogle(): Promise<void> {
//     this.isLoading = true;

//     try {
//       await this.authService.loginWithGoogle();

//       setTimeout(() => {
//         const currentUser = this.authService.getCurrentUser();
//         console.log('Usuario después del login con Google:', currentUser);

//         if (currentUser) {
//           const rolInfo = this.getRolInfo(currentUser.rol_id);
//           const redirectRoute = rolInfo.ruta;
//           const nombreRol = rolInfo.nombre;

//           console.log(`Redirigiendo a: ${redirectRoute}, Rol ID: ${currentUser.rol_id}, Nombre Rol: ${nombreRol}`);

//           Swal.fire({
//             title: '¡Bienvenido!',
//             text: `Has iniciado sesión con Google como ${nombreRol}`,
//             icon: 'success',
//             timer: 2000,
//             showConfirmButton: false
//           }).then(() => {
//             this.router.navigate([redirectRoute]);
//           });
//         } else {
//           console.warn('No se pudo obtener el usuario, redirigiendo a dashboard');
//           this.router.navigate(['/dashboard']);
//         }
//       }, 1000);

//     } catch (error: any) {
//       console.error('Error en login con Google:', error);
//       Swal.fire('Error', error.message || 'Error al iniciar sesión con Google', 'error');
//     } finally {
//       this.isLoading = false;
//     }
//   }

//   // Método para obtener información del rol por ID
//   private getRolInfo(rolId: number): { nombre: string; ruta: string } {
//     return this.roleMap[rolId] || { nombre: 'Usuario', ruta: '/dashboard' };
//   }

//   // // Método para verificar si es administrador 
//   // private isUserAdmin(user: any): boolean {
//   //   return user.rol_id === 4; // Solo rol_id 1 es administrador
//   // }

//   togglePasswordVisibility(): void {
//     this.showPassword = !this.showPassword;
//   }

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
  ) {}

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
      // Primero intentamos login con Firebase
      await this.authService.loginWithEmail(this.correo, this.password);
      
      console.log('Login Firebase exitoso');

      // Intentar obtener el usuario completo con datos del backend
      let currentUser = null;
      let syncAttempts = 0;
      const maxAttempts = 3;

      // Intentar sincronizar varias veces (con retry)
      while (syncAttempts < maxAttempts && !currentUser) {
        syncAttempts++;
        try {
          // Esperar un momento para que se complete la sincronización
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Intentar obtener el usuario sincronizado
          currentUser = this.authService.getCurrentUser();
          
          if (!currentUser) {
            console.log(`Intento ${syncAttempts}: Usuario aún no sincronizado`);
            
            // En el último intento, intentar forzar una sincronización
            if (syncAttempts === maxAttempts) {
              console.log('Último intento, esperando sincronización...');
              // Intentar obtener el usuario una última vez
              await new Promise(resolve => setTimeout(resolve, 2000));
              currentUser = this.authService.getCurrentUser();
              
              if (!currentUser) {
                // Verificar si hay un error específico de backend
                const backendError = localStorage.getItem('backend_sync_error');
                if (backendError) {
                  throw new Error(JSON.parse(backendError).message || 'Error de conexión con el servidor');
                }
              }
            }
          }
        } catch (syncError: any) {
          console.error(`Error en intento ${syncAttempts} de sincronización:`, syncError);
          
          // Si es el último intento, lanzar el error
          if (syncAttempts === maxAttempts) {
            // Verificar si hay un error almacenado en localStorage
            const backendError = localStorage.getItem('backend_sync_error');
            if (backendError) {
              const errorData = JSON.parse(backendError);
              throw new Error(errorData.message || 'Error de conexión con el servidor');
            }
            throw syncError;
          }
        }
      }

      // Verificar si finalmente tenemos el usuario
      if (!currentUser) {
        throw new Error('No se pudo obtener la información completa del usuario. El servidor de backend podría no estar disponible.');
      }

      console.log('Usuario después del login:', currentUser);

      // Obtener información del rol
      const rolInfo = this.getRolInfo(currentUser.rol_id);
      const redirectRoute = rolInfo.ruta;
      const nombreRol = rolInfo.nombre;

      console.log(`Redirigiendo a: ${redirectRoute}, Rol ID: ${currentUser.rol_id}, Nombre Rol: ${nombreRol}`);

      Swal.fire({
        title: '¡Bienvenido!',
        text: `Has iniciado sesión como ${nombreRol}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        this.router.navigate([redirectRoute]);
      });

    } catch (error: any) {
      console.error('Error en login:', error);

      let errorMessage = error.message || 'Error al iniciar sesión';

      // Detectar errores específicos
      if (errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/wrong-password')) {
        errorMessage = 'Correo o contraseña incorrectos';
      } else if (errorMessage.includes('auth/user-not-found')) {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (errorMessage.includes('auth/too-many-requests')) {
        errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
      } else if (errorMessage.includes('auth/user-disabled')) {
        errorMessage = 'Esta cuenta ha sido deshabilitada';
      } else if (errorMessage.includes('No se pudo obtener la información completa') || 
                 errorMessage.includes('Error de conexión con el servidor')) {
        errorMessage = 'Error de conexión con el servidor. Por favor, verifica que el servidor de backend esté funcionando.';
      } else if (error.status === 0 || error.status === 404 || error.status === 500) {
        errorMessage = 'Error de conexión con el servidor. Por favor, verifica que el servidor de backend esté funcionando.';
      } else if (errorMessage.includes('Failed to fetch') || 
                 errorMessage.includes('NetworkError') || 
                 errorMessage.includes('ERR_CONNECTION_REFUSED') || 
                 errorMessage.includes('CORS') ||
                 errorMessage.includes('cors')) {
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica que el servidor de backend esté activo. Error: ' + 
                      (errorMessage.includes('CORS') ? 'Problema de CORS en el servidor' : 'Conexión rechazada');
      } else if (errorMessage.includes('HttpErrorResponse') || errorMessage.includes('Http failure response')) {
        errorMessage = 'Error en la comunicación con el servidor. Por favor, contacta al administrador del sistema.';
      }

      Swal.fire({
        title: 'Error de conexión',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#d33',
        footer: errorMessage.includes('servidor') ? 
          '<small>Servidor backend no disponible. Contacta al administrador.</small>' : ''
      });
      
      // Si hay error de servidor, hacer logout de Firebase para limpiar el estado
      if (errorMessage.includes('servidor') || error.status === 0 || errorMessage.includes('CORS')) {
        try {
          await this.authService.logout();
        } catch (logoutError) {
          console.error('Error al hacer logout:', logoutError);
        }
      }
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.isLoading = true;

    try {
      await this.authService.loginWithGoogle();

      setTimeout(() => {
        const currentUser = this.authService.getCurrentUser();
        console.log('Usuario después del login con Google:', currentUser);

        if (currentUser) {
          const rolInfo = this.getRolInfo(currentUser.rol_id);
          const redirectRoute = rolInfo.ruta;
          const nombreRol = rolInfo.nombre;

          console.log(`Redirigiendo a: ${redirectRoute}, Rol ID: ${currentUser.rol_id}, Nombre Rol: ${nombreRol}`);

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
          console.warn('No se pudo obtener el usuario, redirigiendo a dashboard');
          this.router.navigate(['/dashboard']);
        }
      }, 1000);

    } catch (error: any) {
      console.error('Error en login con Google:', error);
      
      let errorMessage = error.message || 'Error al iniciar sesión con Google';
      
      // Verificar si el error es por falta de conexión al servidor
      if (error.status === 0 || error.status === 404 || error.status === 500) {
        errorMessage = 'Error de conexión con el servidor. Por favor, verifica que el servidor esté en funcionamiento.';
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet y que el servidor esté activo.';
      } else if (errorMessage.includes('HttpErrorResponse') || errorMessage.includes('Http failure response')) {
        errorMessage = 'Error en la comunicación con el servidor. Por favor, contacta al administrador del sistema.';
      }

      Swal.fire({
        title: 'Error de conexión',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#d33'
      });
    } finally {
      this.isLoading = false;
    }
  }

  // Método para obtener información del rol por ID
  private getRolInfo(rolId: number): { nombre: string; ruta: string } {
    return this.roleMap[rolId] || { nombre: 'Usuario', ruta: '/dashboard' };
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