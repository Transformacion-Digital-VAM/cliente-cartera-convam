// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class SolicitudService {
//   private apiUrl = 'http://localhost:3000/solicitud';
//   private aliadosUrl = 'http://localhost:3000/aliados'; 
//   private avalesUrl = 'http://localhost:3000/avales';

//   constructor(private http: HttpClient) { }

//   // Crear nueva solicitud
//   crearSolicitud(solicitud: any): Observable<any> {
//     return this.http.post(`${this.apiUrl}/crear`, solicitud);
//   }

//   obtenerSolicitudes(): Observable<any[]> {
//     return this.http.get<any[]>(`${this.apiUrl}`);
//   }

//   obtenerSolicitudPorId(id: number): Observable<any> {
//     return this.http.get<any>(`${this.apiUrl}/${id}`);
//   }

//   // Obtener solicitudes por estado
//   obtenerSolicitudesPorEstado(estado: string): Observable<any[]> {
//     return this.http.get<any[]>(`${this.apiUrl}/estado/${estado}`);
//   }

//   // Aprobar solicitud
//   aprobarSolicitud(id: number, montoAprobado: number): Observable<any> {
//     return this.http.put(`${this.apiUrl}/aprobar/${id}`, { monto_aprobado: montoAprobado });
//   }

//   // Rechazar solicitud
//   rechazarSolicitud(id: number, motivo: string): Observable<any> {
//     return this.http.put(`${this.apiUrl}/rechazar/${id}`, { motivo });
//   }

//   // Obtener solicitudes por cliente
//   obtenerSolicitudesPorCliente(clienteId: number): Observable<any[]> {
//     return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`);
//   }

// }


// -----------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { from } from 'rxjs/internal/observable/from';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  actualizarSolicitud: any;
  actualizarSolicitudDomicilio(datosActualizacion: { id_solicitud: any; estado: string; horario_entrega: string; persona_confirma: string; fecha_domiciliada: string; }) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = `${environment.apiUrl}/solicitud`;

  // Rutas actualizadas
  private aliadosUrl = `${environment.apiUrl}/aliado`;
  private avalesUrl = `${environment.apiUrl}/cliente/avales`;

  // constructor(private http: HttpClient) { 

  // }
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Manejo de errores mejorado
  private handleError(error: HttpErrorResponse) {
    console.error('Error en SolicitudService:', error);

    let errorMessage = 'Error del servidor';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.detalle || error.error?.error || error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  // ============================================
  // MÉTODOS PRINCIPALES MEJORADOS
  // ============================================

  // Obtener todas las solicitudes con nombres de aliado y aval
  obtenerSolicitudes(): Observable<any[]> {
    return forkJoin({
      solicitudes: this.http.get<any[]>(this.apiUrl),
      aliados: this.obtenerTodosAliados(),
      avales: this.obtenerTodosAvales()
    }).pipe(
      map(({ solicitudes, aliados, avales }) => {
        return this.agregarNombresASolicitudes(solicitudes, aliados, avales);
      }),
      catchError(this.handleError)
    );
  }

  // Obtener solicitudes por estado con nombres
  obtenerSolicitudesPorEstado(estado: string): Observable<any[]> {
    return forkJoin({
      solicitudes: this.http.get<any[]>(`${this.apiUrl}/estado/${estado}`),
      aliados: this.obtenerTodosAliados(),
      avales: this.obtenerTodosAvales()
    }).pipe(
      map(({ solicitudes, aliados, avales }) => {
        return this.agregarNombresASolicitudes(solicitudes, aliados, avales);
      }),
      catchError(this.handleError)
    );
  }

  // Obtener solicitud específica con nombres
  obtenerSolicitudPorId(id: number): Observable<any> {
    return forkJoin({
      solicitud: this.http.get<any>(`${this.apiUrl}/${id}`),
      aliados: this.obtenerTodosAliados(),
      avales: this.obtenerTodosAvales()
    }).pipe(
      map(({ solicitud, aliados, avales }) => {
        return this.agregarNombresASolicitud(solicitud, aliados, avales);
      }),
      catchError(this.handleError)
    );
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  // Agregar nombres a múltiples solicitudes
  private agregarNombresASolicitudes(solicitudes: any[], aliados: any[], avales: any[]): any[] {
    return solicitudes.map(solicitud => {

      return this.agregarNombresASolicitud(solicitud, aliados, avales);

    });


  }

  // Agregar nombres a una sola solicitud
  private agregarNombresASolicitud(solicitud: any, aliados: any[], avales: any[]): any {
    if (!solicitud) return solicitud;

    const resultado = { ...solicitud };

    // Agregar nombre del aliado (solo si no viene del backend)
    if (!resultado.nombre_aliado && solicitud.aliado_id) {
      const aliado = aliados.find(a => a.id_aliado == solicitud.aliado_id);
      resultado.nombre_aliado = this.extraerNombreAliado(aliado) || 'No asignado';
    } else if (!resultado.nombre_aliado) {
      resultado.nombre_aliado = 'No asignado';
    }

    // Agregar nombre del aval (solo si no viene del backend)
    if (!resultado.nombre_aval && solicitud.aval_id) {
      const aval = avales.find(a => a.id_aval == solicitud.aval_id);
      // Solo asignar si extraerNombreAval devuelve algo válido
      const nombreAvalExtraido = this.extraerNombreAval(aval);
      if (nombreAvalExtraido && nombreAvalExtraido !== 'Aval no encontrado') {
        resultado.nombre_aval = nombreAvalExtraido;
      }
    }

    // Si después de todo no hay nombre_aval, asignar uno por defecto
    if (!resultado.nombre_aval || resultado.nombre_aval === 'Aval no encontrado') {
      // Intentar construir con los campos que sí vienen
      const nombre = solicitud.nombre_aval || '';
      const app = solicitud.app_aval || '';
      const apm = solicitud.apm_aval || '';
      const nombreCompleto = `${nombre} ${app} ${apm}`.trim();

      resultado.nombre_aval = nombreCompleto || 'Sin aval';
    }

    return resultado;
  }

  // Extraer nombre del aliado (con múltiples formatos posibles)
  private extraerNombreAliado(aliado: any): string {
    if (!aliado) return 'Aliado no encontrado';

    // Intentar diferentes formatos de campos
    if (aliado.nom_aliado) {
      return aliado.nom_aliado.trim();
    }
    if (aliado.nombre) {
      return aliado.nombre.trim();
    }
    if (aliado.nombre_completo) {
      return aliado.nombre_completo.trim();
    }
    if (aliado.nombre_aliado) {
      return aliado.nombre_aliado.trim();
    }

    return 'Aliado sin nombre';
  }

  // Extraer nombre del aval (con múltiples formatos posibles)
  private extraerNombreAval(aval: any): string {
    if (!aval) return ''; // Cambia a cadena vacía

    // Intentar construir nombre completo
    const nombre = aval.nombre || aval.nombre_aval || '';
    const apellidoPaterno = aval.apellido_paterno || aval.app_aval || '';
    const apellidoMaterno = aval.apellido_materno || aval.apm_aval || '';

    const partes = [
      nombre,
      apellidoPaterno,
      apellidoMaterno
    ].filter(p => p && p.trim());

    return partes.join(' ').trim(); // Devuelve cadena vacía si no hay partes
  }



  // ============================================
  // MÉTODOS PARA OBTENER DATOS EXTERNOS
  // ============================================

  // Obtener todos los aliados con manejo de errores
  obtenerTodosAliados(): Observable<any[]> {
    return this.http.get<any[]>(this.aliadosUrl).pipe(
      catchError(error => {
        console.warn('No se pudieron cargar aliados:', error.message);
        return of([]); // Retornar array vacío si falla
      })
    );
  }

  // Obtener todos los avales con manejo de errores y normalización
  obtenerTodosAvales(): Observable<any[]> {
    return this.http.get<any>(this.avalesUrl).pipe(
      map(response => {
        console.log('=== RESPUESTA DE AVALES (RAW) ===');
        console.log('Tipo:', typeof response);
        console.log('Es array?:', Array.isArray(response));
        console.log('Contenido:', response);

        // NORMALIZACIÓN: Convertir diferentes formatos a array
        let avalesArray: any[] = [];

        if (Array.isArray(response)) {
          // Caso 1: Ya es un array directamente
          avalesArray = response;
          console.log('✓ Formato: Array directo');
        } else if (response && typeof response === 'object') {
          // Caso 2: Es un objeto que contiene un array
          if (response.avales && Array.isArray(response.avales)) {
            avalesArray = response.avales;
            console.log('✓ Formato: { avales: [...] }');
          } else if (response.data && Array.isArray(response.data)) {
            avalesArray = response.data;
            console.log('✓ Formato: { data: [...] }');
          } else if (response.rows && Array.isArray(response.rows)) {
            avalesArray = response.rows;
            console.log('✓ Formato: { rows: [...] }');
          } else {
            // Caso 3: Es un objeto único, convertir a array de 1 elemento
            avalesArray = [response];
            console.log('✓ Formato: Objeto único convertido a array');
          }
        }

        console.log('Array normalizado:', avalesArray);
        console.log('Total de avales:', avalesArray.length);

        if (avalesArray.length > 0) {
          console.log('Primer aval:', avalesArray[0]);
        }

        return avalesArray;
      }),
      catchError(error => {
        console.error('Error al cargar avales:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        return of([]);
      })
    );
  }

  // Obtener aliado específico
  obtenerAliadoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.aliadosUrl}/${id}`).pipe(
      catchError(error => {
        console.warn(`No se pudo obtener aliado ${id}:`, error);
        return of(null);
      })
    );
  }

  // Obtener aval específico
  obtenerAvalPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.avalesUrl}/${id}`).pipe(
      catchError(error => {
        console.warn(`No se pudo obtener aval ${id}:`, error);
        return of(null);
      })
    );
  }

  // ============================================
  // MÉTODOS DE OPERACIONES
  // ============================================

  // Crear nueva solicitud
  crearSolicitud(solicitud: any): Observable<any> {
    console.log('Creando solicitud con datos:', solicitud);

    return this.http.post(`${this.baseUrl}/crear`, solicitud).pipe(
      catchError(this.handleError)
    );
  }

  // Aprobar solicitud
  aprobarSolicitud(id: number, montoAprobado: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/aprobar/${id}`, {
      monto_aprobado: montoAprobado
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Rechazar solicitud
  rechazarSolicitud(id: number, motivo: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/rechazar/${id}`, {
      motivo: motivo
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener solicitudes por cliente
  obtenerSolicitudesPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener solicitudes por usuario (ejecutivo)
  obtenerSolicitudesPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
      catchError(this.handleError)
    );
  }


  actualizarDomiciliacion(id: number, datos: any): Observable<any> {
    return from(this.authService.getFirebaseToken()).pipe(
      switchMap((token: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        return this.http.put<any>(
          `${this.baseUrl}/${id}/domiciliar`,
          datos,
          { headers }
        );
      }),
      catchError(error => {
        console.error('Error en actualizarDomiciliacion:', error);
        return throwError(() => error);
      })
    );
  }


  // Método para obtener solicitudes pendientes de domiciliación
  obtenerSolicitudesPendientesDomiciliacion(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendientes/domiciliacion`).pipe(
      catchError(this.handleError)
    );
  }


  // O si usas PUT:
  actualizarEstadoSolicitud(idSolicitud: number, datos: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${idSolicitud}/estado`, datos);
  }


}


