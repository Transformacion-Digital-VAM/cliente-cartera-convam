// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { SolicitudService } from '../../../../services/solicitud.service';
// import { ClienteService } from '../../../../services/client.service';
// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-credit-request',
//   imports: [CommonModule, FormsModule],
//   standalone: true,
//   templateUrl: './credit-request.component.html',
//   styleUrls: ['./credit-request.component.css']
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

//   // Estadísticas
//   totalSolicitudes: number = 0;
//   totalMontoSolicitado: number = 0;

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
//         this.calcularEstadisticas();
//         this.cargando = false;

//         // Debug: verificar estructura de datos
//         if (solicitudes.length > 0) {
//           console.log('Primera solicitud con datos:', solicitudes[0]);
//         }
//       },
//       error: (error) => {
//         console.error('Error al cargar solicitudes:', error);
//         this.mostrarError('No se pudieron cargar las solicitudes', error);
//         this.cargando = false;
//       }
//     });
//   }
//   calcularEstadisticas(): void {
//     this.totalSolicitudes = this.solicitudesPendientes.length;
//     this.totalMontoSolicitado = this.solicitudesPendientes.reduce(
//       (total, solicitud) => total + (Number(solicitud.monto_solicitado) || 0), 0
//     );
//   }

//   esDomiciliada(solicitud: any): boolean {
//     if (!solicitud) return false;
//     // Compatibilizar con distintas posibles propiedades
//     return Boolean(
//       solicitud.estado_domiciliacion ??
//       solicitud.domiciliado ??
//       solicitud.domiciliacion ??
//       solicitud.domiciliada
//     );
//   }


//   getTextoDomiciliacion(solicitud: any): string {
//     return this.esDomiciliada(solicitud) ? 'Domiciliada' : 'No domiciliada';
//   }

//   // Clase CSS para badge según estado
//   getClaseBadgeDomiciliacion(solicitud: any): string {
//     return this.esDomiciliada(solicitud) ? 'badge-success' : 'badge-secondary';
//   }

//   // Información adicional: fecha o quien confirmó (si existe)
//   getDetalleDomiciliacion(solicitud: any): string {
//     const fecha = solicitud.fecha_domiciliada || solicitud.fecha_domiciliacion || solicitud.fecha_domicilio;
//     const quien = solicitud.persona_confirma || solicitud.persona_confirmo || solicitud.confirmado_por;
//     const horario = solicitud.horario_entrega || solicitud.horario_domicilio;
//     const partes = [];
//     if (fecha) partes.push(`Fecha: ${this.formatearFecha(fecha)}`);
//     if (horario) partes.push(`Horario: ${horario}`);
//     if (quien) partes.push(`Confirmó: ${quien}`);
//     return partes.length ? partes.join(' · ') : 'Sin detalles';
//   }

//   // Abrir modal con los detalles de la solicitud
//   abrirModal(solicitud: any): void {
//     this.solicitudSeleccionada = solicitud;
//     this.montoAprobado = solicitud.monto_solicitado;
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
//     if (!this.validarMontoAprobado()) {
//       return;
//     }

//     Swal.fire({
//       title: '¿Confirmar aprobación?',
//       text: `¿Está seguro de aprobar la solicitud por ${this.formatearMoneda(this.montoAprobado!)}?`,
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, aprobar',
//       cancelButtonText: 'Cancelar',
//       confirmButtonColor: '#28a745',
//       cancelButtonColor: '#dc3545'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.procesarAprobacion();
//       }
//     });
//   }

//   // Validar monto aprobado
//   validarMontoAprobado(): boolean {
//     if (!this.montoAprobado || this.montoAprobado <= 0) {
//       this.mostrarAdvertencia('Monto inválido', 'Por favor ingrese un monto válido');
//       return false;
//     }

//     if (this.montoAprobado > this.solicitudSeleccionada.monto_solicitado) {
//       this.mostrarAdvertencia('Monto excedido', 'El monto aprobado no puede ser mayor al monto solicitado');
//       return false;
//     }

//     return true;
//   }

//   // Procesar aprobación
//   procesarAprobacion(): void {
//     this.cargandoAprobacion = true;

//     this.solicitudService.aprobarSolicitud(
//       this.solicitudSeleccionada.id_solicitud, 
//       this.montoAprobado!
//     ).subscribe({
//       next: (response) => {
//         console.log('Solicitud aprobada:', response);

//         // Remover la solicitud aprobada de la lista
//         this.solicitudesPendientes = this.solicitudesPendientes.filter(
//           s => s.id_solicitud !== this.solicitudSeleccionada.id_solicitud
//         );

//         // Recalcular estadísticas
//         this.calcularEstadisticas();

//         this.mostrarExito('¡Aprobado!', 'La solicitud ha sido aprobada exitosamente');
//         this.cerrarModal();
//         this.cargandoAprobacion = false;
//       },
//       error: (error) => {
//         console.error('Error al aprobar solicitud:', error);
//         this.mostrarError('Error al aprobar la solicitud', error);
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
//       confirmButtonColor: '#dc3545',
//       inputValidator: (value) => {
//         if (!value) {
//           return 'Debe ingresar un motivo para rechazar la solicitud';
//         }
//         if (value.length < 10) {
//           return 'El motivo debe tener al menos 10 caracteres';
//         }
//         return null;
//       }
//     });

//     if (!motivo) {
//       return; 
//     }

//     Swal.fire({
//       title: '¿Confirmar rechazo?',
//       text: `¿Está seguro de rechazar la solicitud?`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, rechazar',
//       cancelButtonText: 'Cancelar',
//       confirmButtonColor: '#dc3545',
//       cancelButtonColor: '#6c757d'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.procesarRechazo(motivo);
//       }
//     });
//   }

//   // Procesar rechazo
//   procesarRechazo(motivo: string): void {
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

//         // Recalcular estadísticas
//         this.calcularEstadisticas();

//         this.mostrarAdvertencia('Rechazado', 'La solicitud ha sido rechazada');
//         this.cerrarModal();
//         this.cargandoAprobacion = false;
//       },
//       error: (error) => {
//         console.error('Error al rechazar solicitud:', error);
//         this.mostrarError('Error al rechazar la solicitud', error);
//         this.cargandoAprobacion = false;
//       }
//     });
//   }

//   // ============================================
//   // MÉTODOS DE UTILIDAD
//   // ============================================

//   // Formatear nombre completo del cliente
//   getNombreCompleto(solicitud: any): string {
//     if (!solicitud) return 'N/A';

//     const nombre = solicitud.nombre_cliente || solicitud.nombre || '';
//     const app = solicitud.app_cliente || solicitud.apellido_paterno || '';
//     const apm = solicitud.apm_cliente || solicitud.apellido_materno || '';

//     return `${nombre} ${app} ${apm}`.trim() || 'Cliente sin nombre';
//   }

//   getNombreAval(solicitud: any): string {
//     if (!solicitud.aval_id) {
//       return 'Sin aval';
//     }

//     if (solicitud.nombre_aval && 
//         (solicitud.nombre_aval.includes('no encontrado') || 
//         solicitud.nombre_aval.includes('No encontrado'))) {
//       return `ID: ${solicitud.aval_id}`;
//     }

//     return solicitud.nombre_aval || `ID: ${solicitud.aval_id}`;
//   }

//   // Formatear moneda
//   formatearMoneda(monto: number): string {
//     if (!monto && monto !== 0) return '$0.00';
//     return new Intl.NumberFormat('es-MX', {
//       style: 'currency',
//       currency: 'MXN'
//     }).format(monto);
//   }

//   // Formatear fecha
//   formatearFecha(fecha: string): string {
//     if (!fecha) return 'No especificada';
//     try {
//       return new Date(fecha).toLocaleDateString('es-MX', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
//     } catch (error) {
//       return 'Fecha inválida';
//     }
//   }

//   // ============================================
//   // MÉTODOS DE ALERTAS
//   // ============================================

//   mostrarExito(titulo: string, mensaje: string): void {
//     Swal.fire({
//       icon: 'success',
//       title: titulo,
//       text: mensaje,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#28a745',
//       timer: 3000,
//       timerProgressBar: true
//     });
//   }

//   mostrarError(titulo: string, error: any): void {
//     const mensaje = error.error?.error || error.error?.detalle || error.message || 'Error desconocido';

//     Swal.fire({
//       icon: 'error',
//       title: titulo,
//       html: `<div style="text-align: left;">
//               <p>${mensaje}</p>
//               ${error.status ? `<small>Código: ${error.status}</small>` : ''}
//             </div>`,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#dc3545'
//     });
//   }

//   mostrarAdvertencia(titulo: string, mensaje: string): void {
//     Swal.fire({
//       icon: 'warning',
//       title: titulo,
//       text: mensaje,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#ffc107'
//     });
//   }

//   // Verificar si hay solicitudes
//   get haySolicitudes(): boolean {
//     return this.solicitudesPendientes.length > 0;
//   }
// }



import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../../../services/solicitud.service';
import { ClienteService } from '../../../../services/client.service';
import { CreditoService } from '../../../../services/credito.service';
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

  // Para validación de garantía
  garantiaAnterior: number = 0;
  diferenciaGarantia: number = 0;
  creditoAnterior: any = null;
  mostrarValidacionGarantia: boolean = false;
  cargandoGarantia: boolean = false;

  // Estadísticas
  totalSolicitudes: number = 0;
  totalMontoSolicitado: number = 0;

  constructor(
    private solicitudService: SolicitudService,
    private creditoService: CreditoService
  ) { }

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

        // DEPURACIÓN DETALLADA
        if (solicitudes.length > 0) {
          console.log('=== DATOS DE SOLICITUDES ===');
          solicitudes.forEach((solicitud, index) => {
            console.log(`Solicitud ${index + 1}:`, {
              id: solicitud.id_solicitud,
              cliente: solicitud.cliente_id,
              aliado_id: solicitud.aliado_id,
              aval_id: solicitud.aval_id,
              nombre_aliado: solicitud.nombre_aliado,
              nombre_aval: solicitud.nombre_aval,
              // Ver campos adicionales
              app_aval: solicitud.app_aval,
              apm_aval: solicitud.apm_aval,
              nombre_cliente_aval: solicitud.nombre_cliente_aval
            });
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
        this.mostrarError('No se pudieron cargar las solicitudes', error);
        this.cargando = false;
      }
    });
  }

  calcularEstadisticas(): void {
    this.totalSolicitudes = this.solicitudesPendientes.length;
    this.totalMontoSolicitado = this.solicitudesPendientes.reduce(
      (total, solicitud) => total + (Number(solicitud.monto_solicitado) || 0), 0
    );
  }

  esDomiciliada(solicitud: any): boolean {
    if (!solicitud) return false;
    // Compatibilizar con distintas posibles propiedades
    return Boolean(
      solicitud.estado_domiciliacion ??
      solicitud.domiciliado ??
      solicitud.domiciliacion ??
      solicitud.domiciliada
    );
  }

  getTextoDomiciliacion(solicitud: any): string {
    return this.esDomiciliada(solicitud) ? 'Domiciliada' : 'No domiciliada';
  }

  // Clase CSS para badge según estado
  getClaseBadgeDomiciliacion(solicitud: any): string {
    return this.esDomiciliada(solicitud) ? 'badge-success' : 'badge-secondary';
  }

  // Información adicional: fecha o quien confirmó (si existe)
  getDetalleDomiciliacion(solicitud: any): string {
    const fecha = solicitud.fecha_domiciliada || solicitud.fecha_domiciliacion || solicitud.fecha_domicilio;
    const quien = solicitud.persona_confirma || solicitud.persona_confirmo || solicitud.confirmado_por;
    const horario = solicitud.horario_entrega || solicitud.horario_domicilio;
    const partes = [];
    if (fecha) partes.push(`Fecha: ${this.formatearFecha(fecha)}`);
    if (horario) partes.push(`Horario: ${horario}`);
    if (quien) partes.push(`Confirmó: ${quien}`);
    return partes.length ? partes.join(' · ') : 'Sin detalles';
  }

  // Abrir modal con los detalles de la solicitud
  async abrirModal(solicitud: any): Promise<void> {
    this.solicitudSeleccionada = solicitud;
    this.montoAprobado = solicitud.monto_solicitado;
    this.modalAbierto = true;

    // Resetear variables de garantía
    this.garantiaAnterior = 0;
    this.diferenciaGarantia = 0;
    this.creditoAnterior = null;
    this.mostrarValidacionGarantia = false;
    this.cargandoGarantia = true;

    // Obtener la garantía anterior del cliente
    try {
      await this.validarGarantia(solicitud.cliente_id, solicitud.monto_solicitado);
    } catch (error) {
      console.error('Error al validar garantía:', error);
    } finally {
      this.cargandoGarantia = false;
    }
  }

  // Cerrar modal
  cerrarModal(): void {
    this.modalAbierto = false;
    this.solicitudSeleccionada = null;
    this.montoAprobado = null;
    this.cargandoAprobacion = false;
    this.garantiaAnterior = 0;
    this.diferenciaGarantia = 0;
    this.creditoAnterior = null;
    this.mostrarValidacionGarantia = false;
  }

  async validarGarantia(clienteId: number, montoSolicitado: number): Promise<void> {
    console.log('=== VALIDANDO GARANTÍA PARA APROBACIÓN ===');
    console.log('Cliente ID:', clienteId);
    console.log('Monto solicitado:', montoSolicitado);

    this.cargandoGarantia = true;

    try {
      // Obtener créditos del cliente desde el servicio
      const creditos = await this.creditoService.obtenerCreditosPorCliente(clienteId).toPromise();

      console.log('Créditos obtenidos del cliente:', creditos);

      if (creditos && creditos.length > 0) {
        // DEBUG: Mostrar todos los estados encontrados
        const estados = creditos.map(c => c.estado_credito || 'SIN_ESTADO');
        console.log('Estados de créditos encontrados:', estados);

        // MODIFICACIÓN: NO filtrar por estado, tomar todos los créditos del cliente
        // Solo ordenarlos por fecha para tomar el más reciente
        const todosLosCreditos = [...creditos];

        // Ordenar por fecha de ministración (la más reciente primero)
        todosLosCreditos.sort((a, b) => {
          const fechaA = a.fecha_ministracion || a.fecha_primer_pago || a.created_at || '2000-01-01';
          const fechaB = b.fecha_ministracion || b.fecha_primer_pago || b.created_at || '2000-01-01';
          return new Date(fechaB).getTime() - new Date(fechaA).getTime();
        });

        // Tomar el crédito más reciente (independientemente del estado)
        this.creditoAnterior = todosLosCreditos[0];
        console.log('Crédito anterior más reciente (sin filtrar por estado):', this.creditoAnterior);

        // Obtener la garantía anterior de la tabla de crédito (total_garantia)
        this.garantiaAnterior = Number(this.creditoAnterior.total_garantia) || 0;

        // Si el estado es "PENDIENTE", mostrar mensaje especial
        const estadoActual = (this.creditoAnterior.estado_credito || '').toString().toUpperCase();
        console.log('Estado del crédito más reciente:', estadoActual);

        // Calcular la nueva garantía (10% del monto solicitado)
        const nuevaGarantia = montoSolicitado * 0.10;

        // Calcular la diferencia entre la nueva garantía y la garantía anterior
        this.diferenciaGarantia = nuevaGarantia - this.garantiaAnterior;

        // Mostrar validación incluso si el estado es PENDIENTE
        this.mostrarValidacionGarantia = true;

        console.log('Validación de garantía completada:', {
          garantiaAnterior: this.garantiaAnterior,
          nuevaGarantia: nuevaGarantia,
          montoSolicitado: montoSolicitado,
          porcentajeGarantia: '10%',
          diferencia: this.diferenciaGarantia,
          estadoCredito: estadoActual,
          mensaje: this.diferenciaGarantia === 0 ? 'No tiene que dar nada (montos iguales)' :
            this.diferenciaGarantia > 0 ? 'Requiere garantía adicional' :
              'Garantía excedente'
        });
      } else {
        console.log('Cliente no tiene créditos anteriores (array vacío o nulo)');
        this.mostrarValidacionGarantia = false;
      }
    } catch (error: any) {
      console.error('Error al validar garantía:', error);

      // MANEJO ESPECÍFICO PARA ERROR 404
      if (error.status === 404) {
        console.log('Endpoint devolvió 404 - Cliente no tiene créditos registrados en el sistema');
        console.log('Interpretando como: cliente sin historial de créditos anteriores');

        // No mostrar la comparación de garantías, solo mostrar garantía normal
        this.mostrarValidacionGarantia = false;

        // NO mostrar error al usuario, ya que es un caso normal (cliente nuevo)
        // Solo log para debugging
        console.info('Mostrando garantía normal (10%) sin comparación con créditos anteriores');
      } else {
        // Para otros errores (500, network error, etc.)
        console.error('Error inesperado al obtener créditos del cliente:', error);
        this.mostrarValidacionGarantia = false;

        // Opcional: mostrar mensaje de error al usuario
        // this.mostrarAdvertencia('Error', 'No se pudo verificar el historial de créditos');
      }
    } finally {
      this.cargandoGarantia = false;
    }
  }

  // Método que se llama cuando cambia el monto aprobado
  onMontoAprobadoChange(): void {
    if (this.montoAprobado && this.solicitudSeleccionada) {
      // Solo calcular diferencia si hay historial
      if (this.mostrarValidacionGarantia) {
        const nuevaGarantia = this.getNuevaGarantia();
        this.diferenciaGarantia = nuevaGarantia - this.garantiaAnterior;
      }
    }
  }

  // Obtener información del crédito anterior
  getInfoCreditoAnterior(): string {
    if (!this.creditoAnterior || !this.mostrarValidacionGarantia) {
      return 'No hay crédito anterior registrado';
    }

    const montoAprobado =
      this.creditoAnterior.monto_aprobado ||
      this.creditoAnterior.total_capital ||
      this.creditoAnterior.monto_solicitado ||
      0;

    const fecha =
      this.creditoAnterior.fecha_ministracion ||
      this.creditoAnterior.fecha_primer_pago ||
      this.creditoAnterior.fecha_creacion ||
      this.creditoAnterior.created_at ||
      'Fecha no disponible';

    return `Crédito anterior: ${this.formatearMoneda(montoAprobado)} - Garantía: ${this.formatearMoneda(this.garantiaAnterior)} (${this.formatearFecha(fecha)})`;
  }

  // Obtener texto de diferencia de garantía
  getDiferenciaGarantiaTexto(): string {
    if (!this.mostrarValidacionGarantia || this.garantiaAnterior === 0) {
      return 'Sin crédito anterior para comparar';
    }

    const nuevaGarantia = this.getNuevaGarantia();
    const diferenciaAbsoluta = Math.abs(this.diferenciaGarantia);

    if (this.diferenciaGarantia > 0) {
      return `${this.formatearMoneda(diferenciaAbsoluta)} `;
    } else if (this.diferenciaGarantia < 0) {
      return `${this.formatearMoneda(diferenciaAbsoluta)}`;
    } else {
      return 'Montos iguales';
    }
  }

  // Obtener clase CSS según estado de garantía
  getEstadoGarantiaClass(): string {
    if (!this.mostrarValidacionGarantia) {
      return '';
    }

    if (this.diferenciaGarantia > 0) {
      return 'text-success';
    } else if (this.diferenciaGarantia < 0) {
      return 'text-success';
    } else {
      return 'text-warning';
    }
  }

  aprobarSolicitud(): void {
    if (!this.validarMontoAprobado()) {
      return;
    }


    // Verificar si la solicitud NO está domiciliada
    if (!this.esDomiciliada(this.solicitudSeleccionada)) {
      this.mostrarAdvertenciaNoDomiciliada();
      return;
    }

    // Si está domiciliada, proceder con la confirmación normal
    this.confirmarAprobacion();
  }


  // Nuevo método: Mostrar advertencia cuando no está domiciliada
  mostrarAdvertenciaNoDomiciliada(): void {
    Swal.fire({
      title: '¡Atención! Solicitud no domiciliada',
      html: `
      <div style="text-align: center;">
        <p class="text-muted mt-2">¿Desea continuar con la aprobación de todas formas?</p>
      </div>
    `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar de todas formas',
      cancelButtonText: 'Revisar domiciliación',
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#dc3545',
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Si el usuario confirma, proceder con la aprobación normal
        this.confirmarAprobacion();
      } else {
        // Si cancela, mantener el modal abierto
        console.log('El usuario decidió revisar la domiciliación');
      }
    });
  }

  // Nuevo método: Confirmar aprobación (método separado para reutilizar)
  confirmarAprobacion(): void {
    Swal.fire({
      title: '¿Confirmar aprobación?',
      html: `
      <div style="text-align: left;">
        <p>¿Está seguro de aprobar la solicitud por <strong>${this.formatearMoneda(this.montoAprobado!)}</strong>?</p>
        ${!this.esDomiciliada(this.solicitudSeleccionada) ?
          '<p class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i> <strong>Advertencia:</strong> Esta solicitud no está domiciliada.</p>' :
          ''}
      </div>
    `,
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

  // Modifica el método mostrarAdvertenciaReduccionGarantia para que use confirmarAprobacion
  mostrarAdvertenciaReduccionGarantia(): void {
    Swal.fire({
      title: '¡Atención! Reducción de Garantía',
      html: `
      <div style="text-align: left;">
        <p>Está a punto de aprobar un monto <strong>MENOR</strong> que la garantía anterior.</p>
        <p><strong>Garantía anterior:</strong> ${this.formatearMoneda(this.garantiaAnterior)}</p>
        <p><strong>Monto a aprobar:</strong> ${this.formatearMoneda(this.montoAprobado!)}</p>
        <p><strong>Diferencia:</strong> <span class="text-danger">${this.formatearMoneda(this.diferenciaGarantia)}</span></p>
        <p class="text-muted mt-2">¿Está seguro de continuar con la aprobación?</p>
      </div>
    `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar de todas formas',
      cancelButtonText: 'Revisar monto',
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        // Después de confirmar la reducción, verificar domiciliación
        if (!this.esDomiciliada(this.solicitudSeleccionada)) {
          this.mostrarAdvertenciaNoDomiciliada();
        } else {
          this.confirmarAprobacion();
        }
      }
    });
  }

  getNuevaGarantia(): number {
    return (this.montoAprobado || this.solicitudSeleccionada?.monto_solicitado || 0) * 0.10;
  }

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


  // getNombreAval(solicitud: any): string {
  //   console.log('Datos del aval para depuración:', {
  //     aval_id: solicitud.aval_id,
  //     nombre_aval: solicitud.nombre_aval,
  //     nombre_cliente_aval: solicitud.nombre_cliente_aval,
  //     nombre: solicitud.nombre_aval_simple,
  //     app: solicitud.app_aval,
  //     apm: solicitud.apm_aval
  //   });

  //   if (!solicitud.aval_id || solicitud.aval_id === 0) {
  //     return 'Sin aval';
  //   }

  //   // Intenta diferentes formas de obtener el nombre
  //   if (solicitud.nombre_cliente_aval) {
  //     return solicitud.nombre_cliente_aval;
  //   }

  //   if (solicitud.nombre_aval) {
  //     // Verifica si es un mensaje de error
  //     if (typeof solicitud.nombre_aval === 'string' &&
  //       (solicitud.nombre_aval.includes('no encontrado') ||
  //         solicitud.nombre_aval.includes('No encontrado'))) {
  //       return `ID: ${solicitud.aval_id}`;
  //     }
  //     return solicitud.nombre_aval;
  //   }

  //   // Construye el nombre desde partes
  //   const nombre = solicitud.nombre_aval_simple || solicitud.nombre_aval_parte || '';
  //   const app = solicitud.app_aval || '';
  //   const apm = solicitud.apm_aval || '';

  //   const nombreCompleto = `${nombre} ${app} ${apm}`.trim();

  //   return nombreCompleto || `ID: ${solicitud.aval_id}`;
  // }
  // REEMPLAZA el método getNombreAval en tu componente

getNombreAval(solicitud: any): string {
  console.log('=== getNombreAval ===');
  console.log('Solicitud completa:', {
    id: solicitud.id_solicitud,
    aval_id: solicitud.aval_id,
    nombre_aval: solicitud.nombre_aval,
    nombre_cliente_aval: solicitud.nombre_cliente_aval,
    app_aval: solicitud.app_aval,
    apm_aval: solicitud.apm_aval
  });

  // Caso 1: No hay aval asignado
  if (!solicitud.aval_id || solicitud.aval_id === 0) {
    console.log('→ Sin aval (ID no válido)');
    return 'Sin aval';
  }

  // Caso 2: Nombre completo del cliente aval
  if (solicitud.nombre_cliente_aval) {
    console.log('→ Usando nombre_cliente_aval:', solicitud.nombre_cliente_aval);
    return solicitud.nombre_cliente_aval;
  }

  // Caso 3: nombre_aval válido (no es mensaje de error)
  if (solicitud.nombre_aval && 
      typeof solicitud.nombre_aval === 'string') {
    
    // Verificar que NO sea un mensaje de error
    const esError = solicitud.nombre_aval.toLowerCase().includes('no encontrado');
    
    if (!esError) {
      console.log('→ Usando nombre_aval:', solicitud.nombre_aval);
      return solicitud.nombre_aval;
    }
  }

  // Caso 4: Construir desde partes (nombre, app_aval, apm_aval)
  const partes: string[] = [];
  
  if (solicitud.nombre_aval && 
      !solicitud.nombre_aval.toLowerCase().includes('no encontrado')) {
    partes.push(solicitud.nombre_aval);
  }
  
  if (solicitud.app_aval) {
    partes.push(solicitud.app_aval);
  }
  
  if (solicitud.apm_aval) {
    partes.push(solicitud.apm_aval);
  }

  const nombreConstruido = partes.join(' ').trim();
  
  if (nombreConstruido) {
    console.log('→ Nombre construido desde partes:', nombreConstruido);
    return nombreConstruido;
  }

  // Caso 5: Solo mostrar el ID como último recurso
  console.log('→ Mostrando solo ID (no se encontró nombre)');
  return `Aval ID: ${solicitud.aval_id}`;
}


  getNombreAliado(solicitud: any): string {
    if (!solicitud.aliado_id) {
      return 'Sin aliado';
    }

    if (solicitud.nombre_aliado) {
      return solicitud.nombre_aliado;
    }

    return `ID: ${solicitud.aliado_id}`;
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