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
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private apiUrl = 'http://localhost:3000/solicitud';
  
  // Rutas actualizadas
  private aliadosUrl = 'http://localhost:3000/aliado'; 
  private avalesUrl = ' http://localhost:3000/cliente/avales'; 

  constructor(private http: HttpClient) { }

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

    // Agregar nombre del aliado
    if (solicitud.aliado_id) {
      const aliado = aliados.find(a => a.id_aliado == solicitud.aliado_id);
      resultado.nombre_aliado = this.extraerNombreAliado(aliado);
    } else {
      resultado.nombre_aliado = 'No asignado';
    }

    // Agregar nombre del aval
    if (solicitud.aval_id) {
      const aval = avales.find(a => a.id_aval == solicitud.aval_id);
      resultado.nombre_aval = this.extraerNombreAval(aval);
    } else {
      resultado.nombre_aval = 'Sin aval';
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
    if (!aval) return 'Aval no encontrado';

    // Intentar construir nombre completo
    const nombre = aval.nombre || aval.nombre_aval || '';
    const apellidoPaterno = aval.apellido_paterno || aval.app_aval || '';
    const apellidoMaterno = aval.apellido_materno || aval.apm_aval || '';

    const partes = [
      nombre,
      apellidoPaterno,
      apellidoMaterno
    ].filter(p => p && p.trim());

    return partes.join(' ').trim() || 'Aval sin nombre';
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

  // Obtener todos los avales con manejo de errores
  obtenerTodosAvales(): Observable<any[]> {
    return this.http.get<any[]>(this.avalesUrl).pipe(
      catchError(error => {
        console.warn('No se pudieron cargar avales:', error.message);
        return of([]); // Retornar array vacío si falla
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
    
    return this.http.post(`${this.apiUrl}/crear`, solicitud).pipe(
      catchError(this.handleError)
    );
  }

  // Aprobar solicitud
  aprobarSolicitud(id: number, montoAprobado: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/aprobar/${id}`, { 
      monto_aprobado: montoAprobado 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Rechazar solicitud
  rechazarSolicitud(id: number, motivo: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/rechazar/${id}`, { 
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
}
