// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class PagareService {
//   private apiUrl = 'http://localhost:3000/pagare';

//   constructor(private http: HttpClient) { }

//   // CORRECCIÓN: Tu backend usa GET, no POST
//   generarPagare(creditoId: number): Observable<Blob> {
//     return this.http.get(`${this.apiUrl}/${creditoId}`, {
//       responseType: 'blob' // Importante: especifica que esperas un blob (PDF)
//     });
//   }

//   // CORRECCIÓN: Tu backend usa GET, no POST
//   generarHojaControl(creditoId: number): Observable<Blob> {
//     return this.http.get(`${this.apiUrl}/hoja-control/${creditoId}`, {
//       responseType: 'blob' // Importante: especifica que esperas un blob (PDF)
//     });
//   }

//   // NOTA: No necesitas métodos separados para "descargar" porque
//   // el backend ya devuelve el PDF directamente al generarlo

//   // Método auxiliar para manejar la descarga (opcional)
//   descargarArchivo(blob: Blob, nombreArchivo: string): void {
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = nombreArchivo;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     window.URL.revokeObjectURL(url);
//   }
// }



// pagare.service.ts - VERSIÓN FINAL CORREGIDA
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