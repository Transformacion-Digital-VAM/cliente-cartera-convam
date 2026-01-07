import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService } from '../../../../services/client.service';
import { SolicitudService } from '../../../../services/solicitud.service';
import { AliadoService } from '../../../../services/aliado.service';
import { AvalesService } from '../../../../services/avales.service';
import { AuthService } from '../../../../services/auth.service';
import { PagoService } from '../../../../services/pago.service';
import { PagareService } from '../../../../services/pagare.service';
import { CreditoService } from '../../../../services/credito.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

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

  // Para validación de garantía
  garantiaAnterior: number = 0;
  diferenciaGarantia: number = 0;
  creditoAnterior: any = null;
  mostrarValidacionGarantia: boolean = false;
  mostrarTodosClientes: boolean = true;

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

  // Subscripciones
  private userSubscription: Subscription | null = null;
  private authCheckInterval: any;

  constructor(
    private clienteService: ClienteService,
    private solicitudService: SolicitudService,
    private aliadoService: AliadoService,
    private avalesService: AvalesService,
    private authService: AuthService,
    private pagoService: PagoService,
    private pagareService: PagareService,
    private creditoService: CreditoService,
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
      monto_solicitado: ['', [Validators.required, Validators.min(5000), Validators.max(100000)]],
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

    this.solicitudForm.get('tipo_credito')?.valueChanges.subscribe((tipoCredito) => {
      this.actualizarValidacionMonto(tipoCredito);
    });
  }

  actualizarValidacionMonto(tipoCredito: string): void {
    const montoControl = this.solicitudForm.get('monto_solicitado');

    if (!montoControl) return;

    if (tipoCredito === 'NUEVO') {
      // Para clientes nuevos: entre 3,000 y 25,000
      montoControl.setValidators([
        Validators.required,
        Validators.min(3000),
        Validators.max(25000)
      ]);
    } else {
      // Para renovaciones y re-ingresos: entre 5,000 y 100,000
      montoControl.setValidators([
        Validators.required,
        Validators.min(5000),
        Validators.max(100000)
      ]);
    }

    montoControl.updateValueAndValidity();
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

  buscarAvalDelCliente(cliente: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!cliente || !cliente.id_cliente) {
        this.avalSeleccionado = null;
        resolve(null);
        return;
      }

      console.log('Buscando aval para cliente ID:', cliente.id_cliente);

      // Primero buscar en la lista local
      this.avalSeleccionado = this.avales.find(aval => {
        return aval.cliente_id === cliente.id_cliente ||
          aval.id_cliente === cliente.id_cliente;
      });

      if (this.avalSeleccionado) {
        console.log('Aval encontrado en lista local:', this.avalSeleccionado);
        resolve(this.avalSeleccionado);
        return;
      }

      console.log('Buscando aval por API...');
      this.avalesService.obtenerAvalesPorCliente(cliente.id_cliente).subscribe({
        next: (avalesCliente) => {
          if (avalesCliente && avalesCliente.length > 0) {
            this.avalSeleccionado = avalesCliente[0];
            console.log('Aval encontrado por API:', this.avalSeleccionado);

            // Agregar a la lista si no existe
            if (!this.avales.find(a => a.id_aval === this.avalSeleccionado.id_aval)) {
              this.avales.push(this.avalSeleccionado);
            }

            resolve(this.avalSeleccionado);
          } else {
            console.log('No se encontró aval para este cliente');
            this.avalSeleccionado = null;
            resolve(null);
          }
        },
        error: (err) => {
          console.error('Error al buscar aval por cliente:', err);
          this.avalSeleccionado = null;
          reject(err);
        }
      });
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

  // cargarClientes(): void {
  //   this.cargando = true;
  //   this.error = '';

  //   this.clienteService.obtenerClientes().subscribe({
  //     next: (data) => {
  //       this.clientes = (data || [])
  //         .filter(cliente => cliente != null)
  //         .sort((a, b) => b.id_cliente - a.id_cliente);

  //       console.log('Clientes cargados:', this.clientes.length);

  //       // Validar estado de cada cliente
  //       this.clientes.forEach(cliente => {
  //         this.validarEstadoClienteParaLista(cliente);
  //       });

  //       this.cargando = false;
  //     },
  //     error: (err) => {
  //       this.error = 'Error al cargar los clientes';
  //       this.cargando = false;
  //       console.error('Error:', err);
  //     }
  //   });
  // }
  cargarClientes(): void {
  this.cargando = true;
  this.error = '';

  this.clienteService.obtenerClientes().subscribe({
    next: (data) => {
      this.clientes = (data || [])
        .filter(cliente => cliente != null)
        .sort((a, b) => b.id_cliente - a.id_cliente);

      console.log('Clientes cargados:', this.clientes.length);

      // Validar estado de cada cliente
      this.clientes.forEach(cliente => {
        this.validarEstadoClienteParaLista(cliente);
      });

      this.cargando = false;
    },
    error: (err) => {
      this.error = 'Error al cargar los clientes';
      this.cargando = false;
      console.error('Error:', err);
    }
  });
}

  asignarEstadoCliente(cliente: any): void {
    if (!cliente) return;

    const cicloActual = cliente.ciclo_actual || 0;
    const mora = cliente.mora || 0;
    const moraDecimal = parseFloat(mora) || 0;

    // Si ciclo_actual > 0, tiene crédito activo
    if (cicloActual > 0 && cicloActual <= 16) {
      cliente.tiene_credito_activo = true;
      cliente.pagos_completados = cicloActual - 1; // Si está en ciclo 5, ya pagó 4
      cliente.total_pagos = 16;
      cliente.numero_pago_actual = cicloActual;
    } else {
      cliente.tiene_credito_activo = false;
      cliente.pagos_completados = 0;
      cliente.total_pagos = 16;
      cliente.numero_pago_actual = 0;
    }

    cliente.mora_decimal = moraDecimal;
  }

  verificarCreditoActivo(cliente: any): void {
    if (!cliente || !cliente.id_cliente) return;

    // Usar el endpoint de obtenerCalendarioPorCliente
    this.pagoService.obtenerCalendarioPorCliente(cliente.id_cliente).subscribe({
      next: (calendario) => {
        if (calendario && calendario.length > 0) {
          // Tiene crédito activo
          cliente.tiene_credito_activo = true;

          // Encontrar el calendario más reciente (por si tiene múltiples créditos)
          const calendarioReciente = calendario.reduce((prev, current) =>
            (prev.numero_pago > current.numero_pago) ? prev : current
          );

          cliente.numero_pago_actual = calendarioReciente.numero_pago || 0;
          cliente.id_credito_activo = calendarioReciente.id_credito;
          cliente.id_pagare = calendarioReciente.id_pagare;

          // Contar pagos completados
          const pagosCompletados = calendario.filter(p => p.pagado === true).length;
          cliente.pagos_completados = pagosCompletados;
          cliente.total_pagos = 16; // Siempre 16 pagos en tu sistema
        } else {
          // No tiene crédito activo
          cliente.tiene_credito_activo = false;
          cliente.numero_pago_actual = 0;
          cliente.pagos_completados = 0;
          cliente.total_pagos = 16;
        }

        console.log(`Cliente ${cliente.id_cliente} - ${cliente.nombre_cliente}:`, {
          tiene_credito_activo: cliente.tiene_credito_activo,
          numero_pago_actual: cliente.numero_pago_actual,
          pagos_completados: cliente.pagos_completados,
          total_pagos: cliente.total_pagos
        });
      },
      error: (err) => {
        console.error(`Error al verificar crédito para cliente ${cliente.id_cliente}:`, err);
        cliente.tiene_credito_activo = false;
      }
    });
  }

  verificarCreditosActivos(): void {
    // Obtener todos los créditos activos
    this.clienteService.obtenerCreditosActivos().subscribe({
      next: (creditos) => {
        // Crear un mapa de cliente_id -> crédito activo
        const clientesConCredito = new Map();

        creditos.forEach(credito => {
          if (credito.cliente_id) {
            clientesConCredito.set(credito.cliente_id, {
              id_credito: credito.id_credito,
              cliente_id: credito.cliente_id,
              ciclo_actual: credito.ciclo_actual || 0,
              pagos_completados: 0, // Inicializar
              total_pagos: 16
            });
          }
        });

        // Actualizar los clientes con la información del crédito
        this.clientes.forEach(cliente => {
          const credito = clientesConCredito.get(cliente.id_cliente);
          if (credito) {
            cliente.tiene_credito_activo = true;
            cliente.ciclo_actual = credito.ciclo_actual;
            cliente.id_credito_activo = credito.id_credito;

            // Obtener pagos completados para este cliente
            this.obtenerPagosCompletados(cliente.id_cliente);
          } else {
            cliente.tiene_credito_activo = false;
            cliente.ciclo_actual = 0;
            cliente.id_credito_activo = null;
            cliente.pagos_completados = 0;
          }
        });

        console.log('Clientes con crédito activo:', clientesConCredito.size);
      },
      error: (err) => {
        console.error('Error al verificar créditos activos:', err);
      }
    });
  }

  obtenerPagosCompletados(clienteId: number): void {
    this.pagoService.obtenerPagosPorCliente(clienteId).subscribe({
      next: (pagos) => {
        // Contar pagos completados
        const pagosCompletados = pagos.filter(pago => pago.pagado === true).length;

        // Actualizar el cliente específico
        const clienteIndex = this.clientes.findIndex(c => c.id_cliente === clienteId);
        if (clienteIndex !== -1) {
          this.clientes[clienteIndex].pagos_completados = pagosCompletados;
          this.clientes[clienteIndex].total_pagos = 16;
        }
      },
      error: (err) => {
        console.error('Error al obtener pagos completados:', err);
      }
    });
  }

  seleccionarCliente(cliente: any): void {
    if (cliente && cliente.id_cliente) {
      this.clienteSeleccionado = cliente;
      this.buscarAvalDelCliente(cliente);
    }
  }

  async abrirModalSolicitud(cliente: any): Promise<void> {
    if (!cliente || !cliente.id_cliente) return;

    // Mostrar loading mientras valida
    Swal.fire({
      title: 'Validando cliente...',
      text: 'Verificando estado de pagos',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Validar si puede generar solicitud
    const puede = await this.puedeGenerarSolicitud(cliente);

    Swal.close();

    if (!puede) {
      const pagosFaltantes = cliente.pagos_pendientes || 0;
      const pagosCompletados = cliente.pagos_completados || 0;

      Swal.fire({
        icon: 'error',
        title: 'No se puede generar solicitud',
        html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>${cliente.mensaje_validacion}</strong></p>
          <hr>
          <p><strong>Pagos completados:</strong> ${pagosCompletados} de 15</p>
          <p><strong>Pagos pendientes:</strong> ${pagosFaltantes}</p>
          <p class="text-muted" style="font-size: 0.9em; margin-top: 10px;">
            El cliente debe completar los pagos del 1 al 15 para poder generar una nueva solicitud.
          </p>
        </div>
      `,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Continuar con el flujo normal
    this.clienteParaSolicitud = cliente;
    this.verificarUsuarioParaModal();

    // Resetear variables de garantía
    this.garantiaAnterior = 0;
    this.diferenciaGarantia = 0;
    this.creditoAnterior = null;
    this.mostrarValidacionGarantia = false;

    // Resetear formulario
    this.solicitudForm.reset({
      plazo_meses: 4,
      tipo_vencimiento: 'semanal',
      tipo_credito: cliente.es_cliente_nuevo ? 'NUEVO' : 'RENOVACIÓN',
      no_pagos: 16,
      dia_pago: 'Lunes',
      observaciones: '',
      monto_solicitado: '',
      tasa_interes: '',
      aliado_id: '',
      aval_id: ''
    });

    const tipoCreditoInicial = this.solicitudForm.get('tipo_credito')?.value;
    if (tipoCreditoInicial) {
      this.actualizarValidacionMonto(tipoCreditoInicial);
    }

    // Buscar aval del cliente
    await this.buscarAvalDelCliente(cliente);

    if (this.avalSeleccionado && this.avalSeleccionado.id_aval) {
      this.solicitudForm.patchValue({
        aval_id: this.avalSeleccionado.id_aval
      });
    }

    // Suscribirse a cambios en el monto para validar garantía
    const montoControl = this.solicitudForm.get('monto_solicitado');
    if (montoControl) {
      console.log('Configurando suscripción a cambios de monto...');

      montoControl.valueChanges.subscribe(async (monto) => {
        console.log('--- CAMBIO EN MONTO DETECTADO ---');
        console.log('Nuevo monto:', monto);
        console.log('Cliente ID:', this.clienteParaSolicitud?.id_cliente);
        console.log('Tipo de monto:', typeof monto);

        if (monto && !isNaN(monto) && this.clienteParaSolicitud) {
          console.log('Llamando a validarGarantia...');
          await this.validarGarantia(this.clienteParaSolicitud.id_cliente, parseFloat(monto));
        } else {
          console.log('Monto inválido o cliente no disponible');
          this.mostrarValidacionGarantia = false;
        }
      });
    }

    // Abrir modal
    this.abrirModalBootstrap();
  }

  getMontoErrorMessage(): string {
    const control = this.solicitudForm.get('monto_solicitado');
    const tipoCredito = this.solicitudForm.get('tipo_credito')?.value;

    if (!control || !control.errors) return '';

    if (control.hasError('required')) {
      return 'El monto solicitado es requerido';
    }

    if (control.hasError('min')) {
      const minValue = tipoCredito === 'NUEVO' ? '3,000' : '5,000';
      return `El monto mínimo para ${tipoCredito === 'NUEVO' ? 'clientes nuevos' : tipoCredito.toLowerCase()} es $${minValue}`;
    }

    if (control.hasError('max')) {
      const maxValue = tipoCredito === 'NUEVO' ? '25,000' : '100,000';
      return `El monto máximo para ${tipoCredito === 'NUEVO' ? 'clientes nuevos' : tipoCredito.toLowerCase()} es $${maxValue}`;
    }

    return '';
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

      if (!this.usuarioActual || !this.usuarioActual.id_usuario) {
        this.usuarioActual = this.crearUsuarioPorDefecto();
        console.log('Usuario por defecto para modal:', this.usuarioActual.nombre);
      }
    }
  }

  async validarGarantia(clienteId: number, montoSolicitado: number): Promise<void> {
    console.log('=== INICIANDO VALIDACIÓN DE GARANTÍA ===');
    console.log('Cliente ID:', clienteId);
    console.log('Monto solicitado:', montoSolicitado);

    try {
      // Obtener créditos del cliente
      console.log('Llamando a obtenerCreditosPorCliente...');
      const creditos = await this.creditoService.obtenerCreditosPorCliente(clienteId).toPromise();
      console.log('Respuesta del servicio:', creditos);
      console.log('Número de créditos encontrados:', creditos?.length);

      if (creditos && creditos.length > 0) {
        console.log('Lista completa de créditos:', creditos);

        // Filtrar créditos aprobados (estado 'APROBADO' o 'ACTIVO')
        const creditosAprobados = creditos.filter(c => {
          const estado = c.estado_credito || c.estado;
          console.log(`Crédito ID ${c.id_credito || c.id}: estado = ${estado}`);
          return estado === 'APROBADO' || estado === 'ACTIVO' || estado === 'APROBADA';
        });

        console.log('Créditos aprobados filtrados:', creditosAprobados.length);
        console.log('Detalle créditos aprobados:', creditosAprobados);

        if (creditosAprobados.length > 0) {
          // Ordenar por fecha descendente para obtener el más reciente
          creditosAprobados.sort((a, b) => {
            const fechaA = a.fecha_aprobacion || a.fecha_creacion || a.created_at || 0;
            const fechaB = b.fecha_aprobacion || b.fecha_creacion || b.created_at || 0;
            return new Date(fechaB).getTime() - new Date(fechaA).getTime();
          });

          this.creditoAnterior = creditosAprobados[0];
          console.log('Crédito anterior seleccionado:', this.creditoAnterior);

          // Obtener la garantía del crédito anterior
          this.garantiaAnterior =
            this.creditoAnterior.garantia_total ||
            this.creditoAnterior.garantia ||
            this.creditoAnterior.monto_garantia ||
            this.creditoAnterior.monto_aprobado ||
            this.creditoAnterior.monto_solicitado ||
            0;

          console.log('Garantía anterior calculada:', this.garantiaAnterior);

          // Calcular diferencia
          this.diferenciaGarantia = montoSolicitado - this.garantiaAnterior;
          this.mostrarValidacionGarantia = true;

          console.log('Validación de garantía COMPLETADA:', {
            garantiaAnterior: this.garantiaAnterior,
            montoSolicitado: montoSolicitado,
            diferencia: this.diferenciaGarantia,
            mostrarValidacionGarantia: this.mostrarValidacionGarantia
          });
        } else {
          this.mostrarValidacionGarantia = false;
          console.log('Cliente no tiene créditos aprobados anteriores');
        }
      } else {
        this.mostrarValidacionGarantia = false;
        console.log('Cliente no tiene créditos anteriores');
      }
    } catch (error: any) {
      console.error('Error al validar garantía:', error);
      if (error && error.error) {
        console.error('Error details:', error.error);
      }
      this.mostrarValidacionGarantia = false;
    }
  }

  getInfoCreditoAnterior(): string {
    if (!this.creditoAnterior || !this.mostrarValidacionGarantia) {
      return 'No hay crédito anterior registrado';
    }

    const montoAprobado =
      this.creditoAnterior.monto_aprobado ||
      this.creditoAnterior.monto_solicitado ||
      0;

    const fecha =
      this.creditoAnterior.fecha_aprobacion ||
      this.creditoAnterior.fecha_creacion ||
      this.creditoAnterior.created_at ||
      'Fecha no disponible';

    return `Crédito anterior: $${montoAprobado.toFixed(2)} - Garantía: $${this.garantiaAnterior.toFixed(2)} - Fecha: ${fecha}`;
  }

  getDiferenciaGarantiaTexto(): string {
    if (!this.mostrarValidacionGarantia || this.garantiaAnterior === 0) {
      return 'Sin crédito anterior para comparar';
    }

    const diferenciaAbsoluta = Math.abs(this.diferenciaGarantia);

    if (this.diferenciaGarantia > 0) {
      return `+ $${diferenciaAbsoluta.toFixed(2)} (Aumento de garantía)`;
    } else if (this.diferenciaGarantia < 0) {
      return `- $${diferenciaAbsoluta.toFixed(2)} (Reducción de garantía)`;
    } else {
      return 'Sin cambio en garantía (Monto igual)';
    }
  }

  getEstadoGarantiaClass(): string {
    if (!this.mostrarValidacionGarantia) {
      return '';
    }

    if (this.diferenciaGarantia > 0) {
      return 'text-success';
    } else if (this.diferenciaGarantia < 0) {
      return 'text-danger';
    } else {
      return 'text-warning';
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

  // guardarSolicitud(): void {
  //   console.log(' Guardando solicitud...');

  //   if (!this.verificarUsuarioParaEnvio()) {
  //     return;
  //   }

  //   if (this.solicitudForm.valid && this.clienteParaSolicitud) {
  //     this.confirmarEnvioSolicitud();
  //   } else {
  //     this.mostrarErroresFormulario();
  //   }
  // }
  guardarSolicitud(): void {
    console.log(' Guardando solicitud...');

    // 1. Verificar usuario
    if (!this.verificarUsuarioParaEnvio()) {
      return;
    }

    // 2. Verificar que el formulario sea válido y que haya un cliente seleccionado
    if (this.solicitudForm.valid && this.clienteParaSolicitud) {
      const tipoCredito = this.solicitudForm.value.tipo_credito;
      const monto = parseFloat(this.solicitudForm.value.monto_solicitado);
      const cliente = this.clienteParaSolicitud;

      console.log('Validando solicitud:', {
        tipoCredito,
        monto,
        clienteId: cliente.id_cliente,
        esClienteNuevo: cliente.es_cliente_nuevo
      });

      // 3. Validación específica para clientes nuevos
      if (tipoCredito === 'NUEVO' || cliente.es_cliente_nuevo) {
        if (monto < 3000) {
          Swal.fire({
            icon: 'error',
            title: 'Monto insuficiente',
            html: `
            <div style="text-align: left;">
              <p><strong>Para clientes nuevos:</strong></p>
              <p>• El monto mínimo es <strong>$3,000</strong></p>
              <p>• El monto máximo es <strong>$7,000</strong></p>
              <p>• Monto ingresado: <strong>$${monto.toLocaleString()}</strong></p>
              <hr>
              <p class="text-sm text-gray-500">
                Cliente: ${this.getNombreCompleto(cliente)}<br>
                ID: ${cliente.id_cliente}<br>
                Estado: ${cliente.es_cliente_nuevo ? 'NUEVO' : 'CON HISTORIAL'}
              </p>
            </div>
          `,
            confirmButtonText: 'Ajustar Monto',
            confirmButtonColor: '#3085d6'
          });
          return;
        }

        if (monto > 25000) {
          Swal.fire({
            icon: 'error',
            title: 'Monto excedido',
            html: `
            <div style="text-align: left;">
              <p><strong>Límite para clientes nuevos:</strong></p>
              <p>• Monto máximo permitido: <strong>$25,000</strong></p>
              <p>• Monto ingresado: <strong>$${monto.toLocaleString()}</strong></p>
              <p>• Excedente: <strong class="text-danger">$${(monto - 25000).toLocaleString()}</strong></p>
              <hr>
              <p class="text-sm text-gray-500">
                <strong>Nota:</strong> Los clientes nuevos tienen límites reducidos para su primer crédito.<br>
                Una vez completado el primer ciclo, podrán solicitar montos mayores.
              </p>
            </div>
          `,
            confirmButtonText: 'Reducir Monto',
            confirmButtonColor: '#3085d6'
          });
          return;
        }

        // Mensaje de confirmación para clientes nuevos
        Swal.fire({
          title: 'Confirmar solicitud para cliente nuevo',
          html: `
          <div style="text-align: left;">
            <p><strong>Cliente NUEVO - Validación de límites:</strong></p>
            <p>• Monto solicitado: <strong>$${monto.toLocaleString()}</strong></p>
            <p>• Límite aplicado: <strong>$3,000 - $25,000</strong></p>
            <p>• Tipo: <strong>PRIMER CRÉDITO</strong></p>
            <hr>
            <p class="text-info">
              <i class="fas fa-info-circle"></i>
              Este es el primer crédito del cliente. Los montos se incrementarán en ciclos posteriores.
            </p>
          </div>
        `,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Confirmar',
          cancelButtonText: 'Revisar',
          confirmButtonColor: '#3085d6'
        }).then((result) => {
          if (result.isConfirmed) {
            this.confirmarEnvioSolicitud();
          }
        });
        return;
      }

      // 4. Validación para renovaciones y re-ingresos
      if (tipoCredito === 'RENOVACIÓN' || tipoCredito === 'RE-INGRESO') {
        if (monto < 5000) {
          Swal.fire({
            icon: 'error',
            title: 'Monto mínimo no alcanzado',
            html: `
            <div style="text-align: left;">
              <p><strong>Para ${tipoCredito}:</strong></p>
              <p>• Monto mínimo: <strong>$5,000</strong></p>
              <p>• Monto máximo: <strong>$100,000</strong></p>
              <p>• Monto ingresado: <strong>$${monto.toLocaleString()}</strong></p>
              <hr>
              <p class="text-sm text-gray-500">
                Cliente: ${this.getNombreCompleto(cliente)}<br>
                Pagos completados: ${cliente.pagos_completados || 0}/15
              </p>
            </div>
          `,
            confirmButtonText: 'Ajustar Monto'
          });
          return;
        }

        if (monto > 100000) {
          Swal.fire({
            icon: 'error',
            title: 'Límite excedido',
            text: `El monto máximo para ${tipoCredito.toLowerCase()} es $100,000`,
            confirmButtonText: 'Reducir Monto'
          });
          return;
        }
      }

      // 5. Validación adicional de garantía si aplica
      if (this.mostrarValidacionGarantia && this.diferenciaGarantia > 10000) {
        Swal.fire({
          title: 'Aumento significativo de garantía',
          html: `
          <div style="text-align: left;">
            <p>Se ha detectado un aumento considerable en la garantía:</p>
            <p>• Garantía anterior: <strong>$${this.garantiaAnterior.toLocaleString()}</strong></p>
            <p>• Monto solicitado: <strong>$${monto.toLocaleString()}</strong></p>
            <p>• Aumento: <strong class="text-success">+$${this.diferenciaGarantia.toLocaleString()}</strong></p>
            <hr>
            <p class="text-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <strong>Verificar:</strong> La capacidad de pago del cliente para este nuevo monto.
            </p>
          </div>
        `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Continuar',
          cancelButtonText: 'Revisar',
          confirmButtonColor: '#3085d6'
        }).then((result) => {
          if (result.isConfirmed) {
            this.confirmarEnvioSolicitud();
          }
        });
        return;
      }

      // 6. Si pasa todas las validaciones, proceder con confirmación normal
      this.confirmarEnvioSolicitud();
    } else {
      // 7. Mostrar errores del formulario
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
    this.garantiaAnterior = 0;
    this.diferenciaGarantia = 0;
    this.creditoAnterior = null;
    this.mostrarValidacionGarantia = false;
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

  esClienteValido(cliente: any): boolean {
    return cliente != null && cliente.id_cliente != null;
  }

  puedeGenerarSolicitud(cliente: any): Promise<boolean> {
    return new Promise((resolve) => {
      if (!cliente || !cliente.id_cliente) {
        resolve(false);
        return;
      }

      // Obtener el calendario del cliente usando el método existente
      this.pagareService.obtenerCalendarioPorCliente(cliente.id_cliente).subscribe({
        next: (calendario) => {
          console.log(`Calendario del cliente ${cliente.id_cliente}:`, calendario);

          // Si no tiene calendario, es cliente nuevo - PUEDE solicitar
          if (!calendario || calendario.length === 0) {
            console.log('Cliente nuevo sin calendario');
            cliente.es_cliente_nuevo = true;
            cliente.puede_solicitar = true;
            cliente.pagos_completados = 0;
            cliente.mensaje_validacion = 'Cliente nuevo sin créditos previos';
            resolve(true);
            return;
          }

          // Tiene calendario - Validar pagos del 1 al 15
          const pagosDel1al15 = calendario.filter(p => p.numero_pago >= 1 && p.numero_pago <= 15);
          const pagosPagados = pagosDel1al15.filter(p => p.pagado === true);
          const todosLosPagosPagados = pagosDel1al15.length === pagosPagados.length;

          // Actualizar información del cliente
          cliente.es_cliente_nuevo = false;
          cliente.puede_solicitar = todosLosPagosPagados;
          cliente.pagos_completados = pagosPagados.length;
          cliente.total_pagos = calendario.length;
          cliente.pagos_pendientes = pagosDel1al15.length - pagosPagados.length;

          if (todosLosPagosPagados) {
            cliente.mensaje_validacion = 'Cliente cumple requisitos para nueva solicitud';
            console.log(`✓ Cliente ${cliente.id_cliente} puede solicitar`);
          } else {
            cliente.mensaje_validacion = `Faltan ${cliente.pagos_pendientes} pagos por completar`;
            console.log(`✗ Cliente ${cliente.id_cliente} no puede solicitar - Faltan ${cliente.pagos_pendientes} pagos`);
          }

          resolve(todosLosPagosPagados);
        },
        error: (err) => {
          console.error(`Error al obtener calendario del cliente ${cliente.id_cliente}:`, err);
          // Si hay error, asumir que es cliente nuevo
          cliente.es_cliente_nuevo = true;
          cliente.puede_solicitar = true;
          cliente.mensaje_validacion = 'No se pudo verificar historial';
          resolve(true);
        }
      });
    });
  }

  // Validar antigüedad del cliente 
  validarAntiguedadCliente(cliente: any): Promise<boolean> {
    return new Promise((resolve) => {
      if (!cliente || !cliente.id_cliente) {
        resolve(false);
        return;
      }

      // Obtener el calendario del cliente usando el método existente
      this.pagareService.obtenerCalendarioPorCliente(cliente.id_cliente).subscribe({
        next: (calendario) => {
          console.log(`Calendario del cliente ${cliente.id_cliente}:`, calendario);

          // Si no tiene calendario, es cliente nuevo - PUEDE solicitar
          if (!calendario || calendario.length === 0) {
            console.log('Cliente nuevo sin calendario');
            cliente.es_cliente_nuevo = true;
            cliente.puede_solicitar = true;
            cliente.pagos_completados = 0;
            cliente.mensaje_validacion = 'Cliente nuevo sin créditos previos';
            resolve(true);
            return;
          }

          
        },
        error: (err) => {
          console.error(`Error al obtener calendario del cliente ${cliente.id_cliente}:`, err);
          // Si hay error, asumir que es cliente nuevo
          cliente.es_cliente_nuevo = true;
          cliente.puede_solicitar = true;
          cliente.mensaje_validacion = 'No se pudo verificar historial (posible cliente nuevo)';
          resolve(true);
        }
      });
    });
  }

  // getEstadoCliente(cliente: any): string {
  //   if (!cliente) return 'SIN DATOS';

  //   if (cliente.es_cliente_nuevo) {
  //     return 'CLIENTE NUEVO';
  //   }

  //   const pagosCompletados = cliente.pagos_completados || 0;
  //   const moraDecimal = cliente.mora_decimal || 0;

  //   if (moraDecimal > 0) {
  //     return `CON MORA ($${moraDecimal.toFixed(2)})`;
  //   }

  //   if (cliente.puede_solicitar) {
  //     return 'DISPONIBLE PARA RENOVACIÓN';
  //   }

  //   if (pagosCompletados < 15) {
  //     return `CA (${pagosCompletados}/15)`;
  //   }

  //   return 'VERIFICAR ESTADO';
  // }
  

  // validarEstadoClienteParaLista(cliente: any): void {
  //   this.pagareService.obtenerCalendarioPorCliente(cliente.id_cliente).subscribe({
  //     next: (calendario) => {
  //       if (!calendario || calendario.length === 0) {
  //         // Cliente nuevo
  //         cliente.es_cliente_nuevo = true;
  //         cliente.puede_solicitar = true;
  //         cliente.pagos_completados = 0;
  //         cliente.total_pagos = 0;
  //         cliente.tiene_credito_activo = false;
  //         console.log(`Cliente ${cliente.id_cliente} es nuevo`);
  //       } else {
  //         // Cliente con historial
  //         const pagosDel1al15 = calendario.filter(p => p.numero_pago >= 1 && p.numero_pago <= 15);
  //         const pagosPagados = pagosDel1al15.filter(p => p.pagado === true);
  //         // const creditoFinalizo = calendario.some(p => p.pagado === false && new Date(p.fecha_vencimiento) >= new Date());
  //         // const creditoPagado = creditoFinalizo && pagosDel1al15.filter(p => p.pagado === true).length === pagosDel1al15.length;

  //         cliente.es_cliente_nuevo = false;
  //         cliente.tiene_credito_activo = true;
  //         cliente.pagos_completados = pagosPagados.length;
  //         cliente.total_pagos = calendario.length;
  //         cliente.puede_solicitar = pagosDel1al15.length === pagosPagados.length;
  //         cliente.numero_pago_actual = Math.max(...calendario.map(p => p.numero_pago));

  //         // Calcular mora si existe
  //         const totalMora = calendario.reduce((sum, p) => sum + (Number(p.mora_acumulada) || 0), 0);
  //         cliente.mora_decimal = totalMora;
          
  //       }
  //     },
  //     error: (err) => {
  //       console.error(`Error validando cliente ${cliente.id_cliente}:`, err);
  //       cliente.es_cliente_nuevo = true;
  //       cliente.puede_solicitar = true;
  //     }
  //   });
  // }

  getEstadoCliente(cliente: any): string {
  if (!cliente) return 'SIN DATOS';

  // Primero verificar si hubo error de carga
  if (cliente.error_carga) {
    return 'ERROR AL CARGAR';
  }

  // Verificar crédito cerrado hace más de 7 meses
  if (cliente.credito_cerrado_mas_7_meses) {
    const meses = cliente.meses_desde_cierre || 0;
    return `RE-INGRESO - (${meses} meses)`;
  }

  if (cliente.es_cliente_nuevo) {
    return 'CLIENTE NUEVO';
  }

  const pagosCompletados = cliente.pagos_completados || 0;
  const moraDecimal = cliente.mora_decimal || 0;

  if (moraDecimal > 0) {
    return `CON MORA ($${moraDecimal.toFixed(2)})`;
  }

  if (cliente.puede_solicitar) {
    return 'DISPONIBLE PARA RENOVACIÓN';
  }

  if (pagosCompletados < 15) {
    return `CA (${pagosCompletados}/15)`;
  }

  if (cliente.tiene_credito_activo && cliente.numero_pago_actual) {
    return `CA (${cliente.numero_pago_actual}/16)`;
  }

  return 'VERIFICAR ESTADO';
}


  validarEstadoClienteParaLista(cliente: any): void {
      cliente.error_carga = false;
      cliente.credito_cerrado_mas_7_meses = false;
      cliente.es_cliente_nuevo = true;
      cliente.tiene_credito_activo = false;
      cliente.meses_desde_cierre = 0;
  this.pagareService.obtenerCalendarioPorCliente(cliente.id_cliente).subscribe({
    next: (calendario) => {
      console.log(`Calendario del cliente ${cliente.id_cliente}:`, calendario);

      // Si no tiene calendario, es cliente nuevo
      if (!calendario || calendario.length === 0) {
        console.log(`Cliente ${cliente.id_cliente} es nuevo`);
        cliente.es_cliente_nuevo = true;
        cliente.puede_solicitar = true;
        cliente.pagos_completados = 0;
        cliente.total_pagos = 0;
        cliente.tiene_credito_activo = false;
        cliente.credito_cerrado_mas_7_meses = false;
        return;
      }

      // Cliente con historial - procesar calendario
      const pagosDel1al15 = calendario.filter(p => p.numero_pago >= 1 && p.numero_pago <= 15);
      const pagosPagados = pagosDel1al15.filter(p => p.pagado === true);
      
      // Buscar el pago 16
      const pago16 = calendario.find(p => p.numero_pago === 16);
      
      // Inicializar propiedades
      cliente.es_cliente_nuevo = false;
      cliente.pagos_completados = pagosPagados.length;
      cliente.total_pagos = calendario.length;
      cliente.puede_solicitar = pagosDel1al15.length === pagosPagados.length;
      
      // Verificar si el pago 16 está pagado (crédito cerrado)
      if (pago16 && pago16.pagado === true) {
        // Crédito cerrado - verificar fecha
        cliente.tiene_credito_activo = false;
        
        if (pago16.fecha_pago) {
          const fechaPago16 = new Date(pago16.fecha_pago);
          const hoy = new Date();
          
          // Calcular diferencia en meses
          const diferenciaMeses = this.calcularDiferenciaMeses(fechaPago16, hoy);
          cliente.meses_desde_cierre = diferenciaMeses;
          cliente.fecha_ultimo_pago = fechaPago16;
          cliente.credito_cerrado_mas_7_meses = diferenciaMeses > 7;
          
          console.log(`Cliente ${cliente.id_cliente} - Crédito cerrado hace ${diferenciaMeses} meses`);
          
          if (cliente.credito_cerrado_mas_7_meses) {
            console.log(`¡ALERTA! Cliente ${cliente.id_cliente} lleva más de 7 meses sin crédito`);
            cliente.mensaje_estado = `Crédito cerrado hace ${diferenciaMeses} meses`;
          } else {
            cliente.mensaje_estado = `Crédito cerrado hace ${diferenciaMeses} meses`;
          }
        } else {
          cliente.credito_cerrado_mas_7_meses = false;
          cliente.mensaje_estado = 'Crédito cerrado (sin fecha de pago)';
        }
      } else {
        // Crédito activo o pendiente
        cliente.tiene_credito_activo = true;
        cliente.credito_cerrado_mas_7_meses = false;
        
        // Encontrar el último pago para mostrar progreso
        const ultimoPago = calendario.reduce((prev, current) => 
          (prev.numero_pago > current.numero_pago) ? prev : current
        );
        
        cliente.numero_pago_actual = ultimoPago.numero_pago || 0;
        cliente.mensaje_estado = `En ciclo ${cliente.numero_pago_actual}/16`;
      }
      
      // Calcular mora si existe
      const totalMora = calendario.reduce((sum, p) => sum + (Number(p.mora_acumulada) || 0), 0);
      cliente.mora_decimal = totalMora;
    },
    error: (err) => {
      console.error(`Error validando cliente ${cliente.id_cliente}:`, err);
      
      // En caso de error, establecer valores por defecto
      cliente.es_cliente_nuevo = true;
      cliente.puede_solicitar = true;
      cliente.tiene_credito_activo = false;
      cliente.credito_cerrado_mas_7_meses = false;
      cliente.error_carga = true;
      
      // Mostrar error solo si es un error real (no abort)
      if (err.status !== 0) {
        console.warn(`Error específico para cliente ${cliente.id_cliente}:`, err.message);
      }
    }
  });
}

// Agrega este método para calcular la diferencia en meses
calcularDiferenciaMeses(fechaInicio: Date, fechaFin: Date): number {
  let meses = (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12;
  meses -= fechaInicio.getMonth();
  meses += fechaFin.getMonth();
  
  // Ajustar si el día del mes de la fecha fin es menor que el día del mes de la fecha inicio
  if (fechaFin.getDate() < fechaInicio.getDate()) {
    meses--;
  }
  
  return meses < 0 ? 0 : meses;
}

  // getEstadoClienteClass(cliente: any): string {
  //   if (!cliente) return 'estado-desconocido';

  //   if (cliente.es_cliente_nuevo) {
  //     return 'estado-nuevo';
  //   }

  //   if (cliente.mora_decimal > 0) {
  //     return 'estado-mora';
  //   }

  //   if (cliente.puede_solicitar) {
  //     return 'estado-disponible';
  //   }

  //   if (cliente.tiene_credito_activo) {
  //     return 'estado-en-ciclo';
  //   }

  //   return 'estado-desconocido';
  // }

  getEstadoClienteClass(cliente: any): string {
  if (!cliente) return 'estado-desconocido';

  // Cliente con error de carga
  if (cliente.error_carga) {
    return 'estado-error';
  }

  // Crédito cerrado hace más de 7 meses
  if (cliente.credito_cerrado_mas_7_meses) {
    return 'estado-cerrado';
  }

  if (cliente.es_cliente_nuevo) {
    return 'estado-nuevo';
  }

  if (cliente.mora_decimal > 0) {
    return 'estado-mora';
  }

  if (cliente.puede_solicitar) {
    return 'estado-disponible';
  }

  if (cliente.tiene_credito_activo) {
    return 'estado-en-ciclo';
  }

  return 'estado-desconocido';
}


// Método para alternar la vista
// alternarVistaClientes(): void {
//   this.mostrarTodosClientes = !this.mostrarTodosClientes;
// }
alternarVistaClientes(): void {
  this.mostrarTodosClientes = !this.mostrarTodosClientes;
  
  // Si al cambiar la vista, el cliente seleccionado no está en la lista filtrada, deseleccionarlo
  if (this.clienteSeleccionado) {
    const clienteEnLista = this.clientesFiltrados.some(
      cliente => cliente.id_cliente === this.clienteSeleccionado.id_cliente
    );
    
    if (!clienteEnLista) {
      this.volverALista();
    }
  }
}


// Método para obtener clientes filtrados
// get clientesFiltrados(): any[] {
//   if (this.mostrarTodosClientes) {
//     return this.clientes;
//   } else {
//     // Mostrar solo clientes activos (no cerrados por más de 7 meses)
//     return this.clientes.filter(cliente => 
//       !cliente.credito_cerrado_mas_7_meses && 
//       !cliente.error_carga
//     );
//   }
// }
get clientesFiltrados(): any[] {
  if (this.mostrarTodosClientes) {
    // Mostrar todos los clientes
    return this.clientes;
  } else {
    // Mostrar solo clientes que NO están en estado cerrado (>7 meses)
    return this.clientes.filter(cliente => {
      // Si hay error de carga, no mostrar
      if (cliente.error_carga) return false;
      
      // Si el cliente es nuevo, mostrarlo
      if (cliente.es_cliente_nuevo) return true;
      
      // Si no tiene crédito activo pero no es estado "cerrado", mostrarlo
      if (!cliente.tiene_credito_activo) {
        // Verificar si es estado cerrado (>7 meses)
        return !cliente.credito_cerrado_mas_7_meses;
      }
      
      // Si tiene crédito activo, mostrarlo
      return cliente.tiene_credito_activo;
    });
  }
}


// Método mejorado para cargar clientes con manejo de errores
cargarClientesConReintento(): void {
  this.cargando = true;
  this.error = '';

  this.clienteService.obtenerClientes().subscribe({
    next: (data) => {
      this.clientes = (data || [])
        .filter(cliente => cliente != null)
        .sort((a, b) => b.id_cliente - a.id_cliente);

      console.log('Clientes cargados:', this.clientes.length);

      // Validar estado de cada cliente con manejo de errores
      this.clientes.forEach(cliente => {
        try {
          this.validarEstadoClienteParaLista(cliente);
        } catch (error) {
          console.error(`Error al validar cliente ${cliente.id_cliente}:`, error);
          cliente.error_carga = true;
        }
      });

      this.cargando = false;
    },
    error: (err) => {
      this.error = 'Error al cargar los clientes. Por favor, verifica tu conexión.';
      this.cargando = false;
      console.error('Error:', err);
      
      // Mostrar alerta si el error es de conexión
      if (err.status === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
          confirmButtonText: 'Reintentar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.cargarClientes();
          }
        });
      }
    }
  });
}


}