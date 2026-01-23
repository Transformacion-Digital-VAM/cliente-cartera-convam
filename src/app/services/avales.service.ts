import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AvalesService {
  // private apiUrl = 'http://localhost:3000/cliente/aval';
  private baseUrl = `${environment.apiUrl}/cliente/aval`;
  
  constructor(private http: HttpClient) { }

  // Obtener todos los avales
  obtenerAvales(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/`).pipe(
      map(response => {
        console.log('Respuesta de obtenerAvales:', response);
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
    return this.http.get<any>(`${this.baseUrl}/cliente/${clienteId}`).pipe(
      map(response => {
        console.log(`Respuesta de avales del cliente ${clienteId}:`, response);
        return Array.isArray(response) ? response : (response.avales || []);
      }),
      catchError(error => {
        console.error(`Error al obtener avales del cliente ${clienteId}:`, error);
        return of([]);
      })
    );
  }

  // Obtener aval por ID
  obtenerAvalPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
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