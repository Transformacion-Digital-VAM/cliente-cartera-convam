// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class CreditoService {
//   private apiUrl = 'http://localhost:3000/credito';

//   constructor(private http: HttpClient) { }

//   // Obtener todos los créditos
//   obtenerCreditos(): Observable<any[]> {
//     return this.http.get<any[]>(this.apiUrl);
//   }

//   // Obtener créditos por cliente
//   obtenerCreditosPorCliente(clienteId: number): Observable<any[]> {
//     // return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`);
//     return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`);
//   }

//   // Crear nuevo crédito
//   crearCredito(credito: any): Observable<any> {
//     return this.http.post(this.apiUrl, credito);
//   }

//   // Editar crédito
//   editarCredito(id: number, credito: any): Observable<any> {
//     return this.http.put(`${this.apiUrl}/${id}`, credito);
//   }

//   // Eliminar crédito
//   eliminarCredito(id: number): Observable<any> {
//     return this.http.delete(`${this.apiUrl}/${id}`);
//   }

  
//   actualizarEstadoCredito(id: number, estado: string): Observable<any> {
//     return this.http.put(`${this.apiUrl}/${id}/estado`, { estado_credito: estado });
//   }


//     // Obtener solicitudes por estado (MÉTODO NUEVO)
//   obtenerSolicitudesPorEstado(estado: string): Observable<any[]> {
//     return this.http.get<any[]>(`${this.apiUrl}/solicitudes?estado=${estado}`);
//   }
// }



import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreditoService {
  private apiUrl = 'http://localhost:3000/credito';
  private apiEditarUrl = 'http://localhost:3000'; // URL para editar créditos

  constructor(private http: HttpClient) { }

  // Obtener todos los créditos
  obtenerCreditos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Obtener créditos por cliente
  obtenerCreditosPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // Verificar si existe un crédito activo para una solicitud
  verificarCreditoActivo(solicitudId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/solicitud/${solicitudId}/activo`);
  }

  // Crear nuevo crédito
  crearCredito(credito: any): Observable<any> {
    return this.http.post(this.apiUrl, credito);
  }

  // Editar crédito
  editarCredito(id: number, credito: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, credito);
  }

  // Eliminar crédito
  eliminarCredito(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  actualizarEstadoCredito(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/estado`, { estado_credito: estado });
  }

  // Obtener solicitudes por estado
  obtenerSolicitudesPorEstado(estado: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/solicitudes?estado=${estado}`);
  }

  // En tu credito.service.ts
  actualizarCredito(idCredito: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idCredito}`, datos);
  }

}