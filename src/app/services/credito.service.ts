// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class CreditoService {

//   constructor() { }
// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreditoService {
  private apiUrl = 'http://localhost:3000/credito';

  constructor(private http: HttpClient) { }

  // Obtener todos los créditos
  obtenerCreditos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Obtener créditos por cliente
  obtenerCreditosPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`);
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


    // Obtener solicitudes por estado (MÉTODO NUEVO)
  obtenerSolicitudesPorEstado(estado: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/solicitudes?estado=${estado}`);
  }
}