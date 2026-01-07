// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable, map } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class AvalesService {
//   private apiUrl = 'http://localhost:3000/cliente/aval';

//   constructor(private http: HttpClient) { }

//   // Obtener todos los avales -
//   obtenerAvales(): Observable<any[]> {
//     return this.http.get<any>(`${this.apiUrl}/`).pipe(
//       map(response => response.avales || []) 
//     );
//   }

//   // Obtener avales por cliente - NUEVO MÉTODO
//   obtenerAvalesPorCliente(clienteId: number): Observable<any[]> {
//     return this.http.get<any>(`${this.apiUrl}/cliente/${clienteId}`).pipe(
//       map(response => response.avales || [])
//     );
//   }

//   // Obtener aliado por ID
//   obtenerAvalPorId(id: number): Observable<any> {
//     return this.http.get<any>(`${this.apiUrl}/${id}`);
//   }
// }

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AvalesService {
  private apiUrl = 'http://localhost:3000/cliente/aval';
  
  constructor(private http: HttpClient) { }

  // Obtener todos los avales
  obtenerAvales(): Observable<any[]> {
    // ❌ ANTES: return this.http.get<any>`${this.apiUrl}/`).pipe(
    // ✅ AHORA: parentesis ANTES de comilla invertida
    return this.http.get<any>(`${this.apiUrl}/`).pipe(
      map(response => {
        console.log('Respuesta de obtenerAvales:', response);
        // Maneja tanto { avales: [...] } como [...]
        return Array.isArray(response) ? response : (response.avales || []);
      }),
      catchError(error => {
        console.error('Error al obtener avales:', error);
        return of([]);
      })
    );
  }

  // Obtener avales por cliente
  obtenerAvalesPorCliente(clienteId: number): Observable<any[]> {
    // ❌ ANTES: return this.http.get<any>`${this.apiUrl}/cliente/${clienteId}`).pipe(
    // ✅ AHORA: parentesis ANTES de comilla invertida
    return this.http.get<any>(`${this.apiUrl}/cliente/${clienteId}`).pipe(
      map(response => {
        console.log(`Respuesta de avales del cliente ${clienteId}:`, response);
        return Array.isArray(response) ? response : (response.avales || []);
      }),
      catchError(error => {
        // ❌ ANTES: console.error`Error al obtener avales...`
        // ✅ AHORA: parentesis normales para console.error
        console.error(`Error al obtener avales del cliente ${clienteId}:`, error);
        return of([]);
      })
    );
  }

  // Obtener aval por ID
  obtenerAvalPorId(id: number): Observable<any> {
    // ❌ ANTES: return this.http.get<any>`${this.apiUrl}/${id}`).pipe(
    // ✅ AHORA: parentesis ANTES de comilla invertida
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(aval => {
        console.log(`Aval ${id} obtenido:`, aval);
        return aval;
      }),
      catchError(error => {
        console.error(`Error al obtener aval ${id}:`, error);
        return of(null);
      })
    );
  }
}