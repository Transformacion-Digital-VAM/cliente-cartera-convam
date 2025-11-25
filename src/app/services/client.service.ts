import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; 

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:3000/cliente';

  constructor(private http: HttpClient) { }

  // Obtener todos los clientes
  obtenerClientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obtener`);
  }

  // Obtener cliente por ID
  obtenerClientePorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/obtener/${id}`);
  }

  // Buscar clientes con filtros
  buscarCliente(filtros: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obtener`).pipe(
      map(clientes => this.filtrarClientes(clientes, filtros))
    );
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

  // ========== MÉTODOS PARA EL PROCESO DE ALTA ==========

  // Guardar dirección (para cliente o aval)
  guardarDireccion(direccion: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/direccion`, direccion);
  }

  // Guardar cliente
  guardarCliente(cliente: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cliente`, cliente);
  }

  // Guardar aval
  guardarAval(aval: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/aval`, aval);
  }

  // Guardar solicitud
  guardarSolicitud(solicitud: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitud`, solicitud);
  }

  // ========== MÉTODOS ADICIONALES PARA AVALES ==========

  // Obtener avales por cliente ID
  obtenerAvalesPorCliente(clienteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/aval/cliente/${clienteId}`);
  }

  // Obtener aval por ID
  obtenerAvalPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/aval/${id}`);
  }

  // Editar aval
  editarAval(id: string, aval: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/aval/${id}`, aval);
  }

  // Eliminar aval
  eliminarAval(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/aval/${id}`);
  }

  // ========== MÉTODOS PARA EDICIÓN Y ELIMINACIÓN ==========

  // Método para editar cliente
  editarCliente(id: string, cliente: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/editar/${id}`, cliente);
  }

  // Método para eliminar cliente
  eliminarCliente(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }

  // ========== MÉTODO COMPLETO (backup) ==========
  
  // Método original para crear cliente completo en una sola operación
  crearCliente(datosCompletos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, datosCompletos);
  }
}