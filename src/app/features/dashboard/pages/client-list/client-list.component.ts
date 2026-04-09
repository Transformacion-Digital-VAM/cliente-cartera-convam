import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService } from '../../../../services/client.service';
import { SolicitudService } from '../../../../services/solicitud.service';
import { AliadoService } from '../../../../services/aliado.service';
import { AvalesService } from '../../../../services/avales.service';
import { AuthService } from '../../../../services/auth.service';
import Swal from 'sweetalert2';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CalendarioPagoService } from '../../../../services/calendario-pago.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css']
})
export class ClientListComponent implements OnInit, OnDestroy {
  // Datos del cliente
  clientes: any[] = [];
  clienteSeleccionado: any = null;
  clienteParaSolicitud: any = null;
  aliados: any[] = [];
  avales: any[] = [];
  avalSeleccionado: any = null;
  usuarioActual: any = null;

  // Formulario de solicitud
  solicitudForm!: FormGroup;
  guardando = false;

  // Opciones para selects
  plazosMeses = [4];
  tiposVencimiento = [
    { value: 'semanal', label: 'SEMANAL' },
    { value: 'quincenal', label: 'QUINCENAL' },
    { value: 'mensual', label: 'MENSUAL' }
  ];
  tiposSolicitud = [
    { value: 'NUEVO', label: 'NUEVO' },
    { value: 'RENOVACIÓN', label: 'RENOVACIÓN' },
    { value: 'RE-INGRESO', label: 'RE-INGRESO' }
  ];

  diasPago = [
    { value: 'Lunes', label: 'LUNES' },
    { value: 'Martes', label: 'MARTES' },
    { value: 'Miércoles', label: 'MIÉRCOLES' },
    { value: 'Jueves', label: 'JUEVES' },
    { value: 'Viernes', label: 'VIERNES' },
    { value: 'Sábado', label: 'SÁBADO' }
  ];

  // Filtros de búsqueda
  filtro = {
    nombre: '',
    identificacion: '',
    estadoCredito: ''
  };

  // Estados
  cargando = false;
  error = '';
  cargandoAliados = false;
  cargandoAvales = false;

  // Caché de estados calculados
  clienteStatusCache: Map<number, {
    status: string,
    canRequest: boolean,
    class: string,
    mora: number,
    ultimaFechaPago: Date | null
  }> = new Map();

  // Subscripciones
  private userSubscription: Subscription | null = null;
  private authCheckInterval: any;

  constructor(
    private clienteService: ClienteService,
    private solicitudService: SolicitudService,
    private aliadoService: AliadoService,
    private avalesService: AvalesService,
    private authService: AuthService,
    private calendarioService: CalendarioPagoService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    console.log('ClientListComponent inicializando...');

    // Diagnóstico inicial
    this.diagnosticoSesion();

    // Inicializar formulario
    this.inicializarFormularioSolicitud();

    // Cargar datos iniciales
    this.cargarClientes();
    this.cargarAliados();
    this.cargarAvales();

    // Suscribirse a cambios en el usuario
    this.suscribirCambiosUsuario();

    // Configurar verificación periódica de autenticación
    this.configurarVerificacionAutenticacion();

    // Verificar usuario con retardo para dar tiempo a Firebase
    setTimeout(() => {
      this.verificarUsuarioConTolerancia();
    }, 1500);
  }

  ngOnDestroy(): void {
    // Limpiar subscripciones
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }

    // Limpiar intervalo
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
  }

  diagnosticoSesion(): void {
    console.log('=== DIAGNÓSTICO DE SESIÓN ===');
    console.log('1. localStorage.user:', localStorage.getItem('user'));
    console.log('2. localStorage.firebase_token:', localStorage.getItem('firebase_token'));
    console.log('3. Firebase currentUser:', this.authService.getCurrentFirebaseUser()?.email);
    console.log('4. AuthService currentUserSubject:', this.authService.getUserDataSync());
    console.log('5. Ruta actual:', window.location.pathname);
    console.log('6. Usuario logueado en otras partes:', document.querySelector('.user-info'));
  }

  suscribirCambiosUsuario(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(
      (user) => {
        console.log('Cambio en usuario detectado en subscription:', user);
        if (user) {
          this.usuarioActual = user;
          console.log('Usuario actualizado desde subscription:', user.nombre);
        } else {
          console.log('Subscription recibió null user');
        }
      },
      (error) => {
        console.error('Error en subscription de usuario:', error);
      }
    );
  }

  configurarVerificacionAutenticacion(): void {
    // Verificar autenticación periódicamente
    this.authCheckInterval = setInterval(() => {
      this.verificarEstadoAutenticacion();
    }, 900000); // Cada 15 minutos
  }

  verificarEstadoAutenticacion(): void {
    const tieneSesion = this.tieneSesionValida();
    console.log(' Verificación periódica de sesión:', tieneSesion ? 'ACTIVA' : 'INACTIVA');

    if (!tieneSesion) {
      this.intentarRecuperarSesion();
    }
  }

  tieneSesionValida(): boolean {
    // Verificar múltiples fuentes
    const fuentes = [
      this.usuarioActual,
      this.authService.getUserDataSync(),
      localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
      this.authService.getCurrentFirebaseUser()
    ];

    return fuentes.some(fuente => fuente !== null && fuente !== undefined);
  }

  verificarUsuarioConTolerancia(): void {
    console.log('Verificando usuario con tolerancia...');

    // Intentar obtener usuario del authService
    this.usuarioActual = this.authService.getCurrentUser();

    // Si no hay, verificar localStorage directamente
    if (!this.usuarioActual || !this.usuarioActual.id_usuario) {
      console.log('Usuario no en authService, revisando localStorage...');
      this.usuarioActual = this.obtenerUsuarioDeLocalStorage();
    }

    // Si aún no hay, verificar Firebase
    if (!this.usuarioActual || !this.usuarioActual.id_usuario) {
      console.log('Revisando Firebase directamente...');
      this.verificarFirebaseYRecuperar();
    }

    // Si todo falla, usar valor por defecto
    if (!this.usuarioActual || !this.usuarioActual.id_usuario) {
      console.warn('No se pudo obtener usuario válido, usando por defecto');
      this.usuarioActual = this.crearUsuarioPorDefecto();
    } else {
      console.log('Usuario verificado:', this.usuarioActual.nombre);
      console.log('ID de usuario:', this.usuarioActual.id_usuario);
    }

    // Guardar usuario en localStorage si no está
    if (this.usuarioActual && !localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(this.usuarioActual));
    }
  }

  obtenerUsuarioDeLocalStorage(): any {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('Usuario cargado desde localStorage:', user.nombre);

        // Actualizar BehaviorSubject si está vacío
        if (user && !this.authService.getUserDataSync()) {
          this.actualizarBehaviorSubject(user);
        }

        return user;
      } catch (e) {
        console.error('Error parseando usuario de localStorage:', e);
        return null;
      }
    }
    return null;
  }

  verificarFirebaseYRecuperar(): void {
    const firebaseUser = this.authService.getCurrentFirebaseUser();
    if (firebaseUser) {
      console.log('Firebase tiene usuario autenticado:', firebaseUser.email);

      // Si Firebase tiene usuario pero no en localStorage, forzar sincronización
      if (!localStorage.getItem('user')) {
        console.log('Firebase activo sin localStorage, sincronizando...');
        this.forzarSincronizacionFirebase();
      }
    } else {
      console.log('Firebase no tiene usuario autenticado');
    }
  }

  forzarSincronizacionFirebase(): void {
    // sincronizar con backend
    const firebaseUser = this.authService.getCurrentFirebaseUser();
    if (firebaseUser) {
      console.log(' Sincronizando Firebase con backend...');

      // Crear usuario temporal basado en Firebase
      const tempUser = {
        id_usuario: 1,
        nombre: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
        usuario: firebaseUser.email,
        firebase_uid: firebaseUser.uid
      };

      // Guardar temporalmente
      localStorage.setItem('user', JSON.stringify(tempUser));
      this.usuarioActual = tempUser;
      this.actualizarBehaviorSubject(tempUser);

      console.log(' Usuario temporal creado desde Firebase:', tempUser.nombre);
    }
  }

  crearUsuarioPorDefecto(): any {
    // Obtener del sessionStorage si existe
    const sessionUser = sessionStorage.getItem('temp_user');
    if (sessionUser) {
      try {
        return JSON.parse(sessionUser);
      } catch (e) {
        console.error('Error parseando sessionStorage:', e);
      }
    }

    // Crear nuevo usuario por defecto
    const defaultUser = {
      id_usuario: 1,
      nombre: 'Usuario Temporal',
      usuario: 'usuario@temporal.com',
      es_temporal: true
    };

    // Guardar en sessionStorage para esta sesión
    sessionStorage.setItem('temp_user', JSON.stringify(defaultUser));

    return defaultUser;
  }



  actualizarBehaviorSubject(user: any): void {
    try {
      const subject = (this.authService as any).currentUserSubject;
      if (subject && typeof subject.next === 'function') {
        subject.next(user);
        console.log('BehaviorSubject actualizado');
      }
    } catch (error) {
      console.error('Error actualizando BehaviorSubject:', error);
    }
  }

  inicializarFormularioSolicitud(): void {
    this.solicitudForm = this.fb.group({
      monto_solicitado: ['', [Validators.required, Validators.min(3000), Validators.max(100000)]],
      plazo_meses: [4, [Validators.required, Validators.min(1), Validators.max(60)]],
      tipo_vencimiento: ['semanal', [Validators.required]],
      tipo_credito: ['NUEVO', [Validators.required]],
      aliado_id: ['', [Validators.required]],
      aval_id: ['', [Validators.required]],
      dia_pago: ['Lunes', [Validators.required]],
      tasa_interes: [{ value: '', disabled: true }],
      no_pagos: [{ value: 16, disabled: true }],
      observaciones: ['']
    });

    this.solicitudForm.get('aliado_id')?.valueChanges.subscribe(aliadoId => {
      this.actualizarTasaInteres(aliadoId);
    });

    // Listener para actualizar el número de pagos basado en el plazo de meses
    this.solicitudForm.get('plazo_meses')?.valueChanges.subscribe(meses => {
      if (meses) {
        const noPagos = meses * 4;
        this.solicitudForm.patchValue({
          no_pagos: noPagos
        });
      }
    });
  }

  cargarAvales(): void {
    this.cargandoAvales = true;
    this.avalesService.obtenerAvales().subscribe({
      next: (data) => {
        this.avales = (data || []).filter(aval => aval != null);
        console.log('Avales cargados:', this.avales.length);
        this.cargandoAvales = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los avales';
        this.cargandoAvales = false;
        console.error('Error al cargar avales:', err);
      }
    });
  }

  buscarAvalDelCliente(cliente: any): void {
    if (!cliente || !cliente.id_cliente) {
      this.avalSeleccionado = null;
      return;
    }

    console.log('Buscando aval para cliente ID:', cliente.id_cliente);
    this.avalSeleccionado = this.avales.find(aval => {
      return aval.cliente_id === cliente.id_cliente ||
        aval.id_cliente === cliente.id_cliente;
    });

    if (this.avalSeleccionado) {
      console.log('Aval encontrado en lista local:', this.avalSeleccionado);
      return;
    }

    console.log('Buscando aval por API...');
    this.avalesService.obtenerAvalesPorCliente(cliente.id_cliente).subscribe({
      next: (avalesCliente) => {
        if (avalesCliente && avalesCliente.length > 0) {
          this.avalSeleccionado = avalesCliente[0];
          console.log('Aval encontrado por API:', this.avalSeleccionado);

          if (!this.avales.find(a => a.id_aval === this.avalSeleccionado.id_aval)) {
            this.avales.push(this.avalSeleccionado);
          }
        } else {
          console.log('No se encontró aval para este cliente');
          this.avalSeleccionado = null;
        }
      },
      error: (err) => {
        console.error('Error al buscar aval por cliente:', err);
        this.avalSeleccionado = null;
      }
    });
  }

  cargarAliados(): void {
    this.cargandoAliados = true;
    this.aliadoService.obtenerAliados().subscribe({
      next: (data) => {
        this.aliados = (data || []).filter(aliado => aliado != null);
        this.cargandoAliados = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los aliados';
        this.cargandoAliados = false;
        console.error('Error al cargar aliados:', err);
      }
    });
  }

  actualizarTasaInteres(aliadoId: number): void {
    if (aliadoId) {
      const aliadoSeleccionado = this.aliados.find(aliado => aliado.id_aliado === aliadoId);
      if (aliadoSeleccionado) {
        const tasaInteres = aliadoSeleccionado.tasa_interes ||
          aliadoSeleccionado.tasa ||
          aliadoSeleccionado.interes ||
          0;
        this.solicitudForm.patchValue({
          tasa_interes: tasaInteres
        });
      }
    } else {
      this.solicitudForm.patchValue({
        tasa_interes: ''
      });
    }
  }

  cargarClientes(): void {
    this.cargando = true;
    this.error = '';
    this.clienteService.obtenerClientes().subscribe({
      next: (data) => {
        this.clientes = (data || []).filter(cliente => cliente != null);
        console.log('Clientes cargados:', this.clientes.length);
        this.cargando = false;
        // Cargar estados para cada cliente
        this.cargarEstadosClientes();
      },
      error: (err) => {
        this.error = 'Error al cargar los clientes';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  cargarEstadosClientes(): void {
    if (!this.clientes || this.clientes.length === 0) return;

    console.log('Cargando estados detallados para los clientes...');

    // Procesar cada cliente para obtener su estado real desde el calendario
    this.clientes.forEach(cliente => {
      this.calendarioService.obtenerPorCliente(cliente.id_cliente).subscribe({
        next: (calendario) => {
          this.vincularEstadoCliente(cliente.id_cliente, calendario);
        },
        error: (err) => {
          console.error(`Error al cargar calendario para cliente ${cliente.id_cliente}:`, err);
          // Estado por defecto en caso de error
          this.clienteStatusCache.set(cliente.id_cliente, {
            status: 'ERROR CARGA',
            canRequest: false,
            class: 'estado-desconocido',
            mora: 0,
            ultimaFechaPago: null
          });
        }
      });
    });
  }

  vincularEstadoCliente(clienteId: number, calendario: any[]): void {
    let status = '';
    let canRequest = false;
    let cssClass = '';
    let moraAcumulada = 0;
    let ultimaFechaPago: Date | null = null;

    if (!calendario || calendario.length === 0) {
      status = 'NUEVO';
      canRequest = true;
      cssClass = 'estado-sin-credito';
    } else {
      const totalPagos = calendario.length;
      const pagosRealizados = calendario.filter(p => p.pagado === true).length;
      moraAcumulada = calendario.reduce((sum, p) => sum + (parseFloat(p.mora_acumulada) || 0), 0);

      // Obtener la fecha del último pago realizado (o el último vencimiento pagado)
      const pagosHechos = calendario.filter(p => p.pagado === true);
      if (pagosHechos.length > 0) {
        // Ordenar por fecha de vencimiento descendente para encontrar el último
        const ultimo = [...pagosHechos].sort((a, b) =>
          new Date(b.fecha_vencimiento).getTime() - new Date(a.fecha_vencimiento).getTime()
        )[0];
        ultimaFechaPago = new Date(ultimo.fecha_vencimiento);
      }

      if (pagosRealizados === totalPagos) {
        status = 'Disponible para renovación';
        canRequest = moraAcumulada === 0;
        cssClass = 'estado-disponible';
      } else if (totalPagos - pagosRealizados <= 2) {
        // Validar si puede renovar anticipadamente (Semana 15 y 16 pendientes)
        status = `CA (${pagosRealizados}/${totalPagos}) - Renovación anticipada`;
        canRequest = moraAcumulada === 0;
        cssClass = moraAcumulada === 0 ? 'estado-disponible' : 'estado-en-ciclo';
      } else {
        status = `CA (${pagosRealizados}/${totalPagos})`;
        canRequest = false;
        cssClass = 'estado-en-ciclo';
      }

      if (moraAcumulada > 0) {
        cssClass = 'estado-con-mora';
      }
    }

    this.clienteStatusCache.set(clienteId, {
      status: status,
      canRequest: canRequest,
      class: cssClass,
      mora: moraAcumulada,
      ultimaFechaPago: ultimaFechaPago
    });
  }

  seleccionarCliente(cliente: any): void {
    if (cliente && cliente.id_cliente) {
      this.clienteSeleccionado = cliente;
      this.buscarAvalDelCliente(cliente);
    }
  }

  abrirModalSolicitud(cliente: any): void {
    if (cliente && cliente.id_cliente) {
      console.log('Abriendo modal de solicitud para cliente:', cliente.nombre_cliente);

      // VALIDAR SI EL CLIENTE PUEDE GENERAR SOLICITUD
      const statusInfo = this.clienteStatusCache.get(cliente.id_cliente);
      if (!this.puedeGenerarSolicitud(cliente)) {
        let mensaje = '';
        if (statusInfo) {
          if (statusInfo.mora > 0) {
            mensaje = `El cliente tiene una mora acumulada de $${statusInfo.mora}. Debe liquidar sus pendientes para generar una nueva solicitud.`;
          } else if (statusInfo.status.includes('CA')) {
            mensaje = `El cliente tiene un crédito activo (${statusInfo.status}). Debe terminar su ciclo de pagos (o estar en la semana 14) para generar una nueva solicitud.`;
          } else {
            mensaje = 'El cliente no cumple con las condiciones para generar una nueva solicitud.';
          }
        } else {
          mensaje = 'Estamos verificando el estado del cliente. Por favor espere un momento...';
        }

        Swal.fire({
          icon: 'error',
          title: 'No se puede generar solicitud',
          text: mensaje,
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      // Verificar usuario sin redirigir
      this.verificarUsuarioParaModal();

      this.clienteParaSolicitud = cliente;
      this.buscarAvalDelCliente(cliente);

      // Determinar tipo de crédito por defecto
      let tipoCreditoDefault = 'NUEVO';
      if (statusInfo) {
        if (statusInfo.status === 'NUEVO') {
          tipoCreditoDefault = 'NUEVO';
        } else if (statusInfo.ultimaFechaPago) {
          const hoy = new Date();
          const diferenciaMs = hoy.getTime() - statusInfo.ultimaFechaPago.getTime();
          const diferenciaDias = diferenciaMs / (1000 * 60 * 60 * 24);

          if (diferenciaDias > 30) {
            tipoCreditoDefault = 'RE-INGRESO';
          } else {
            tipoCreditoDefault = 'RENOVACIÓN';
          }
        } else {
          // Si tiene historial pero no hay fecha de último pago (raro), renovacion por defecto
          tipoCreditoDefault = 'RENOVACIÓN';
        }
      }

      this.solicitudForm.reset({
        plazo_meses: 4,
        tipo_vencimiento: 'semanal',
        tipo_credito: tipoCreditoDefault,
        no_pagos: 16,
        dia_pago: 'Lunes',
        observaciones: ''
      });

      if (this.avalSeleccionado) {
        this.solicitudForm.patchValue({
          aval_id: this.avalSeleccionado.id_aval
        });
        console.log('Aval asignado:', this.avalSeleccionado.id_aval);
      } else {
        console.log(' Cliente sin aval asignado');
        Swal.fire({
          icon: 'warning',
          title: 'Aval requerido',
          text: 'Este cliente no tiene aval. Debe asignar uno antes de crear la solicitud.',
          confirmButtonText: 'Entendido'
        });
      }

      if (cliente.aliado_id && this.aliados.length > 0) {
        const aliadoCliente = this.aliados.find(a => a.id_aliado === cliente.aliado_id);
        if (aliadoCliente) {
          this.solicitudForm.patchValue({
            aliado_id: cliente.aliado_id
          });
        }
      }

      this.abrirModalBootstrap();
    }
  }

  verificarUsuarioParaModal(): void {
    if (!this.usuarioActual || !this.usuarioActual.id_usuario) {
      console.log('Usuario no disponible en modal, buscando alternativas...');

      // Buscar en localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.usuarioActual = JSON.parse(userStr);
          console.log('Usuario recuperado para modal:', this.usuarioActual.nombre);
        } catch (e) {
          console.error('Error parseando usuario:', e);
        }
      }

      // Si aún no hay, usar por defecto
      if (!this.usuarioActual || !this.usuarioActual.id_usuario) {
        this.usuarioActual = this.crearUsuarioPorDefecto();
        console.log('Usuario por defecto para modal:', this.usuarioActual.nombre);
      }
    }
  }

  abrirModalBootstrap(): void {
    const modalElement = document.getElementById('crearSolicitud');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  cerrarModalSolicitud(): void {
    const modalElement = document.getElementById('crearSolicitud');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.limpiarFormularioSolicitud();
  }

  guardarSolicitud(): void {
    console.log(' Guardando solicitud...');

    if (!this.verificarUsuarioParaEnvio()) {
      return;
    }

    if (this.solicitudForm.valid && this.clienteParaSolicitud) {
      this.confirmarEnvioSolicitud();
    } else {
      this.mostrarErroresFormulario();
    }
  }

  verificarUsuarioParaEnvio(): boolean {
    // Verificar si tenemos usuario válido
    if (!this.usuarioActual || !this.usuarioActual.id_usuario) {
      console.warn('Usuario no válido para envío');

      Swal.fire({
        icon: 'warning',
        title: 'Usuario no identificado',
        html: `
          <div style="text-align: left;">
            <p>No se pudo identificar su usuario para crear la solicitud.</p>
            <p><strong>¿Desea continuar con usuario temporal?</strong></p>
            <p class="text-sm text-gray-500">(Se usará el usuario ID: 1)</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.usuarioActual = this.crearUsuarioPorDefecto();
          this.confirmarEnvioSolicitud();
        }
      });

      return false;
    }

    return true;
  }

  confirmarEnvioSolicitud(): void {
    const usuarioNombre = this.usuarioActual?.nombre || 'Usuario';
    const usuarioId = this.usuarioActual?.id_usuario || 1;

    Swal.fire({
      title: '¿Crear solicitud?',
      html: `
        <div style="text-align: left;">
          <p><strong>Cliente:</strong> ${this.getNombreCompleto(this.clienteParaSolicitud)}</p>
          <p><strong>Monto:</strong> $${this.solicitudForm.value.monto_solicitado}</p>
          <p><strong>Ejecutivo:</strong> ${usuarioNombre}</p>
          <p><strong>ID Ejecutivo:</strong> ${usuarioId}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.enviarSolicitud(usuarioId);
      }
    });
  }

  enviarSolicitud(usuarioId: number): void {
    this.guardando = true;
    const formData = this.solicitudForm.getRawValue();

    const solicitudData = {
      cliente_id: Number(this.clienteParaSolicitud.id_cliente),
      usuario_id: Number(usuarioId),
      aliado_id: Number(formData.aliado_id),
      aval_id: Number(formData.aval_id),
      monto_solicitado: Number(formData.monto_solicitado),
      plazo_meses: Number(formData.plazo_meses),
      no_pagos: Number(formData.no_pagos),
      tipo_vencimiento: formData.tipo_vencimiento.toUpperCase(),
      tipo_credito: formData.tipo_credito,
      observaciones: formData.observaciones || '',
      dia_pago: formData.dia_pago,
      estado: 'PENDIENTE',
      tasa_interes: formData.tasa_interes || 0
    };

    console.log(' Enviando solicitud:', solicitudData);

    this.solicitudService.crearSolicitud(solicitudData).subscribe({
      next: (response) => {
        this.guardando = false;
        this.cerrarModalSolicitud();

        Swal.fire({
          icon: 'success',
          title: '¡Solicitud creada!',
          html: `
            <div style="text-align: center;">
              <p>La solicitud ha sido registrada exitosamente</p>
              <p><strong>Folio:</strong> ${response.id_solicitud || 'N/A'}</p>
              <p><strong>Estado:</strong> PENDIENTE</p>
              <p><strong>Ejecutivo ID:</strong> ${usuarioId}</p>
            </div>
          `,
          confirmButtonText: 'Aceptar',
          timer: 5000,
          timerProgressBar: true
        });

        this.cargarClientes();
      },
      error: (error) => {
        this.guardando = false;
        console.error('Error al crear solicitud:', error);

        this.manejarErrorSolicitud(error, usuarioId);
      }
    });
  }

  manejarErrorSolicitud(error: any, usuarioId: number): void {
    let mensajeError = 'Error al crear la solicitud';

    if (error.error?.detalle) {
      mensajeError += ': ' + error.error.detalle;
    } else if (error.error?.error) {
      mensajeError += ': ' + error.error.error;
    } else if (error.message) {
      mensajeError += ': ' + error.message;
    }

    // Manejo específico de errores
    if (mensajeError.includes('llave foránea')) {
      if (mensajeError.includes('usuario_id')) {
        mensajeError = `Error: El usuario con ID ${usuarioId} no existe. Contacte al administrador.`;
      } else if (mensajeError.includes('cliente_id')) {
        mensajeError = 'Error: El cliente no existe en el sistema.';
      } else if (mensajeError.includes('aliado_id')) {
        mensajeError = 'Error: El aliado seleccionado no existe.';
      } else if (mensajeError.includes('aval_id')) {
        mensajeError = 'Error: El aval seleccionado no existe.';
      }
    }

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensajeError,
      confirmButtonText: 'Aceptar'
    });
  }

  mostrarErroresFormulario(): void {
    Object.keys(this.solicitudForm.controls).forEach(key => {
      const control = this.solicitudForm.get(key);
      if (control && control.enabled && control.invalid) {
        control.markAsTouched();
      }
    });

    Swal.fire({
      icon: 'error',
      title: 'Formulario incompleto',
      text: 'Por favor complete todos los campos requeridos',
      confirmButtonText: 'Aceptar'
    });
  }

  limpiarFormularioSolicitud(): void {
    this.solicitudForm.reset({
      plazo_meses: 4,
      tipo_vencimiento: 'semanal',
      tipo_credito: 'NUEVO',
      no_pagos: 16,
      dia_pago: 'Lunes',
      observaciones: ''
    });
    this.clienteParaSolicitud = null;
    this.avalSeleccionado = null;
  }

  intentarRecuperarSesion(): void {
    console.log(' Intentando recuperar sesión automáticamente...');

    // Verificar si hay datos en localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.usuarioActual = user;
        console.log(' Sesión recuperada de localStorage');
        return;
      } catch (e) {
        console.error('Error parseando usuario:', e);
      }
    }

    // Verificar Firebase
    if (this.authService.getCurrentFirebaseUser()) {
      console.log('Firebase tiene sesión activa, recargando...');
      setTimeout(() => location.reload(), 1000);
    }
  }

  buscarCliente(): void {
    this.cargando = true;
    this.error = '';

    this.clienteService.buscarCliente(this.filtro).subscribe({
      next: (data) => {
        this.clientes = (data || []).filter(cliente => cliente != null);
        this.cargando = false;
        this.cargarEstadosClientes();
      },
      error: (err) => {
        this.error = 'Error en la búsqueda';
        this.cargando = false;
        console.error('Error:', err);
      }
    });
  }

  limpiarFiltros(): void {
    this.filtro = {
      nombre: '',
      identificacion: '',
      estadoCredito: ''
    };
    this.cargarClientes();
  }

  volverALista(): void {
    this.clienteSeleccionado = null;
    this.avalSeleccionado = null;
  }

  getNombreCompleto(cliente: any): string {
    if (!cliente) return 'Cliente no disponible';

    const nombre = cliente.nombre_cliente || '';
    const app = cliente.app_cliente || '';
    const apm = cliente.apm_cliente || '';

    return `${nombre} ${app} ${apm}`.trim() || 'Nombre no especificado';
  }

  getNombreCompletoAval(aval: any): string {
    if (!aval) return 'Aval no asignado';

    const nombre = aval.nombre_aval || aval.nombre || '';
    const app = aval.app_aval || aval.apellido_paterno || '';
    const apm = aval.apm_aval || aval.apellido_materno || '';

    return `${nombre} ${app} ${apm}`.trim() || 'Aval no especificado';
  }

  getDireccionCompleta(cliente: any): string {
    if (!cliente) return 'Sin dirección';

    const calle = cliente.calle || '';
    const numero = cliente.numero || '';
    const localidad = cliente.localidad || '';
    const municipio = cliente.municipio || '';

    const partes = [calle, numero, localidad, municipio].filter(part => part !== '');
    return partes.length > 0 ? partes.join(', ') : 'Sin dirección';
  }

  getEstadoCreditoClass(cliente: any): string {
    if (!cliente) return 'estado-desconocido';

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

  // Método para verificar si el cliente puede generar solicitud
  puedeGenerarSolicitud(cliente: any): boolean {
    if (!cliente) return false;
    const cache = this.clienteStatusCache.get(cliente.id_cliente);
    if (!cache) return false; // Todavía cargando o error

    return cache.canRequest;
  }

  // Método para obtener el estado del cliente (para mostrar en tabla)
  getEstadoCliente(cliente: any): string {
    if (!cliente) return 'SIN DATOS';
    const cache = this.clienteStatusCache.get(cliente.id_cliente);
    return cache ? cache.status : 'Cargando...';
  }

  // Método para obtener la clase CSS según estado
  getEstadoClienteClass(cliente: any): string {
    if (!cliente) return 'estado-desconocido';
    const cache = this.clienteStatusCache.get(cliente.id_cliente);
    return cache ? cache.class : 'estado-desconocido';
  }




}