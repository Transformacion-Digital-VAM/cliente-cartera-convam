import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AliadoService {

  private apiUrl = 'http://localhost:3000/aliado';

  constructor(private http: HttpClient) { }

  // Obtener todos los aliados
  obtenerAliados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/`);
  }

  // Obtener aliado por ID (opcional, por si lo necesitas)
  obtenerAliadoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}