import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Solicitud {
  id_solicitud: number;
  cliente_id: number;
  usuario_id: number;
  fecha_creacion: string;
  monto_solicitado: number;
  tasa_interes: number;
  tasa_moratoria: number;
  plazo_meses: number;
  no_pages: number;
  tipo_vencimiento: string;
  seguro: boolean;
  estado: string;
  observaciones: string;
  fecha_aprobacion: string | null;
}

interface Cliente {
  id_cliente: number;
  folio_cliente: string;
  nombre_cliente: string;
  app_cliente: string;
  apm_cliente: string;
  cusp: string;
  rfc: string;
  fecha_nacimiento: string;
  nacionalidad: string;
  direccion_id: number;
  ocupacion: string;
  ciclo_actual: string;
}

interface SolicitudCompleta {
  solicitud: Solicitud;
  cliente: Cliente;
}

@Component({
  selector: 'app-credit-request',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './credit-request.component.html',
  styleUrl: './credit-request.component.css'
})
export class CreditRequestComponent {
  // Datos para las tarjetas de estado
  totalSolicitudes = 15;
  enProceso = 3;
  confirmadas = 8;
  rechazadas = 2;
  eliminadas = 2;

  // Control del modal
  mostrarModal = false;
  solicitudSeleccionada: any = null;
  montoAprobado: number = 0;

  // Datos de ejemplo
  solicitudes = [
    {
      numero: 'SOL-001',
      depositorable: 'Juan Pérez',
      solicitadoA: 'Departamento Legal',
      estado: 'Confirmada',
      fechaSolicitud: '15/10/2023',
      tipoExpediente: 'Legal',
      prioridad: 'Alta',
      descripcion: 'Revisión de contrato corporativo para fusión empresarial. Se requiere análisis detallado de cláusulas y términos legales.'
    },
    {
      numero: 'SOL-002',
      depositorable: 'María García',
      solicitadoA: 'Recursos Humanos',
      estado: 'En Proceso',
      fechaSolicitud: '16/10/2023',
      tipoExpediente: 'Personal',
      prioridad: 'Media',
      descripcion: 'Expediente de nómina y beneficios para nuevo personal contratado en el trimestre.'
    }
  ];

  abrirModalDetalles(solicitud: any) {
    this.solicitudSeleccionada = solicitud;
    this.montoAprobado = 0;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.solicitudSeleccionada = null;
    this.montoAprobado = 0;
  }

  aprobarSolicitud() {
    if (this.montoAprobado > 0 && this.solicitudSeleccionada) {
      console.log('Solicitud aprobada:', this.solicitudSeleccionada.numero, 'Monto:', this.montoAprobado);
      // Aquí iría la lógica real de aprobación
      alert(`Solicitud ${this.solicitudSeleccionada.numero} aprobada con monto $${this.montoAprobado}`);
      this.cerrarModal();
    }
  }

  rechazarSolicitud() {
    if (this.solicitudSeleccionada) {
      if (confirm(`¿Está seguro de rechazar la solicitud ${this.solicitudSeleccionada.numero}?`)) {
        console.log('Solicitud rechazada:', this.solicitudSeleccionada.numero);
        // Aquí iría la lógica real de rechazo
        this.cerrarModal();
      }
    }
  }

  descargarExpediente() {
    if (this.solicitudSeleccionada) {
      console.log('Descargando expediente:', this.solicitudSeleccionada.numero);
      // Lógica para descargar el expediente
      alert(`Iniciando descarga del expediente ${this.solicitudSeleccionada.numero}`);
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
      case 'aprobada':
        return 'estado-confirmada';
      case 'en proceso':
        return 'estado-proceso';
      case 'pendiente':
        return 'estado-pendiente';
      case 'rechazada':
        return 'estado-rechazada';
      default:
        return 'estado-pendiente';
    }
  }
}