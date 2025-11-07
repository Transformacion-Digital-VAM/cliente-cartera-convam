// // ✅ VERSION CORREGIDA - auth.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, from, BehaviorSubject } from 'rxjs';
// import { switchMap } from 'rxjs/operators';
// import { environment } from '../environments/environment';
// import { initializeApp } from 'firebase/app';
// import {
//   getAuth,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signInWithPopup,
//   GoogleAuthProvider,
//   signOut,
//   onAuthStateChanged,
//   User as FirebaseUser
// } from 'firebase/auth';

// export interface User {
//   id: number;
//   nombre: string;
//   usuario: string;
//   rol_id: number;
//   firebase_uid: string;
//   created_at: string;
// }

// export interface AuthResponse {
//   success: boolean;
//   message: string;
//   data: {
//     user: User;
//     firebase_user?: {
//       uid: string;
//       email: string;
//       name: string;
//       picture: string;
//     };
//   };
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private apiUrl = `${environment.apiUrl}/auth`;
//   private auth: any;
//   private googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
//   private currentUserSubject = new BehaviorSubject<User | null>(null);
//   public currentUser$ = this.currentUserSubject.asObservable();

//   constructor(private http: HttpClient) {
//     const app = initializeApp(environment.firebaseConfig);
//     this.auth = getAuth(app);
//     this.setupAuthStateListener();
//   }

//   // 🔹 Escucha el estado de sesión de Firebase
//   private setupAuthStateListener(): void {
//     onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
//       if (firebaseUser) {
//         console.log('Usuario autenticado en Firebase:', firebaseUser.email);
//         await this.syncUserWithBackend();
//       } else {
//         console.log('Usuario cerró sesión en Firebase');
//         this.currentUserSubject.next(null);
//         localStorage.removeItem('user');
//         localStorage.removeItem('firebase_token');
//       }
//     });
//   }

//   // 🔹 Sincroniza usuario Firebase con backend (si no existe, lo crea)
//   private async syncUserWithBackend(): Promise<void> {
//     try {
//       const token = await this.getFirebaseToken();
//       const response = await this.http
//         .post<AuthResponse>(
//           `${this.apiUrl}/login`,
//           {},
//           { headers: { Authorization: `Bearer ${token}` } }
//         )
//         .toPromise();

//       if (response?.success) {
//         console.log('Usuario sincronizado con backend:', response.data.user);
//         this.setUserData(response.data.user, token);
//       } else {
//         console.error('Error en respuesta del backend:', response);
//       }
//     } catch (error) {
//       console.error('Error sincronizando con backend:', error);
//       this.logout();
//     }
//   }

//   // 🔹 Registro solo en Firebase (el backend lo insertará al hacer login)
//   async registerWithEmail(nombre: string, correo: string, password: string, rol_id: number): Promise<any> {
//     const auth = getAuth();

//     try {
//       console.log('📲 Registrando usuario en Firebase...');
//       const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
//       const firebase_uid = userCredential.user.uid;

//       console.log('✅ Usuario creado en Firebase con UID:', firebase_uid);

//       // Registrar en PostgreSQL
//       const body = { nombre, usuario: correo, rol_id, firebase_uid };
//       console.log('📤 Enviando datos al backend:', body);

//       const response = await this.http.post(`${this.apiUrl}/register`, body).toPromise();
//       console.log('✅ Usuario registrado en PostgreSQL:', response);

//       return response;
//     } catch (error: any) {
//       console.error('❌ Error en registro:', error);
//       throw error;
//     }
//   }


//   // 🔹 Login con email y password
//   async loginWithEmail(correo: string, password: string): Promise<void> {
//     try {
//       console.log('Iniciando sesión con:', correo);
//       await signInWithEmailAndPassword(this.auth, correo, password);
//       console.log('✅ Login Firebase exitoso');
//     } catch (error: any) {
//       console.error('Error en login Firebase:', error);
//       throw this.handleFirebaseError(error);
//     }
//   }

//   // 🔹 Login con Google
//   async loginWithGoogle(): Promise<void> {
//     try {
//       const userCredential = await signInWithPopup(
//         this.auth,
//         this.googleProvider
//       );
//       console.log('✅ Login con Google exitoso:', userCredential.user.email);
//     } catch (error: any) {
//       console.error('Error en login Google:', error);
//       throw this.handleFirebaseError(error);
//     }
//   }

//   // 🔹 Logout
//   async logout(): Promise<void> {
//     await signOut(this.auth);
//     this.currentUserSubject.next(null);
//     localStorage.removeItem('user');
//     localStorage.removeItem('firebase_token');
//     console.log('Logout exitoso');
//   }

//   // 🔹 Token de Firebase
//   async getFirebaseToken(): Promise<string> {
//     const user = this.auth.currentUser;
//     if (!user) throw new Error('Usuario no autenticado');
//     return await user.getIdToken(true);
//   }

//   // 🔹 Guardar datos de usuario
//   private setUserData(user: User, token: string): void {
//     localStorage.setItem('user', JSON.stringify(user));
//     localStorage.setItem('firebase_token', token);
//     this.currentUserSubject.next(user);
//   }

//   private handleFirebaseError(error: any): Error {
//     const messages: Record<string, string> = {
//       'auth/email-already-in-use': 'Este email ya está registrado',
//       'auth/invalid-email': 'Correo inválido',
//       'auth/weak-password': 'Contraseña muy débil',
//       'auth/wrong-password': 'Contraseña incorrecta',
//       'auth/user-not-found': 'Usuario no encontrado',
//     };
//     return new Error(messages[error.code] || error.message || 'Error desconocido');
//   }
// }


// auth.service.ts - VERSIÓN COMPLETA CORREGIDA
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  User as FirebaseUser
} from 'firebase/auth';

export interface User {
  id: number;
  nombre: string;
  usuario: string;
  rol_id: number;
  firebase_uid: string;
  created_at: string;
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
  getUserData() {
    throw new Error('Method not implemented.');
  }
  private apiUrl = `${environment.apiUrl}/auth`;
  private auth: any;
  private googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(app);
    this.setupAuthStateListener();
  }

  // 🔹 Escucha el estado de sesión de Firebase
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

  // 🔹 Sincroniza usuario Firebase con backend
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
      this.logout();
    }
  }

  // ✅ NUEVO MÉTODO: Registro SIN inicio de sesión automático
  async registerWithoutLogin(nombre: string, correo: string, password: string, rol_id: number): Promise<RegisterResponse> {
    let tempAuth: any = null;
    
    try {
      console.log('📲 Iniciando registro completo...');
      
      // Crear una instancia temporal de auth para no afectar la sesión principal
      const app = initializeApp(environment.firebaseConfig, 'TempApp');
      tempAuth = getAuth(app);
      
      // 1. Crear usuario en Firebase
      console.log('🔐 Creando usuario en Firebase...');
      const userCredential = await createUserWithEmailAndPassword(tempAuth, correo, password);
      const firebase_uid = userCredential.user.uid;
      
      console.log('✅ Usuario creado en Firebase con UID:', firebase_uid);
      
      // 2. Cerrar sesión inmediatamente en la instancia temporal
      await signOut(tempAuth);
      console.log('✅ Sesión temporal cerrada');

      // 3. Registrar en PostgreSQL
      console.log('🗄️ Registrando usuario en PostgreSQL...');
      const body = { 
        nombre, 
        usuario: correo, 
        contrasenia: password, // ✅ ENVIAR CONTRASEÑA AL BACKEND
        rol_id, 
        firebase_uid 
      };
      
      console.log('📤 Enviando datos al backend:', body);

      const response = await firstValueFrom(
        this.http.post<RegisterResponse>(`${this.apiUrl}/register`, body)
      );

      if (!response.success) {
        throw new Error(response.message || 'Error en el registro backend');
      }

      console.log('✅ Usuario registrado exitosamente en PostgreSQL:', response.data.user);
      return response;

    } catch (error: any) {
      console.error('❌ Error en registro completo:', error);
      
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

  // 🔹 Método original de registro (mantener para compatibilidad)
  async registerWithEmail(nombre: string, correo: string, password: string, rol_id: number): Promise<any> {
    try {
      console.log('📲 Registrando usuario en Firebase...');
      
      // Usar auth principal
      const userCredential = await createUserWithEmailAndPassword(this.auth, correo, password);
      const firebase_uid = userCredential.user.uid;

      console.log('✅ Usuario creado en Firebase con UID:', firebase_uid);

      // Registrar en PostgreSQL
      const body = { 
        nombre, 
        usuario: correo, 
        contrasenia: password,
        rol_id, 
        firebase_uid 
      };
      
      console.log('📤 Enviando datos al backend:', body);

      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/register`, body)
      );

      console.log('✅ Usuario registrado en PostgreSQL:', response);
      return response;

    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      
      // Cerrar sesión si hubo error
      try {
        await signOut(this.auth);
      } catch (logoutError) {
        console.log('No había sesión activa');
      }
      
      throw error;
    }
  }

  // 🔹 Login con email y password
  async loginWithEmail(correo: string, password: string): Promise<void> {
    try {
      console.log('🔐 Iniciando sesión con:', correo);
      await signInWithEmailAndPassword(this.auth, correo, password);
      console.log('✅ Login Firebase exitoso');
    } catch (error: any) {
      console.error('Error en login Firebase:', error);
      throw new Error(this.handleFirebaseError(error));
    }
  }

  // 🔹 Login con Google
  async loginWithGoogle(): Promise<void> {
    try {
      const userCredential = await signInWithPopup(this.auth, this.googleProvider);
      console.log('✅ Login con Google exitoso:', userCredential.user.email);
    } catch (error: any) {
      console.error('Error en login Google:', error);
      throw new Error(this.handleFirebaseError(error));
    }
  }

  // 🔹 Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      localStorage.removeItem('user');
      localStorage.removeItem('firebase_token');
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  // 🔹 Obtener token de Firebase
  async getFirebaseToken(): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    return await user.getIdToken(true);
  }

  // 🔹 Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  // 🔹 Obtener usuario actual
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // 🔹 Guardar datos de usuario en localStorage y BehaviorSubject
  private setUserData(user: User, token: string): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('firebase_token', token);
    this.currentUserSubject.next(user);
  }

  // 🔹 Cargar usuario desde localStorage (para persistencia)
  loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('firebase_token');
    
    if (userStr && token) {
      const user: User = JSON.parse(userStr);
      this.currentUserSubject.next(user);
    }
  }

  // 🔹 Manejar errores de Firebase
  private handleFirebaseError(error: any): string {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres)',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
      'auth/operation-not-allowed': 'Operación no permitida.',
      'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este email.',
    };
    
    return messages[error.code] || error.message || 'Error desconocido en la autenticación';
  }

  // 🔹 Verificar estado de autenticación
  checkAuthState(): Observable<boolean> {
    return new Observable(subscriber => {
      onAuthStateChanged(this.auth, (user) => {
        subscriber.next(!!user);
      });
    });
  }

  // 🔹 Obtener UID del usuario actual de Firebase
  getCurrentFirebaseUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  // 🔹 Actualizar perfil de usuario en Firebase
  async updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    try {
      await user.updateProfile({
        displayName,
        photoURL
      });
      console.log('✅ Perfil actualizado correctamente');
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      throw new Error(this.handleFirebaseError(error));
    }
  }

  // 🔹 Enviar email de verificación
  async sendEmailVerification(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    try {
      await user.sendEmailVerification();
      console.log('✅ Email de verificación enviado');
    } catch (error: any) {
      console.error('Error enviando verificación:', error);
      throw new Error(this.handleFirebaseError(error));
    }
  }

  // 🔹 Enviar email de reset de contraseña
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await this.auth.sendPasswordResetEmail(email);
      console.log('✅ Email de reset enviado a:', email);
    } catch (error: any) {
      console.error('Error enviando reset:', error);
      throw new Error(this.handleFirebaseError(error));
    }
  }
}