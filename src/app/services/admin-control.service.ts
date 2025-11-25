import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService, User } from './auth.service';
import { RolService } from './roles.service';

export interface CreateUserRequest {
  rol_nombre?: string; 
  nombre: string;
  usuario: string;
  contrasenia: string;
  rol_id: number;
  id_usuario?: number;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminControlService {
  private apiUrl = `${environment.apiUrl}/usuario`; 

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Obtener todos los usuarios
  async getUsers(): Promise<User[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<UsersResponse>(this.apiUrl, {
          headers: await this.getAuthHeaders()
        })
      );
      
      if (response.success) {
        return response.data.users;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Eliminar usuario
  async deleteUser(userId: number): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.delete<{success: boolean; message: string}>(
          `${this.apiUrl}/${userId}`,
          { headers: await this.getAuthHeaders() }
        )
      );
      
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  // Restablecer contraseña (usa el AuthService existente)
  async resetUserPassword(email: string): Promise<void> {
    try {
      await this.authService.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      throw error;
    }
  }

  // Headers de autenticación
  private async getAuthHeaders(): Promise<HttpHeaders> {
    try {
      const token = await this.authService.getFirebaseToken();
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    } catch (error) {
      console.error('Error obteniendo token:', error);
      throw new Error('No se pudo obtener el token de autenticación');
    }
  }

  getRoles(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}