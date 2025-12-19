// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { SolicitudService } from '../../../../services/solicitud.service';
// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-credit-request',
//   imports: [CommonModule, FormsModule],
//   standalone: true,
//   templateUrl: './credit-request.component.html',
//   styleUrl: './credit-request.component.css'
// })
// export class CreditRequestComponent implements OnInit {
//   // Lista de solicitudes pendientes
//   solicitudesPendientes: any[] = [];
//   // Solicitud seleccionada para el modal
//   solicitudSeleccionada: any = null;
//   // Monto para aprobación
//   montoAprobado: number | null = null;
//   // Control de modal
//   modalAbierto: boolean = false;
//   // Estados de carga
//   cargando: boolean = false;
//   cargandoAprobacion: boolean = false;

//   constructor(private solicitudService: SolicitudService) {}

//   ngOnInit(): void {
//     this.cargarSolicitudesPendientes();
//   }

//   // Cargar solicitudes con estado PENDIENTE
//   cargarSolicitudesPendientes(): void {
//     this.cargando = true;
//     this.solicitudService.obtenerSolicitudesPorEstado('PENDIENTE').subscribe({
//       next: (solicitudes) => {
//         this.solicitudesPendientes = solicitudes;
//         this.cargando = false;
//       },
//       error: (error) => {
//         console.error('Error al cargar solicitudes:', error);
//         Swal.fire({
//           icon: 'error',
//           title: 'Error',
//           text: 'No se pudieron cargar las solicitudes',
//           confirmButtonText: 'Aceptar'
//         });
//         this.cargando = false;
//       }
//     });
//   }

//   // Abrir modal con los detalles de la solicitud
//   abrirModal(solicitud: any): void {
//     this.solicitudSeleccionada = solicitud;
//     this.montoAprobado = null;
//     this.modalAbierto = true;
//   }

//   // Cerrar modal
//   cerrarModal(): void {
//     this.modalAbierto = false;
//     this.solicitudSeleccionada = null;
//     this.montoAprobado = null;
//     this.cargandoAprobacion = false;
//   }

//   // Aprobar solicitud
//   aprobarSolicitud(): void {
//     if (!this.montoAprobado || this.montoAprobado <= 0) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Monto inválido',
//         text: 'Por favor ingrese un monto válido',
//         confirmButtonText: 'Aceptar'
//       });
//       return;
//     }

//     if (this.montoAprobado > this.solicitudSeleccionada.monto_solicitado) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Monto excedido',
//         text: 'El monto aprobado no puede ser mayor al monto solicitado',
//         confirmButtonText: 'Aceptar'
//       });
//       return;
//     }

//     this.cargandoAprobacion = true;
    
//     this.solicitudService.aprobarSolicitud(
//       this.solicitudSeleccionada.id_solicitud, 
//       this.montoAprobado
//     ).subscribe({
//       next: (response) => {
//         console.log('Solicitud aprobada:', response);
        
//         // Remover la solicitud aprobada de la lista
//         this.solicitudesPendientes = this.solicitudesPendientes.filter(
//           s => s.id_solicitud !== this.solicitudSeleccionada.id_solicitud
//         );
        
//         Swal.fire({
//           icon: 'success',
//           title: '¡Aprobado!',
//           text: 'La solicitud ha sido aprobada exitosamente',
//           confirmButtonText: 'Aceptar',
//           timer: 3000,
//           timerProgressBar: true
//         });
        
//         this.cerrarModal();
//         this.cargandoAprobacion = false;
//       },
//       error: (error) => {
//         console.error('Error al aprobar solicitud:', error);
//         Swal.fire({
//           icon: 'error',
//           title: 'Error',
//           text: `Error al aprobar la solicitud: ${error.error?.error || error.message}`,
//           confirmButtonText: 'Aceptar'
//         });
//         this.cargandoAprobacion = false;
//       }
//     });
//   }

//   // Rechazar solicitud
//   async rechazarSolicitud(): Promise<void> {
//     const { value: motivo } = await Swal.fire({
//       title: 'Motivo de rechazo',
//       input: 'text',
//       inputLabel: 'Ingrese el motivo del rechazo:',
//       inputPlaceholder: 'Escriba el motivo aquí...',
//       showCancelButton: true,
//       cancelButtonText: 'Cancelar',
//       confirmButtonText: 'Rechazar',
//       inputValidator: (value) => {
//         if (!value) {
//           return 'Debe ingresar un motivo para rechazar la solicitud';
//         }
//         return null;
//       }
//     });

//     if (!motivo) {
//       return; 
//     }

//     this.cargandoAprobacion = true;

//     this.solicitudService.rechazarSolicitud(
//       this.solicitudSeleccionada.id_solicitud,
//       motivo
//     ).subscribe({
//       next: (response) => {
//         console.log('Solicitud rechazada:', response);
        
//         // Remover la solicitud rechazada de la lista
//         this.solicitudesPendientes = this.solicitudesPendientes.filter(
//           s => s.id_solicitud !== this.solicitudSeleccionada.id_solicitud
//         );
        
//         Swal.fire({
//           icon: 'info',
//           title: 'Rechazado',
//           text: 'La solicitud ha sido rechazada',
//           confirmButtonText: 'Aceptar',
//           timer: 3000,
//           timerProgressBar: true
//         });
        
//         this.cerrarModal();
//         this.cargandoAprobacion = false;
//       },
//       error: (error) => {
//         console.error('Error al rechazar solicitud:', error);
//         Swal.fire({
//           icon: 'error',
//           title: 'Error',
//           text: `Error al rechazar la solicitud: ${error.error?.error || error.message}`,
//           confirmButtonText: 'Aceptar'
//         });
//         this.cargandoAprobacion = false;
//       }
//     });
//   }

//   // Formatear nombre completo del cliente
//   getNombreCompleto(solicitud: any): string {
//     return `${solicitud.nombre_cliente} ${solicitud.app_cliente} ${solicitud.apm_cliente}`.trim();
//   }

//   // Formatear moneda
//   formatearMoneda(monto: number): string {
//     return new Intl.NumberFormat('es-MX', {
//       style: 'currency',
//       currency: 'MXN'
//     }).format(monto);
//   }
// }



import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../../../services/solicitud.service';
import { ClienteService } from '../../../../services/client.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-credit-request',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './credit-request.component.html',
  styleUrls: ['./credit-request.component.css']
})
export class CreditRequestComponent implements OnInit {
  // Lista de solicitudes pendientes
  solicitudesPendientes: any[] = [];
  
  // Solicitud seleccionada para el modal
  solicitudSeleccionada: any = null;
  
  // Monto para aprobación
  montoAprobado: number | null = null;
  
  // Control de modal
  modalAbierto: boolean = false;
  
  // Estados de carga
  cargando: boolean = false;
  cargandoAprobacion: boolean = false;
  
  // Estadísticas
  totalSolicitudes: number = 0;
  totalMontoSolicitado: number = 0;

  constructor(private solicitudService: SolicitudService) {}

  ngOnInit(): void {
    this.cargarSolicitudesPendientes();
  }

  // Cargar solicitudes con estado PENDIENTE
  cargarSolicitudesPendientes(): void {
    this.cargando = true;
    
    this.solicitudService.obtenerSolicitudesPorEstado('PENDIENTE').subscribe({
      next: (solicitudes) => {
        this.solicitudesPendientes = solicitudes;
        this.calcularEstadisticas();
        this.cargando = false;
        
        // Debug: verificar estructura de datos
        if (solicitudes.length > 0) {
          console.log('Primera solicitud con datos:', solicitudes[0]);
        }
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
        this.mostrarError('No se pudieron cargar las solicitudes', error);
        this.cargando = false;
      }
    });
  }
//   cargarSolicitudesPendientes(): void {
//   this.cargando = true;
  
//   this.solicitudService.obtenerSolicitudesPorEstado('PENDIENTE').subscribe({
//     next: (solicitudes) => {
//       this.solicitudesPendientes = solicitudes;
//       this.calcularEstadisticas();
//       this.cargando = false;
      
//       // Debug: verificar estructura completa de datos
//       if (solicitudes.length > 0) {
//         console.log('Primera solicitud completa:', solicitudes[0]);
//         console.log('Todas las claves:', Object.keys(solicitudes[0]));
        
//         // Verificar específicamente campos relacionados con aval y aliado
//         console.log('¿Tiene aval_id?', solicitudes[0].aval_id);
//         console.log('¿Tiene nombre_aval?', solicitudes[0].nombre_aval);
//         console.log('¿Tiene aliado_id?', solicitudes[0].aliado_id);
//         console.log('¿Tiene nombre_aliado?', solicitudes[0].nombre_aliado);
//       }
//     },
//     error: (error) => {
//       console.error('Error al cargar solicitudes:', error);
//       this.mostrarError('No se pudieron cargar las solicitudes', error);
//       this.cargando = false;
//     }
//   });
// }

  // Calcular estadísticas
  calcularEstadisticas(): void {
    this.totalSolicitudes = this.solicitudesPendientes.length;
    this.totalMontoSolicitado = this.solicitudesPendientes.reduce(
      (total, solicitud) => total + (Number(solicitud.monto_solicitado) || 0), 0
    );
  }

  // Abrir modal con los detalles de la solicitud
  abrirModal(solicitud: any): void {
    this.solicitudSeleccionada = solicitud;
    this.montoAprobado = solicitud.monto_solicitado; // Sugerir el monto solicitado
    this.modalAbierto = true;
  }

  // Cerrar modal
  cerrarModal(): void {
    this.modalAbierto = false;
    this.solicitudSeleccionada = null;
    this.montoAprobado = null;
    this.cargandoAprobacion = false;
  }

  // Aprobar solicitud
  aprobarSolicitud(): void {
    if (!this.validarMontoAprobado()) {
      return;
    }

    Swal.fire({
      title: '¿Confirmar aprobación?',
      text: `¿Está seguro de aprobar la solicitud por ${this.formatearMoneda(this.montoAprobado!)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarAprobacion();
      }
    });
  }

  // Validar monto aprobado
  validarMontoAprobado(): boolean {
    if (!this.montoAprobado || this.montoAprobado <= 0) {
      this.mostrarAdvertencia('Monto inválido', 'Por favor ingrese un monto válido');
      return false;
    }

    if (this.montoAprobado > this.solicitudSeleccionada.monto_solicitado) {
      this.mostrarAdvertencia('Monto excedido', 'El monto aprobado no puede ser mayor al monto solicitado');
      return false;
    }

    return true;
  }

  // Procesar aprobación
  procesarAprobacion(): void {
    this.cargandoAprobacion = true;
    
    this.solicitudService.aprobarSolicitud(
      this.solicitudSeleccionada.id_solicitud, 
      this.montoAprobado!
    ).subscribe({
      next: (response) => {
        console.log('Solicitud aprobada:', response);
        
        // Remover la solicitud aprobada de la lista
        this.solicitudesPendientes = this.solicitudesPendientes.filter(
          s => s.id_solicitud !== this.solicitudSeleccionada.id_solicitud
        );
        
        // Recalcular estadísticas
        this.calcularEstadisticas();
        
        this.mostrarExito('¡Aprobado!', 'La solicitud ha sido aprobada exitosamente');
        this.cerrarModal();
        this.cargandoAprobacion = false;
      },
      error: (error) => {
        console.error('Error al aprobar solicitud:', error);
        this.mostrarError('Error al aprobar la solicitud', error);
        this.cargandoAprobacion = false;
      }
    });
  }

  // Rechazar solicitud
  async rechazarSolicitud(): Promise<void> {
    const { value: motivo } = await Swal.fire({
      title: 'Motivo de rechazo',
      input: 'text',
      inputLabel: 'Ingrese el motivo del rechazo:',
      inputPlaceholder: 'Escriba el motivo aquí...',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Rechazar',
      confirmButtonColor: '#dc3545',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un motivo para rechazar la solicitud';
        }
        if (value.length < 10) {
          return 'El motivo debe tener al menos 10 caracteres';
        }
        return null;
      }
    });

    if (!motivo) {
      return; 
    }

    Swal.fire({
      title: '¿Confirmar rechazo?',
      text: `¿Está seguro de rechazar la solicitud?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarRechazo(motivo);
      }
    });
  }

  // Procesar rechazo
  procesarRechazo(motivo: string): void {
    this.cargandoAprobacion = true;

    this.solicitudService.rechazarSolicitud(
      this.solicitudSeleccionada.id_solicitud,
      motivo
    ).subscribe({
      next: (response) => {
        console.log('Solicitud rechazada:', response);
        
        // Remover la solicitud rechazada de la lista
        this.solicitudesPendientes = this.solicitudesPendientes.filter(
          s => s.id_solicitud !== this.solicitudSeleccionada.id_solicitud
        );
        
        // Recalcular estadísticas
        this.calcularEstadisticas();
        
        this.mostrarAdvertencia('Rechazado', 'La solicitud ha sido rechazada');
        this.cerrarModal();
        this.cargandoAprobacion = false;
      },
      error: (error) => {
        console.error('Error al rechazar solicitud:', error);
        this.mostrarError('Error al rechazar la solicitud', error);
        this.cargandoAprobacion = false;
      }
    });
  }

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================

  // Formatear nombre completo del cliente
  getNombreCompleto(solicitud: any): string {
    if (!solicitud) return 'N/A';
    
    const nombre = solicitud.nombre_cliente || solicitud.nombre || '';
    const app = solicitud.app_cliente || solicitud.apellido_paterno || '';
    const apm = solicitud.apm_cliente || solicitud.apellido_materno || '';
    
    return `${nombre} ${app} ${apm}`.trim() || 'Cliente sin nombre';
  }

  getNombreAval(solicitud: any): string {
    if (!solicitud.aval_id) {
      return 'Sin aval';
    }
    
    if (solicitud.nombre_aval && 
        (solicitud.nombre_aval.includes('no encontrado') || 
        solicitud.nombre_aval.includes('No encontrado'))) {
      return `ID: ${solicitud.aval_id}`;
    }
    
    return solicitud.nombre_aval || `ID: ${solicitud.aval_id}`;
  }

  // Formatear moneda
  formatearMoneda(monto: number): string {
    if (!monto && monto !== 0) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  // ============================================
  // MÉTODOS DE ALERTAS
  // ============================================

  mostrarExito(titulo: string, mensaje: string): void {
    Swal.fire({
      icon: 'success',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true
    });
  }

  mostrarError(titulo: string, error: any): void {
    const mensaje = error.error?.error || error.error?.detalle || error.message || 'Error desconocido';
    
    Swal.fire({
      icon: 'error',
      title: titulo,
      html: `<div style="text-align: left;">
              <p>${mensaje}</p>
              ${error.status ? `<small>Código: ${error.status}</small>` : ''}
            </div>`,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#dc3545'
    });
  }

  mostrarAdvertencia(titulo: string, mensaje: string): void {
    Swal.fire({
      icon: 'warning',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#ffc107'
    });
  }

  // Verificar si hay solicitudes
  get haySolicitudes(): boolean {
    return this.solicitudesPendientes.length > 0;
  }
}