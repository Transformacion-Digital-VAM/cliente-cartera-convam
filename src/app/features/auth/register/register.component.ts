import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RolService, Rol } from '../../../services/roles.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  nombre: string = '';
  correo: string = '';
  password: string = '';
  confirmPassword: string = '';
  rol_id: number = 0;
  isLoading: boolean = false;
  showPassword: boolean = false;
  loadingRoles: boolean = false;

  roles: Rol[] = [];

  constructor(
    private authService: AuthService,
    private rolService: RolService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loadingRoles = true;
    
    this.rolService.getRoles().subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response);
        
        this.roles = Array.isArray(response) ? response : response.data;

        console.log('Roles cargados correctamente');
        
        if (this.roles && this.roles.length > 0) {
          this.rol_id = this.roles[0].id_rol;
        }
        
        this.loadingRoles = false;
      },
      error: (error) => {
        console.error('Error cargando roles:', error);
        Swal.fire('Error', 'No se pudieron cargar los roles', 'error');
        this.loadingRoles = false;
        
        this.roles = [
          { id_rol: 1, nombre_rol: 'Administrador' },
          { id_rol: 2, nombre_rol: 'Ejecutiva' },
          { id_rol: 3, nombre_rol: 'Consulta' }
        ];
      }
    });
  }

  async register(): Promise<void> {
    if (!this.nombre || !this.correo || !this.password || !this.confirmPassword) {
      Swal.fire('Error', 'Por favor, completa todos los campos', 'error');
      return;
    }

    if (this.rol_id === 0) {
      Swal.fire('Error', 'Por favor, selecciona un rol', 'error');
      return;
    }

    if (this.password !== this.confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    if (this.password.length < 6) {
      Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.correo)) {
      Swal.fire('Error', 'Por favor, ingresa un correo electrónico válido', 'error');
      return;
    }

    this.isLoading = true;

    try {
      console.log('Iniciando registro completo...');
      // console.log('Datos del registro:', {
      //   nombre: this.nombre,
      //   correo: this.correo,
      //   rol_id: this.rol_id,
      //   rol_seleccionado: this.roles.find(r => r.id_rol === this.rol_id)?.nombre_rol
      // });
      
      // REGISTRO SIN INICIAR SESIÓN
      const result = await this.authService.registerWithoutLogin(
        this.nombre, 
        this.correo, 
        this.password, 
        this.rol_id
      );

      console.log('Registro completo exitoso:', result);

      Swal.fire({
        title: '¡Registro Exitoso!',
        html: `
          <p>Usuario <strong>${this.nombre}</strong> creado correctamente</p>
          <p><small>Rol: ${this.getRolNombre()}</small></p>
          <p><small>Ahora puedes iniciar sesión</small></p>
        `,
        icon: 'success',
        timer: 4000,
        showConfirmButton: true
      }).then(() => {
        // REDIRIGIR AL ADMIN-PANEL
        this.router.navigate(['/admin-control']);
      });

    } catch (error: any) {
      console.error('Error en registro completo:', error);
      
      let errorMessage = error.message || 'Error al registrar usuario';
      
      if (errorMessage.includes('auth/email-already-in-use')) {
        errorMessage = 'Este correo electrónico ya está registrado';
      } else if (errorMessage.includes('auth/weak-password')) {
        errorMessage = 'La contraseña es muy débil';
      } else if (errorMessage.includes('CORS') || errorMessage.includes('Network')) {
        errorMessage = 'Error de conexión con el servidor. Verifica que el backend esté funcionando.';
      } else if (errorMessage.includes('rol') || errorMessage.includes('role')) {
        errorMessage = 'Error con el rol seleccionado. Verifica los permisos.';
      }
      
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  getRolNombre(): string {
    const rol = this.roles.find(r => r.id_rol === this.rol_id);
    return rol ? rol.nombre_rol : 'No seleccionado';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
    goToAdmin(): void {
    this.router.navigate(['/admin-control']);
  }
}