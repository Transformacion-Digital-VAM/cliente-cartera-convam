// import { Component } from '@angular/core';
// import { AuthService } from '../../../services/auth.service';
// import Swal from 'sweetalert2';


// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [],
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.css'
// })

// export class LoginComponent {
//   correo = '';
//   password = '';

//   constructor(private authService: AuthService) {}

//   login() {
//     this.authService.login({ correo: this.correo, password: this.password }).subscribe({
//       next: (res) => {
//         localStorage.setItem('token', res.token);
//         Swal.fire('Bienvenido', res.user.nombre, 'success');
//       },
//       error: (err) => {
//         Swal.fire('Error', err.error.message || 'Error al iniciar sesión', 'error');
//       },
//     });
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
  imports: [CommonModule, FormsModule, RouterLink],
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

    this.isLoading = true;

    try {
      await this.authService.loginWithEmail(this.correo, this.password);
      
      Swal.fire({
        title: '¡Bienvenido!',
        text: 'Has iniciado sesión correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        this.router.navigate(['/dashboard']);
      });

    } catch (error: any) {
      Swal.fire('Error', error.message || 'Error al iniciar sesión', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Login con Google
  async loginWithGoogle(): Promise<void> {
    this.isLoading = true;

    try {
      await this.authService.loginWithGoogle();
      
      Swal.fire({
        title: '¡Bienvenido!',
        text: 'Has iniciado sesión con Google correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        this.router.navigate(['/dashboard']);
      });

    } catch (error: any) {
      Swal.fire('Error', error.message || 'Error al iniciar sesión con Google', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Método para redirigir a registro
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Método para recuperar contraseña
  forgotPassword(): void {
    Swal.fire({
      title: 'Recuperar Contraseña',
      input: 'email',
      inputLabel: 'Ingresa tu correo electrónico',
      inputPlaceholder: 'tu@correo.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async (email) => {
        if (!email) {
          Swal.showValidationMessage('Por favor ingresa tu correo electrónico');
          return;
        }
        // Aquí puedes implementar el envío de recuperación de contraseña
        // await this.authService.sendPasswordResetEmail(email);
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Enviado', 'Se ha enviado un correo para recuperar tu contraseña', 'success');
      }
    });
  }
}