import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AvalesService {
  private apiUrl = `${environment.apiUrl}/cliente/aval`;

  constructor(private http: HttpClient) { }

  // Obtener todos los avales - CORREGIDO
  obtenerAvales(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/`).pipe(
      map(response => response.avales || []) // Extrae el array de avales
    );
  }

  // Obtener avales por cliente - NUEVO MÉTODO
  obtenerAvalesPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/cliente/${clienteId}`).pipe(
      map(response => response.avales || [])
    );
  }

  // Obtener aliado por ID
  obtenerAvalPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}