// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { SolicitudService } from '../../../../services/solicitud.service';
// import { AuthService, User } from '../../../../services/auth.service';
// import Swal from 'sweetalert2';
// import { HttpErrorResponse } from '@angular/common/http';
// import { Subscription } from 'rxjs';

// // Interfaces para tipado
// interface Solicitud {
//   id_solicitud: number;
//   cliente_id: number;
//   usuario_id: number;
//   fecha_creacion: string;
//   monto_solicitado: number;
//   plazo_meses: number;
//   no_pagos: number;
//   tipo_vencimiento: string;
//   estado: string;
//   observaciones?: string;
//   fecha_aprobacion?: string;
//   monto_aprobado?: number;
//   dia_pago?: number;
//   tipo_credito?: string;
//   aliado_id?: number;
//   aval_id?: number;
//   domiciliado?: boolean | null;
//   domiciliacion_fecha?: string;
//   domiciliacion_horario?: string;
//   persona_recibio?: string;
//   coordinador_id?: number;
//   fecha_domiciliacion?: string;

//   // Campos adicionales del JOIN
//   nombre_cliente?: string;
//   app_cliente?: string;
//   apm_cliente?: string;
//   telefono?: string;
//   folio_cliente?: string;
//   nombre_aliado?: string;
//   nom_aliado?: string;
//   cliente_localidad?: string;
//   cliente_calle?: string;
//   cliente_numero?: string;
//   cliente_municipio?: string;

//   // Valores del aval
//   nombre_aval?: string;
//   app_aval?: string;
//   apm_aval?: string;
//   telefono_aval?: string;
//   aval_calle?: string;
//   aval_numero?: string;
//   aval_localidad?: string;
//   aval_municipio?: string;
// }

// interface Estado {
//   valor: string;
//   texto: string;
// }

// @Component({
//   selector: 'app-credit-address',
//   imports: [CommonModule, FormsModule],
//   standalone: true,
//   templateUrl: './credit-address.component.html',
//   styleUrls: ['./credit-address.component.css']
// })
// export class CreditAddressComponent implements OnInit, OnDestroy {
//   // Estados
//   solicitudes: Solicitud[] = [];
//   solicitudSeleccionada: Solicitud | null = null;
//   filtroEstado: string = 'PENDIENTE'; // CORREGIDO: Cambiar a APROBADO (no PENDIENTE)
//   loading: boolean = true;
//   modalVisible: boolean = false;
//   horario: string = '';
//   personaRecibio: string = '';
//   fechaDomiciliacion: string = '';
//   coordinadorId: number = 0;
//   filtroAliado: string = '';
//   aliados: string[] = [];
//   usuarioActual: User | null = null;

//   // Suscripciones
//   private usuarioSubscription: Subscription | null = null;

//   // Estados disponibles - CORREGIDO
//   estados: Estado[] = [
//     { valor: 'PENDIENTE', texto: 'Aprobadas por domiciliar' }, // Cambiado de PENDIENTE a APROBADO
//     { valor: 'DOMICILIADA', texto: 'Domiciliadas' },
//     { valor: 'todos', texto: 'Todas' }
//   ];
//   verificarUsuarioEnLocalStorage: any;

//   constructor(
//     private solicitudService: SolicitudService,
//     private authService: AuthService
//   ) { }

//   ngOnInit(): void {
//     this.obtenerUsuarioActual();
//     this.cargarSolicitudes();
//   }

//   ngOnDestroy(): void {
//     if (this.usuarioSubscription) {
//       this.usuarioSubscription.unsubscribe();
//     }
//   }

//   // Obtener usuario actual
//   obtenerUsuarioActual(): void {
//     // Opción 1: Suscribirse al observable
//     this.usuarioSubscription = this.authService.currentUser$.subscribe({
//       next: (usuario: User | null) => {
//         this.actualizarUsuario(usuario);
//       },
//       error: (error) => {
//         console.error('Error al obtener usuario:', error);
//         this.obtenerUsuarioDeFormaDirecta();
//       }
//     });

//     // También obtener valor actual inmediatamente
//     this.obtenerUsuarioDeFormaDirecta();
//   }

//   obtenerUsuarioDeFormaDirecta(): void {
//     const usuario = this.authService.getCurrentUser();

//     if (usuario) {
//       this.actualizarUsuario(usuario);
//       console.log('Usuario obtenido de forma directa:', usuario);

//       // Verificar que tenga token de Firebase
//       this.verificarTokenDisponible();
//     } else {
//       console.warn('No se pudo obtener el usuario de forma directa.');
//       this.verificarUsuarioEnLocalStorage();
//     }
//   }

//   // Verificar si hay token disponible
//   verificarTokenDisponible(): void {
//     this.authService.getFirebaseToken().then((token: string) => {
//       console.log('Token disponible, longitud:', token.length);
//     }).catch((error: any) => {
//       console.warn('No se pudo obtener token:', error);
//       Swal.fire({
//         icon: 'warning',
//         title: 'Sesión expirada',
//         text: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
//         confirmButtonText: 'Aceptar',
//         confirmButtonColor: '#ffc107'
//       });
//     });
//   }

//   // Actualizar usuario en el componente
//   actualizarUsuario(usuario: User | null): void {
//     if (usuario) {
//       this.usuarioActual = usuario;
//       this.coordinadorId = usuario.id_usuario;

//       // Verificar si es coordinador (rol_id 3 según tus logs)
//       if (usuario.rol_id !== 3) {
//         console.warn('El usuario no es coordinador. Rol ID:', usuario.rol_id);
//         this.mostrarErrorPermisos();
//       } else {
//         console.log('Usuario coordinador identificado:', {
//           id: usuario.id_usuario,
//           nombre: usuario.nombre,
//           rol: usuario.nombre_rol || `Rol ID: ${usuario.rol_id}`
//         });
//       }
//     } else {
//       this.usuarioActual = null;
//       this.coordinadorId = 0;
//     }
//   }

//   // Método para cargar solicitudes 
//   cargarSolicitudes(): void {
//     this.loading = true;

//     this.solicitudService.obtenerSolicitudes().subscribe({
//       next: (solicitudes: Solicitud[]) => {
//         // FILTRAR SOLO SOLICITUDES APROBADAS NO DOMICILIADAS
//         this.solicitudes = solicitudes.filter(s =>
//           s.estado === 'PENDIENTE' &&
//           (s.domiciliado === false || s.domiciliado === null)
//         );

//         console.log(`Solicitudes PENDIENTES no domiciliadas: ${this.solicitudes.length}`);

//         this.procesarSolicitudes(this.solicitudes);
//         this.loading = false;
//       },
//       error: (error: HttpErrorResponse) => {
//         console.error('Error al cargar solicitudes:', error);

//         Swal.fire({
//           icon: 'error',
//           title: 'Error al cargar',
//           text: 'No se pudieron cargar las solicitudes. Verifique la conexión.',
//           confirmButtonText: 'Reintentar',
//           confirmButtonColor: '#dc3545'
//         }).then(() => {
//           this.cargarSolicitudes();
//         });

//         this.loading = false;
//       }
//     });
//   }

//   // Procesar solicitudes
//   procesarSolicitudes(solicitudes: Solicitud[]): void {
//     // Extraer aliados únicos para el filtro
//     const aliadosUnicos = new Set<string>();
//     solicitudes.forEach(s => {
//       const nombreAliado = s.nombre_aliado || s.nom_aliado;
//       if (nombreAliado) {
//         aliadosUnicos.add(nombreAliado);
//       }
//     });
//     this.aliados = Array.from(aliadosUnicos);

//     // Ordenar por fecha de aprobación más reciente primero
//     this.solicitudes.sort((a, b) => {
//       const fechaA = a.fecha_aprobacion ? new Date(a.fecha_aprobacion).getTime() :
//         a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
//       const fechaB = b.fecha_aprobacion ? new Date(b.fecha_aprobacion).getTime() :
//         b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
//       return fechaB - fechaA;
//     });
//   }

//   // Filtrar solicitudes según estado y aliado
//   get solicitudesFiltradas(): Solicitud[] {
//     return this.solicitudes.filter(solicitud => {
//       const coincideEstado = this.filtroEstado === 'todos' || solicitud.estado === this.filtroEstado;
//       const nombreAliado = solicitud.nombre_aliado || solicitud.nom_aliado || '';
//       const coincideAliado = !this.filtroAliado || nombreAliado === this.filtroAliado;
//       return coincideEstado && coincideAliado;
//     });
//   }

//   // Manejar selección de solicitud
//   seleccionarSolicitud(solicitud: Solicitud): void {
//     // Verificar permisos antes de seleccionar
//     if (!this.verificarPermisosCoordinador()) {
//       return;
//     }

//     this.solicitudSeleccionada = solicitud;

//     // Inicializar campos
//     this.horario = solicitud.domiciliacion_horario || '';
//     this.personaRecibio = solicitud.persona_recibio || '';
//     this.fechaDomiciliacion = solicitud.fecha_domiciliacion ||
//       solicitud.domiciliacion_fecha ||
//       this.obtenerFechaActual();

//     this.modalVisible = true;
//   }

//   // Verificar permisos del coordinador
//   verificarPermisosCoordinador(): boolean {
//     if (!this.usuarioActual) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Usuario no identificado',
//         text: 'No se pudo identificar su usuario. Por favor, inicie sesión nuevamente.',
//         confirmButtonText: 'Aceptar',
//         confirmButtonColor: '#ffc107'
//       });
//       return false;
//     }

//     if (this.usuarioActual.rol_id !== 3) {
//       this.mostrarErrorPermisos();
//       return false;
//     }

//     return true;
//   }

//   // Mostrar error de permisos
//   mostrarErrorPermisos(): void {
//     Swal.fire({
//       icon: 'error',
//       title: 'Acceso restringido',
//       html: `
//         <div style="text-align: left;">
//           <p>Solo los coordinadores pueden acceder a esta funcionalidad.</p>
//           <p><strong>Usuario actual:</strong> ${this.usuarioActual?.nombre || 'No identificado'}</p>
//           <p><strong>Rol:</strong> ${this.usuarioActual?.nombre_rol || `ID: ${this.usuarioActual?.rol_id}`}</p>
//           <p><strong>Rol requerido:</strong> Coordinador (ID: 3)</p>
//         </div>
//       `,
//       confirmButtonText: 'Entendido',
//       confirmButtonColor: '#dc3545'
//     });
//   }

//   // Validar antes de domiciliar
//   validarAntesDeDomiciliar(): boolean {
//     // Validar que se haya obtenido el coordinador ID
//     if (this.coordinadorId === 0) {
//       Swal.fire({
//         icon: 'error',
//         title: 'Usuario no identificado',
//         text: 'No se pudo identificar su usuario. Por favor, inicie sesión nuevamente.',
//         confirmButtonText: 'Aceptar',
//         confirmButtonColor: '#dc3545'
//       });
//       return false;
//     }

//     // Validar que el usuario sea coordinador (rol_id 3 según tus logs)
//     if (this.usuarioActual && this.usuarioActual.rol_id !== 3) {
//       this.mostrarErrorPermisos();
//       return false;
//     }

//     return true;
//   }

//   // Marcar como domiciliada
//   marcarDomiciliada(): void {
//     // Validar campos primero
//     if (!this.horario.trim()) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Horario requerido',
//         text: 'Por favor, ingrese el horario de la domiciliación',
//         confirmButtonText: 'Aceptar',
//         confirmButtonColor: '#ffc107'
//       });
//       return;
//     }

//     if (!this.personaRecibio.trim()) {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Persona que recibió requerida',
//         text: 'Por favor, ingrese el nombre de la persona que recibió',
//         confirmButtonText: 'Aceptar',
//         confirmButtonColor: '#ffc107'
//       });
//       return;
//     }

//     // Validar usuario y permisos
//     if (!this.validarAntesDeDomiciliar()) {
//       return;
//     }

//     // Mostrar confirmación
//     this.mostrarConfirmacionDomiciliacion();
//   }

//   // Mostrar confirmación
//   mostrarConfirmacionDomiciliacion(): void {
//     Swal.fire({
//       title: '¿Confirmar domiciliación?',
//       html: `
//         <div style="text-align: left; margin: 10px 0;">
//           <p><strong>Cliente:</strong> ${this.getNombreCompleto(this.solicitudSeleccionada!)}</p>
//           <p><strong>Dirección:</strong> ${this.getDireccionCompleta(this.solicitudSeleccionada!)}</p>
//           <p><strong>Teléfono:</strong> ${this.getTelefonoFormateado(this.solicitudSeleccionada!)}</p>
//           <p><strong>Fecha domiciliación:</strong> ${this.fechaDomiciliacion}</p>
//           <p><strong>Horario:</strong> ${this.horario}</p>
//           <p><strong>Persona que recibió:</strong> ${this.personaRecibio}</p>
//           <p><strong>Registrado por:</strong> ${this.usuarioActual?.nombre || 'Coordinador'}</p>
//           <p><strong>ID Coordinador:</strong> ${this.coordinadorId}</p>
//         </div>
//       `,
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, confirmar domiciliación',
//       cancelButtonText: 'Cancelar',
//       confirmButtonColor: '#28a745',
//       cancelButtonColor: '#dc3545'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.procesarDomiciliacion();
//       }
//     });
//   }

//   procesarDomiciliacion(): void {
//     if (!this.solicitudSeleccionada) return;

//     const datosDomiciliacion = {
//       horario: this.horario,
//       persona_recibio: this.personaRecibio,
//       fecha_domiciliacion: this.fechaDomiciliacion
//     };

//     this.solicitudService.actualizarDomiciliacion(
//       this.solicitudSeleccionada.id_solicitud,
//       datosDomiciliacion
//     ).subscribe({
//       next: (response) => {
//         this.actualizarSolicitudLocalmente(response.data || response);
//         this.mostrarExito('¡Domiciliación exitosa!', response.message);
//         this.cerrarModal();
//       },
//       error: (error) => this.mostrarErrorDomiciliacion(error)
//     });
//   }


//   // Manejar errores de domiciliación
//   mostrarErrorDomiciliacion(error: HttpErrorResponse): void {
//     let mensajeError = 'Error desconocido';
//     let tituloError = 'Error al domiciliar';

//     if (error.status === 401) {
//       tituloError = 'No autorizado (401)';
//       mensajeError = 'No tiene permisos para realizar esta acción. El token de autenticación puede ser inválido o haber expirado. Por favor, inicie sesión nuevamente.';
//     } else if (error.status === 403) {
//       tituloError = 'Acceso denegado';
//       mensajeError = 'No tiene permisos para domiciliar solicitudes. Solo coordinadores pueden realizar esta acción.';
//     } else if (error.status === 404) {
//       tituloError = 'Solicitud no encontrada';
//       mensajeError = 'La solicitud no existe o ya ha sido procesada.';
//     } else if (error.status === 400) {
//       tituloError = 'Datos inválidos';
//       mensajeError = error.error?.detalle || 'Los datos enviados no son válidos para domiciliación.';
//     } else if (error.status === 500) {
//       tituloError = 'Error del servidor';
//       mensajeError = 'Ocurrió un error interno en el servidor. Intente nuevamente.';
//     } else {
//       mensajeError = error.error?.detalle || error.message || 'Error del servidor';
//     }

//     Swal.fire({
//       icon: 'error',
//       title: tituloError,
//       html: `
//         <div style="text-align: left;">
//           <p>${mensajeError}</p>
//           ${error.status ? `<p><small>Código de error: ${error.status}</small></p>` : ''}
//         </div>
//       `,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#dc3545'
//     });
//   }

//   // Actualizar solicitud localmente
//   actualizarSolicitudLocalmente(solicitudActualizada: any): void {
//     if (!this.solicitudSeleccionada) return;

//     const indice = this.solicitudes.findIndex(
//       s => s.id_solicitud === this.solicitudSeleccionada!.id_solicitud
//     );

//     if (indice !== -1) {
//       // Actualizar con los datos del servidor
//       this.solicitudes[indice] = {
//         ...this.solicitudes[indice],
//         ...solicitudActualizada,
//         domiciliado: true, // Asegurar que se marque como domiciliado
//         estado: 'PENDIENTE' // Mantener estado como PENDIENTE 
//       };

//       // Remover de la lista (ya está domiciliada)
//       this.solicitudes.splice(indice, 1);
//     }
//   }

//   // Obtener fecha actual
//   obtenerFechaActual(): string {
//     return new Date().toISOString().split('T')[0];
//   }

//   // Cerrar modal
//   cerrarModal(): void {
//     this.modalVisible = false;
//     this.solicitudSeleccionada = null;
//     this.horario = '';
//     this.personaRecibio = '';
//     this.fechaDomiciliacion = this.obtenerFechaActual();
//   }

//   // Limpiar filtros
//   limpiarFiltros(): void {
//     this.filtroEstado = 'PENDIENTE';
//     this.filtroAliado = '';
//   }

//   // Métodos auxiliares
//   getEstadoClass(estado: string): string {
//     switch (estado) {
//       case 'PENDIENTE': return 'estado-pendiente';
//       case 'APROBADO': return 'estado-aprobada';
//       case 'DOMICILIADA': return 'estado-domiciliada';
//       default: return '';
//     }
//   }

//   getEstadoText(estado: string): string {
//     switch (estado) {
//       case 'PENDIENTE': return 'Pendiente';
//       case 'APROBADO': return 'Aprobada';
//       case 'DOMICILIADA': return 'Domiciliada';
//       default: return estado;
//     }
//   }

//   getNombreCompleto(solicitud: Solicitud): string {
//     const nombre = solicitud.nombre_cliente || '';
//     const app = solicitud.app_cliente || '';
//     const apm = solicitud.apm_cliente || '';
//     return `${nombre} ${app} ${apm}`.trim() || `Cliente ID: ${solicitud.cliente_id}`;
//   }

//   getDireccionCompleta(solicitud: Solicitud): string {
//     const partes = [];
//     if (solicitud.cliente_calle) partes.push(solicitud.cliente_calle);
//     if (solicitud.cliente_numero) partes.push(`#${solicitud.cliente_numero}`);
//     if (solicitud.cliente_localidad) partes.push(solicitud.cliente_localidad);
//     if (solicitud.cliente_municipio) partes.push(solicitud.cliente_municipio);
//     return partes.join(', ') || 'Sin dirección especificada';
//   }

//   getTelefonoFormateado(solicitud: any): string {
//     const posibles = [
//       solicitud?.telefono,
//       solicitud?.cliente?.telefono,
//       solicitud?.contacto?.telefono,
//       solicitud?.telefonoPrincipal,
//       solicitud?.telefonoSecundario
//     ];

//     // escoger el primer valor no vacío
//     let raw = posibles.find(v => v !== undefined && v !== null && v !== '') ?? '';

//     // si viene como array, tomar el primero
//     if (Array.isArray(raw)) raw = raw[0] ?? '';

//     raw = String(raw).trim();
//     const digits = raw.replace(/\D/g, '');

//     if (!digits) return 'N/A';

//     let d = digits;

//     // Normalizar eliminando prefijos comunes (ej. +52, 0052, 52, leading 1)
//     // Tomar últimos 10 dígitos si vienen con código de país u otros prefijos
//     if (d.length > 10) {
//       // si empieza con '52' y tiene al menos 12 dígitos, tomar los últimos 10
//       if (d.startsWith('52') && d.length >= 12) d = d.slice(-10);
//       // si tiene 11 dígitos y comienza con '1' (ej. formato norteamericano) quitar el '1'
//       else if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
//       // en cualquier otro caso largo, tomar los últimos 10 dígitos por seguridad
//       else if (d.length > 10) d = d.slice(-10);
//     }

//     // Formatos esperados
//     if (d.length === 10) {
//       return `(${d.substring(0, 3)}) ${d.substring(3, 6)}-${d.substring(6)}`;
//     }
//     if (d.length === 7) { // formato local corto
//       return `${d.substring(0, 3)}-${d.substring(3)}`;
//     }

//     // Si no se puede formatear, devolver el raw original (más legible) o los dígitos
//     return raw || digits;
//   }


//   getNombreAliado(solicitud: Solicitud): string {
//     return solicitud.nombre_aliado || solicitud.nom_aliado || 'Sin aliado asignado';
//   }

//   formatearFecha(fecha: string): string {
//     if (!fecha) return 'No especificada';
//     try {
//       return new Date(fecha).toLocaleDateString('es-MX', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric'
//       });
//     } catch {
//       return 'Fecha inválida';
//     }
//   }

//   formatearMoneda(monto: number): string {
//     if (!monto && monto !== 0) return '$0.00';
//     return new Intl.NumberFormat('es-MX', {
//       style: 'currency',
//       currency: 'MXN'
//     }).format(monto);
//   }

//   actualizarDatos(): void {
//     this.loading = true;
//     this.cargarSolicitudes();
//   }

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
//     const mensaje = typeof error === 'string' ? error :
//       error?.error?.detalle || error?.error?.error || error?.message || 'Error desconocido';

//     Swal.fire({
//       icon: 'error',
//       title: titulo,
//       text: mensaje,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#dc3545'
//     });
//   }

//   getTelefonoNumerico(solicitud: Solicitud): string {
//     const telefono = solicitud.telefono || '';
//     return telefono.toString().replace(/\D/g, '');
//   }



//   // -------------------------------------
//   // ---- METODO PARA OBTENER AVALES -----
//   // -------------------------------------

//   //NOMBRE COMPLETO DEL AVAL
//   getNombreAval(solicitud: Solicitud): string {    
//     const nombre = solicitud.nombre_aval || '';
//     const app = solicitud.app_aval || '';
//     const apm = solicitud.apm_aval || '';
    
//     const completo = `${nombre} ${app} ${apm}`.trim();
    
//     // console.log('Nombre completo calculado:', completo);
    
//     return completo || 'Sin aval registrado';
//   }

//   // DIRECCION COMPLETA DEL AVAL
//   getDireccionAval(solicitud: Solicitud): string {
//     const partes = [];
//     if (solicitud.aval_calle) partes.push(solicitud.aval_calle);
//     if (solicitud.aval_numero) partes.push(`#${solicitud.aval_numero}`);
//     if (solicitud.aval_localidad) partes.push(solicitud.aval_localidad);
//     if (solicitud.aval_municipio) partes.push(solicitud.aval_municipio);

//     return partes.join(', ') || 'Sin dirección del aval';
//   }

//   // TELEFONO DEL AVAL
//   getTelefonoAvalFormateado(solicitud: Solicitud): string {
//     return this.getTelefonoFormateado({ telefono: solicitud.telefono_aval });
//   }

//   getTelefonoAvalNumerico(solicitud: Solicitud): string {
//     const tel = solicitud.telefono_aval || '';
//     return tel.toString().replace(/\D/g, '');
//   }


// }


import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../../../services/solicitud.service';
import { AuthService, User } from '../../../../services/auth.service';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

// Interfaces para tipado
interface Solicitud {
  id_solicitud: number;
  cliente_id: number;
  usuario_id: number;
  fecha_creacion: string;
  monto_solicitado: number;
  plazo_meses: number;
  no_pagos: number;
  tipo_vencimiento: string;
  estado: string;
  observaciones?: string;
  fecha_aprobacion?: string;
  monto_aprobado?: number;
  dia_pago?: number;
  tipo_credito?: string;
  aliado_id?: number;
  aval_id?: number;
  domiciliado?: boolean | null;
  domiciliacion_fecha?: string;
  domiciliacion_horario?: string;
  persona_recibio?: string;
  coordinador_id?: number;
  fecha_domiciliacion?: string;

  // Campos adicionales del JOIN
  nombre_cliente?: string;
  app_cliente?: string;
  apm_cliente?: string;
  telefono?: string;
  folio_cliente?: string;
  nombre_aliado?: string;
  nom_aliado?: string;
  cliente_localidad?: string;
  cliente_calle?: string;
  cliente_numero?: string;
  cliente_municipio?: string;

  // Valores del aval
  nombre_aval?: string;
  app_aval?: string;
  apm_aval?: string;
  telefono_aval?: string;
  aval_calle?: string;
  aval_numero?: string;
  aval_localidad?: string;
  aval_municipio?: string;
}

interface Estado {
  valor: string;
  texto: string;
}

@Component({
  selector: 'app-credit-address',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './credit-address.component.html',
  styleUrls: ['./credit-address.component.css']
})
export class CreditAddressComponent implements OnInit, OnDestroy {
  // Estados
  solicitudes: Solicitud[] = [];
  solicitudSeleccionada: Solicitud | null = null;
  // filtroEstado: string = 'PENDIENTE'; 
  filtroEstado: string = 'NO_DOMICILIADA';
  loading: boolean = true;
  modalVisible: boolean = false;
  horario: string = '';
  personaRecibio: string = '';
  fechaDomiciliacion: string = '';
  coordinadorId: number = 0;
  filtroAliado: string = '';
  aliados: string[] = [];
  usuarioActual: User | null = null;

  // Suscripciones
  private usuarioSubscription: Subscription | null = null;

  // Estados disponibles - CORREGIDO
  // estados: Estado[] = [
  //   { valor: 'PENDIENTE', texto: 'Aprobadas por domiciliar' }, // Cambiado de PENDIENTE a APROBADO
  //   { valor: 'DOMICILIADA', texto: 'Domiciliadas' },
  //   { valor: 'todos', texto: 'Todas' }
  // ];
  estados: Estado[] = [
    { valor: 'NO_DOMICILIADA', texto: 'Por domiciliar' }, // Nuevo filtro combinado
    { valor: 'PENDIENTE', texto: 'Pendientes' },
    { valor: 'APROBADO', texto: 'Aprobadas' },
    { valor: 'DOMICILIADA', texto: 'Domiciliadas' },
    { valor: 'todos', texto: 'Todas' }
  ];
  verificarUsuarioEnLocalStorage: any;

  constructor(
    private solicitudService: SolicitudService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.obtenerUsuarioActual();
    this.cargarSolicitudes();
  }

  ngOnDestroy(): void {
    if (this.usuarioSubscription) {
      this.usuarioSubscription.unsubscribe();
    }
  }

  // Obtener usuario actual
  obtenerUsuarioActual(): void {
    // Opción 1: Suscribirse al observable
    this.usuarioSubscription = this.authService.currentUser$.subscribe({
      next: (usuario: User | null) => {
        this.actualizarUsuario(usuario);
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
        this.obtenerUsuarioDeFormaDirecta();
      }
    });

    // También obtener valor actual inmediatamente
    this.obtenerUsuarioDeFormaDirecta();
  }

  obtenerUsuarioDeFormaDirecta(): void {
    const usuario = this.authService.getCurrentUser();

    if (usuario) {
      this.actualizarUsuario(usuario);
      console.log('Usuario obtenido de forma directa:', usuario);

      // Verificar que tenga token de Firebase
      this.verificarTokenDisponible();
    } else {
      console.warn('No se pudo obtener el usuario de forma directa.');
      this.verificarUsuarioEnLocalStorage();
    }
  }

  // Verificar si hay token disponible
  verificarTokenDisponible(): void {
    this.authService.getFirebaseToken().then((token: string) => {
      console.log('Token disponible, longitud:', token.length);
    }).catch((error: any) => {
      console.warn('No se pudo obtener token:', error);
      Swal.fire({
        icon: 'warning',
        title: 'Sesión expirada',
        text: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ffc107'
      });
    });
  }

  // Actualizar usuario en el componente
  actualizarUsuario(usuario: User | null): void {
    if (usuario) {
      this.usuarioActual = usuario;
      this.coordinadorId = usuario.id_usuario;

      // Verificar si es coordinador (rol_id 3 según tus logs)
      if (usuario.rol_id !== 3) {
        console.warn('El usuario no es coordinador. Rol ID:', usuario.rol_id);
        this.mostrarErrorPermisos();
      } else {
        console.log('Usuario coordinador identificado:', {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          rol: usuario.nombre_rol || `Rol ID: ${usuario.rol_id}`
        });
      }
    } else {
      this.usuarioActual = null;
      this.coordinadorId = 0;
    }
  }

  // Método para cargar solicitudes 
  // cargarSolicitudes(): void {
  //   this.loading = true;

  //   this.solicitudService.obtenerSolicitudes().subscribe({
  //     next: (solicitudes: Solicitud[]) => {
  //       // FILTRAR SOLO SOLICITUDES APROBADAS NO DOMICILIADAS
  //       this.solicitudes = solicitudes.filter(s =>
  //         s.estado === 'PENDIENTE' &&
  //         (s.domiciliado === false || s.domiciliado === null)
  //       );

  //       console.log(`Solicitudes PENDIENTES no domiciliadas: ${this.solicitudes.length}`);

  //       this.procesarSolicitudes(this.solicitudes);
  //       this.loading = false;
  //     },
  //     error: (error: HttpErrorResponse) => {
  //       console.error('Error al cargar solicitudes:', error);

  //       Swal.fire({
  //         icon: 'error',
  //         title: 'Error al cargar',
  //         text: 'No se pudieron cargar las solicitudes. Verifique la conexión.',
  //         confirmButtonText: 'Reintentar',
  //         confirmButtonColor: '#dc3545'
  //       }).then(() => {
  //         this.cargarSolicitudes();
  //       });

  //       this.loading = false;
  //     }
  //   });
  // }
  cargarSolicitudes(): void {
  this.loading = true;

  this.solicitudService.obtenerSolicitudes().subscribe({
    next: (solicitudes: Solicitud[]) => {
      // GUARDAR TODAS las solicitudes sin filtrar aquí
      this.solicitudes = solicitudes;

      console.log(`Total solicitudes cargadas: ${this.solicitudes.length}`);
      console.log('Solicitudes no domiciliadas:', 
        this.solicitudes.filter(s => s.domiciliado === false || s.domiciliado === null).length
      );

      this.procesarSolicitudes(this.solicitudes);
      this.loading = false;
    },
    error: (error: HttpErrorResponse) => {
      console.error('Error al cargar solicitudes:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error al cargar',
        text: 'No se pudieron cargar las solicitudes. Verifique la conexión.',
        confirmButtonText: 'Reintentar',
        confirmButtonColor: '#dc3545'
      }).then(() => {
        this.cargarSolicitudes();
      });

      this.loading = false;
    }
  });
}

  // Procesar solicitudes
  procesarSolicitudes(solicitudes: Solicitud[]): void {
    // Extraer aliados únicos para el filtro
    const aliadosUnicos = new Set<string>();
    solicitudes.forEach(s => {
      const nombreAliado = s.nombre_aliado || s.nom_aliado;
      if (nombreAliado) {
        aliadosUnicos.add(nombreAliado);
      }
    });
    this.aliados = Array.from(aliadosUnicos);

    // Ordenar por fecha de aprobación más reciente primero
    this.solicitudes.sort((a, b) => {
      const fechaA = a.fecha_aprobacion ? new Date(a.fecha_aprobacion).getTime() :
        a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
      const fechaB = b.fecha_aprobacion ? new Date(b.fecha_aprobacion).getTime() :
        b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
      return fechaB - fechaA;
    });
  }

  // Filtrar solicitudes según estado y aliado
  // get solicitudesFiltradas(): Solicitud[] {
  //   return this.solicitudes.filter(solicitud => {
  //     const coincideEstado = this.filtroEstado === 'todos' || solicitud.estado === this.filtroEstado;
  //     const nombreAliado = solicitud.nombre_aliado || solicitud.nom_aliado || '';
  //     const coincideAliado = !this.filtroAliado || nombreAliado === this.filtroAliado;
  //     return coincideEstado && coincideAliado;
  //   });
  // }
  get solicitudesFiltradas(): Solicitud[] {
  return this.solicitudes.filter(solicitud => {
    // Filtro por estado
    let coincideEstado = false;
    
    if (this.filtroEstado === 'todos') {
      coincideEstado = true;
    } else if (this.filtroEstado === 'NO_DOMICILIADA') {
      // Mostrar PENDIENTES y APROBADAS que NO estén domiciliadas
      coincideEstado = (
        (solicitud.estado === 'PENDIENTE' || solicitud.estado === 'APROBADO') &&
        (solicitud.domiciliado === false || solicitud.domiciliado === null)
      );
    } else if (this.filtroEstado === 'DOMICILIADA') {
      // Solo las que están marcadas como domiciliadas
      coincideEstado = solicitud.domiciliado === true;
    } else {
      // Filtrar por estado específico (PENDIENTE o APROBADO)
      coincideEstado = solicitud.estado === this.filtroEstado;
    }

    // Filtro por aliado
    const nombreAliado = solicitud.nombre_aliado || solicitud.nom_aliado || '';
    const coincideAliado = !this.filtroAliado || nombreAliado === this.filtroAliado;

    return coincideEstado && coincideAliado;
  });
}

  // Manejar selección de solicitud
  seleccionarSolicitud(solicitud: Solicitud): void {
    // Verificar permisos antes de seleccionar
    if (!this.verificarPermisosCoordinador()) {
      return;
    }

    this.solicitudSeleccionada = solicitud;

    // Inicializar campos
    this.horario = solicitud.domiciliacion_horario || '';
    this.personaRecibio = solicitud.persona_recibio || '';
    this.fechaDomiciliacion = solicitud.fecha_domiciliacion ||
      solicitud.domiciliacion_fecha ||
      this.obtenerFechaActual();

    this.modalVisible = true;
  }

  // Verificar permisos del coordinador
  verificarPermisosCoordinador(): boolean {
    if (!this.usuarioActual) {
      Swal.fire({
        icon: 'warning',
        title: 'Usuario no identificado',
        text: 'No se pudo identificar su usuario. Por favor, inicie sesión nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ffc107'
      });
      return false;
    }

    if (this.usuarioActual.rol_id !== 3) {
      this.mostrarErrorPermisos();
      return false;
    }

    return true;
  }

  // Mostrar error de permisos
  mostrarErrorPermisos(): void {
    Swal.fire({
      icon: 'error',
      title: 'Acceso restringido',
      html: `
        <div style="text-align: left;">
          <p>Solo los coordinadores pueden acceder a esta funcionalidad.</p>
          <p><strong>Usuario actual:</strong> ${this.usuarioActual?.nombre || 'No identificado'}</p>
          <p><strong>Rol:</strong> ${this.usuarioActual?.nombre_rol || `ID: ${this.usuarioActual?.rol_id}`}</p>
          <p><strong>Rol requerido:</strong> Coordinador (ID: 3)</p>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc3545'
    });
  }

  // Validar antes de domiciliar
  validarAntesDeDomiciliar(): boolean {
    // Validar que se haya obtenido el coordinador ID
    if (this.coordinadorId === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Usuario no identificado',
        text: 'No se pudo identificar su usuario. Por favor, inicie sesión nuevamente.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
      return false;
    }

    // Validar que el usuario sea coordinador (rol_id 3 según tus logs)
    if (this.usuarioActual && this.usuarioActual.rol_id !== 3) {
      this.mostrarErrorPermisos();
      return false;
    }

    return true;
  }

  // Marcar como domiciliada
  marcarDomiciliada(): void {
    // Validar campos primero
    if (!this.horario.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Horario requerido',
        text: 'Por favor, ingrese el horario de la domiciliación',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    if (!this.personaRecibio.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Persona que recibió requerida',
        text: 'Por favor, ingrese el nombre de la persona que recibió',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    // Validar usuario y permisos
    if (!this.validarAntesDeDomiciliar()) {
      return;
    }

    // Mostrar confirmación
    this.mostrarConfirmacionDomiciliacion();
  }

  // Mostrar confirmación
  mostrarConfirmacionDomiciliacion(): void {
    Swal.fire({
      title: '¿Confirmar domiciliación?',
      html: `
        <div style="text-align: left; margin: 10px 0;">
          <p><strong>Cliente:</strong> ${this.getNombreCompleto(this.solicitudSeleccionada!)}</p>
          <p><strong>Dirección:</strong> ${this.getDireccionCompleta(this.solicitudSeleccionada!)}</p>
          <p><strong>Teléfono:</strong> ${this.getTelefonoFormateado(this.solicitudSeleccionada!)}</p>
          <p><strong>Fecha domiciliación:</strong> ${this.fechaDomiciliacion}</p>
          <p><strong>Horario de Disponibilidad:</strong> ${this.horario}</p>
          <p><strong>Persona que recibió:</strong> ${this.personaRecibio}</p>
          <p><strong>Registrado por:</strong> ${this.usuarioActual?.nombre || 'Coordinador'}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar domiciliación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarDomiciliacion();
      }
    });
  }

  procesarDomiciliacion(): void {
    if (!this.solicitudSeleccionada) return;

    const datosDomiciliacion = {
      horario: this.horario,
      persona_recibio: this.personaRecibio,
      fecha_domiciliacion: this.fechaDomiciliacion
    };

    this.solicitudService.actualizarDomiciliacion(
      this.solicitudSeleccionada.id_solicitud,
      datosDomiciliacion
    ).subscribe({
      next: (response) => {
        this.actualizarSolicitudLocalmente(response.data || response);
        this.mostrarExito('¡Domiciliación exitosa!', response.message);
        this.cerrarModal();
      },
      error: (error) => this.mostrarErrorDomiciliacion(error)
    });
  }


  // Manejar errores de domiciliación
  mostrarErrorDomiciliacion(error: HttpErrorResponse): void {
    let mensajeError = 'Error desconocido';
    let tituloError = 'Error al domiciliar';

    if (error.status === 401) {
      tituloError = 'No autorizado (401)';
      mensajeError = 'No tiene permisos para realizar esta acción. El token de autenticación puede ser inválido o haber expirado. Por favor, inicie sesión nuevamente.';
    } else if (error.status === 403) {
      tituloError = 'Acceso denegado';
      mensajeError = 'No tiene permisos para domiciliar solicitudes. Solo coordinadores pueden realizar esta acción.';
    } else if (error.status === 404) {
      tituloError = 'Solicitud no encontrada';
      mensajeError = 'La solicitud no existe o ya ha sido procesada.';
    } else if (error.status === 400) {
      tituloError = 'Datos inválidos';
      mensajeError = error.error?.detalle || 'Los datos enviados no son válidos para domiciliación.';
    } else if (error.status === 500) {
      tituloError = 'Error del servidor';
      mensajeError = 'Ocurrió un error interno en el servidor. Intente nuevamente.';
    } else {
      mensajeError = error.error?.detalle || error.message || 'Error del servidor';
    }

    Swal.fire({
      icon: 'error',
      title: tituloError,
      html: `
        <div style="text-align: left;">
          <p>${mensajeError}</p>
          ${error.status ? `<p><small>Código de error: ${error.status}</small></p>` : ''}
        </div>
      `,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#dc3545'
    });
  }

  // Actualizar solicitud localmente
  actualizarSolicitudLocalmente(solicitudActualizada: any): void {
    if (!this.solicitudSeleccionada) return;

    const indice = this.solicitudes.findIndex(
      s => s.id_solicitud === this.solicitudSeleccionada!.id_solicitud
    );

    if (indice !== -1) {
      // Actualizar con los datos del servidor
      this.solicitudes[indice] = {
        ...this.solicitudes[indice],
        ...solicitudActualizada,
        domiciliado: true, // Asegurar que se marque como domiciliado
        estado: 'PENDIENTE' // Mantener estado como PENDIENTE 
      };

      // Remover de la lista (ya está domiciliada)
      this.solicitudes.splice(indice, 1);
    }
  }

  // Obtener fecha actual
  obtenerFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Cerrar modal
  cerrarModal(): void {
    this.modalVisible = false;
    this.solicitudSeleccionada = null;
    this.horario = '';
    this.personaRecibio = '';
    this.fechaDomiciliacion = this.obtenerFechaActual();
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.filtroEstado = 'NO_DOMICILIADA';
    this.filtroAliado = '';
  }

  // Métodos auxiliares
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'estado-pendiente';
      case 'APROBADO': return 'estado-aprobada';
      case 'DOMICILIADA': return 'estado-domiciliada';
      default: return '';
    }
  }

  // getEstadoText(estado: string): string {
  //   switch (estado) {
  //     case 'PENDIENTE': return 'Pendiente';
  //     case 'APROBADO': return 'Aprobada';
  //     case 'DOMICILIADA': return 'Domiciliada';
  //     default: return estado;
  //   }
  // }
  getEstadoText(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'APROBADO': return 'Aprobada';
      case 'DOMICILIADA': return 'Domiciliada';
      case 'RECHAZADO': return 'Rechazada';
      default: return estado;
    }
  }

  getNombreCompleto(solicitud: Solicitud): string {
    const nombre = solicitud.nombre_cliente || '';
    const app = solicitud.app_cliente || '';
    const apm = solicitud.apm_cliente || '';
    return `${nombre} ${app} ${apm}`.trim() || `Cliente ID: ${solicitud.cliente_id}`;
  }

  getDireccionCompleta(solicitud: Solicitud): string {
    const partes = [];
    if (solicitud.cliente_calle) partes.push(solicitud.cliente_calle);
    if (solicitud.cliente_numero) partes.push(`#${solicitud.cliente_numero}`);
    if (solicitud.cliente_localidad) partes.push(solicitud.cliente_localidad);
    if (solicitud.cliente_municipio) partes.push(solicitud.cliente_municipio);
    return partes.join(', ') || 'Sin dirección especificada';
  }

  getTelefonoFormateado(solicitud: any): string {
    const posibles = [
      solicitud?.telefono,
      solicitud?.cliente?.telefono,
      solicitud?.contacto?.telefono,
      solicitud?.telefonoPrincipal,
      solicitud?.telefonoSecundario
    ];

    // escoger el primer valor no vacío
    let raw = posibles.find(v => v !== undefined && v !== null && v !== '') ?? '';

    // si viene como array, tomar el primero
    if (Array.isArray(raw)) raw = raw[0] ?? '';

    raw = String(raw).trim();
    const digits = raw.replace(/\D/g, '');

    if (!digits) return 'N/A';

    let d = digits;

    // Normalizar eliminando prefijos comunes (ej. +52, 0052, 52, leading 1)
    // Tomar últimos 10 dígitos si vienen con código de país u otros prefijos
    if (d.length > 10) {
      // si empieza con '52' y tiene al menos 12 dígitos, tomar los últimos 10
      if (d.startsWith('52') && d.length >= 12) d = d.slice(-10);
      // si tiene 11 dígitos y comienza con '1' (ej. formato norteamericano) quitar el '1'
      else if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
      // en cualquier otro caso largo, tomar los últimos 10 dígitos por seguridad
      else if (d.length > 10) d = d.slice(-10);
    }

    // Formatos esperados
    if (d.length === 10) {
      return `(${d.substring(0, 3)}) ${d.substring(3, 6)}-${d.substring(6)}`;
    }
    if (d.length === 7) { // formato local corto
      return `${d.substring(0, 3)}-${d.substring(3)}`;
    }

    // Si no se puede formatear, devolver el raw original (más legible) o los dígitos
    return raw || digits;
  }


  getNombreAliado(solicitud: Solicitud): string {
    return solicitud.nombre_aliado || solicitud.nom_aliado || 'Sin aliado asignado';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  formatearMoneda(monto: number): string {
    if (!monto && monto !== 0) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  actualizarDatos(): void {
    this.loading = true;
    this.cargarSolicitudes();
  }

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
    const mensaje = typeof error === 'string' ? error :
      error?.error?.detalle || error?.error?.error || error?.message || 'Error desconocido';

    Swal.fire({
      icon: 'error',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#dc3545'
    });
  }

  getTelefonoNumerico(solicitud: Solicitud): string {
    const telefono = solicitud.telefono || '';
    return telefono.toString().replace(/\D/g, '');
  }



  // -------------------------------------
  // ---- METODO PARA OBTENER AVALES -----
  // -------------------------------------

  //NOMBRE COMPLETO DEL AVAL
  getNombreAval(solicitud: Solicitud): string {    
    const nombre = solicitud.nombre_aval || '';
    const app = solicitud.app_aval || '';
    const apm = solicitud.apm_aval || '';
    
    const completo = `${nombre} ${app} ${apm}`.trim();
    
    // console.log('Nombre completo calculado:', completo);
    
    return completo || 'Sin aval registrado';
  }

  // DIRECCION COMPLETA DEL AVAL
  getDireccionAval(solicitud: Solicitud): string {
    const partes = [];
    if (solicitud.aval_calle) partes.push(solicitud.aval_calle);
    if (solicitud.aval_numero) partes.push(`#${solicitud.aval_numero}`);
    if (solicitud.aval_localidad) partes.push(solicitud.aval_localidad);
    if (solicitud.aval_municipio) partes.push(solicitud.aval_municipio);

    return partes.join(', ') || 'Sin dirección del aval';
  }

  // TELEFONO DEL AVAL
  getTelefonoAvalFormateado(solicitud: Solicitud): string {
    return this.getTelefonoFormateado({ telefono: solicitud.telefono_aval });
  }

  getTelefonoAvalNumerico(solicitud: Solicitud): string {
    const tel = solicitud.telefono_aval || '';
    return tel.toString().replace(/\D/g, '');
  }


}


