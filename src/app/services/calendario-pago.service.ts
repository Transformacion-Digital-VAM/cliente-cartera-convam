import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CalendarioPagoService {
  // CAMBIA ESTA RUTA: '/pagare' debe apuntar a donde está tu router de pagaré
  private apiUrl = `${environment.apiUrl}/pagare`;

  constructor(private http: HttpClient) { }

  // Obtener calendario por cliente - RUTA CORRECTA
  obtenerPorCliente(idCliente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendario/cliente/${idCliente}`);
  }

  // Obtener calendario por crédito - RUTA CORRECTA
  obtenerPorCredito(idCredito: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendario/credito/${idCredito}`);
  }

  // Verificar si puede solicitar nuevo crédito
  verificarPuedeSolicitar(idCliente: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verificar-solicitud/${idCliente}`);
  }
}