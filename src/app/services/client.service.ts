import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  // private apiUrl = 'http://localhost:3000/cliente';
  private baseUrl = `${environment.apiUrl}/cliente`;

  constructor(private http: HttpClient) { }

  // Método existente
  obtenerClientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/obtener`);
  }

  // Nuevo método para verificar si puede solicitar crédito
  verificarPuedeSolicitar(idCliente: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/verificar-solicitud/${idCliente}`);
  }

  // Método existente modificado para incluir estado del crédito
  obtenerClientePorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/obtener/${id}`);
  }

  // Resto de métodos existentes...
  buscarCliente(filtros: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/obtener`).pipe(
      map(clientes => this.filtrarClientes(clientes, filtros)));
  }


  private filtrarClientes(clientes: any[], filtros: any): any[] {
    return clientes.filter(cliente => {
      const nombreCompleto = `${cliente.nombre_cliente} ${cliente.app_cliente} ${cliente.apm_cliente || ''}`.toLowerCase();
      const buscaNombre = filtros.nombre?.toLowerCase() || '';

      const coincideNombre = !filtros.nombre ||
        nombreCompleto.includes(buscaNombre);

      const coincideIdentificacion = !filtros.identificacion ||
        cliente.curp?.includes(filtros.identificacion);

      const coincideEstado = !filtros.estadoCredito;

      return coincideNombre && coincideIdentificacion && coincideEstado;
    });
  }

  // En tu ClienteService (client.service.ts)
  obtenerCreditosActivos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/creditos-activos`);
  }

  // En tu PagoService
  obtenerCalendarioPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/calendario/cliente/${clienteId}`);
  }
  // ========== MÉTODOS PARA EL PROCESO DE ALTA ==========

  // Guardar dirección (para cliente o aval)
  guardarDireccion(direccion: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/direccion`, direccion);
  }

  // Guardar cliente
  guardarCliente(cliente: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/cliente`, cliente);
  }

  // Guardar aval
  guardarAval(aval: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/aval`, aval);
  }

  // Guardar solicitud
  guardarSolicitud(solicitud: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/solicitud`, solicitud);
  }

  // ========== MÉTODOS ADICIONALES PARA AVALES ==========

  // Obtener avales por cliente ID
  obtenerAvalesPorCliente(clienteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/aval/cliente/${clienteId}`);
  }

  // Obtener aval por ID
  obtenerAvalPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/aval/${id}`);
  }

  // Editar aval
  editarAval(id: string, aval: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/aval/${id}`, aval);
  }

  // Eliminar aval
  eliminarAval(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/aval/${id}`);
  }

  // ========== MÉTODOS PARA EDICIÓN Y ELIMINACIÓN ==========

  // Método para editar cliente
  editarCliente(id: string, cliente: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/editar/${id}`, cliente);
  }

  // Método para eliminar cliente
  eliminarCliente(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/eliminar/${id}`);
  }

  // ========== MÉTODO COMPLETO (backup) ==========

  // Método original para crear cliente completo en una sola operación
  crearCliente(datosCompletos: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crear`, datosCompletos);
  }

  // ... otros métodos existentes
}