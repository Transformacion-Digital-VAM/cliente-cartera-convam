// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class TreasuryService {

//   constructor() { }
// }


import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TreasuryService {
  private baseUrl = 'http://localhost:3000';
  
  // Rutas exactas según tu backend
  private endpoints = {
    // Reportes de Tesorería
    capitalReport: '/api/reporte/tesoreria/capital-cartera',
    portfolioSummary: '/api/reporte/tesoreria/resumen-cartera',
    paymentDetail: '/api/reporte/tesoreria/detalle-pagos',
    filterOptions: '/api/reporte/tesoreria/filtros',
    ministrationReport: '/api/reporte/tesoreria/ministraciones',
    
    // Dashboard
    dashboardTrends: '/api/reporte/tesoreria/dashboard-trends',
    exportDashboard: '/api/reporte/tesoreria/export-dashboard'
  };

  constructor(private http: HttpClient) { }

  // Método genérico para construir peticiones
  private get(url: string, params?: HttpParams): Observable<any> {
    const fullUrl = `${this.baseUrl}${url}`;
    console.log('Realizando petición a:', fullUrl);
    return this.http.get(fullUrl, { params }).pipe(
      catchError(error => {
        console.error(`Error en ${url}:`, error);
        throw error;
      })
    );
  }

  getCapitalReport(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.get(this.endpoints.capitalReport, params);
  }

  getPortfolioSummary(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.get(this.endpoints.portfolioSummary, params);
  }

  getDashboardTrends(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.get(this.endpoints.dashboardTrends, params);
  }

  getPaymentDetailReport(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.get(this.endpoints.paymentDetail, params);
  }

  getFilterOptions(): Observable<any> {
    return this.get(this.endpoints.filterOptions);
  }

  // Nota: La ruta export-dashboard no está en tu routes.js, necesitas agregarla
  exportDashboard(filters: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get(`${this.baseUrl}${this.endpoints.exportDashboard}`, { 
      params, 
      responseType: 'blob' 
    });
  }
}