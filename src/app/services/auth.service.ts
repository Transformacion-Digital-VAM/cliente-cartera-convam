import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification
} from 'firebase/auth';

export interface User {
  id_usuario: number;
  rol_id: number;
  nombre_rol: string;
  nombre: string;
  usuario: string;
  contrasenia?: string;
  firebase_uid?: string;
  rol_nombre?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    firebase_user?: {
      uid: string;
      email: string;
      name: string;
      picture: string;
    };
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  getRouteByRoleId(rol_id: number): string {
    switch (rol_id) {
      case 4: return '/admin-control';
      case 3: return '/domiciliacion';
      case 2: return '/dashboard';
      case 1: return '/solicitud';
      default: return '/dashboard';
    }
  }

  private apiUrl = `${environment.apiUrl}/auth`;
  private auth: any;
  private googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(app);
    this.loadUserFromStorage();
    this.setupAuthStateListener();
  }


  // Sesión de Firebase
  private setupAuthStateListener(): void {
    onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        console.log('Usuario autenticado en Firebase:', firebaseUser.email);
        await this.syncUserWithBackend();
      } else {
        console.log('Usuario cerró sesión en Firebase');
        this.currentUserSubject.next(null);
        localStorage.removeItem('user');
        localStorage.removeItem('firebase_token');
      }
    });
  }

  // Sincroniza usuario Firebase con backend
  private async syncUserWithBackend(): Promise<void> {
    try {
      const token = await this.getFirebaseToken();
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(
          `${this.apiUrl}/login`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      if (response?.success) {
        console.log('Usuario sincronizado con backend:', response.data.user);
        this.setUserData(response.data.user, token);
      } else {
        console.error('Error en respuesta del backend:', response);
        this.logout();
      }
    } catch (error) {
      console.error('Error sincronizando con backend:', error);
      // this.logout();
    }
  }



  // Registro, no inicia sesión en automático
  async registerWithoutLogin(nombre: string, correo: string, password: string, rol_id: number): Promise<RegisterResponse> {
    let tempAuth: any = null;

    try {
      console.log(' Iniciando registro completo...');

      // Crear una instancia temporal de auth para no afectar la sesión principal
      const app = initializeApp(environment.firebaseConfig, 'TempApp');
      tempAuth = getAuth(app);

      // 1. Crear usuario en Firebase
      console.log('Creando usuario en Firebase...');
      const userCredential = await createUserWithEmailAndPassword(tempAuth, correo, password);
      const firebase_uid = userCredential.user.uid;

      console.log('Usuario creado en Firebase con UID:', firebase_uid);

      // 2. Cerrar sesión inmediatamente en la instancia temporal
      await signOut(tempAuth);
      console.log('Sesión temporal cerrada');

      // 3. Registrar en PostgreSQL
      console.log('Registrando usuario en PostgreSQL...');
      const body = {
        nombre,
        usuario: correo,
        contrasenia: password,
        rol_id,
        firebase_uid
      };

      console.log('Enviando datos al backend:', body);

      const response = await firstValueFrom(
        this.http.post<RegisterResponse>(`${this.apiUrl}/register`, body)
      );

      if (!response.success) {
        throw new Error(response.message || 'Error en el registro backend');
      }

      console.log('Usuario registrado exitosamente en PostgreSQL:', response.data.user);
      return response;

    } catch (error: any) {
      console.error('Error en registro completo:', error);

      // Limpiar cualquier sesión residual
      if (tempAuth) {
        try {
          await signOut(tempAuth);
        } catch (logoutError) {
          console.log('No había sesión temporal activa');
        }
      }

      // Manejar errores específicos
      let errorMessage = 'Error al registrar usuario';

      if (error.code) {
        errorMessage = this.handleFirebaseError(error);
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  // Método de registro
  async registerWithEmail(nombre: string, correo: string, password: string, rol_id: number): Promise<any> {
    try {
      console.log('Registrando usuario en Firebase...');

      const userCredential = await createUserWithEmailAndPassword(this.auth, correo, password);
      const firebase_uid = userCredential.user.uid;

      console.log('Usuario creado en Firebase con UID:', firebase_uid);

      // Registrar en PostgreSQL
      const body = {
        nombre,
        usuario: correo,
        contrasenia: password,
        rol_id,
        firebase_uid
      };

      console.log('Enviando datos al backend:', body);

      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/register`, body)
      );

      console.log('Usuario registrado en PostgreSQL:', response);
      return response;

    } catch (error: any) {
      console.error('Error en registro:', error);

      // Cerrar sesión si hubo error
      try {
        await signOut(this.auth);
      } catch (logoutError) {
        console.log('No había sesión activa');
      }

      throw error;
    }
  }

  // Login con email y password
  async loginWithEmail(correo: string, password: string): Promise<void> {
    try {
      console.log('Iniciando sesión con:', correo);
      await signInWithEmailAndPassword(this.auth, correo, password);
      console.log('Login Firebase exitoso');
    } catch (error: any) {
      console.error('Error en login Firebase:', error);
      throw new Error(this.handleFirebaseError(error));
    }
  }

  // Login con Google
  async loginWithGoogle(): Promise<void> {
    try {
      const userCredential = await signInWithPopup(this.auth, this.googleProvider);
      console.log('Login con Google exitoso:', userCredential.user.email);
    } catch (error: any) {
      console.error('Error en login Google:', error);
      throw new Error(this.handleFirebaseError(error));
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      localStorage.removeItem('user');
      localStorage.removeItem('firebase_token');
      console.log('Logout exitoso');
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  // Obtener token de Firebase
  async getFirebaseToken(): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Usuario Firebase no autenticado');
    }
    return await (await user).getIdToken(true);
  }


  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    // return this.auth.currentUser !== null;
    return this.currentUserSubject.value !== null;
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Obtener datos del usuario desde localStorage
  getUserData(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr) as User;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
      return null;
    }
  }

  // Obtener datos del usuario como Observable
  getUserDataObservable(): Observable<User | null> {
    return this.currentUser$;
  }

  // Guardar datos de usuario en localStorage y BehaviorSubject
  private setUserData(user: User, token: string): void {
    // Guardar en storage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('firebase_token', token);

    // Emitir al BehaviorSubject
    this.currentUserSubject.next(user);
  }

  // Cargar usuario desde localStorage
  loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('firebase_token');

    if (userStr && token) {
      const user: User = JSON.parse(userStr);
      this.currentUserSubject.next(user);
    }
  }

  // Manejar errores de Firebase
  private handleFirebaseError(error: any): string {
    const messages: Record<string, string> = {
      // Errores de autenticación general
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres)',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
      'auth/operation-not-allowed': 'Operación no permitida.',
      'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este email.',
      'auth/invalid-credential': 'Credenciales inválidas',
    };

    return messages[error.code] || error.message || 'Error desconocido en la autenticación';
  }

  // Verificar estado de autenticación
  checkAuthState(): Observable<boolean> {
    return new Observable(subscriber => {
      onAuthStateChanged(this.auth, (user) => {
        subscriber.next(!!user);
      });
    });
  }


  // Actualizar perfil de usuario en Firebase
  async updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    try {
      await user.updateProfile({
        displayName,
        photoURL
      });
      console.log('Perfil actualizado correctamente');
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      throw new Error(this.handleFirebaseError(error));
    }
  }

  // Enviar email de verificación 
  async sendEmailVerification(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    try {
      await firebaseSendEmailVerification(user);
      console.log('Email de verificación enviado');
    } catch (error: any) {
      console.error('Error enviando verificación:', error);
      throw new Error(this.handleFirebaseError(error));
    }
  }

  // Enviar email de reset de contraseña
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      console.log('Enviando email de recuperación a:', email);
      await firebaseSendPasswordResetEmail(this.auth, email);
      console.log('Email de recuperación enviado correctamente a:', email);
    } catch (error: any) {
      console.error('Error enviando email de recuperación:', error);

      // Manejo específico de errores
      let errorMessage = this.handleFirebaseError(error);

      // Mensajes más específicos para recuperación
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Por favor, intenta más tarde.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'La recuperación de contraseña no está habilitada';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      }

      throw new Error(errorMessage);
    }
  }

  // Debuggear token 
  async debugToken(): Promise<void> {
    try {
      const token = await this.getCurrentToken();
      if (token) {
        console.log('TOKEN ACTUAL:', token);
        console.log('Longitud del token:', token.length);

        // Decodificar la parte del payload (sin verificar)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Payload del token:', payload);
        console.log('Token expira:', new Date(payload.exp * 1000));
        console.log('Email en token:', payload.email);
        console.log('UID en token:', payload.user_id);
      } else {
        console.log('No hay token disponible');
      }
    } catch (error) {
      console.error('Error debuggeando token:', error);
    }
  }

  // Obtener token actual 
  async getCurrentToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    return await user.getIdToken(false);
  }

  // Forzar refresco del token
  async refreshToken(): Promise<string> {
    const token = await this.getFirebaseToken();
    return token;
  }

  // Verificar si el token es válido
  async isTokenValid(): Promise<boolean> {
    try {
      const token = await this.getCurrentToken();
      if (!token) return false;

      // El token se verifica automáticamente al usarlo en requests
      return true;
    } catch (error) {
      return false;
    }
  }

  // Crear headers de autenticación para requests
  createAuthHeaders(token?: string): HttpHeaders {
    let authToken = token;

    if (!authToken && this.auth.currentUser) {
      // Si no se proporciona token, usar el actual
      authToken = this.auth.currentUser.getIdToken ? this.auth.currentUser.getIdToken() : null;
    }

    if (!authToken) {
      throw new Error('No hay token de autenticación disponible');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    });
  }

  // Método para hacer requests autenticados
  async authenticatedRequest<T>(
    method: string,
    url: string,
    data?: any
  ): Promise<T> {
    try {
      const token = await this.getFirebaseToken();
      const headers = this.createAuthHeaders(token);

      let request: Observable<T>;

      switch (method.toLowerCase()) {
        case 'get':
          request = this.http.get<T>(url, { headers });
          break;
        case 'post':
          request = this.http.post<T>(url, data, { headers });
          break;
        case 'put':
          request = this.http.put<T>(url, data, { headers });
          break;
        case 'delete':
          request = this.http.delete<T>(url, { headers });
          break;
        default:
          throw new Error(`Método HTTP no soportado: ${method}`);
      }

      return await firstValueFrom(request);

    } catch (error) {
      console.error(`Error en request ${method} ${url}:`, error);
      throw error;
    }
  }

  // En auth.service.ts
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.rol_id === 4 : false;
  }


  // Método para obtener la ruta de redirección
  getRedirectUrl(): string {
    return this.isAdmin() ? '/admin-control' : '/dashboard';
  }


  getCurrentFirebaseUser(): any {
    return this.auth?.currentUser || null;
  }

  getUserDataSync(): User | null {
    return this.currentUserSubject.value;
  }


  // Método público para actualizar el usuario (NUEVO)
  setCurrentUser(user: User | null): void {
    this.currentUserSubject.next(user);
  }



  getUserObservable(): Observable<User | null> {
    return this.currentUser$;
  }

  mapRoleIdToName(rolId: number): string {
    switch (rolId) {
      case 1: return 'ejecutiva';
      case 2: return 'tesoreria';
      case 3: return 'coordinador';
      case 4: return 'administrador';
      default: return '';
    }
  }

  // Método para verificar rol específico
  hasRole(roleName: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    if (user.nombre_rol) return user.nombre_rol.toLowerCase() === roleName.toLowerCase();
    // fallback por rol_id
    return this.mapRoleIdToName(user.rol_id) === roleName.toLowerCase();
  }

  // Método para verificar si tiene alguno de los roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    if (user.nombre_rol) {
      return roles.some(r => user.nombre_rol.toLowerCase() === r.toLowerCase());
    }
    const userRole = this.mapRoleIdToName(user.rol_id);
    return roles.map(r => r.toLowerCase()).includes(userRole);
  }

  // Método para obtener la ruta según el rol
  getRouteByRole(): string {
    const user = this.currentUserSubject.value;
    if (!user || !user.nombre_rol) return '/dashboard';

    switch (user.nombre_rol.toLowerCase()) {
      case 'administrador':
        return '/admin-control';
      case 'coordinador':
        return '/domiciliacion';
      case 'tesoreria':
        return '/solicitud';
      case 'ejecutiva':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  }

  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }
}





// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

// // auth.service.ts
// import { Injectable } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { map } from 'rxjs/operators';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private currentUserSubject = new BehaviorSubject<any>(null);
//   public currentUser$ = this.currentUserSubject.asObservable();

//   // Mapeo de roles por ID
//   private roleMap: { [key: number]: { nombre: string; ruta: string } } = {
//     1: { nombre: 'ejecutiva', ruta: '/dashboard' },
//     2: { nombre: 'tesoreria', ruta: '/solicitud' },
//     3: { nombre: 'coordinador', ruta: '/domiciliacion' },
//     4: { nombre: 'administrador', ruta: '/admin-control' }
//   };
//   getFirebaseToken: any;
//   loginWithEmail: any;
//   loginWithGoogle: any;

//   constructor() {
//     // Cargar usuario de localStorage al iniciar
//     const savedUser = localStorage.getItem('user');
//     if (savedUser) {
//       this.currentUserSubject.next(JSON.parse(savedUser));
//     }
//   }

//   // Obtener información del rol por ID
//   getRoleInfo(rolId: number): { nombre: string; ruta: string } {
//     return this.roleMap[rolId] || { nombre: 'usuario', ruta: '/dashboard' };
//   }

//      // Obtener nombre del rol por ID
//   getRoleName(rolId: number): string {
//     return this.getRoleInfo(rolId).nombre;
//   }

//   // Obtener ruta por rol ID
//   getRouteByRoleId(rolId: number): string {
//     return this.getRoleInfo(rolId).ruta;
//   }

//   // Verificar si es administrador
//   isAdmin(user: any): boolean {
//     return user?.rol_id === 4;
//   }

//   // Obtener usuario actual
//   getCurrentUser(): any {
//     return this.currentUserSubject.value;
//   }

//   // Establecer usuario
//   setUser(user: any): void {
//     // Agregar nombre_rol al usuario para compatibilidad con guards
//     if (user && user.rol_id) {
//       user.nombre_rol = this.getRoleName(user.rol_id);
//     }
//     this.currentUserSubject.next(user);
//     localStorage.setItem('user', JSON.stringify(user));
//   }

//   // Limpiar usuario (logout)
//   clearUser(): void {
//     this.currentUserSubject.next(null);
//     localStorage.removeItem('user');
//   }

//   // Obtener ruta según rol del usuario actual
//   getRouteByRole(): string {
//     const user = this.getCurrentUser();
//     if (!user || !user.rol_id) return '/login';
//     return this.getRouteByRoleId(user.rol_id);
//   }

//   // Verificar si tiene un rol específico
//   hasRole(roleName: string): boolean {
//     const user = this.getCurrentUser();
//     if (!user || !user.rol_id) return false;
//     return this.getRoleName(user.rol_id) === roleName.toLowerCase();
//   }


// }