// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class CalendarioPagoService {

//   constructor() { }
// }


// calendario-pago.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalendarioPagoService {
  private apiUrl = 'http://localhost:3000/calendario-pago';

  constructor(private http: HttpClient) { }

  // Obtener calendario por cliente
  obtenerPorCliente(idCliente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cliente/${idCliente}`);
  }

  // Obtener calendario por crédito
  obtenerPorCredito(idCredito: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/credito/${idCredito}`);
  }

  // Verificar si puede solicitar nuevo crédito
  verificarPuedeSolicitar(idCliente: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verificar-solicitud/${idCliente}`);
  }
}