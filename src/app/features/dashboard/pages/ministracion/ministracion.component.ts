// import { Component, OnDestroy, OnInit } from '@angular/core';
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
// export class MinistracionComponent implements OnInit, OnDestroy {
//   parseInt(arg0: string, arg1: number) {
//     throw new Error('Method not implemented.');
//   }

//   solicitudesAprobadas: any[] = [];
//   clientesFiltrados: any[] = [];
//   solicitudesRecientes: any[] = [];

//   // Lista de créditos creados
//   creditos: any[] = [];

//   // Filtros
//   filtroNombre: string = '';
//   filtroApPaterno: string = '';

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
//   seguro: boolean = true;
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
//   totalSeguro: number = 80;
//   totalAPagar: number = 0;
//   pagoInicial: number = 0;
//   pagoSemanal: number = 0;
//   totalGarantia: number = 0;
//   Math: any;

//   constructor(
//     private solicitudService: SolicitudService,
//     private creditoService: CreditoService,
//     private aliadoService: AliadoService,
//     private pagareService: PagareService,
//     private sanitizer: DomSanitizer

//   ) { }
//   private intervaloActualizacion: any;
//   tiempoActual: number = Date.now();

//   ngOnInit(): void {
//     this.cargarDatosIniciales();
//     this.cargarCreditos();
//     this.iniciarActualizacionTemporizador();
//   }
//     ngOnDestroy(): void {
//     // Limpiar el intervalo cuando el componente se destruya
//     if (this.intervaloActualizacion) {
//       clearInterval(this.intervaloActualizacion);
//     }
//   }



//   // En el método cargarDatosIniciales, modifica la parte de ordenación:
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

//         // ORDENAR POR ID DE SOLICITUD DE MAYOR A MENOR (más reciente primero)
//         this.solicitudesAprobadas.sort((a, b) => {
//           // Convertir a número para asegurar ordenación numérica
//           const idA = Number(a.id_solicitud) || 0;
//           const idB = Number(b.id_solicitud) || 0;
//           return idB - idA; // Orden descendente (mayor a menor)
//         });

//         // Tomar solo las 6 solicitudes más recientes (ya están ordenadas por ID)
//         this.solicitudesRecientes = this.solicitudesAprobadas.slice(0, 6);

//         // Para mantener compatibilidad con el filtro, inicializamos clientesFiltrados con las 6 más recientes
//         this.clientesFiltrados = [...this.solicitudesRecientes];
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


//   // Obtener créditos por estado con ordenamiento específico
// getCreditosPorEstado(estado: string): any[] {
//   const creditosFiltrados = this.creditos.filter(credito => {
//     // Para créditos sin estado definido, considerar como PENDIENTE
//     if (!credito.estado_credito) {
//       return estado === 'PENDIENTE';
//     }
//     return credito.estado_credito === estado;
//   });

//   // Ordenar según el estado
//   if (estado === 'ENTREGADO' || estado === 'DEVOLUCION') {
//     // Ordenar ENTREGADOS y DEVOLUCION por ID de crédito descendente (mayor a menor)
//     return creditosFiltrados.sort((a, b) => {
//       const idA = Number(a.id_credito) || 0;
//       const idB = Number(b.id_credito) || 0;
//       return idB - idA; // Orden descendente (mayor a menor)
//     });
//   } else if (estado === 'PENDIENTE') {
//     // Ordenar PENDIENTES por tiempo restante (más crítico primero)
//     return creditosFiltrados.sort((a, b) => {
//       const tiempoA = this.getTiempoRestante(a);
//       const tiempoB = this.getTiempoRestante(b);

//       // Primero los expirados
//       if (tiempoA.tiempoExpirado && !tiempoB.tiempoExpirado) return -1;
//       if (!tiempoA.tiempoExpirado && tiempoB.tiempoExpirado) return 1;

//       // Luego por tiempo restante (menos tiempo primero)
//       return tiempoA.horasRestantes - tiempoB.horasRestantes;
//     });
//   } else {
//     // Para otros estados, ordenar por ID de crédito descendente
//     return creditosFiltrados.sort((a, b) => {
//       const idA = Number(a.id_credito) || 0;
//       const idB = Number(b.id_credito) || 0;
//       return idB - idA;
//     });
//   }
// }

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
//     // this.seguro = false;
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

//     // Seguro
//     const totalSeguro = this.solicitudSeleccionada.seguro;



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
//     this.totalAPagar = this.totalCapital + this.totalInteres;
//     this.totalGarantia = montoAprobado * 0.10;
//     this.pagoSemanal = this.totalAPagar / 16;
//     this.pagoInicial = this.totalGarantia + this.totalSeguro;
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

//   // Marcar crédito como ENTREGADO
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

//             // Recargar créditos para reflejar el cambio
//             this.cargarCreditos();
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

//   //  Marcar crédito como  PENDIENTE - RE-INGRESO
//   marcarComoPendiente(credito: any): void {
//     Swal.fire({
//       title: '¿Regresar crédito a PENDIENTE?',
//       text: `¿Está seguro de marcar el crédito ${credito.id_credito} como PENDIENTE?`,
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, marcar como PENDIENTE',
//       cancelButtonText: 'Cancelar',
//       confirmButtonColor: '#28a745',
//       cancelButtonColor: '#d33'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.creditoService.actualizarEstadoCredito(credito.id_credito, 'PENDIENTE').subscribe({
//           next: (response) => {
//             Swal.fire({
//               icon: 'success',
//               title: '¡Estado actualizado!',
//               text: 'El crédito ha sido marcado como PENDIENTE',
//               timer: 2000,
//               showConfirmButton: false
//             });

//             // Recargar créditos para reflejar el cambio
//             this.cargarCreditos();
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

//   // Marcar crédito como DEVOLUCION
//   marcarComoDevolucion(credito: any): void {
//     Swal.fire({
//       title: '¿Marcar como DEVOLUCIÓN?',
//       text: `¿Está seguro de marcar el crédito ${credito.id_credito} como DEVOLUCIÓN?`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, marcar como DEVOLUCIÓN',
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
//               text: 'El crédito ha sido marcado como DEVOLUCIÓN',
//               timer: 2000,
//               showConfirmButton: false
//             });

//             // Recargar créditos para reflejar el cambio
//             this.cargarCreditos();
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

//   // Modifica el método buscar para mantener el orden por ID:
//   buscar(): void {
//     let resultados = this.solicitudesRecientes.filter(solicitud => {
//       const coincideNombre = this.filtroNombre ?
//         solicitud.nombre_cliente.toLowerCase().includes(this.filtroNombre.toLowerCase()) : true;

//       const coincideApPaterno = this.filtroApPaterno ?
//         solicitud.app_cliente.toLowerCase().includes(this.filtroApPaterno.toLowerCase()) : true;

//       return coincideNombre && coincideApPaterno;
//     });

//     // Ordenar resultados por ID de mayor a menor
//     this.clientesFiltrados = resultados.sort((a, b) => {
//       const idA = Number(a.id_solicitud) || 0;
//       const idB = Number(b.id_solicitud) || 0;
//       return idB - idA; // Orden descendente
//     });
//   }

//   // Modifica el método limpiarFiltros:
//   limpiarFiltros(): void {
//     this.filtroNombre = '';
//     this.filtroApPaterno = '';
//     this.clientesFiltrados = [...this.solicitudesRecientes].sort((a, b) => {
//       const idA = Number(a.id_solicitud) || 0;
//       const idB = Number(b.id_solicitud) || 0;
//       return idB - idA;
//     });
//   }

//   // Eliminar solicitud de la tabla
//   eliminarSolicitudDeTabla(idSolicitud: number): void {
//     // Eliminar de solicitudesRecientes
//     const indexReciente = this.solicitudesRecientes.findIndex(s => s.id_solicitud === idSolicitud);
//     if (indexReciente !== -1) {
//       this.solicitudesRecientes.splice(indexReciente, 1);
//     }

//     // También eliminar de solicitudesAprobadas para consistencia
//     const indexOriginal = this.solicitudesAprobadas.findIndex(s => s.id_solicitud === idSolicitud);
//     if (indexOriginal !== -1) {
//       this.solicitudesAprobadas.splice(indexOriginal, 1);
//     }

//     // Actualizar clientesFiltrados
//     const indexFiltrado = this.clientesFiltrados.findIndex(s => s.id_solicitud === idSolicitud);
//     if (indexFiltrado !== -1) {
//       this.clientesFiltrados.splice(indexFiltrado, 1);
//     }

//     // Si tenemos menos de 6 solicitudes recientes, podemos agregar una más de la lista completa
//     if (this.solicitudesRecientes.length < 6 && this.solicitudesAprobadas.length > 0) {
//       // Tomar la siguiente solicitud más reciente que no esté ya en la lista
//       const siguienteSolicitud = this.solicitudesAprobadas.find(s =>
//         !this.solicitudesRecientes.some(r => r.id_solicitud === s.id_solicitud)
//       );

//       if (siguienteSolicitud) {
//         this.solicitudesRecientes.push(siguienteSolicitud);
//         this.clientesFiltrados = [...this.solicitudesRecientes];
//       }
//     }
//   }

//   // Re-ingreso de crédito
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

//   getNombreCompletoCredito(credito: any): string {
//     // Si el crédito ya viene con la información del cliente desde el backend
//     if (credito.nombre_cliente && credito.app_cliente) {
//       return `${credito.nombre_cliente} ${credito.app_cliente} ${credito.apm_cliente || ''}`.trim();
//     }

//     // Si no, intentar obtenerlo de las solicitudes aprobadas
//     const solicitud = this.solicitudesAprobadas.find(s => s.id_solicitud === credito.solicitud_id);
//     if (solicitud) {
//       return this.getNombreCompleto(solicitud);
//     }

//     // Si no se encuentra, mostrar el ID
//     return `Cliente ${credito.cliente_id || 'N/A'}`;
//   }

//   getNombreCortoCliente(credito: any): string {
//     if (credito.nombre_cliente && credito.app_cliente) {
//       return `${credito.nombre_cliente} ${credito.app_cliente}`.trim();
//     }
//     return `Cliente ${credito.cliente_id || 'N/A'}`;
//   }

//   getDatosClienteCredito(credito: any): any {
//     return {
//       nombreCompleto: this.getNombreCompletoCredito(credito),
//       nombre: credito.nombre_cliente || 'N/A',
//       apellidoPaterno: credito.app_cliente || 'N/A',
//       apellidoMaterno: credito.apm_cliente || '',
//       clienteId: credito.cliente_id || 'N/A'
//     };
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
//     try {
//       return new Date(fecha).toLocaleDateString('es-MX');
//     } catch (error) {
//       return 'Fecha inválida';
//     }
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
//     return this.solicitudesRecientes.length > 0;
//   }

//   // Calcular cuando cambia algún valor
//   onValorCambiado(): void {
//     this.calcularValoresCredito();
//   }

//   // Método para calcular el tiempo restante (48 horas desde fecha_ministracion)
//   // Tomando en cuenta que el conteo inicia a partir de las hrs ya avanzadas
//   // 12:00 am y si se realizo a las 3:00 pm, solo quedan 33 horas
//   // getTiempoRestante(credito: any): any {
//   //   if (!credito.fecha_ministracion) {
//   //     return {
//   //       hayFecha: false,
//   //       texto: 'N/A',
//   //       esCritico: false,
//   //       esAdvertencia: false,
//   //       porcentaje: 0
//   //     };
//   //   }

//   //   const fechaMinistracion = new Date(credito.fecha_ministracion);
//   //   const fechaLimite = new Date(fechaMinistracion);

//   //   // Agregar 48 horas (2 días) a la fecha de ministración
//   //   fechaLimite.setHours(fechaLimite.getHours() + 48);

//   //   const ahora = this.tiempoActual;
//   //   const tiempoTotalMs = 48 * 60 * 60 * 1000; // 48 horas en milisegundos
//   //   const tiempoTranscurridoMs = ahora - fechaMinistracion.getTime();
//   //   const tiempoRestanteMs = fechaLimite.getTime() - ahora;

//   //   // Si ya pasó el tiempo
//   //   if (tiempoRestanteMs <= 0) {
//   //     return {
//   //       hayFecha: true,
//   //       texto: '00:00:00',
//   //       esCritico: true,
//   //       esAdvertencia: false,
//   //       porcentaje: 100,
//   //       tiempoExpirado: true
//   //     };
//   //   }

//   //   // Calcular horas, minutos y segundos
//   //   const horas = Math.floor(tiempoRestanteMs / (1000 * 60 * 60));
//   //   const minutos = Math.floor((tiempoRestanteMs % (1000 * 60 * 60)) / (1000 * 60));
//   //   const segundos = Math.floor((tiempoRestanteMs % (1000 * 60)) / 1000);

//   //   // Formatear como HH:MM:SS
//   //   const texto = `${this.padZero(horas)}:${this.padZero(minutos)}:${this.padZero(segundos)}`;

//   //   // Calcular porcentaje transcurrido
//   //   const porcentajeTranscurrido = Math.min((tiempoTranscurridoMs / tiempoTotalMs) * 100, 100);
//   //   const porcentajeFormateado = porcentajeTranscurrido.toFixed(2); 

//   //   // Determinar si es crítico (menos de 12 horas) o advertencia (menos de 24 horas)
//   //   const esCritico = horas < 12;
//   //   const esAdvertencia = horas < 24 && horas >= 12;

//   //   return {
//   //     hayFecha: true,
//   //     texto,
//   //     esCritico,
//   //     esAdvertencia,
//   //     porcentaje: porcentajeFormateado,
//   //     horasRestantes: horas,
//   //     tiempoExpirado: false
//   //   };
//   // }
//   getTiempoRestante(credito: any): any {
//   if (!credito.fecha_ministracion) {
//     return {
//       hayFecha: false,
//       texto: 'N/A',
//       esCritico: false,
//       esAdvertencia: false,
//       porcentaje: 0
//     };
//   }

//   const tiempoTotalMs = 48 * 60 * 60 * 1000; // 48 horas exactas
//   const fechaInicio = new Date(credito.fecha_ministracion).getTime();
//   const ahora = this.tiempoActual; // Date.now()
//   const fechaExpiracion = fechaInicio + tiempoTotalMs;

//   const tiempoRestanteMs = fechaExpiracion - ahora;
//   const tiempoTranscurridoMs = Math.max(ahora - fechaInicio, 0);

//   // Expirado
//   if (tiempoRestanteMs <= 0) {
//     return {
//       hayFecha: true,
//       texto: '00:00:00',
//       esCritico: true,
//       esAdvertencia: false,
//       porcentaje: 100,
//       tiempoExpirado: true
//     };
//   }

//   // Cálculo exacto
//   const horas = Math.floor(tiempoRestanteMs / (1000 * 60 * 60));
//   const minutos = Math.floor((tiempoRestanteMs % (1000 * 60 * 60)) / (1000 * 60));
//   const segundos = Math.floor((tiempoRestanteMs % (1000 * 60)) / 1000);

//   const texto = `${this.padZero(horas)}:${this.padZero(minutos)}:${this.padZero(segundos)}`;

//   const porcentaje = Math.min(
//     (tiempoTranscurridoMs / tiempoTotalMs) * 100,
//     100
//   ).toFixed(2);

//   return {
//     hayFecha: true,
//     texto,
//     esCritico: horas < 12,
//     esAdvertencia: horas >= 12 && horas < 24,
//     porcentaje,
//     horasRestantes: horas,
//     tiempoExpirado: false
//   };
// }

//   // Método auxiliar para agregar ceros
//   private padZero(num: number): string {
//     return num < 10 ? `0${num}` : `${num}`;
//   }


//   cargarCreditos(): void {
//     this.cargandoCreditos = true;
//     this.creditoService.obtenerCreditos().subscribe({
//       next: (creditos) => {
//         // Asegurarse de que cada crédito tenga fecha_ministracion
//         this.creditos = creditos.map(credito => {
//           if (!credito.fecha_ministracion && credito.fecha_creacion) {
//             // Si no tiene fecha_ministracion pero sí fecha_creacion, usar esa
//             return { ...credito, fecha_ministracion: credito.fecha_creacion };
//           }
//           return credito;
//         });

//         // Ordenar créditos por tiempo restante (más crítico primero)
//         this.creditos.sort((a, b) => {
//           const tiempoA = this.getTiempoRestante(a);
//           const tiempoB = this.getTiempoRestante(b);

//           // Primero los expirados
//           if (tiempoA.tiempoExpirado && !tiempoB.tiempoExpirado) return -1;
//           if (!tiempoA.tiempoExpirado && tiempoB.tiempoExpirado) return 1;

//           // Luego por tiempo restante (menos tiempo primero)
//           return tiempoA.horasRestantes - tiempoB.horasRestantes;
//         });

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

//   // Método para mostrar alerta cuando el tiempo esté por expirar
//   verificarAlertasTemporizador(): void {
//     const creditosPendientes = this.getCreditosPorEstado('PENDIENTE');

//     creditosPendientes.forEach(credito => {
//       const tiempoRestante = this.getTiempoRestante(credito);

//       if (tiempoRestante.tiempoExpirado) {
//         // Ya expiró - mostrar alerta
//         if (!credito.alertaMostrada) {
//           this.mostrarAlertaExpiracion(credito);
//           credito.alertaMostrada = true;
//         }
//       } else if (tiempoRestante.esCritico && !credito.alertaCriticaMostrada) {
//         // Menos de 12 horas - alerta crítica
//         this.mostrarAlertaCritica(credito, tiempoRestante.horasRestantes);
//         credito.alertaCriticaMostrada = true;
//       } else if (tiempoRestante.esAdvertencia && !credito.alertaAdvertenciaMostrada) {
//         // Menos de 24 horas - alerta de advertencia
//         this.mostrarAlertaAdvertencia(credito, tiempoRestante.horasRestantes);
//         credito.alertaAdvertenciaMostrada = true;
//       }
//     });
//   }

//   // Métodos para mostrar alertas
//   mostrarAlertaExpiracion(credito: any): void {
//     Swal.fire({
//       icon: 'error',
//       title: '¡TIEMPO EXPIRADO!',
//       html: `
//         <div style="text-align: left;">
//           <p><strong>Crédito ID:</strong> ${credito.id_credito}</p>
//           <p><strong>Cliente:</strong> ${this.getNombreCompletoCredito(credito)}</p>
//           <p><strong>Monto:</strong> ${this.formatearMoneda(credito.total_a_pagar)}</p>
//           <p>El tiempo de 48 horas para entregar este crédito ha expirado. Por favor, actualizar el estado a DEVOLUCIÓN</p>
//         </div>
//       `,
//       confirmButtonText: 'Entendido',
//       confirmButtonColor: '#dc3545'
//     });
//   }

//   mostrarAlertaCritica(credito: any, horasRestantes: number): void {
//     Swal.fire({
//       icon: 'warning',
//       title: '¡TIEMPO CRÍTICO!',
//       html: `
//         <div style="text-align: left;">
//           <p><strong>Crédito ID:</strong> ${credito.id_credito}</p>
//           <p><strong>Cliente:</strong> ${this.getNombreCompletoCredito(credito)}</p>
//           <p><strong>Tiempo restante:</strong> ${horasRestantes} horas</p>
//           <p>Quedan menos de 12 horas para entregar este crédito.</p>
//         </div>
//       `,
//       confirmButtonText: 'Entendido',
//       confirmButtonColor: '#ffc107'
//     });
//   }

//   mostrarAlertaAdvertencia(credito: any, horasRestantes: number): void {
//     Swal.fire({
//       icon: 'info',
//       title: 'Tiempo por expirar',
//       html: `
//         <div style="text-align: left;">
//           <p><strong>Crédito ID:</strong> ${credito.id_credito}</p>
//           <p><strong>Cliente:</strong> ${this.getNombreCompletoCredito(credito)}</p>
//           <p><strong>Tiempo restante:</strong> ${horasRestantes} horas</p>
//           <p>Quedan menos de 24 horas para entregar este crédito.</p>
//         </div>
//       `,
//       confirmButtonText: 'Entendido',
//       confirmButtonColor: '#17a2b8'
//     });
//   }

//   // Actualizar el método para verificar alertas periódicamente
//   private iniciarActualizacionTemporizador(): void {
//     this.intervaloActualizacion = setInterval(() => {
//       this.tiempoActual = Date.now();

//       // Verificar alertas cada 80 segundos
//       const ahora = new Date();
//       if (ahora.getSeconds() % 80 === 0) { 
//         this.verificarAlertasTemporizador();
//       }
//     }, 1000);
//   }

//   // ------------------------------------------------------
//   // VER PAGARE GENERADO
//   // ------------------------------------------------------
//   // Método para ver el pagaré ya generado
// verPagareExistente(credito: any): void {
//   this.cargando = true;

//   this.pagareService.generarPagare(credito.id_credito).subscribe({
//     next: (blob: Blob) => {
//       const url = window.URL.createObjectURL(blob);
//       this.pdfPagareUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

//       // Abrir modal o nueva ventana con el PDF
//       this.abrirModalDocumentoExistente(credito, 'pagare', url);
//       this.cargando = false;
//     },
//     error: (error) => {
//       console.error('Error al generar pagaré:', error);
//       Swal.fire({
//         icon: 'error',
//         title: 'Error',
//         text: 'No se pudo cargar el pagaré generado anteriormente',
//         confirmButtonText: 'Aceptar'
//       });
//       this.cargando = false;
//     }
//   });
// }

// // Método para ver la hoja de control ya generada
// verHojaControlExistente(credito: any): void {
//   this.cargando = true;

//   this.pagareService.generarHojaControl(credito.id_credito).subscribe({
//     next: (blob: Blob) => {
//       const url = window.URL.createObjectURL(blob);
//       this.pdfHojaControlUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

//       // Abrir modal o nueva ventana con el PDF
//       this.abrirModalDocumentoExistente(credito, 'hojaControl', url);
//       this.cargando = false;
//     },
//     error: (error) => {
//       console.error('Error al generar hoja de control:', error);
//       Swal.fire({
//         icon: 'error',
//         title: 'Error',
//         text: 'No se pudo cargar la hoja de control generada anteriormente',
//         confirmButtonText: 'Aceptar'
//       });
//       this.cargando = false;
//     }
//   });
// }

// // Abrir modal para ver documento existente
// abrirModalDocumentoExistente(credito: any, tipoDocumento: string, pdfUrl: string): void {
//   this.documentoActual = tipoDocumento;

//   if (tipoDocumento === 'pagare') {
//     this.pdfPagareUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
//   } else {
//     this.pdfHojaControlUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
//   }

//   // Mostrar modal con el documento
//   this.mostrarModalDocumentoExistente(credito, tipoDocumento);
// }

// // Mostrar modal con SweetAlert
// mostrarModalDocumentoExistente(credito: any, tipoDocumento: string): void {
//   const nombreCliente = this.getNombreCompletoCredito(credito);
//   const tipoDocumentoTitulo = tipoDocumento === 'pagare' ? 'Pagaré' : 'Hoja de Control';

//   Swal.fire({
//     title: `${tipoDocumentoTitulo} - ${nombreCliente}`,
//     html: `
//       <div style="text-align: center;">
//         <p><strong>Cliente:</strong> ${nombreCliente}</p>
//         <p><strong>ID Crédito:</strong> ${credito.id_credito}</p>
//         <p><strong>Estado:</strong> ${credito.estado_credito || 'PENDIENTE'}</p>
//         <div style="margin: 20px 0;">
//           <iframe 
//             src="${tipoDocumento === 'pagare' ? this.pdfPagareUrl : this.pdfHojaControlUrl}" 
//             width="100%" 
//             height="400px" 
//             style="border: 1px solid #ddd;">
//           </iframe>
//         </div>
//       </div>
//     `,
//     showCancelButton: true,
//     confirmButtonText: 'Descargar',
//     cancelButtonText: 'Cerrar',
//     showDenyButton: true,
//     denyButtonText: tipoDocumento === 'pagare' ? 'Ver Hoja Control' : 'Ver Pagaré',
//     width: '800px',
//     didOpen: () => {
//       // Asegurarse de que el iframe se cargue correctamente
//       const iframe = document.querySelector('iframe');
//       if (iframe) {
//         iframe.onload = () => {
//           console.log('Documento cargado correctamente');
//         };
//       }
//     }
//   }).then((result) => {
//     if (result.isConfirmed) {
//       // Descargar documento
//       if (tipoDocumento === 'pagare') {
//         this.descargarPagareCredito(credito);
//       } else {
//         this.descargarHojaControlCredito(credito);
//       }
//     } else if (result.isDenied) {
//       // Cambiar al otro documento
//       if (tipoDocumento === 'pagare') {
//         this.verHojaControlExistente(credito);
//       } else {
//         this.verPagareExistente(credito);
//       }
//     }
//   });
// }

// // Método para descargar pagaré existente
// descargarPagareCredito(credito: any): void {
//   this.pagareService.generarPagare(credito.id_credito).subscribe({
//     next: (blob: Blob) => {
//       const nombreArchivo = `pagare_${credito.id_credito}_${this.getNombreCompletoCredito(credito).replace(/\s+/g, '_')}.pdf`;
//       this.descargarDocumento(blob, nombreArchivo);
//       Swal.fire('Éxito', 'Pagaré descargado correctamente', 'success');
//     },
//     error: (error) => {
//       console.error('Error al descargar pagaré:', error);
//       Swal.fire('Error', 'No se pudo descargar el pagaré', 'error');
//     }
//   });
// }

// // Método para descargar hoja de control existente
// descargarHojaControlCredito(credito: any): void {
//   this.pagareService.generarHojaControl(credito.id_credito).subscribe({
//     next: (blob: Blob) => {
//       const nombreArchivo = `hoja_control_${credito.id_credito}_${this.getNombreCompletoCredito(credito).replace(/\s+/g, '_')}.pdf`;
//       this.descargarDocumento(blob, nombreArchivo);
//       Swal.fire('Éxito', 'Hoja de control descargada correctamente', 'success');
//     },
//     error: (error) => {
//       console.error('Error al descargar hoja de control:', error);
//       Swal.fire('Error', 'No se pudo descargar la hoja de control', 'error');
//     }
//   });
// }



// }




import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class MinistracionComponent implements OnInit, OnDestroy {
  solicitudesAprobadas: any[] = [];
  clientesFiltrados: any[] = [];
  solicitudesRecientes: any[] = [];

  // Lista de créditos creados
  creditos: any[] = [];

  // Filtros
  filtroNombre: string = '';
  filtroApPaterno: string = '';

  modalGenerarCreditoAbierto: boolean = false;
  modalGenerarPagareAbierto: boolean = false;
  procesandoGeneracion: boolean = false;

  // Control de modals
  // modalPagareAbierto: boolean = false;
  solicitudSeleccionada: any = null;

  // Estados de carga
  cargando: boolean = false;
  cargandoCreditos: boolean = false;
  procesandoEntrega: boolean = false;
  generandoDocumentos: boolean = false;

  // Datos para el formulario de crédito
  referenciaBancaria: string = '';
  cuentaBancaria: string = '';
  seguro: boolean = true;
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
  totalSeguro: number = 80;
  totalAPagar: number = 0;
  pagoInicial: number = 0;
  pagoSemanal: number = 0;
  totalGarantia: number = 0;
  Math: any;


  // EDITAR FECHAS MINISTRACION - PRIMER PAGO
  modalEditarFechasAbierto: boolean = false;
  creditoSeleccionado: any = null;
  nuevaFechaMinistracion: string = '';
  nuevaFechaPrimerPago: string = '';

  constructor(
    private solicitudService: SolicitudService,
    private creditoService: CreditoService,
    private aliadoService: AliadoService,
    private pagareService: PagareService,
    private sanitizer: DomSanitizer

  ) { }
  private intervaloActualizacion: any;
  tiempoActual: number = Date.now();

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.cargarCreditos();
    this.iniciarActualizacionTemporizador();
  }
  ngOnDestroy(): void {
    // Limpiar el intervalo cuando el componente se destruya
    if (this.intervaloActualizacion) {
      clearInterval(this.intervaloActualizacion);
    }
  }



  // En el método cargarDatosIniciales, modifica la parte de ordenación:
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

        // ORDENAR POR ID DE SOLICITUD DE MAYOR A MENOR (más reciente primero)
        this.solicitudesAprobadas.sort((a, b) => {
          // Convertir a número para asegurar ordenación numérica
          const idA = Number(a.id_solicitud) || 0;
          const idB = Number(b.id_solicitud) || 0;
          return idB - idA; // Orden descendente (mayor a menor)
        });

        // Tomar solo las 6 solicitudes más recientes (ya están ordenadas por ID)
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


  // Obtener créditos por estado con ordenamiento específico
  getCreditosPorEstado(estado: string): any[] {
    const creditosFiltrados = this.creditos.filter(credito => {
      // Para créditos sin estado definido, considerar como PENDIENTE
      if (!credito.estado_credito) {
        return estado === 'PENDIENTE';
      }
      return credito.estado_credito === estado;
    });

    // Ordenar según el estado
    if (estado === 'ENTREGADO' || estado === 'DEVOLUCION') {
      // Ordenar ENTREGADOS y DEVOLUCION por ID de crédito descendente (mayor a menor)
      return creditosFiltrados.sort((a, b) => {
        const idA = Number(a.id_credito) || 0;
        const idB = Number(b.id_credito) || 0;
        return idB - idA; // Orden descendente (mayor a menor)
      });
    } else if (estado === 'PENDIENTE') {
      // Ordenar PENDIENTES por tiempo restante (más crítico primero)
      return creditosFiltrados.sort((a, b) => {
        const tiempoA = this.getTiempoRestante(a);
        const tiempoB = this.getTiempoRestante(b);

        // Primero los expirados
        if (tiempoA.tiempoExpirado && !tiempoB.tiempoExpirado) return -1;
        if (!tiempoA.tiempoExpirado && tiempoB.tiempoExpirado) return 1;

        // Luego por tiempo restante (menos tiempo primero)
        return tiempoA.horasRestantes - tiempoB.horasRestantes;
      });
    } else {
      // Para otros estados, ordenar por ID de crédito descendente
      return creditosFiltrados.sort((a, b) => {
        const idA = Number(a.id_credito) || 0;
        const idB = Number(b.id_credito) || 0;
        return idB - idA;
      });
    }
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

  // ABRIR MODAL PARA GENERAR PAGARÉ
  // abrirModalPagare(solicitud: any): void {
  //   // Primero validar si la solicitud está domiciliado
  //   if (!solicitud.domiciliado) {
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'No se puede proceder',
  //       html: `La solicitud <strong>#${solicitud.id_solicitud}</strong> no está domiciliado.<br><br>
  //           Debe completar el proceso de domiciliación antes de generar el crédito.`,
  //       confirmButtonText: 'Entendido',
  //       confirmButtonColor: '#d33'
  //     });
  //     return;
  //   }

  //   // Si está domiciliada, continuar con el proceso normal
  //   this.solicitudSeleccionada = solicitud;
  //   this.modalPagareAbierto = true;

  //   // Resetear variables
  //   this.referenciaBancaria = '';
  //   this.cuentaBancaria = '';
  //   this.creditoRecienCreado = null;
  //   this.documentosGenerados = false;
  //   this.pdfPagareUrl = null;
  //   this.pdfHojaControlUrl = null;

  //   // Establecer fechas por defecto
  //   const hoy = new Date();
  //   this.fechaMinistracion = hoy.toISOString().split('T')[0];

  //   const fechaPrimerPago = new Date(hoy);
  //   fechaPrimerPago.setDate(fechaPrimerPago.getDate() + 7);
  //   this.fechaPrimerPago = fechaPrimerPago.toISOString().split('T')[0];

  //   // Calcular valores iniciales
  //   this.calcularValoresCredito();
  // }


  // abrirModalPagare(solicitud: any): void {
  //   // Validar si la solicitud está domiciliada
  //   if (!solicitud.domiciliado) {
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'No se puede proceder',
  //       html: `La solicitud <strong>#${solicitud.id_solicitud}</strong> no está domiciliado.<br><br>
  //         Debe completar el proceso de domiciliación antes de generar el crédito.`,
  //       confirmButtonText: 'Entendido',
  //       confirmButtonColor: '#d33'
  //     });
  //     return;
  //   }

  //   // NUEVA VALIDACIÓN: Verificar si ya existe un crédito activo
  //   if (!this.puedeGenerarCredito(solicitud)) {
  //     const estadoExistente = this.obtenerEstadoCreditoExistente(solicitud);

  //     Swal.fire({
  //       icon: 'warning',
  //       title: 'Crédito Existente',
  //       html: `La solicitud <strong>#${solicitud.id_solicitud}</strong> ya tiene un crédito generado.<br><br>
  //         <strong>Estado del crédito:</strong> ${estadoExistente}<br><br>
  //         No puede generar un nuevo crédito hasta que el crédito actual esté <strong>FINALIZADO</strong>.`,
  //       confirmButtonText: 'Entendido',
  //       confirmButtonColor: '#ffc107'
  //     });
  //     return;
  //   }

  //   // Si está domiciliada y no tiene crédito activo, continuar con el proceso normal
  //   this.solicitudSeleccionada = solicitud;
  //   this.modalPagareAbierto = true;

  //   // Resetear variables
  //   this.referenciaBancaria = '';
  //   this.cuentaBancaria = '';
  //   this.creditoRecienCreado = null;
  //   this.documentosGenerados = false;
  //   this.pdfPagareUrl = null;
  //   this.pdfHojaControlUrl = null;

  //   // Establecer fechas por defecto
  //   const hoy = new Date();
  //   this.fechaMinistracion = hoy.toISOString().split('T')[0];

  //   const fechaPrimerPago = new Date(hoy);
  //   fechaPrimerPago.setDate(fechaPrimerPago.getDate() + 7);
  //   this.fechaPrimerPago = fechaPrimerPago.toISOString().split('T')[0];

  //   // Calcular valores iniciales
  //   this.calcularValoresCredito();
  // }
  // abrirModalPagare(solicitud: any): void {
  //   // Validar si la solicitud está domiciliada
  //   if (!solicitud.domiciliado) {
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'No se puede proceder',
  //       html: `La solicitud <strong>#${solicitud.id_solicitud}</strong> no está domiciliado.<br><br>
  //         Debe completar el proceso de domiciliación antes de generar el crédito.`,
  //       confirmButtonText: 'Entendido',
  //       confirmButtonColor: '#d33'
  //     });
  //     return;
  //   }

  //   // NUEVA VALIDACIÓN: Verificar si ya existe un crédito activo
  //   if (!this.puedeGenerarCredito(solicitud)) {
  //     const estadoExistente = this.obtenerEstadoCreditoExistente(solicitud);

  //     Swal.fire({
  //       icon: 'warning',
  //       title: 'Crédito Existente',
  //       html: `La solicitud <strong>#${solicitud.id_solicitud}</strong> ya tiene un crédito generado.<br><br>
  //         <strong>Estado del crédito:</strong> ${estadoExistente}<br><br>
  //         No puede generar un nuevo crédito hasta que el crédito actual esté <strong>FINALIZADO</strong>.`,
  //       confirmButtonText: 'Entendido',
  //       confirmButtonColor: '#ffc107'
  //     });
  //     return;
  //   }

  //   // Si está domiciliada y no tiene crédito activo, continuar con el proceso normal
  //   this.solicitudSeleccionada = solicitud;
  //   this.modalPagareAbierto = true;

  //   // Resetear variables
  //   this.referenciaBancaria = '';
  //   this.cuentaBancaria = '';
  //   this.creditoRecienCreado = null;
  //   this.documentosGenerados = false;
  //   this.pdfPagareUrl = null;
  //   this.pdfHojaControlUrl = null;

  //   // Establecer fechas por defecto
  //   const hoy = new Date();
  //   this.fechaMinistracion = hoy.toISOString().split('T')[0];

  //   const fechaPrimerPago = new Date(hoy);
  //   fechaPrimerPago.setDate(fechaPrimerPago.getDate() + 7);
  //   this.fechaPrimerPago = fechaPrimerPago.toISOString().split('T')[0];

  //   // Calcular valores iniciales
  //   this.calcularValoresCredito();
  // }



  abrirModalPagare(solicitud: any): void {
    // VALIDACIÓN 1: Verificar si está domiciliado
    if (!solicitud.domiciliado) {
      Swal.fire({
        icon: 'error',
        title: 'No se puede proceder',
        html: `La solicitud <strong>#${solicitud.id_solicitud}</strong> no está domiciliada.<br><br>
          Debe completar el proceso de domiciliación antes de generar el crédito.`,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // VALIDACIÓN 2: Verificar si ya existe CUALQUIER crédito
    if (!this.puedeGenerarCredito(solicitud)) {
      const estadoExistente = this.obtenerEstadoCreditoExistente(solicitud);
      const idCreditoExistente = this.obtenerIdCreditoExistente(solicitud);

      Swal.fire({
        icon: 'warning',
        title: 'Crédito Existente',
        html: `
        <div style="text-align: left;">
          <p>La solicitud <strong>#${solicitud.id_solicitud}</strong> ya tiene un crédito registrado.</p>
          <hr>
          <p><strong>ID del Crédito:</strong> #${idCreditoExistente}</p>
          <p><strong>Estado Actual:</strong> <span class="badge badge-info">${estadoExistente}</span></p>
          <hr>
          <p class="text-muted">
            <i class="fas fa-info-circle"></i> 
            No se puede generar un nuevo crédito para esta solicitud porque ya tiene un crédito asociado.
          </p>
        </div>
      `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-eye"></i> Ver Crédito Existente',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#17a2b8',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          // Si el usuario quiere ver el crédito, mostrar sus detalles
          this.verDetallesCreditoExistente(solicitud);
        }
      });
      return;
    }

    // Si está domiciliada y NO tiene ningún crédito, continuar con el proceso normal
    this.solicitudSeleccionada = solicitud;

    // ¡CORRECCIÓN AQUÍ! Usa la variable correcta que controla el modal
    this.modalGenerarCreditoAbierto = true; // Cambia esta línea

    // Resetear variables
    this.referenciaBancaria = '';
    this.cuentaBancaria = '';
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
    this.totalAPagar = this.totalCapital + this.totalInteres;
    this.totalGarantia = montoAprobado * 0.10;
    this.pagoSemanal = this.totalAPagar / 16;
    this.pagoInicial = this.totalGarantia + this.totalSeguro;
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

    // this.creditoService.crearCredito(creditoData).subscribe({
    //   next: (response: any) => {
    //     this.creditoRecienCreado = response.credito;

    //     Swal.fire({
    //       icon: 'success',
    //       title: '¡Crédito creado exitosamente!',
    //       html: `El crédito ha sido creado correctamente.<br><br>
    //             <strong>ID del Crédito:</strong> ${this.creditoRecienCreado.id_credito}<br>
    //             <strong>Cliente:</strong> ${this.getNombreCompleto(this.solicitudSeleccionada)}<br><br>
    //             Ahora puede generar los documentos.`,
    //       confirmButtonText: 'Continuar',
    //       timer: 3000
    //     });

    //     this.procesandoEntrega = false;

    //     // Eliminar la solicitud de la tabla
    //     this.eliminarSolicitudDeTabla(this.solicitudSeleccionada.id_solicitud);

    //     // Recargar la lista de créditos
    //     this.cargarCreditos();
    //   },
    //   error: (error) => {
    //     console.error('Error al crear crédito:', error);
    //     Swal.fire({
    //       icon: 'error',
    //       title: 'Error',
    //       text: `Error al crear el crédito: ${error.error?.error || error.message}`,
    //       confirmButtonText: 'Aceptar'
    //     });
    //     this.procesandoEntrega = false;
    //   }
    // });
    this.creditoService.crearCredito(creditoData).subscribe({
      next: (response: any) => {
        this.creditoRecienCreado = response.credito;

        // Cerrar el modal de generar crédito
        this.modalGenerarCreditoAbierto = false;

        // Abrir el modal de generar pagaré
        this.modalGenerarPagareAbierto = true; // Esto abre el segundo modal con documentos

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

  //  Marcar crédito como  PENDIENTE - RE-INGRESO
  marcarComoPendiente(credito: any): void {
    Swal.fire({
      title: '¿Regresar crédito a PENDIENTE?',
      text: `¿Está seguro de marcar el crédito ${credito.id_credito} como PENDIENTE?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como PENDIENTE',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.creditoService.actualizarEstadoCredito(credito.id_credito, 'PENDIENTE').subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: '¡Estado actualizado!',
              text: 'El crédito ha sido marcado como PENDIENTE',
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
      title: '¿Marcar como DEVOLUCIÓN?',
      text: `¿Está seguro de marcar el crédito ${credito.id_credito} como DEVOLUCIÓN?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como DEVOLUCIÓN',
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
              text: 'El crédito ha sido marcado como DEVOLUCIÓN',
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
  // descargarPagare(): void {
  //   if (!this.creditoRecienCreado?.id_credito) {
  //     Swal.fire('Advertencia', 'Primero debe crear el crédito', 'warning');
  //     return;
  //   }

  //   this.pagareService.generarPagare(this.creditoRecienCreado.id_credito).subscribe({
  //     next: (blob: Blob) => {
  //       const nombreArchivo = `pagare_${this.creditoRecienCreado.id_credito}_${this.getNombreCompleto(this.solicitudSeleccionada).replace(/\s+/g, '_')}.pdf`;
  //       this.descargarDocumento(blob, nombreArchivo);
  //       Swal.fire('Éxito', 'Pagaré descargado correctamente', 'success');
  //     },
  //     error: (error) => {
  //       console.error('Error al descargar pagaré:', error);
  //       Swal.fire('Error', 'No se pudo descargar el pagaré', 'error');
  //     }
  //   });
  // }
  descargarPagare(): void {
    if (!this.creditoRecienCreado?.id_credito || !this.solicitudSeleccionada) {
      Swal.fire('Advertencia', 'Primero debe crear el crédito', 'warning');
      return;
    }

    this.pagareService.generarPagare(this.creditoRecienCreado.id_credito).subscribe({
      next: (blob: Blob) => {
        const nombreCliente = this.getNombreCompleto(this.solicitudSeleccionada);
        const nombreArchivo = `pagare_${this.creditoRecienCreado.id_credito}_${nombreCliente.replace(/\s+/g, '_')}.pdf`;
        this.descargarDocumento(blob, nombreArchivo);
        Swal.fire('Éxito', 'Pagaré descargado correctamente', 'success');
      }
    });
  }


  // Descargar hoja de control
  // descargarHojaControl(): void {
  //   if (!this.creditoRecienCreado?.id_credito) {
  //     Swal.fire('Advertencia', 'Primero debe crear el crédito', 'warning');
  //     return;
  //   }

  //   this.pagareService.generarHojaControl(this.creditoRecienCreado.id_credito).subscribe({
  //     next: (blob: Blob) => {
  //       const nombreArchivo = `hoja_control_${this.creditoRecienCreado.id_credito}_${this.getNombreCompleto(this.solicitudSeleccionada).replace(/\s+/g, '_')}.pdf`;
  //       this.descargarDocumento(blob, nombreArchivo);
  //       Swal.fire('Éxito', 'Hoja de control descargada correctamente', 'success');
  //     },
  //     error: (error) => {
  //       console.error('Error al descargar hoja de control:', error);
  //       Swal.fire('Error', 'No se pudo descargar la hoja de control', 'error');
  //     }
  //   });
  // }
  descargarHojaControl(): void {
    if (!this.creditoRecienCreado?.id_credito || !this.solicitudSeleccionada) {
      Swal.fire('Advertencia', 'Primero debe crear el crédito', 'warning');
      return;
    }

    this.pagareService.generarHojaControl(this.creditoRecienCreado.id_credito).subscribe({
      next: (blob: Blob) => {
        const nombreCliente = this.getNombreCompleto(this.solicitudSeleccionada);
        const nombreArchivo = `hoja_control_${this.creditoRecienCreado.id_credito}_${nombreCliente.replace(/\s+/g, '_')}.pdf`;
        this.descargarDocumento(blob, nombreArchivo);
        Swal.fire('Éxito', 'Hoja de control descargada correctamente', 'success');
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

    // this.modalPagareAbierto = false;
    this.solicitudSeleccionada = null;
    this.creditoRecienCreado = null;
    this.pdfPagareUrl = null;
    this.pdfHojaControlUrl = null;
    this.documentoActual = 'pagare';
    this.documentosGenerados = false;
  }

  // Modifica el método buscar para mantener el orden por ID:
  buscar(): void {
    let resultados = this.solicitudesRecientes.filter(solicitud => {
      const coincideNombre = this.filtroNombre ?
        solicitud.nombre_cliente.toLowerCase().includes(this.filtroNombre.toLowerCase()) : true;

      const coincideApPaterno = this.filtroApPaterno ?
        solicitud.app_cliente.toLowerCase().includes(this.filtroApPaterno.toLowerCase()) : true;

      return coincideNombre && coincideApPaterno;
    });

    // Ordenar resultados por ID de mayor a menor
    this.clientesFiltrados = resultados.sort((a, b) => {
      const idA = Number(a.id_solicitud) || 0;
      const idB = Number(b.id_solicitud) || 0;
      return idB - idA; // Orden descendente
    });
  }

  // Modifica el método limpiarFiltros:
  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroApPaterno = '';
    this.clientesFiltrados = [...this.solicitudesRecientes].sort((a, b) => {
      const idA = Number(a.id_solicitud) || 0;
      const idB = Number(b.id_solicitud) || 0;
      return idB - idA;
    });
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

  formatearTasaFija(tasa: number | null): string {
    if (!tasa) return '0%';
    return `${Math.round(tasa * 100)}%`;
  }

  // Formatear nombre completo
  getNombreCompleto(solicitud: any): string {
    return `${solicitud.nombre_cliente} ${solicitud.app_cliente} ${solicitud.apm_cliente || ''}`.trim();
  }

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

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-MX');
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

  // Verificar si hay solicitudes aprobadas 
  get haySolicitudes(): boolean {
    return this.solicitudesRecientes.length > 0;
  }

  // Calcular cuando cambia algún valor
  onValorCambiado(): void {
    this.calcularValoresCredito();
  }

  getTiempoRestante(credito: any): any {
    if (!credito.fecha_ministracion) {
      return {
        hayFecha: false,
        texto: 'N/A',
        esCritico: false,
        esAdvertencia: false,
        porcentaje: 0
      };
    }

    const tiempoTotalMs = 48 * 60 * 60 * 1000; // 48 horas exactas
    const fechaInicio = new Date(credito.fecha_ministracion).getTime();
    const ahora = this.tiempoActual; // Date.now()
    const fechaExpiracion = fechaInicio + tiempoTotalMs;

    const tiempoRestanteMs = fechaExpiracion - ahora;
    const tiempoTranscurridoMs = Math.max(ahora - fechaInicio, 0);

    // Expirado
    if (tiempoRestanteMs <= 0) {
      return {
        hayFecha: true,
        texto: '00:00:00',
        esCritico: true,
        esAdvertencia: false,
        porcentaje: 100,
        tiempoExpirado: true
      };
    }

    // Cálculo exacto
    const horas = Math.floor(tiempoRestanteMs / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoRestanteMs % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((tiempoRestanteMs % (1000 * 60)) / 1000);

    const texto = `${this.padZero(horas)}:${this.padZero(minutos)}:${this.padZero(segundos)}`;

    const porcentaje = Math.min(
      (tiempoTranscurridoMs / tiempoTotalMs) * 100,
      100
    ).toFixed(2);

    return {
      hayFecha: true,
      texto,
      esCritico: horas < 12,
      esAdvertencia: horas >= 12 && horas < 24,
      porcentaje,
      horasRestantes: horas,
      tiempoExpirado: false
    };
  }

  // Método auxiliar para agregar ceros
  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }


  cargarCreditos(): void {
    this.cargandoCreditos = true;
    this.creditoService.obtenerCreditos().subscribe({
      next: (creditos) => {
        // Asegurarse de que cada crédito tenga fecha_ministracion
        this.creditos = creditos.map(credito => {
          if (!credito.fecha_ministracion && credito.fecha_creacion) {
            // Si no tiene fecha_ministracion pero sí fecha_creacion, usar esa
            return { ...credito, fecha_ministracion: credito.fecha_creacion };
          }
          return credito;
        });

        // Ordenar créditos por tiempo restante (más crítico primero)
        this.creditos.sort((a, b) => {
          const tiempoA = this.getTiempoRestante(a);
          const tiempoB = this.getTiempoRestante(b);

          // Primero los expirados
          if (tiempoA.tiempoExpirado && !tiempoB.tiempoExpirado) return -1;
          if (!tiempoA.tiempoExpirado && tiempoB.tiempoExpirado) return 1;

          // Luego por tiempo restante (menos tiempo primero)
          return tiempoA.horasRestantes - tiempoB.horasRestantes;
        });

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

  // Método para mostrar alerta cuando el tiempo esté por expirar
  verificarAlertasTemporizador(): void {
    const creditosPendientes = this.getCreditosPorEstado('PENDIENTE');

    creditosPendientes.forEach(credito => {
      const tiempoRestante = this.getTiempoRestante(credito);

      if (tiempoRestante.tiempoExpirado) {
        // Ya expiró - mostrar alerta
        if (!credito.alertaMostrada) {
          this.mostrarAlertaExpiracion(credito);
          credito.alertaMostrada = true;
        }
      } else if (tiempoRestante.esCritico && !credito.alertaCriticaMostrada) {
        // Menos de 12 horas - alerta crítica
        this.mostrarAlertaCritica(credito, tiempoRestante.horasRestantes);
        credito.alertaCriticaMostrada = true;
      } else if (tiempoRestante.esAdvertencia && !credito.alertaAdvertenciaMostrada) {
        // Menos de 24 horas - alerta de advertencia
        this.mostrarAlertaAdvertencia(credito, tiempoRestante.horasRestantes);
        credito.alertaAdvertenciaMostrada = true;
      }
    });
  }

  // Métodos para mostrar alertas
  mostrarAlertaExpiracion(credito: any): void {
    Swal.fire({
      icon: 'error',
      title: '¡TIEMPO EXPIRADO!',
      html: `
        <div style="text-align: left;">
          <p><strong>Crédito ID:</strong> ${credito.id_credito}</p>
          <p><strong>Cliente:</strong> ${this.getNombreCompletoCredito(credito)}</p>
          <p><strong>Monto:</strong> ${this.formatearMoneda(credito.total_a_pagar)}</p>
          <p>El tiempo de 48 horas para entregar este crédito ha expirado. Por favor, actualizar el estado a DEVOLUCIÓN</p>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc3545'
    });
  }

  mostrarAlertaCritica(credito: any, horasRestantes: number): void {
    Swal.fire({
      icon: 'warning',
      title: '¡TIEMPO CRÍTICO!',
      html: `
        <div style="text-align: left;">
          <p><strong>Crédito ID:</strong> ${credito.id_credito}</p>
          <p><strong>Cliente:</strong> ${this.getNombreCompletoCredito(credito)}</p>
          <p><strong>Tiempo restante:</strong> ${horasRestantes} horas</p>
          <p>Quedan menos de 12 horas para entregar este crédito.</p>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ffc107'
    });
  }

  mostrarAlertaAdvertencia(credito: any, horasRestantes: number): void {
    Swal.fire({
      icon: 'info',
      title: 'Tiempo por expirar',
      html: `
        <div style="text-align: left;">
          <p><strong>Crédito ID:</strong> ${credito.id_credito}</p>
          <p><strong>Cliente:</strong> ${this.getNombreCompletoCredito(credito)}</p>
          <p><strong>Tiempo restante:</strong> ${horasRestantes} horas</p>
          <p>Quedan menos de 24 horas para entregar este crédito.</p>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#17a2b8'
    });
  }

  // Actualizar el método para verificar alertas periódicamente
  private iniciarActualizacionTemporizador(): void {
    this.intervaloActualizacion = setInterval(() => {
      this.tiempoActual = Date.now();

      // Verificar alertas cada 80 segundos
      const ahora = new Date();
      if (ahora.getSeconds() % 80 === 0) {
        this.verificarAlertasTemporizador();
      }
    }, 1000);
  }

  // ------------------------------------------------------
  // VER PAGARE GENERADO
  // ------------------------------------------------------
  // Método para ver el pagaré ya generado
  verPagareExistente(credito: any): void {
    this.cargando = true;

    this.pagareService.generarPagare(credito.id_credito).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        this.pdfPagareUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

        // Abrir modal o nueva ventana con el PDF
        this.abrirModalDocumentoExistente(credito, 'pagare', url);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al generar pagaré:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el pagaré generado anteriormente',
          confirmButtonText: 'Aceptar'
        });
        this.cargando = false;
      }
    });
  }

  // Método para ver la hoja de control ya generada
  verHojaControlExistente(credito: any): void {
    this.cargando = true;

    this.pagareService.generarHojaControl(credito.id_credito).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        this.pdfHojaControlUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

        // Abrir modal o nueva ventana con el PDF
        this.abrirModalDocumentoExistente(credito, 'hojaControl', url);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al generar hoja de control:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la hoja de control generada anteriormente',
          confirmButtonText: 'Aceptar'
        });
        this.cargando = false;
      }
    });
  }

  // Abrir modal para ver documento existente
  abrirModalDocumentoExistente(credito: any, tipoDocumento: string, pdfUrl: string): void {
    this.documentoActual = tipoDocumento;

    if (tipoDocumento === 'pagare') {
      this.pdfPagareUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
    } else {
      this.pdfHojaControlUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
    }

    // Mostrar modal con el documento
    this.mostrarModalDocumentoExistente(credito, tipoDocumento);
  }

  // Mostrar modal con SweetAlert
  mostrarModalDocumentoExistente(credito: any, tipoDocumento: string): void {
    const nombreCliente = this.getNombreCompletoCredito(credito);
    const tipoDocumentoTitulo = tipoDocumento === 'pagare' ? 'Pagaré' : 'Hoja de Control';

    Swal.fire({
      title: `${tipoDocumentoTitulo} - ${nombreCliente}`,
      html: `
      <div style="text-align: center;">
        <p><strong>Cliente:</strong> ${nombreCliente}</p>
        <p><strong>ID Crédito:</strong> ${credito.id_credito}</p>
        <p><strong>Estado:</strong> ${credito.estado_credito || 'PENDIENTE'}</p>
        <div style="margin: 20px 0;">
          <iframe 
            src="${tipoDocumento === 'pagare' ? this.pdfPagareUrl : this.pdfHojaControlUrl}" 
            width="100%" 
            height="400px" 
            style="border: 1px solid #ddd;">
          </iframe>
        </div>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: 'Descargar',
      cancelButtonText: 'Cerrar',
      showDenyButton: true,
      denyButtonText: tipoDocumento === 'pagare' ? 'Ver Hoja Control' : 'Ver Pagaré',
      width: '800px',
      didOpen: () => {
        // Asegurarse de que el iframe se cargue correctamente
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            console.log('Documento cargado correctamente');
          };
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Descargar documento
        if (tipoDocumento === 'pagare') {
          this.descargarPagareCredito(credito);
        } else {
          this.descargarHojaControlCredito(credito);
        }
      } else if (result.isDenied) {
        // Cambiar al otro documento
        if (tipoDocumento === 'pagare') {
          this.verHojaControlExistente(credito);
        } else {
          this.verPagareExistente(credito);
        }
      }
    });
  }

  // Método para descargar pagaré existente
  descargarPagareCredito(credito: any): void {
    this.pagareService.generarPagare(credito.id_credito).subscribe({
      next: (blob: Blob) => {
        const nombreArchivo = `pagare_${credito.id_credito}_${this.getNombreCompletoCredito(credito).replace(/\s+/g, '_')}.pdf`;
        this.descargarDocumento(blob, nombreArchivo);
        Swal.fire('Éxito', 'Pagaré descargado correctamente', 'success');
      },
      error: (error) => {
        console.error('Error al descargar pagaré:', error);
        Swal.fire('Error', 'No se pudo descargar el pagaré', 'error');
      }
    });
  }

  // Método para descargar hoja de control existente
  descargarHojaControlCredito(credito: any): void {
    this.pagareService.generarHojaControl(credito.id_credito).subscribe({
      next: (blob: Blob) => {
        const nombreArchivo = `hoja_control_${credito.id_credito}_${this.getNombreCompletoCredito(credito).replace(/\s+/g, '_')}.pdf`;
        this.descargarDocumento(blob, nombreArchivo);
        Swal.fire('Éxito', 'Hoja de control descargada correctamente', 'success');
      },
      error: (error) => {
        console.error('Error al descargar hoja de control:', error);
        Swal.fire('Error', 'No se pudo descargar la hoja de control', 'error');
      }
    });
  }


  // Métodos para abrir modales
  abrirModalGenerarCredito(solicitud: any) {
    this.solicitudSeleccionada = solicitud;
    this.modalGenerarCreditoAbierto = true;
    this.fechaMinistracion = '';
    this.fechaPrimerPago = '';
  }

  abrirModalGenerarPagare(solicitud: any) {
    this.solicitudSeleccionada = solicitud;
    // Cargar el crédito asociado a esta solicitud
    this.cargarCreditoPorSolicitud(solicitud.id_solicitud);
    this.modalGenerarPagareAbierto = true;
  }
  cargarCreditoPorSolicitud(id_solicitud: any) {
    throw new Error('Method not implemented.');
  }

  abrirModalGenerarPagareDesdeCredito(credito: any) {
    this.creditoRecienCreado = credito;
    // Construir objeto de solicitud desde el crédito
    this.solicitudSeleccionada = {
      id_solicitud: credito.solicitud_id,
      nombre_cliente: credito.nombre_cliente,
      app_cliente: credito.app_cliente,
      apm_cliente: credito.apm_cliente,
      monto_aprobado: credito.monto_aprobado,
      tasa_fija_formateada: credito.tasa_interes,
      aliado_nombre: credito.nom_aliado,
      tipo_credito: credito.tipo_credito,
      dia_pago: credito.dia_pago
    };
    this.modalGenerarPagareAbierto = true;
  }

  // Métodos para cerrar modales
  cerrarModalGenerarCredito() {
    this.modalGenerarCreditoAbierto = false;
    this.solicitudSeleccionada = null;
  }

  cerrarModalGenerarPagare() {
    this.modalGenerarPagareAbierto = false;
    this.solicitudSeleccionada = null;
    this.creditoRecienCreado = null;
  }

  verDetallesCreditoExistente(solicitud: any): void {
    const creditoExistente = this.creditos.find(c =>
      c.solicitud_id === solicitud.id_solicitud
    );

    if (!creditoExistente) {
      Swal.fire({
        icon: 'info',
        title: 'Sin Crédito',
        text: 'No se encontró ningún crédito para esta solicitud',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const tiempoRestante = this.getTiempoRestante(creditoExistente);
    const estadoCredito = creditoExistente.estado_credito || 'PENDIENTE';

    // Determinar el icono según el estado
    let iconoEstado = 'info';
    if (estadoCredito === 'ENTREGADO') iconoEstado = 'success';
    if (estadoCredito === 'DEVOLUCION') iconoEstado = 'error';
    if (estadoCredito === 'PENDIENTE') iconoEstado = 'warning';

    Swal.fire({
      icon: iconoEstado as any,
      title: 'Detalles del Crédito Existente',
      html: `
      <div style="text-align: left; padding: 10px;">
        <div class="mb-3">
          <h5 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 5px;">
            <i class="fas fa-info-circle"></i> Información General
          </h5>
          
          <p><strong>Cliente:</strong> ${this.getNombreCompletoCredito(creditoExistente)}</p>
          
        </div>

        <div class="mb-3">
          <h5 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 5px;">
            <i class="fas fa-dollar-sign"></i> Información Financiera
          </h5>
          <p><strong>Monto Total:</strong> ${this.formatearMoneda(creditoExistente.total_a_pagar)}</p>
          
          ${creditoExistente.tasa_interes ? `<p><strong>Tasa de Interés:</strong> ${creditoExistente.tasa_interes}%</p>` : ''}
        </div>

        <div class="mb-3">
          <h5 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 5px;">
            <i class="fas fa-calendar-alt"></i> Fechas
          </h5>
          <p><strong>Fecha Ministración:</strong> ${this.formatearFecha(creditoExistente.fecha_ministracion)}</p>
          <p><strong>Fecha Primer Pago:</strong> ${this.formatearFecha(creditoExistente.fecha_primer_pago)}</p>
          ${estadoCredito === 'PENDIENTE' || !estadoCredito ?
          `<p><strong>Tiempo Restante:</strong> <span style="color: ${tiempoRestante.esCritico ? '#dc3545' : tiempoRestante.esAdvertencia ? '#ffc107' : '#28a745'}; font-weight: bold;">
              <i class="fas fa-clock"></i> ${tiempoRestante.texto}
            </span></p>` : ''}
        </div>

        ${creditoExistente.nom_aliado ?
          `<div class="mb-3">
            <h5 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 5px;">
              <i class="fas fa-handshake"></i> Aliado
            </h5>
            <p><strong>Aliado:</strong> ${creditoExistente.nom_aliado}</p>
          </div>` : ''}
      </div>
    `,
      width: '600px',
      showCancelButton: true,
      // confirmButtonText: '<i class="fas fa-file-pdf"></i> Ver Documentos',
      cancelButtonText: 'Cerrar',
      // confirmButtonColor: '#17a2b8',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar opciones de documentos
        this.mostrarOpcionesDocumentos(creditoExistente);
      }
    });
  }

  getBadgeColor(estado: string | null): string {
    if (!estado) return 'secondary';

    switch (estado.toUpperCase()) {
      case 'PENDIENTE':
        return 'warning';
      case 'ENTREGADO':
        return 'success';
      case 'DEVOLUCION':
        return 'danger';
      case 'FINALIZADO':
      case 'LIQUIDADO':
        return 'info';
      default:
        return 'light';
    }
  }

  // Método para mostrar opciones de documentos
  mostrarOpcionesDocumentos(credito: any): void {
    Swal.fire({
      title: 'Documentos del Crédito',
      html: `
      <div style="text-align: center;">
        <p>Seleccione el documento que desea visualizar:</p>
        <p><strong>Crédito ID:</strong> ${credito.id_credito}</p>
        <p><strong>Cliente:</strong> ${this.getNombreCompletoCredito(credito)}</p>
      </div>
    `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-file-contract"></i> Ver Pagaré',
      denyButtonText: '<i class="fas fa-clipboard-list"></i> Ver Hoja de Control',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#28a745',
      denyButtonColor: '#17a2b8',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.verPagareExistente(credito);
      } else if (result.isDenied) {
        this.verHojaControlExistente(credito);
      }
    });
  }


  getClaseBotonGenerarCredito(solicitud: any): string {
    if (!solicitud.domiciliado) {
      return 'btn-action-main btn-secondary';
    }

    if (!this.puedeGenerarCredito(solicitud)) {
      return 'btn-action-main btn-warning';
    }

    return 'btn-action-main btn-primary';
  }

  getTooltipGenerarCredito(solicitud: any): string {
    if (!solicitud.domiciliado) {
      return 'No domiciliado - Debe completar domiciliación';
    }

    if (!this.puedeGenerarCredito(solicitud)) {
      const estadoExistente = this.obtenerEstadoCreditoExistente(solicitud);
      const idCredito = this.obtenerIdCreditoExistente(solicitud);
      return `Ya tiene crédito #${idCredito} en estado: ${estadoExistente}`;
    }

    return 'Generar Crédito - Cliente listo para ministración';
  }

  getIconoBotonGenerarCredito(solicitud: any): string {
    if (!solicitud.domiciliado) {
      return 'fas fa-ban';
    }

    if (!this.puedeGenerarCredito(solicitud)) {
      return 'fas fa-exclamation-triangle';
    }

    return 'fas fa-file-invoice-dollar';
  }

  getTextoBotonGenerarCredito(solicitud: any): string {
    if (!solicitud.domiciliado) {
      return 'Sin Domiciliar';
    }

    if (!this.puedeGenerarCredito(solicitud)) {
      return 'Crédito Existente';
    }

    return 'Generar Crédito';
  }



  puedeGenerarCredito(solicitud: any): boolean {
    // Buscar si existe CUALQUIER crédito para esta solicitud
    const creditoExistente = this.creditos.find(c =>
      c.solicitud_id === solicitud.id_solicitud
    );
    return !creditoExistente;
  }

  obtenerEstadoCreditoExistente(solicitud: any): string {
    if (!solicitud || !solicitud.creditoExistente) {
      return 'DESCONOCIDO';
    }
    return solicitud.creditoExistente.estado || 'DESCONOCIDO';
  }



  // Método para obtener el ID del crédito existente
  obtenerIdCreditoExistente(solicitud: any): number | null {
    const creditoExistente = this.creditos.find(c =>
      c.solicitud_id === solicitud.id_solicitud
    );

    return creditoExistente ? creditoExistente.id_credito : null;
  }

  convertirTasaAporcentaje(tasa: number | null): string {
    if (!tasa) return '0%';
    const porcentajeEntero = Math.round(tasa * 100);
    return `${porcentajeEntero}%`;
  }



  // ------------------------------------------------------
  // EDITAR FECHA MINISTRACION Y PRIMER PAGO
  // ------------------------------------------------------
  // Método para abrir modal de edición de fechas
  editarFechasCredito(credito: any): void {
    this.creditoSeleccionado = credito;
    
    // Convertir fechas a formato YYYY-MM-DD para los inputs
    this.nuevaFechaMinistracion = credito.fecha_ministracion 
      ? credito.fecha_ministracion.split('T')[0] 
      : '';
    
    this.nuevaFechaPrimerPago = credito.fecha_primer_pago 
      ? credito.fecha_primer_pago.split('T')[0] 
      : '';
    
    this.modalEditarFechasAbierto = true;
  }


  
// Método para guardar las nuevas fechas
guardarFechasCredito(): void {
  if (!this.creditoSeleccionado || !this.nuevaFechaMinistracion || !this.nuevaFechaPrimerPago) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Debe completar ambas fechas',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  // Validar que fecha de primer pago sea posterior a fecha de ministración
  const fechaMin = new Date(this.nuevaFechaMinistracion);
  const fechaPago = new Date(this.nuevaFechaPrimerPago);
  
  if (fechaPago <= fechaMin) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'La fecha del primer pago debe ser posterior a la fecha de ministración',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  this.procesandoEntrega = true;

  // Datos a actualizar
  const datosActualizacion = {
    fecha_ministracion: this.nuevaFechaMinistracion,
    fecha_primer_pago: this.nuevaFechaPrimerPago
  };

  // Aquí necesitarás un método en tu servicio para actualizar solo las fechas
  // Suponiendo que tienes un método updateCredito o similar
  this.creditoService.actualizarCredito(this.creditoSeleccionado.id_credito, datosActualizacion).subscribe({
    next: (response) => {
      Swal.fire({
        icon: 'success',
        title: '¡Fechas actualizadas!',
        text: 'Las fechas han sido actualizadas correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      
      this.modalEditarFechasAbierto = false;
      this.procesandoEntrega = false;
      
      // Recargar créditos para reflejar los cambios
      this.cargarCreditos();
    },
    error: (error) => {
      console.error('Error al actualizar fechas:', error);
      this.procesandoEntrega = false;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron actualizar las fechas',
        confirmButtonText: 'Aceptar'
      });
    }
  });
}

// Método para cerrar el modal de edición
cerrarModalEditarFechas(): void {
  this.modalEditarFechasAbierto = false;
  this.creditoSeleccionado = null;
  this.nuevaFechaMinistracion = '';
  this.nuevaFechaPrimerPago = '';
}

// Método para marcar como pendiente después de confirmar fechas
marcarComoPendienteConFecha(credito: any): void {
  Swal.fire({
    title: '¿Marcar como PENDIENTE?',
    html: `
      <div style="text-align: left;">
        <p><strong>Crédito ID:</strong> ${credito.id_credito}</p>
        <p><strong>Cliente:</strong> ${this.getNombreCompletoCredito(credito)}</p>
        <p><strong>Fecha de Ministración:</strong> ${this.formatearFecha(credito.fecha_ministracion)}</p>
        <p><strong>Fecha Primer Pago:</strong> ${this.formatearFecha(credito.fecha_primer_pago)}</p>
        <hr>
        <p class="text-muted">
          <i class="fas fa-info-circle"></i> 
          ¿Desea editar las fechas antes de marcar como pendiente?
        </p>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Marcar como Pendiente',
    denyButtonText: 'Editar Fechas Primero',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#28a745',
    denyButtonColor: '#ffc107',
    cancelButtonColor: '#d33'
  }).then((result) => {
    if (result.isConfirmed) {
      // Marcar directamente como pendiente
      this.marcarComoPendiente(credito);
    } else if (result.isDenied) {
      // Abrir modal para editar fechas primero
      this.editarFechasCredito(credito);
    }
  });
}


// Método auxiliar para obtener fecha mínima (hoy)
getFechaMinima(): string {
  return new Date().toISOString().split('T')[0];
}

}