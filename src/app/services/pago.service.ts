import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  // private apiUrl = 'http://localhost:3000/pago'; 
  private apiUrl = `${environment.apiUrl}/pago`;
  
  constructor(private http: HttpClient) { }

  // Obtener todos los pagos
  obtenerPagos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Obtener pagos por crédito
  obtenerPagosPorCredito(creditoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/credito/${creditoId}`);
  }

  // Obtener pagos por cliente
  obtenerPagosPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // NUEVO: Obtener semanas pendientes con días de atraso calculados en backend
  obtenerSemanasPendientes(creditoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/semanas-pendientes/${creditoId}`);
  }

  // Registrar un pago
  registrarPago(pago: any): Observable<any> {
    return this.http.post(this.apiUrl, pago);
  }

  // Editar un pago
  editarPago(idPago: number, pago: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idPago}`, pago);
  }

  // Eliminar un pago
  eliminarPago(idPago: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${idPago}`);
  }

    // Obtener calendario por cliente
  obtenerCalendarioPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendario/cliente/${clienteId}`);
  }

}