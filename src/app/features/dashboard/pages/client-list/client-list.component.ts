// client-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../../services/client.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css']
})
export class ClientListComponent implements OnInit {
[x: string]: any;
  // Datos del cliente
  clientes: any[] = [];
  clienteSeleccionado: any = null;
  
  // Filtros de búsqueda
  filtro = {
    nombre: '',
    identificacion: '',
    estadoCredito: ''
  };

  // Estados
  cargando = false;
  error = '';

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  // Cargar todos los clientes
  cargarClientes(): void {
    this.cargando = true;
    this.error = '';
    
    this.clienteService.obtenerClientes().subscribe({
      next: (data) => {
        // Filtrar clientes nulos o undefined
        this.clientes = (data || []).filter(cliente => cliente != null);
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los clientes';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  // Buscar cliente por criterios
  buscarCliente(): void {
    this.cargando = true;
    this.error = '';
    
    this.clienteService.buscarCliente(this.filtro).subscribe({
      next: (data) => {
        this.clientes = (data || []).filter(cliente => cliente != null);
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error en la búsqueda';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  // Seleccionar cliente para ver detalles
  seleccionarCliente(cliente: any): void {
    if (cliente && cliente.id_cliente) {
      this.clienteSeleccionado = cliente;
    }
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.filtro = {
      nombre: '',
      identificacion: '',
      estadoCredito: ''
    };
    this.cargarClientes();
    console.log(this.clientes);

  }

  // Volver a la lista
  volverALista(): void {
    this.clienteSeleccionado = null;
  }

  // Obtener nombre completo con validaciones
  getNombreCompleto(cliente: any): string {
    if (!cliente) return 'Cliente no disponible';
    
    const nombre = cliente.nombre_cliente || '';
    const app = cliente.app_cliente || '';
    const apm = cliente.apm_cliente || '';
    
    return `${nombre} ${app} ${apm}`.trim() || 'Nombre no especificado';
  }

  // Obtener dirección completa con validaciones
  getDireccionCompleta(cliente: any): string {
    if (!cliente) return 'Sin dirección';
    
    const calle = cliente.calle || '';
    const numero = cliente.numero || '';
    const localidad = cliente.localidad || '';
    const municipio = cliente.municipio || '';
    
    const partes = [calle, numero, localidad, municipio].filter(part => part !== '');
    return partes.length > 0 ? partes.join(', ') : 'Sin dirección';
  }

  // Obtener clase CSS según estado con validaciones
  getEstadoCreditoClass(cliente: any): string {
    if (!cliente) return 'estado-desconocido';
    
    // Aquí puedes implementar la lógica según tu negocio
    // Por ahora uso un estado genérico basado en el ciclo
    const ciclo = cliente.ciclo_actual;
    if (ciclo > 0) {
      return 'estado-activo';
    }
    return 'estado-desconocido';
  }

  getEstadoCreditoText(cliente: any): string {
    if (!cliente) return 'Sin estado';
    
    const ciclo = cliente.ciclo_actual;
    if (ciclo > 0) {
      return 'Activo';
    }
    return 'Sin estado';
  }

  // Método para verificar si un cliente es válido
  esClienteValido(cliente: any): boolean {
    return cliente != null && cliente.id_cliente != null;
  }
  
}