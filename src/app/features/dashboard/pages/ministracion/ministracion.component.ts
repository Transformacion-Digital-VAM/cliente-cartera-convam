
//----------------------------------------------------------------------------------
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { forkJoin } from 'rxjs';
// import { SolicitudService } from '../../../../services/solicitud.service';
// import { CreditoService } from '../../../../services/credito.service';
// import { AliadoService } from '../../../../services/aliado.service';
// import { PagareService } from '../../../../services/pagare.service';
// import Swal from 'sweetalert2';
// import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// @Component({
//   selector: 'app-ministracion',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './ministracion.component.html',
//   styleUrl: './ministracion.component.css'
// })
// export class MinistracionComponent implements OnInit {
//   // Lista de solicitudes aprobadas para mostrar en la tabla
//   solicitudesAprobadas: any[] = [];
//   clientesFiltrados: any[] = [];

//   // Lista de créditos creados
//   creditos: any[] = [];
//   creditosFiltrados: any[] = [];

//   // Filtros
//   filtroNombre: string = '';
//   filtroApPaterno: string = '';
//   filtroEstado: string = '';

//   // Control de modals
//   modalPagareAbierto: boolean = false;
//   solicitudSeleccionada: any = null;

//   // Estados de carga
//   cargando: boolean = false;
//   cargandoCreditos: boolean = false;
//   procesandoEntrega: boolean = false;
//   generandoDocumentos: boolean = false;

//   // Datos para el formulario de crédito
//   referenciaBancaria: string = '';
//   cuentaBancaria: string = '';
//   seguro: boolean = false;
//   fechaMinistracion: string = '';
//   fechaPrimerPago: string = '';

//   // Aliados para cálculo de intereses
//   aliados: any[] = [];

//   // Variables para vista previa de documentos
//   pdfPagareUrl: SafeResourceUrl | null = null;
//   pdfHojaControlUrl: SafeResourceUrl | null = null;
//   documentoCargando: boolean = false;
//   documentoActual: string = 'pagare';
//   creditoRecienCreado: any = null;
//   documentosGenerados: boolean = false;

//   // Variables para mostrar datos en el modal
//   totalCapital: number = 0;
//   totalInteres: number = 0;
//   totalSeguro: number = 0;
//   totalAPagar: number = 0;
//   pagoSemanal: number = 0;
//   totalGarantia: number = 0;

//   constructor(
//     private solicitudService: SolicitudService,
//     private creditoService: CreditoService,
//     private aliadoService: AliadoService,
//     private pagareService: PagareService,
//     private sanitizer: DomSanitizer
//   ) { }

//   ngOnInit(): void {
//     this.cargarDatosIniciales();
//     this.cargarCreditos();
//   }

//   // Cargar todos los datos iniciales
//   cargarDatosIniciales(): void {
//     this.cargando = true;

//     forkJoin({
//       aliados: this.aliadoService.obtenerAliados(),
//       solicitudes: this.solicitudService.obtenerSolicitudesPorEstado('APROBADO')
//     }).subscribe({
//       next: (result) => {
//         this.aliados = result.aliados;
//         this.solicitudesAprobadas = result.solicitudes;

//         // ASIGNAR INFORMACIÓN DEL ALIADO A CADA SOLICITUD
//         this.solicitudesAprobadas.forEach(solicitud => {
//           this.asignarAliadoASolicitud(solicitud);
//         });

//         this.clientesFiltrados = [...this.solicitudesAprobadas];
//         this.cargando = false;
//       },
//       error: (error) => {
//         console.error('Error al cargar datos:', error);
//         this.cargando = false;
//         Swal.fire({
//           icon: 'error',
//           title: 'Error',
//           text: 'Error al cargar los datos iniciales',
//           confirmButtonText: 'Aceptar'
//         });
//       }
//     });
//   }

//   // Cargar créditos
//   cargarCreditos(): void {
//     this.cargandoCreditos = true;
//     this.creditoService.obtenerCreditos().subscribe({
//       next: (creditos) => {
//         this.creditos = creditos;
//         this.creditosFiltrados = [...this.creditos];
//         this.cargandoCreditos = false;
//       },
//       error: (error) => {
//         console.error('Error al cargar créditos:', error);
//         this.cargandoCreditos = false;
//         Swal.fire({
//           icon: 'error',
//           title: 'Error',
//           text: 'Error al cargar los créditos',
//           confirmButtonText: 'Aceptar'
//         });
//       }
//     });
//   }

//   // Asignar información del aliado a la solicitud
//   asignarAliadoASolicitud(solicitud: any): void {
//     if (solicitud.aliado_id !== null && solicitud.aliado_id !== undefined && solicitud.aliado_id !== '') {
//       const aliado = this.aliados.find(a => a.id_aliado == solicitud.aliado_id);

//       if (aliado) {
//         solicitud.aliado_nombre = aliado.nom_aliado ? aliado.nom_aliado.trim() : 'Nombre no disponible';

//         if (aliado.tasa_fija !== null && aliado.tasa_fija !== undefined) {
//           const tasa = parseFloat(aliado.tasa_fija);
//           solicitud.tasa_fija = !isNaN(tasa) ? tasa : 0;
//           solicitud.tasa_fija_formateada = !isNaN(tasa) ? tasa.toFixed(2) + '%' : '0%';
//         } else {
//           solicitud.tasa_fija = 0;
//           solicitud.tasa_fija_formateada = '0%';
//         }

//         solicitud.aliado_info = aliado;
//       } else {
//         solicitud.aliado_nombre = 'Aliado no encontrado';
//         solicitud.tasa_fija = 0;
//         solicitud.tasa_fija_formateada = '0%';
//       }
//     } else {
//       solicitud.aliado_nombre = 'Sin aliado asignado';
//       solicitud.tasa_fija = 0;
//       solicitud.tasa_fija_formateada = '0%';
//     }

//     if (solicitud.dia_pago === undefined || solicitud.dia_pago === null) {
//       solicitud.dia_pago = 1;
//     }
//   }

//   // ABRIR MODAL PARA GENERAR PAGARÉ
//   abrirModalPagare(solicitud: any): void {
//     this.solicitudSeleccionada = solicitud;
//     this.modalPagareAbierto = true;

//     // Resetear variables
//     this.referenciaBancaria = '';
//     this.cuentaBancaria = '';
//     this.seguro = false;
//     this.creditoRecienCreado = null;
//     this.documentosGenerados = false;
//     this.pdfPagareUrl = null;
//     this.pdfHojaControlUrl = null;

//     // Establecer fechas por defecto
//     const hoy = new Date();
//     this.fechaMinistracion = hoy.toISOString().split('T')[0];

//     const fechaPrimerPago = new Date(hoy);
//     fechaPrimerPago.setDate(fechaPrimerPago.getDate() + 7);
//     this.fechaPrimerPago = fechaPrimerPago.toISOString().split('T')[0];

//     // Calcular valores iniciales
//     this.calcularValoresCredito();
//   }

//   // Calcular todos los valores del crédito
//   calcularValoresCredito(): void {
//     if (!this.solicitudSeleccionada) return;

//     const montoAprobado = Number(this.solicitudSeleccionada.monto_aprobado);
//     const tasa = this.solicitudSeleccionada.tasa_fija || 0.25;

//     // Calcular valores
//     this.totalCapital = montoAprobado;
//     this.totalInteres = (montoAprobado * tasa) / 4 * 16;
//     this.totalSeguro = this.seguro ? 80 : 0;
//     this.totalAPagar = this.totalCapital + this.totalInteres + this.totalSeguro;
//     this.totalGarantia = montoAprobado * 0.10;
//     this.pagoSemanal = this.totalAPagar / 16;
//   }

//   // Crear crédito primero
//   crearCredito(): void {
//     if (!this.solicitudSeleccionada) {
//       Swal.fire('Error', 'No hay solicitud seleccionada', 'error');
//       return;
//     }

//     if (!this.fechaMinistracion || !this.fechaPrimerPago) {
//       Swal.fire('Error', 'Debe completar todas las fechas', 'error');
//       return;
//     }

//     this.procesandoEntrega = true;

//     const creditoData = {
//       solicitud_id: this.solicitudSeleccionada.id_solicitud,
//       fecha_ministracion: this.fechaMinistracion,
//       fecha_primer_pago: this.fechaPrimerPago,
//       referencia_bancaria: this.referenciaBancaria || `REF-${this.solicitudSeleccionada.id_solicitud}-${Date.now()}`,
//       tipo_credito: this.solicitudSeleccionada.tipo_credito,
//       cuenta_bancaria: this.cuentaBancaria || '',
//       seguro: this.seguro,
//       tipo_servicio: "Préstamo personal"
//     };

//     this.creditoService.crearCredito(creditoData).subscribe({
//       next: (response: any) => {
//         this.creditoRecienCreado = response.credito;

//         Swal.fire({
//           icon: 'success',
//           title: '¡Crédito creado exitosamente!',
//           html: `El crédito ha sido creado correctamente.<br><br>
//                 <strong>ID del Crédito:</strong> ${this.creditoRecienCreado.id_credito}<br>
//                 <strong>Cliente:</strong> ${this.getNombreCompleto(this.solicitudSeleccionada)}<br><br>
//                 Ahora puede generar los documentos.`,
//           confirmButtonText: 'Continuar',
//           timer: 3000
//         });

//         this.procesandoEntrega = false;

//         // Eliminar la solicitud de la tabla
//         this.eliminarSolicitudDeTabla(this.solicitudSeleccionada.id_solicitud);

//         // Recargar la lista de créditos
//         this.cargarCreditos();
//       },
//       error: (error) => {
//         console.error('Error al crear crédito:', error);
//         Swal.fire({
//           icon: 'error',
//           title: 'Error',
//           text: `Error al crear el crédito: ${error.error?.error || error.message}`,
//           confirmButtonText: 'Aceptar'
//         });
//         this.procesandoEntrega = false;
//       }
//     });
//   }

//   // NUEVO: Marcar crédito como ENTREGADO
//   marcarComoEntregado(credito: any): void {
//     Swal.fire({
//       title: '¿Marcar como ENTREGADO?',
//       text: `¿Está seguro de marcar el crédito ${credito.id_credito} como ENTREGADO?`,
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, marcar como ENTREGADO',
//       cancelButtonText: 'Cancelar',
//       confirmButtonColor: '#28a745',
//       cancelButtonColor: '#d33'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.creditoService.actualizarEstadoCredito(credito.id_credito, 'ENTREGADO').subscribe({
//           next: (response) => {
//             Swal.fire({
//               icon: 'success',
//               title: '¡Estado actualizado!',
//               text: 'El crédito ha sido marcado como ENTREGADO',
//               timer: 2000,
//               showConfirmButton: false
//             });

//             // Actualizar el estado en la lista local
//             const index = this.creditos.findIndex(c => c.id_credito === credito.id_credito);
//             if (index !== -1) {
//               this.creditos[index].estado_credito = 'ENTREGADO';
//               this.creditosFiltrados = [...this.creditos];
//             }
//           },
//           error: (error) => {
//             console.error('Error al actualizar estado:', error);
//             Swal.fire({
//               icon: 'error',
//               title: 'Error',
//               text: 'No se pudo actualizar el estado del crédito',
//               confirmButtonText: 'Aceptar'
//             });
//           }
//         });
//       }
//     });
//   }

//   // NUEVO: Marcar crédito como DEVOLUCION
//   marcarComoDevolucion(credito: any): void {
//     Swal.fire({
//       title: '¿Marcar como DEVOLUCION?',
//       text: `¿Está seguro de marcar el crédito ${credito.id_credito} como DEVOLUCION?`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, marcar como DEVOLUCION',
//       cancelButtonText: 'Cancelar',
//       confirmButtonColor: '#dc3545',
//       cancelButtonColor: '#6c757d'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.creditoService.actualizarEstadoCredito(credito.id_credito, 'DEVOLUCION').subscribe({
//           next: (response) => {
//             Swal.fire({
//               icon: 'success',
//               title: '¡Estado actualizado!',
//               text: 'El crédito ha sido marcado como DEVOLUCION',
//               timer: 2000,
//               showConfirmButton: false
//             });

//             // Actualizar el estado en la lista local
//             const index = this.creditos.findIndex(c => c.id_credito === credito.id_credito);
//             if (index !== -1) {
//               this.creditos[index].estado_credito = 'DEVOLUCION';
//               this.creditosFiltrados = [...this.creditos];
//             }
//           },
//           error: (error) => {
//             console.error('Error al actualizar estado:', error);
//             Swal.fire({
//               icon: 'error',
//               title: 'Error',
//               text: 'No se pudo actualizar el estado del crédito',
//               confirmButtonText: 'Aceptar'
//             });
//           }
//         });
//       }
//     });
//   }

//   // Filtrar créditos por estado
//   filtrarCreditos(): void {
//     if (!this.filtroEstado) {
//       this.creditosFiltrados = [...this.creditos];
//       return;
//     }

//     this.creditosFiltrados = this.creditos.filter(credito => 
//       credito.estado_credito === this.filtroEstado
//     );
//   }

//   // Limpiar filtro de créditos
//   limpiarFiltroCreditos(): void {
//     this.filtroEstado = '';
//     this.creditosFiltrados = [...this.creditos];
//   }

//   // Generar y mostrar vista previa del pagaré
//   generarVistaPreviaPagare(): void {
//     if (!this.creditoRecienCreado?.id_credito) {
//       Swal.fire('Error', 'Primero debe crear el crédito', 'error');
//       return;
//     }

//     this.documentoCargando = true;
//     this.documentoActual = 'pagare';

//     this.pagareService.generarPagare(this.creditoRecienCreado.id_credito).subscribe({
//       next: (blob: Blob) => {
//         const url = window.URL.createObjectURL(blob);
//         this.pdfPagareUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
//         this.documentoCargando = false;
//         this.documentosGenerados = true;
//       },
//       error: (error) => {
//         console.error('Error al generar pagaré:', error);
//         Swal.fire('Error', 'No se pudo generar el pagaré', 'error');
//         this.documentoCargando = false;
//       }
//     });
//   }

//   // Generar y mostrar vista previa de la hoja de control
//   generarVistaPreviaHojaControl(): void {
//     if (!this.creditoRecienCreado?.id_credito) {
//       Swal.fire('Error', 'Primero debe crear el crédito', 'error');
//       return;
//     }

//     this.documentoCargando = true;
//     this.documentoActual = 'hojaControl';

//     this.pagareService.generarHojaControl(this.creditoRecienCreado.id_credito).subscribe({
//       next: (blob: Blob) => {
//         const url = window.URL.createObjectURL(blob);
//         this.pdfHojaControlUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
//         this.documentoCargando = false;
//         this.documentosGenerados = true;
//       },
//       error: (error) => {
//         console.error('Error al generar hoja de control:', error);
//         Swal.fire('Error', 'No se pudo generar la hoja de control', 'error');
//         this.documentoCargando = false;
//       }
//     });
//   }

//   // Cambiar entre documentos en la vista previa
//   cambiarDocumento(tipo: string): void {
//     this.documentoActual = tipo;

//     if (tipo === 'pagare' && !this.pdfPagareUrl) {
//       this.generarVistaPreviaPagare();
//     } else if (tipo === 'hojaControl' && !this.pdfHojaControlUrl) {
//       this.generarVistaPreviaHojaControl();
//     }
//   }

//   // Descargar pagaré
//   descargarPagare(): void {
//     if (!this.creditoRecienCreado?.id_credito) {
//       Swal.fire('Advertencia', 'Primero debe crear el crédito', 'warning');
//       return;
//     }

//     this.pagareService.generarPagare(this.creditoRecienCreado.id_credito).subscribe({
//       next: (blob: Blob) => {
//         const nombreArchivo = `pagare_${this.creditoRecienCreado.id_credito}_${this.getNombreCompleto(this.solicitudSeleccionada).replace(/\s+/g, '_')}.pdf`;
//         this.descargarDocumento(blob, nombreArchivo);
//         Swal.fire('Éxito', 'Pagaré descargado correctamente', 'success');
//       },
//       error: (error) => {
//         console.error('Error al descargar pagaré:', error);
//         Swal.fire('Error', 'No se pudo descargar el pagaré', 'error');
//       }
//     });
//   }

//   // Descargar hoja de control
//   descargarHojaControl(): void {
//     if (!this.creditoRecienCreado?.id_credito) {
//       Swal.fire('Advertencia', 'Primero debe crear el crédito', 'warning');
//       return;
//     }

//     this.pagareService.generarHojaControl(this.creditoRecienCreado.id_credito).subscribe({
//       next: (blob: Blob) => {
//         const nombreArchivo = `hoja_control_${this.creditoRecienCreado.id_credito}_${this.getNombreCompleto(this.solicitudSeleccionada).replace(/\s+/g, '_')}.pdf`;
//         this.descargarDocumento(blob, nombreArchivo);
//         Swal.fire('Éxito', 'Hoja de control descargada correctamente', 'success');
//       },
//       error: (error) => {
//         console.error('Error al descargar hoja de control:', error);
//         Swal.fire('Error', 'No se pudo descargar la hoja de control', 'error');
//       }
//     });
//   }

//   // Descargar ambos documentos
//   descargarAmbosDocumentos(): void {
//     this.descargarPagare();
//     setTimeout(() => {
//       this.descargarHojaControl();
//     }, 1000);
//   }

//   // Método para descargar documentos
//   descargarDocumento(blob: Blob, nombreArchivo: string): void {
//     if (blob.size === 0) {
//       Swal.fire('Advertencia', 'El documento está vacío', 'warning');
//       return;
//     }

//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = nombreArchivo;
//     a.style.display = 'none';
//     document.body.appendChild(a);
//     a.click();

//     setTimeout(() => {
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);
//     }, 100);
//   }

//   // Cerrar modal de pagaré
//   cerrarModalPagare(): void {
//     // Liberar URLs de los PDFs
//     if (this.pdfPagareUrl) {
//       const url = this.pdfPagareUrl.toString();
//       window.URL.revokeObjectURL(url);
//     }
//     if (this.pdfHojaControlUrl) {
//       const url = this.pdfHojaControlUrl.toString();
//       window.URL.revokeObjectURL(url);
//     }

//     this.modalPagareAbierto = false;
//     this.solicitudSeleccionada = null;
//     this.creditoRecienCreado = null;
//     this.pdfPagareUrl = null;
//     this.pdfHojaControlUrl = null;
//     this.documentoActual = 'pagare';
//     this.documentosGenerados = false;
//   }

//   // Buscar clientes
//   buscar(): void {
//     this.clientesFiltrados = this.solicitudesAprobadas.filter(solicitud => {
//       const coincideNombre = this.filtroNombre ?
//         solicitud.nombre_cliente.toLowerCase().includes(this.filtroNombre.toLowerCase()) : true;

//       const coincideApPaterno = this.filtroApPaterno ?
//         solicitud.app_cliente.toLowerCase().includes(this.filtroApPaterno.toLowerCase()) : true;

//       return coincideNombre && coincideApPaterno;
//     });
//   }

//   // Limpiar filtros
//   limpiarFiltros(): void {
//     this.filtroNombre = '';
//     this.filtroApPaterno = '';
//     this.clientesFiltrados = [...this.solicitudesAprobadas];
//   }

//   // Eliminar solicitud de la tabla
//   eliminarSolicitudDeTabla(idSolicitud: number): void {
//     const indexOriginal = this.solicitudesAprobadas.findIndex(s => s.id_solicitud === idSolicitud);
//     if (indexOriginal !== -1) {
//       this.solicitudesAprobadas.splice(indexOriginal, 1);
//     }

//     const indexFiltrado = this.clientesFiltrados.findIndex(s => s.id_solicitud === idSolicitud);
//     if (indexFiltrado !== -1) {
//       this.clientesFiltrados.splice(indexFiltrado, 1);
//     }
//   }

//   // Re-ingreso de crédito (mantener el existente)
//   reingresoCredito(solicitud: any): void {
//     Swal.fire({
//       title: '¿Confirmar re-ingreso?',
//       text: '¿Está seguro de que desea marcar este crédito para re-ingreso?',
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, marcar',
//       cancelButtonText: 'Cancelar',
//       confirmButtonColor: '#3085d6',
//       cancelButtonColor: '#d33'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         Swal.fire({
//           icon: 'success',
//           title: 'Re-ingreso marcado',
//           text: 'Crédito marcado para re-ingreso exitosamente',
//           confirmButtonText: 'Aceptar',
//           timer: 2000,
//           timerProgressBar: true
//         });
//       }
//     });
//   }

//   // Formatear nombre completo
//   getNombreCompleto(solicitud: any): string {
//     return `${solicitud.nombre_cliente} ${solicitud.app_cliente} ${solicitud.apm_cliente || ''}`.trim();
//   }

//   // Formatear nombre completo del cliente (para créditos)
//   getNombreCompletoCredito(credito: any): string {
//     // Asumiendo que el crédito tiene información del cliente
//     if (credito.nombre_cliente) {
//       return `${credito.nombre_cliente} ${credito.app_cliente || ''} ${credito.apm_cliente || ''}`.trim();
//     }
//     return `Cliente ${credito.cliente_id || 'N/A'}`;
//   }

//   // Formatear moneda
//   formatearMoneda(monto: number): string {
//     if (!monto) return '$0.00';
//     return new Intl.NumberFormat('es-MX', {
//       style: 'currency',
//       currency: 'MXN'
//     }).format(monto);
//   }

//   // Formatear fecha
//   formatearFecha(fecha: string): string {
//     if (!fecha) return 'No especificada';
//     return new Date(fecha).toLocaleDateString('es-MX');
//   }

//   // Obtener clase CSS para estado del crédito
//   getClaseEstado(estado: string): string {
//     switch (estado) {
//       case 'ENTREGADO':
//         return 'badge badge-success';
//       case 'DEVOLUCION':
//         return 'badge badge-danger';
//       case 'PENDIENTE':
//         return 'badge badge-warning';
//       default:
//         return 'badge badge-secondary';
//     }
//   }

//   // Verificar si hay créditos
//   get hayCreditos(): boolean {
//     return this.creditos.length > 0;
//   }

//   // Verificar si hay solicitudes aprobadas
//   get haySolicitudes(): boolean {
//     return this.solicitudesAprobadas.length > 0;
//   }

//   // Calcular cuando cambia algún valor
//   onValorCambiado(): void {
//     this.calcularValoresCredito();
//   }
// }
//----------------------------------------------------------------------------------


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SolicitudService } from '../../../../services/solicitud.service';
import { CreditoService } from '../../../../services/credito.service';
import { AliadoService } from '../../../../services/aliado.service';
import { PagareService } from '../../../../services/pagare.service';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-ministracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ministracion.component.html',
  styleUrl: './ministracion.component.css'
})
export class MinistracionComponent implements OnInit {
  parseInt(arg0: string, arg1: number) {
    throw new Error('Method not implemented.');
  }
  // Lista de solicitudes aprobadas para mostrar en la tabla
  solicitudesAprobadas: any[] = [];
  clientesFiltrados: any[] = [];
  solicitudesRecientes: any[] = []; // Nuevo array para las 6 más recientes

  // Lista de créditos creados
  creditos: any[] = [];

  // Filtros
  filtroNombre: string = '';
  filtroApPaterno: string = '';

  // Control de modals
  modalPagareAbierto: boolean = false;
  solicitudSeleccionada: any = null;

  // Estados de carga
  cargando: boolean = false;
  cargandoCreditos: boolean = false;
  procesandoEntrega: boolean = false;
  generandoDocumentos: boolean = false;

  // Datos para el formulario de crédito
  referenciaBancaria: string = '';
  cuentaBancaria: string = '';
  seguro: boolean = false;
  fechaMinistracion: string = '';
  fechaPrimerPago: string = '';

  // Aliados para cálculo de intereses
  aliados: any[] = [];

  // Variables para vista previa de documentos
  pdfPagareUrl: SafeResourceUrl | null = null;
  pdfHojaControlUrl: SafeResourceUrl | null = null;
  documentoCargando: boolean = false;
  documentoActual: string = 'pagare';
  creditoRecienCreado: any = null;
  documentosGenerados: boolean = false;

  // Variables para mostrar datos en el modal
  totalCapital: number = 0;
  totalInteres: number = 0;
  totalSeguro: number = 0;
  totalAPagar: number = 0;
  pagoSemanal: number = 0;
  totalGarantia: number = 0;
  Math: any;

  constructor(
    private solicitudService: SolicitudService,
    private creditoService: CreditoService,
    private aliadoService: AliadoService,
    private pagareService: PagareService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.cargarCreditos();
  }

  // Cargar todos los datos iniciales
  cargarDatosIniciales(): void {
    this.cargando = true;

    forkJoin({
      aliados: this.aliadoService.obtenerAliados(),
      solicitudes: this.solicitudService.obtenerSolicitudesPorEstado('APROBADO')
    }).subscribe({
      next: (result) => {
        this.aliados = result.aliados;
        this.solicitudesAprobadas = result.solicitudes;

        // ASIGNAR INFORMACIÓN DEL ALIADO A CADA SOLICITUD
        this.solicitudesAprobadas.forEach(solicitud => {
          this.asignarAliadoASolicitud(solicitud);
        });

        // Ordenar por fecha de aprobación (más reciente primero)
        this.solicitudesAprobadas.sort((a, b) => {
          const fechaA = new Date(a.fecha_aprobacion || 0);
          const fechaB = new Date(b.fecha_aprobacion || 0);
          return fechaB.getTime() - fechaA.getTime();
        });

        // Tomar solo las 6 solicitudes más recientes
        this.solicitudesRecientes = this.solicitudesAprobadas.slice(0, 6);

        // Para mantener compatibilidad con el filtro, inicializamos clientesFiltrados con las 6 más recientes
        this.clientesFiltrados = [...this.solicitudesRecientes];
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los datos iniciales',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  // Cargar créditos
  cargarCreditos(): void {
    this.cargandoCreditos = true;
    this.creditoService.obtenerCreditos().subscribe({
      next: (creditos) => {
        this.creditos = creditos;
        this.cargandoCreditos = false;
      },
      error: (error) => {
        console.error('Error al cargar créditos:', error);
        this.cargandoCreditos = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los créditos',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  // Obtener créditos por estado
  getCreditosPorEstado(estado: string): any[] {
    return this.creditos.filter(credito => {
      // Para créditos sin estado definido, considerar como PENDIENTE
      if (!credito.estado_credito && estado === 'PENDIENTE') {
        return true;
      }
      return credito.estado_credito === estado;
    });
  }

  // Asignar información del aliado a la solicitud
  asignarAliadoASolicitud(solicitud: any): void {
    if (solicitud.aliado_id !== null && solicitud.aliado_id !== undefined && solicitud.aliado_id !== '') {
      const aliado = this.aliados.find(a => a.id_aliado == solicitud.aliado_id);

      if (aliado) {
        solicitud.aliado_nombre = aliado.nom_aliado ? aliado.nom_aliado.trim() : 'Nombre no disponible';

        if (aliado.tasa_fija !== null && aliado.tasa_fija !== undefined) {
          const tasa = parseFloat(aliado.tasa_fija);
          solicitud.tasa_fija = !isNaN(tasa) ? tasa : 0;
          solicitud.tasa_fija_formateada = !isNaN(tasa) ? tasa.toFixed(2) + '%' : '0%';
        } else {
          solicitud.tasa_fija = 0;
          solicitud.tasa_fija_formateada = '0%';
        }

        solicitud.aliado_info = aliado;
      } else {
        solicitud.aliado_nombre = 'Aliado no encontrado';
        solicitud.tasa_fija = 0;
        solicitud.tasa_fija_formateada = '0%';
      }
    } else {
      solicitud.aliado_nombre = 'Sin aliado asignado';
      solicitud.tasa_fija = 0;
      solicitud.tasa_fija_formateada = '0%';
    }

    if (solicitud.dia_pago === undefined || solicitud.dia_pago === null) {
      solicitud.dia_pago = 1;
    }
  }
  //   asignarAliadoASolicitud(solicitud: any): void {
  //   if (solicitud.aliado_id !== null && solicitud.aliado_id !== undefined && solicitud.aliado_id !== '') {
  //     const aliado = this.aliados.find(a => a.id_aliado == solicitud.aliado_id);

  //     if (aliado) {
  //       solicitud.aliado_nombre = aliado.nom_aliado ? aliado.nom_aliado.trim() : 'Nombre no disponible';

  //       if (aliado.tasa_fija !== null && aliado.tasa_fija !== undefined) {
  //         const tasa = parseFloat(aliado.tasa_fija);

  //         if (!isNaN(tasa)) {
  //           // Multiplicar por 100 para obtener el valor entero del porcentaje
  //           const tasaPorcentaje = tasa * 100;
  //           solicitud.tasa_fija = tasaPorcentaje; 

  //           // Formatear como porcentaje con 2 decimales
  //           solicitud.tasa_fija_formateada = tasaPorcentaje.toFixed(2) + '%';
  //         } else {
  //           solicitud.tasa_fija = 0;
  //           solicitud.tasa_fija_formateada = '0%';
  //         }
  //       } else {
  //         solicitud.tasa_fija = 0;
  //         solicitud.tasa_fija_formateada = '0%';
  //       }

  //       solicitud.aliado_info = aliado;
  //     } else {
  //       solicitud.aliado_nombre = 'Aliado no encontrado';
  //       solicitud.tasa_fija = 0;
  //       solicitud.tasa_fija_formateada = '0%';
  //     }
  //   } else {
  //     solicitud.aliado_nombre = 'Sin aliado asignado';
  //     solicitud.tasa_fija = 0;
  //     solicitud.tasa_fija_formateada = '0%';
  //   }

  //   if (solicitud.dia_pago === undefined || solicitud.dia_pago === null) {
  //     solicitud.dia_pago = 1;
  //   }
  // }

  // ABRIR MODAL PARA GENERAR PAGARÉ
  abrirModalPagare(solicitud: any): void {
    this.solicitudSeleccionada = solicitud;
    this.modalPagareAbierto = true;

    // Resetear variables
    this.referenciaBancaria = '';
    this.cuentaBancaria = '';
    this.seguro = false;
    this.creditoRecienCreado = null;
    this.documentosGenerados = false;
    this.pdfPagareUrl = null;
    this.pdfHojaControlUrl = null;

    // Establecer fechas por defecto
    const hoy = new Date();
    this.fechaMinistracion = hoy.toISOString().split('T')[0];

    const fechaPrimerPago = new Date(hoy);
    fechaPrimerPago.setDate(fechaPrimerPago.getDate() + 7);
    this.fechaPrimerPago = fechaPrimerPago.toISOString().split('T')[0];

    // Calcular valores iniciales
    this.calcularValoresCredito();
  }

  // Calcular todos los valores del crédito
  calcularValoresCredito(): void {
    if (!this.solicitudSeleccionada) return;

    const montoAprobado = Number(this.solicitudSeleccionada.monto_aprobado);
    const tasa = this.solicitudSeleccionada.tasa_fija || 0.25;

    // Calcular valores
    this.totalCapital = montoAprobado;
    this.totalInteres = (montoAprobado * tasa) / 4 * 16;
    this.totalSeguro = this.seguro ? 80 : 0;
    this.totalAPagar = this.totalCapital + this.totalInteres + this.totalSeguro;
    this.totalGarantia = montoAprobado * 0.10;
    this.pagoSemanal = this.totalAPagar / 16;
  }

  // Crear crédito primero
  crearCredito(): void {
    if (!this.solicitudSeleccionada) {
      Swal.fire('Error', 'No hay solicitud seleccionada', 'error');
      return;
    }

    if (!this.fechaMinistracion || !this.fechaPrimerPago) {
      Swal.fire('Error', 'Debe completar todas las fechas', 'error');
      return;
    }

    this.procesandoEntrega = true;

    const creditoData = {
      solicitud_id: this.solicitudSeleccionada.id_solicitud,
      fecha_ministracion: this.fechaMinistracion,
      fecha_primer_pago: this.fechaPrimerPago,
      referencia_bancaria: this.referenciaBancaria || `REF-${this.solicitudSeleccionada.id_solicitud}-${Date.now()}`,
      tipo_credito: this.solicitudSeleccionada.tipo_credito,
      cuenta_bancaria: this.cuentaBancaria || '',
      seguro: this.seguro,
      tipo_servicio: "Préstamo personal"
    };

    this.creditoService.crearCredito(creditoData).subscribe({
      next: (response: any) => {
        this.creditoRecienCreado = response.credito;

        Swal.fire({
          icon: 'success',
          title: '¡Crédito creado exitosamente!',
          html: `El crédito ha sido creado correctamente.<br><br>
                <strong>ID del Crédito:</strong> ${this.creditoRecienCreado.id_credito}<br>
                <strong>Cliente:</strong> ${this.getNombreCompleto(this.solicitudSeleccionada)}<br><br>
                Ahora puede generar los documentos.`,
          confirmButtonText: 'Continuar',
          timer: 3000
        });

        this.procesandoEntrega = false;

        // Eliminar la solicitud de la tabla
        this.eliminarSolicitudDeTabla(this.solicitudSeleccionada.id_solicitud);

        // Recargar la lista de créditos
        this.cargarCreditos();
      },
      error: (error) => {
        console.error('Error al crear crédito:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Error al crear el crédito: ${error.error?.error || error.message}`,
          confirmButtonText: 'Aceptar'
        });
        this.procesandoEntrega = false;
      }
    });
  }

  // Marcar crédito como ENTREGADO
  marcarComoEntregado(credito: any): void {
    Swal.fire({
      title: '¿Marcar como ENTREGADO?',
      text: `¿Está seguro de marcar el crédito ${credito.id_credito} como ENTREGADO?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como ENTREGADO',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.creditoService.actualizarEstadoCredito(credito.id_credito, 'ENTREGADO').subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: '¡Estado actualizado!',
              text: 'El crédito ha sido marcado como ENTREGADO',
              timer: 2000,
              showConfirmButton: false
            });

            // Recargar créditos para reflejar el cambio
            this.cargarCreditos();
          },
          error: (error) => {
            console.error('Error al actualizar estado:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar el estado del crédito',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  // Marcar crédito como DEVOLUCION
  marcarComoDevolucion(credito: any): void {
    Swal.fire({
      title: '¿Marcar como DEVOLUCION?',
      text: `¿Está seguro de marcar el crédito ${credito.id_credito} como DEVOLUCION?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como DEVOLUCION',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.creditoService.actualizarEstadoCredito(credito.id_credito, 'DEVOLUCION').subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: '¡Estado actualizado!',
              text: 'El crédito ha sido marcado como DEVOLUCION',
              timer: 2000,
              showConfirmButton: false
            });

            // Recargar créditos para reflejar el cambio
            this.cargarCreditos();
          },
          error: (error) => {
            console.error('Error al actualizar estado:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar el estado del crédito',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  // Generar y mostrar vista previa del pagaré
  generarVistaPreviaPagare(): void {
    if (!this.creditoRecienCreado?.id_credito) {
      Swal.fire('Error', 'Primero debe crear el crédito', 'error');
      return;
    }

    this.documentoCargando = true;
    this.documentoActual = 'pagare';

    this.pagareService.generarPagare(this.creditoRecienCreado.id_credito).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        this.pdfPagareUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.documentoCargando = false;
        this.documentosGenerados = true;
      },
      error: (error) => {
        console.error('Error al generar pagaré:', error);
        Swal.fire('Error', 'No se pudo generar el pagaré', 'error');
        this.documentoCargando = false;
      }
    });
  }

  // Generar y mostrar vista previa de la hoja de control
  generarVistaPreviaHojaControl(): void {
    if (!this.creditoRecienCreado?.id_credito) {
      Swal.fire('Error', 'Primero debe crear el crédito', 'error');
      return;
    }

    this.documentoCargando = true;
    this.documentoActual = 'hojaControl';

    this.pagareService.generarHojaControl(this.creditoRecienCreado.id_credito).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        this.pdfHojaControlUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.documentoCargando = false;
        this.documentosGenerados = true;
      },
      error: (error) => {
        console.error('Error al generar hoja de control:', error);
        Swal.fire('Error', 'No se pudo generar la hoja de control', 'error');
        this.documentoCargando = false;
      }
    });
  }

  // Cambiar entre documentos en la vista previa
  cambiarDocumento(tipo: string): void {
    this.documentoActual = tipo;

    if (tipo === 'pagare' && !this.pdfPagareUrl) {
      this.generarVistaPreviaPagare();
    } else if (tipo === 'hojaControl' && !this.pdfHojaControlUrl) {
      this.generarVistaPreviaHojaControl();
    }
  }

  // Descargar pagaré
  descargarPagare(): void {
    if (!this.creditoRecienCreado?.id_credito) {
      Swal.fire('Advertencia', 'Primero debe crear el crédito', 'warning');
      return;
    }

    this.pagareService.generarPagare(this.creditoRecienCreado.id_credito).subscribe({
      next: (blob: Blob) => {
        const nombreArchivo = `pagare_${this.creditoRecienCreado.id_credito}_${this.getNombreCompleto(this.solicitudSeleccionada).replace(/\s+/g, '_')}.pdf`;
        this.descargarDocumento(blob, nombreArchivo);
        Swal.fire('Éxito', 'Pagaré descargado correctamente', 'success');
      },
      error: (error) => {
        console.error('Error al descargar pagaré:', error);
        Swal.fire('Error', 'No se pudo descargar el pagaré', 'error');
      }
    });
  }

  // Descargar hoja de control
  descargarHojaControl(): void {
    if (!this.creditoRecienCreado?.id_credito) {
      Swal.fire('Advertencia', 'Primero debe crear el crédito', 'warning');
      return;
    }

    this.pagareService.generarHojaControl(this.creditoRecienCreado.id_credito).subscribe({
      next: (blob: Blob) => {
        const nombreArchivo = `hoja_control_${this.creditoRecienCreado.id_credito}_${this.getNombreCompleto(this.solicitudSeleccionada).replace(/\s+/g, '_')}.pdf`;
        this.descargarDocumento(blob, nombreArchivo);
        Swal.fire('Éxito', 'Hoja de control descargada correctamente', 'success');
      },
      error: (error) => {
        console.error('Error al descargar hoja de control:', error);
        Swal.fire('Error', 'No se pudo descargar la hoja de control', 'error');
      }
    });
  }

  // Descargar ambos documentos
  descargarAmbosDocumentos(): void {
    this.descargarPagare();
    setTimeout(() => {
      this.descargarHojaControl();
    }, 1000);
  }

  // Método para descargar documentos
  descargarDocumento(blob: Blob, nombreArchivo: string): void {
    if (blob.size === 0) {
      Swal.fire('Advertencia', 'El documento está vacío', 'warning');
      return;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  // Cerrar modal de pagaré
  cerrarModalPagare(): void {
    // Liberar URLs de los PDFs
    if (this.pdfPagareUrl) {
      const url = this.pdfPagareUrl.toString();
      window.URL.revokeObjectURL(url);
    }
    if (this.pdfHojaControlUrl) {
      const url = this.pdfHojaControlUrl.toString();
      window.URL.revokeObjectURL(url);
    }

    this.modalPagareAbierto = false;
    this.solicitudSeleccionada = null;
    this.creditoRecienCreado = null;
    this.pdfPagareUrl = null;
    this.pdfHojaControlUrl = null;
    this.documentoActual = 'pagare';
    this.documentosGenerados = false;
  }

  // Buscar clientes (ahora buscará solo en las 6 más recientes)
  buscar(): void {
    this.clientesFiltrados = this.solicitudesRecientes.filter(solicitud => {
      const coincideNombre = this.filtroNombre ?
        solicitud.nombre_cliente.toLowerCase().includes(this.filtroNombre.toLowerCase()) : true;

      const coincideApPaterno = this.filtroApPaterno ?
        solicitud.app_cliente.toLowerCase().includes(this.filtroApPaterno.toLowerCase()) : true;

      return coincideNombre && coincideApPaterno;
    });
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroApPaterno = '';
    this.clientesFiltrados = [...this.solicitudesRecientes];
  }

  // Eliminar solicitud de la tabla
  eliminarSolicitudDeTabla(idSolicitud: number): void {
    // Eliminar de solicitudesRecientes
    const indexReciente = this.solicitudesRecientes.findIndex(s => s.id_solicitud === idSolicitud);
    if (indexReciente !== -1) {
      this.solicitudesRecientes.splice(indexReciente, 1);
    }

    // También eliminar de solicitudesAprobadas para consistencia
    const indexOriginal = this.solicitudesAprobadas.findIndex(s => s.id_solicitud === idSolicitud);
    if (indexOriginal !== -1) {
      this.solicitudesAprobadas.splice(indexOriginal, 1);
    }

    // Actualizar clientesFiltrados
    const indexFiltrado = this.clientesFiltrados.findIndex(s => s.id_solicitud === idSolicitud);
    if (indexFiltrado !== -1) {
      this.clientesFiltrados.splice(indexFiltrado, 1);
    }

    // Si tenemos menos de 6 solicitudes recientes, podemos agregar una más de la lista completa
    if (this.solicitudesRecientes.length < 6 && this.solicitudesAprobadas.length > 0) {
      // Tomar la siguiente solicitud más reciente que no esté ya en la lista
      const siguienteSolicitud = this.solicitudesAprobadas.find(s =>
        !this.solicitudesRecientes.some(r => r.id_solicitud === s.id_solicitud)
      );

      if (siguienteSolicitud) {
        this.solicitudesRecientes.push(siguienteSolicitud);
        this.clientesFiltrados = [...this.solicitudesRecientes];
      }
    }
  }

  // Re-ingreso de crédito
  reingresoCredito(solicitud: any): void {
    Swal.fire({
      title: '¿Confirmar re-ingreso?',
      text: '¿Está seguro de que desea marcar este crédito para re-ingreso?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Re-ingreso marcado',
          text: 'Crédito marcado para re-ingreso exitosamente',
          confirmButtonText: 'Aceptar',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  }

  // Formatear nombre completo
  getNombreCompleto(solicitud: any): string {
    return `${solicitud.nombre_cliente} ${solicitud.app_cliente} ${solicitud.apm_cliente || ''}`.trim();
  }

  // Formatear nombre completo del cliente (para créditos)
  // getNombreCompletoCredito(credito: any): string {
  //   // Si el crédito viene con información del cliente
  //   if (credito.nombre_cliente && credito.app_cliente) {
  //     return `${credito.nombre_cliente} ${credito.app_cliente} ${credito.apm_cliente || ''}`.trim();
  //   }
  //   return `Cliente ${credito.cliente_id || 'N/A'}`;
  // }
  getNombreCompletoCredito(credito: any): string {
    // Si el crédito ya viene con la información del cliente desde el backend
    if (credito.nombre_cliente && credito.app_cliente) {
      return `${credito.nombre_cliente} ${credito.app_cliente} ${credito.apm_cliente || ''}`.trim();
    }

    // Si no, intentar obtenerlo de las solicitudes aprobadas
    const solicitud = this.solicitudesAprobadas.find(s => s.id_solicitud === credito.solicitud_id);
    if (solicitud) {
      return this.getNombreCompleto(solicitud);
    }

    // Si no se encuentra, mostrar el ID
    return `Cliente ${credito.cliente_id || 'N/A'}`;
  }

  getNombreCortoCliente(credito: any): string {
    if (credito.nombre_cliente && credito.app_cliente) {
      return `${credito.nombre_cliente} ${credito.app_cliente}`.trim();
    }
    return `Cliente ${credito.cliente_id || 'N/A'}`;
  }

  getDatosClienteCredito(credito: any): any {
    return {
      nombreCompleto: this.getNombreCompletoCredito(credito),
      nombre: credito.nombre_cliente || 'N/A',
      apellidoPaterno: credito.app_cliente || 'N/A',
      apellidoMaterno: credito.apm_cliente || '',
      clienteId: credito.cliente_id || 'N/A'
    };
  }

  // Formatear moneda
  formatearMoneda(monto: number): string {
    if (!monto) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    try {
      return new Date(fecha).toLocaleDateString('es-MX');
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  // Obtener clase CSS para estado del crédito
  getClaseEstado(estado: string): string {
    switch (estado) {
      case 'ENTREGADO':
        return 'badge badge-success';
      case 'DEVOLUCION':
        return 'badge badge-danger';
      case 'PENDIENTE':
        return 'badge badge-warning';
      default:
        return 'badge badge-secondary';
    }
  }

  // Verificar si hay créditos
  get hayCreditos(): boolean {
    return this.creditos.length > 0;
  }

  // Verificar si hay solicitudes aprobadas (para las 6 más recientes)
  get haySolicitudes(): boolean {
    return this.solicitudesRecientes.length > 0;
  }

  // Calcular cuando cambia algún valor
  onValorCambiado(): void {
    this.calcularValoresCredito();
  }
}