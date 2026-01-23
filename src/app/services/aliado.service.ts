import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AliadoService {

  // private apiUrl = 'http://localhost:3000/aliado';
  private baseUrl = `${environment.apiUrl}/aliado`;

  constructor(private http: HttpClient) { }

  // Obtener todos los aliados
  obtenerAliados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/`);
  }

  // Obtener aliado por ID (opcional, por si lo necesitas)
  obtenerAliadoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }
}