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

  // Tabs
  activeTab: 'PENDIENTES' | 'APROBADO' = 'PENDIENTES';

  // Estados de carga
  cargando: boolean = false;
  cargandoAprobadas: boolean = false;
  cargandoAprobacion: boolean = false;

  // Lista de solicitudes aprobadas
  solicitudesAprobadas: any[] = [];
  // Estadísticas
  totalSolicitudes: number = 0;
  totalMontoSolicitado: number = 0;
  filaExpandida: number | null = null;

  // Garantías
  montoAnterior: number = 0;
  garantiaAnterior: number = 0;
  garantiaSolicitada: number = 0;
  cargandoGarantia: boolean = false;

  get nuevaGarantia(): number {
    return (this.montoAprobado || 0) * 0.10;
  }

  get diferenciaGarantia(): number {
    return this.nuevaGarantia - this.garantiaAnterior;
  }

  get alertClassGarantia(): string {
    if (this.diferenciaGarantia > 0.01) return 'primary';
    if (this.diferenciaGarantia < -0.01) return 'success';
    return 'neutral';
  }

  constructor(
    private solicitudService: SolicitudService,
    private creditoService: CreditoService
  ) { }

  toggleFila(id: number): void {
    if (this.filaExpandida === id) {
      this.filaExpandida = null; // Cerrar si ya está abierta
    } else {
      this.filaExpandida = id; // Abrir la seleccionada
    }
  }

  ngOnInit(): void {
    this.cargarSolicitudesPendientes();
  }

  setTab(tab: 'PENDIENTES' | 'APROBADO'): void {
    this.activeTab = tab;
    if (tab === 'PENDIENTES' && this.solicitudesPendientes.length === 0) {
      this.cargarSolicitudesPendientes();
    } else if (tab === 'APROBADO' && this.solicitudesAprobadas.length === 0) {
      this.cargarSolicitudesAprobadas();
    }
    this.calcularEstadisticas();
  }

  // Cargar solicitudes con estado PENDIENTE
  cargarSolicitudesPendientes(): void {
    this.cargando = true;

    this.solicitudService.obtenerSolicitudesPorEstado('PENDIENTE').subscribe({
      next: (solicitudes) => {
        this.solicitudesPendientes = solicitudes.sort((a, b) => {
          const dateA = new Date(a.fecha_creacion || 0).getTime();
          const dateB = new Date(b.fecha_creacion || 0).getTime();
          return dateB - dateA;
        });
        if (this.activeTab === 'PENDIENTES') this.calcularEstadisticas();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
        this.mostrarError('No se pudieron cargar las solicitudes', error);
        this.cargando = false;
      }
    });
  }

  // Cargar solicitudes con estado APROBADO
  cargarSolicitudesAprobadas(): void {
    this.cargandoAprobadas = true;

    this.solicitudService.obtenerSolicitudesPorEstado('APROBADO').subscribe({
      next: (solicitudes) => {
        this.solicitudesAprobadas = solicitudes.sort((a, b) => {
          const dateA = new Date(a.fecha_aprobacion || a.fecha_creacion || 0).getTime();
          const dateB = new Date(b.fecha_aprobacion || b.fecha_creacion || 0).getTime();
          return dateB - dateA;
        });
        if (this.activeTab === 'APROBADO') this.calcularEstadisticas();
        this.cargandoAprobadas = false;
      },
      error: (error) => {
        console.error('Error al cargar solicitudes aprobadas:', error);
        this.mostrarError('No se pudieron cargar las solicitudes aprobadas', error);
        this.cargandoAprobadas = false;
      }
    });
  }

  calcularEstadisticas(): void {
    const listaActual = this.activeTab === 'PENDIENTES' ? this.solicitudesPendientes : this.solicitudesAprobadas;
    this.totalSolicitudes = listaActual.length;
    this.totalMontoSolicitado = listaActual.reduce(
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
      solicitud.domiciliada ??
      solicitud.es_domiciliada ??
      solicitud.fecha_domiciliada ??
      solicitud.fecha_domiciliacion ??
      solicitud.fecha_domicilio
    );
  }


  getTextoDomiciliacion(solicitud: any): string {
    if (this.esDomiciliada(solicitud)) return 'Domiciliada';
    return (this.activeTab === 'APROBADO') ? 'Pendiente Visita' : 'No domiciliada';
  }

  // Clase CSS para badge según estado
  getClaseBadgeDomiciliacion(solicitud: any): string {
    if (this.esDomiciliada(solicitud)) return 'badge-success';
    return (this.activeTab === 'APROBADO') ? 'badge-danger' : 'badge-warning';
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
  abrirModal(solicitud: any): void {
    this.solicitudSeleccionada = solicitud;
    this.montoAprobado = solicitud.monto_solicitado;
    this.modalAbierto = true;

    // Garantía sobre lo solicitado (estática)
    this.garantiaSolicitada = (solicitud.monto_solicitado || 0) * 0.10;

    // Resetear garantías fijas
    this.montoAnterior = 0;
    this.garantiaAnterior = 0;

    this.calcularGarantias(solicitud);
  }

  calcularGarantias(solicitud: any): void {
    const esRenovacion = solicitud.tipo_credito === 'RENOVACIÓN' || solicitud.tipo_credito === 'RE-INGRESO';

    if (esRenovacion && solicitud.cliente_id) {
      this.cargandoGarantia = true;
      this.creditoService.obtenerCreditosPorCliente(solicitud.cliente_id).subscribe({
        next: (creditos) => {
          if (creditos && creditos.length > 0) {
            // Obtener el crédito más reciente por ID
            const ultimoCredito = [...creditos].sort((a, b) =>
              (b.id_credito || 0) - (a.id_credito || 0)
            )[0];

            this.montoAnterior = parseFloat(ultimoCredito.monto_aprobado || ultimoCredito.monto || 0);
            this.garantiaAnterior = parseFloat(ultimoCredito.total_garantia || 0);
          }
          this.cargandoGarantia = false;
        },
        error: (err) => {
          console.error('Error al obtener crédito anterior:', err);
          this.cargandoGarantia = false;
        }
      });
    }
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
    // console.log('=== getNombreAval ===');
    // console.log('Solicitud completa:', {
    //   id: solicitud.id_solicitud,
    //   aval_id: solicitud.aval_id,
    //   nombre_aval: solicitud.nombre_aval,
    //   nombre_cliente_aval: solicitud.nombre_cliente_aval,
    //   app_aval: solicitud.app_aval,
    //   apm_aval: solicitud.apm_aval
    // });

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
        // console.log('→ Usando nombre_aval:', solicitud.nombre_aval);
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

