import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminControlService } from '../../../services/admin-control.service';
import { AuthService, User } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-control',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './admin-control.component.html',
  styleUrl: './admin-control.component.css'
})
export class AdminControlComponent implements OnInit, OnDestroy {
  users: User[] = [];
  selectedUser: User | null = null;
  showAddUserForm = false;
  showSuccessMessage = false;
  successMessage = '';
  isLoading = false;
  userForm: FormGroup;
  
  private userSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private adminControlService: AdminControlService,
    private authService: AuthService,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      usuario: ['', [Validators.required, Validators.email]],
      rol_id: [2, Validators.required],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // Cargar usuarios desde la base de datos
  async loadUsers() {
    this.isLoading = true;
    try {
      this.users = await this.adminControlService.getUsers();
      // console.log('Usuarios cargados:', this.users);
    } catch (error: any) {
      console.error('Error cargando usuarios:', error);
      this.showError(error.message || 'Error al cargar los usuarios');
    } finally {
      this.isLoading = false;
    }
  }

  // Agregar nuevo usuario usando el AuthService existente
  async addUser() {
    if (this.userForm.valid) {
      this.isLoading = true;
      try {
        const userData = this.userForm.value;
        
        await this.authService.registerWithoutLogin(
          userData.nombre,
          userData.usuario,
          userData.contrasenia,
          userData.rol_id
        );

        this.showSuccess('Usuario agregado exitosamente');
        this.userForm.reset({ rol_id: 2 });
        this.showAddUserForm = false;
        
        // Recargar la lista de usuarios
        await this.loadUsers();
      } catch (error: any) {
        console.error('Error agregando usuario:', error);
        this.showError(error.message || 'Error al agregar usuario');
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  // Restablecer contraseña
  async resetPassword(user: User) {
    if (confirm(`¿Restablecer contraseña para ${user.nombre}?`)) {
      this.isLoading = true;
      try {
        await this.adminControlService.resetUserPassword(user.usuario);
        this.showSuccess(`Se ha enviado un correo para restablecer la contraseña a ${user.usuario}`);
      } catch (error: any) {
        console.error('Error restableciendo contraseña:', error);
        this.showError(error.message || 'Error al restablecer contraseña');
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Eliminar usuario
  async deleteUser(user: User) {
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.nombre}?`)) {
      this.isLoading = true;
      try {
        // USA id_usuario en lugar de id
        await this.adminControlService.deleteUser(user.id_usuario); 
        this.showSuccess('Usuario eliminado exitosamente');
        await this.loadUsers();
      } catch (error: any) {
        console.error('Error eliminando usuario:', error);
        this.showError(error.message || 'Error al eliminar usuario');
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Ver detalles del usuario
  viewUser(user: User) {
    this.selectedUser = user;
  }


  // Mostrar mensaje de éxito
  private showSuccess(message: string) {
    this.successMessage = message;
    this.showSuccessMessage = true;
    
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
  }

  // Mostrar mensaje de error
  private showError(message: string) {
    this.successMessage = message;
    this.showSuccessMessage = true;
    
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
  }

  // Marcar todos los campos como tocados para mostrar errores
  private markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  // Cancelar formulario
  cancelAddUser() {
    this.showAddUserForm = false;
    this.userForm.reset({ rol_id: 2 });
  }

  // Cerrar detalles
  closeUserDetails() {
    this.selectedUser = null;
  }

  // Verificar si el campo del formulario es inválido
  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Obtener mensaje de error para campo
  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email']) {
        return 'Correo electrónico inválido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    
    return '';
  }

  // Método seguro para resetPassword en el modal
  resetPasswordInModal() {
    if (this.selectedUser) {
      this.resetPassword(this.selectedUser);
    }
  }

    // Método para redirigir a registro
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToRecovery(): void {
    this.router.navigate(['/reset-passw']);
  }
}