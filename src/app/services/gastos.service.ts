import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CategoriaGasto {
  id_categoria_gasto: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface GastoItem {
  id_gasto: number;
  categoria_id: number;
  categoria_nombre: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  fecha_gasto: string;
  metodo_pago: string;
  referencia?: string;
  comprobante?: string;
  registrado_por?: number;
  registrado_por_nombre?: string;
  fecha_registro: string;
  estatus: 'PAGADO' | 'PENDIENTE' | 'CANCELADO';
}

export interface DesgloseCategoria {
  categoria: string;
  total: number;
  cantidad: number;
}

export interface TotalesGastos {
  total_gastos: number;
  cantidad_gastos: number;
  categoria_principal: string;
  por_categoria: DesgloseCategoria[];
}

export interface GastosResponse {
  success: boolean;
  message: string;
  totales: TotalesGastos;
  data: GastoItem[];
}

export interface CategoriasResponse {
  success: boolean;
  data: CategoriaGasto[];
}

export interface FiltrosGastos {
  fecha_inicio?: string;
  fecha_fin?: string;
  periodo?: string; // 'todos' | 'hoy' | 'semana' | 'quincena' | 'mes' | 'rango'
  categoria_id?: number | string;
  metodo_pago?: string;
  estatus?: string;
  busqueda?: string;
}

export interface CrearGastoDTO {
  categoria_id: number;
  concepto: string;
  descripcion?: string;
  monto: number;
  fecha_gasto?: string;
  metodo_pago?: string;
  referencia?: string;
  comprobante?: string;
  registrado_por?: number;
  estatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GastosService {
  private apiUrl = `${environment.apiUrl}/gastos`;

  constructor(private http: HttpClient) {}

  obtenerCategorias(): Observable<CategoriasResponse> {
    return this.http.get<CategoriasResponse>(`${this.apiUrl}/categorias`);
  }

  crearCategoria(categoria: { nombre: string; descripcion?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/categorias`, categoria);
  }

  obtenerGastos(filtros?: FiltrosGastos): Observable<GastosResponse> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
      if (filtros.periodo && filtros.periodo !== 'todos' && filtros.periodo !== 'rango') {
        params = params.set('periodo', filtros.periodo);
      }
      if (filtros.categoria_id) params = params.set('categoria_id', filtros.categoria_id.toString());
      if (filtros.metodo_pago) params = params.set('metodo_pago', filtros.metodo_pago);
      if (filtros.estatus) params = params.set('estatus', filtros.estatus);
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
    }
    return this.http.get<GastosResponse>(this.apiUrl, { params });
  }

  crearGasto(gasto: CrearGastoDTO): Observable<any> {
    return this.http.post<any>(this.apiUrl, gasto);
  }

  actualizarGasto(id: number, gasto: Partial<CrearGastoDTO>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, gasto);
  }

  eliminarGasto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
