import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {
  correo = '';
  password = '';

  constructor(private authService: AuthService) {}

  login() {
    this.authService.login({ correo: this.correo, password: this.password }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        Swal.fire('Bienvenido', res.user.nombre, 'success');
      },
      error: (err) => {
        Swal.fire('Error', err.error.message || 'Error al iniciar sesión', 'error');
      },
    });
  }
}
