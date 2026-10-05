import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface IngresoItem {
  id_calendario: number;
  pagare_id: number;
  numero_pago: number;
  no_pagos: number;
  fecha_vencimiento: string;
  fecha_pago: string;
  capital: number;
  interes: number;
  total_semana: number;
  monto_pagado: number;
  mora_acumulada: number;
  estatus: string;
  id_credito: number;
  id_solicitud: number;
  tipo_vencimiento: string;
  id_cliente: number;
  nombre_cliente: string;
  app_cliente: string;
  apm_cliente: string;
  nombre_completo: string;
  nom_aliado: string;
}

export interface TotalesIngresos {
  total_ingresos: number;
  total_capital: number;
  total_mora: number;
  total_recaudado: number;
  cantidad_pagos: number;
}

export interface IngresosResponse {
  success: boolean;
  message: string;
  ingresos: number;
  totales: TotalesIngresos;
  data: IngresoItem[];
}

export interface FiltrosIngresos {
  fecha_inicio?: string;
  fecha_fin?: string;
  periodo?: string; // 'todos' | 'semana' | 'quincena' | 'mes' | 'hoy'
  cliente?: string;
  aliado?: string;   // legado (singular)
  aliados?: string;  // múltiple, separado por comas
}

@Injectable({
  providedIn: 'root'
})
export class IngresosService {
  private apiUrl = `${environment.apiUrl}/ingresos`;

  constructor(private http: HttpClient) {}

  obtenerIngresos(filtros?: FiltrosIngresos): Observable<IngresosResponse> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
      if (filtros.periodo && filtros.periodo !== 'todos') params = params.set('periodo', filtros.periodo);
      if (filtros.cliente) params = params.set('cliente', filtros.cliente);
      if (filtros.aliado) params = params.set('aliado', filtros.aliado);
      if (filtros.aliados) params = params.set('aliados', filtros.aliados);
    }
    return this.http.get<IngresosResponse>(this.apiUrl, { params });
  }
}
