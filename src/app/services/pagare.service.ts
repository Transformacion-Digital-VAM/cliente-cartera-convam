// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class PagareService {
//   private apiUrl = 'http://localhost:3000/pagare';

//   constructor(private http: HttpClient) { }

//   // Generar pagaré - DEVUELVE UN BLOB (PDF)
//   generarPagare(creditoId: number): Observable<Blob> {
//     return this.http.get(`${this.apiUrl}/${creditoId}`, {
//       responseType: 'blob'
//     });
//   }

//   // Generar hoja de control - DEVUELVE UN BLOB (PDF)
//   generarHojaControl(creditoId: number): Observable<Blob> {
//     return this.http.get(`${this.apiUrl}/hoja-control/${creditoId}`, {
//       responseType: 'blob'
//     });
//   }
// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagareService {
  private apiUrl = 'http://localhost:3000/pagare';

  constructor(private http: HttpClient) { }

  // Generar pagaré - DEVUELVE UN BLOB (PDF)
  generarPagare(creditoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${creditoId}`, {
      responseType: 'blob'
    });
  }

  // Generar hoja de control - DEVUELVE UN BLOB (PDF)
  generarHojaControl(creditoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/hoja-control/${creditoId}`, {
      responseType: 'blob'
    });
  }

  // Obtener calendario por pagaré
  obtenerCalendarioPorPagare(pagareId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendario/pagare/${pagareId}`);
  }

  // Obtener calendario por cliente
  obtenerCalendarioPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendario/cliente/${clienteId}`);
  }

  // Obtener calendario por crédito
  obtenerCalendarioPorCredito(creditoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendario/credito/${creditoId}`);
  }
}