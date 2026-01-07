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
  parseInt(arg0: string, arg1: number) {
    throw new Error('Method not implemented.');
  }

  solicitudesAprobadas: any[] = [];
  clientesFiltrados: any[] = [];
  solicitudesRecientes: any[] = [];

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

  // Cargar todos los datos iniciales
  // cargarDatosIniciales(): void {
  //   this.cargando = true;

  //   forkJoin({
  //     aliados: this.aliadoService.obtenerAliados(),
  //     solicitudes: this.solicitudService.obtenerSolicitudesPorEstado('APROBADO')
  //   }).subscribe({
  //     next: (result) => {
  //       this.aliados = result.aliados;
  //       this.solicitudesAprobadas = result.solicitudes;

  //       // ASIGNAR INFORMACIÓN DEL ALIADO A CADA SOLICITUD
  //       this.solicitudesAprobadas.forEach(solicitud => {
  //         this.asignarAliadoASolicitud(solicitud);
  //       });

  //       // Ordenar por fecha de aprobación (más reciente primero)
  //       this.solicitudesAprobadas.sort((a, b) => {
  //         const fechaA = new Date(a.fecha_aprobacion || 0);
  //         const fechaB = new Date(b.fecha_aprobacion || 0);
  //         return fechaB.getTime() - fechaA.getTime();
  //       });

  //       // Tomar solo las 6 solicitudes más recientes
  //       this.solicitudesRecientes = this.solicitudesAprobadas.slice(0, 6);

  //       // Para mantener compatibilidad con el filtro, inicializamos clientesFiltrados con las 6 más recientes
  //       this.clientesFiltrados = [...this.solicitudesRecientes];
  //       this.cargando = false;
  //     },
  //     error: (error) => {
  //       console.error('Error al cargar datos:', error);
  //       this.cargando = false;
  //       Swal.fire({
  //         icon: 'error',
  //         title: 'Error',
  //         text: 'Error al cargar los datos iniciales',
  //         confirmButtonText: 'Aceptar'
  //       });
  //     }
  //   });
  // }

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

  // Cargar créditos
  // cargarCreditos(): void {
  //   this.cargandoCreditos = true;
  //   this.creditoService.obtenerCreditos().subscribe({
  //     next: (creditos) => {
  //       this.creditos = creditos;
  //       this.cargandoCreditos = false;
  //     },
  //     error: (error) => {
  //       console.error('Error al cargar créditos:', error);
  //       this.cargandoCreditos = false;
  //       Swal.fire({
  //         icon: 'error',
  //         title: 'Error',
  //         text: 'Error al cargar los créditos',
  //         confirmButtonText: 'Aceptar'
  //       });
  //     }
  //   });
  // }
  // Modifica el método cargarCreditos:
  // cargarCreditos(): void {
  //   this.cargandoCreditos = true;
  //   this.creditoService.obtenerCreditos().subscribe({
  //     next: (creditos) => {
  //       // Ordenar créditos por ID de mayor a menor
  //       this.creditos = creditos.sort((a, b) => {
  //         const idA = Number(a.id_credito) || 0;
  //         const idB = Number(b.id_credito) || 0;
  //         return idB - idA; // Orden descendente (mayor a menor)
  //       });
  //       this.cargandoCreditos = false;
  //     },
  //     error: (error) => {
  //       console.error('Error al cargar créditos:', error);
  //       this.cargandoCreditos = false;
  //       Swal.fire({
  //         icon: 'error',
  //         title: 'Error',
  //         text: 'Error al cargar los créditos',
  //         confirmButtonText: 'Aceptar'
  //       });
  //     }
  //   });
  // }

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
  // buscar(): void {
  //   this.clientesFiltrados = this.solicitudesRecientes.filter(solicitud => {
  //     const coincideNombre = this.filtroNombre ?
  //       solicitud.nombre_cliente.toLowerCase().includes(this.filtroNombre.toLowerCase()) : true;

  //     const coincideApPaterno = this.filtroApPaterno ?
  //       solicitud.app_cliente.toLowerCase().includes(this.filtroApPaterno.toLowerCase()) : true;

  //     return coincideNombre && coincideApPaterno;
  //   });
  // }
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

  // Método para calcular el tiempo restante (48 horas desde fecha_ministracion)
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
    
    const fechaMinistracion = new Date(credito.fecha_ministracion);
    const fechaLimite = new Date(fechaMinistracion);
    
    // Agregar 48 horas (2 días) a la fecha de ministración
    fechaLimite.setHours(fechaLimite.getHours() + 48);
    
    const ahora = this.tiempoActual;
    const tiempoTotalMs = 48 * 60 * 60 * 1000; // 48 horas en milisegundos
    const tiempoTranscurridoMs = ahora - fechaMinistracion.getTime();
    const tiempoRestanteMs = fechaLimite.getTime() - ahora;
    
    // Si ya pasó el tiempo
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
    
    // Calcular horas, minutos y segundos
    const horas = Math.floor(tiempoRestanteMs / (1000 * 60 * 60));
    const minutos = Math.floor((tiempoRestanteMs % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((tiempoRestanteMs % (1000 * 60)) / 1000);
    
    // Formatear como HH:MM:SS
    const texto = `${this.padZero(horas)}:${this.padZero(minutos)}:${this.padZero(segundos)}`;
    
    // Calcular porcentaje transcurrido
    const porcentajeTranscurrido = Math.min((tiempoTranscurridoMs / tiempoTotalMs) * 100, 100);
    const porcentajeFormateado = porcentajeTranscurrido.toFixed(2); 

    // Determinar si es crítico (menos de 12 horas) o advertencia (menos de 24 horas)
    const esCritico = horas < 12;
    const esAdvertencia = horas < 24 && horas >= 12;
    
    return {
      hayFecha: true,
      texto,
      esCritico,
      esAdvertencia,
      porcentaje: porcentajeFormateado,
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
}