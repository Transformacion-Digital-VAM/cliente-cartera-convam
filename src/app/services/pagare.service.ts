import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagareService {
  private apiUrl = `${environment.apiUrl}/pagare`;

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
}