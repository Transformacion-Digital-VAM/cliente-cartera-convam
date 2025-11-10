import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-passw',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
  ],
  templateUrl: './reset-passw.component.html',
  styleUrls: ['./reset-passw.component.css']
})
export class ResetPasswComponent {
  email: string = '';
  isLoading: boolean = false;
  emailSent: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.email) {
      Swal.fire('Error', 'Por favor, ingresa tu correo electrónico', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      Swal.fire('Error', 'Por favor, ingresa un correo electrónico válido', 'error');
      return;
    }

    this.isLoading = true;

    try {
      await this.authService.sendPasswordResetEmail(this.email);
      this.emailSent = true;
      
      Swal.fire({
        title: '¡Correo Enviado!',
        html: `
          <p>Hemos enviado un enlace de recuperación a:</p>
          <p><strong>${this.email}</strong></p>
          <p>Revisa tu bandeja de entrada y sigue las instrucciones.</p>
          <small class="text-muted">Si no ves el correo, revisa tu carpeta de spam.</small>
        `,
        icon: 'success',
        confirmButtonText: 'Entendido',
        timer: 5000
      });

    } catch (error: any) {
      console.error('Error en recuperación:', error);
      
      let errorMessage = error.message || 'Error al enviar el email de recuperación';
      
      if (errorMessage.includes('auth/user-not-found')) {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (errorMessage.includes('auth/invalid-email')) {
        errorMessage = 'Correo electrónico inválido';
      } else if (errorMessage.includes('auth/too-many-requests')) {
        errorMessage = 'Demasiados intentos. Por favor, intenta más tarde.';
      } else if (errorMessage.includes('auth/operation-not-allowed')) {
        errorMessage = 'La recuperación de contraseña no está habilitada';
      }
      
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  goToAdmin(): void {
    this.router.navigate(['/admin-control']);
  }

  sendAnotherEmail(): void {
    this.emailSent = false;
    this.email = '';
  }
}