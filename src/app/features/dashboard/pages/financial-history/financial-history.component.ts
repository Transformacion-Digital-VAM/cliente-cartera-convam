import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CreditoService } from '../../../../services/credito.service';
import { PagoService } from '../../../../services/pago.service';
import { AliadoService } from '../../../../services/aliado.service';
import { ClienteService } from '../../../../services/client.service';
import { AuthService } from '../../../../services/auth.service';
import { CalendarioPagoService } from '../../../../services/calendario-pago.service';

interface CalendarioPago {
  id_calendario: number;
  numero_pago: number;
  fecha_vencimiento: string;
  capital: number;
  interes: number;
  total_semana: number;
  pagado: boolean;
  monto_pagado: number;
  estatus: 'PENDIENTE' | 'PAGADO' | 'PAGO PARCIAL' | 'VENCIDO';
  mora_acumulada?: number;
}

interface ViewData {
  nombreCliente: string;
  nombreAliado: string;
  diaPago: string;
  pagosRealizados: number;
  totalSemanas: number;
  pagosPendientes: number;
  pagoSemanal: number;
  proximaFecha: string;
  proximaFechaRaw: string;
  totalPagado: number;
  saldoPendiente: number;
  proximoPagoNum: number;
  diasAtraso: number;
  periodosAtrasados: number;
  totalAtrasado: number;
  estadoPago: { texto: string; clase: string; filaClase: string };
  periodoActual: number;
}

@Component({
  selector: 'app-financial-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-history.component.html',
  styleUrls: ['./financial-history.component.css']
})
export class FinancialHistoryComponent implements OnInit, OnDestroy {
  // ============================================
  // PROPIEDADES PRINCIPALES
  // ============================================
  creditos: any[] = [];
  creditosFiltrados: any[] = [];
  calendarioPorCredito: Map<number, CalendarioPago[]> = new Map();
  pagosPorCredito: Map<number, any[]> = new Map();

  // Datos auxiliares
  clientes: any[] = [];
  aliados: any[] = [];
  clientesMap = new Map<number, any>();
  aliadosMap = new Map<number, any>();

  // Filtros
  filtroAliado: number[] = [];
  filtroEstado: string = '';
  filtroCliente: string = '';
  filtroDiaPago: string = '';
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // UI
  cargando: boolean = false;
  filaExpandida: number | null = null;

  // Modales
  modalSeleccionAbierto: boolean = false;
  modalPagoAbierto: boolean = false;
  creditoSeleccionado: any = null;
  procesandoPago: boolean = false;

  // Datos del pago
  montoPago: number = 0;
  metodoPago: string = '';
  tipoPago: string = 'PAGO';
  moratorios: number = 0;
  numeroPagoSeleccionado: number = 1;
  metodosPago: string[] = ['EFECTIVO', 'TRANSFERENCIA'];

  // Variables del modal
  diasAtraso: number = 0;
  periodosAtrasados: number = 0;
  moraAcumulada: number = 0;
  carteraAtrasada: number = 0;
  totalAtrasado: number = 0;
  proximaFechaPago: Date | null = null;
  ultimoPagoCompleto: number = 0;

  // Usuario
  usuarioActual: any = null;
  registradoPor: number = 0;
  private subscriptions: Subscription[] = [];

  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor(
    private creditoService: CreditoService,
    private pagoService: PagoService,
    private aliadoService: AliadoService,
    private clienteService: ClienteService,
    private authService: AuthService,
    private calendarioPagoService: CalendarioPagoService
  ) { }

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  ngOnInit(): void {
    this.cargarUsuarioLogueado();
    this.cargarDatosIniciales();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================
  cargarUsuarioLogueado(): void {
    this.usuarioActual = this.authService.getUserDataSync();
    if (this.usuarioActual?.id_usuario) {
      this.registradoPor = this.usuarioActual.id_usuario;
    }
  }

  cargarDatosIniciales(): void {
    this.cargarClientes();
    this.cargarAliados();
    this.cargarCreditos();
  }

  cargarClientes(): void {
    const sub = this.clienteService.obtenerClientes().subscribe({
      next: (clientes) => {
        this.clientes = clientes;
        clientes.forEach(c => this.clientesMap.set(c.id_cliente, c));
      },
      error: (err) => console.error('Error al cargar clientes:', err)
    });
    this.subscriptions.push(sub);
  }

  cargarAliados(): void {
    const sub = this.aliadoService.obtenerAliados().subscribe({
      next: (aliados) => {
        this.aliados = aliados;
        aliados.forEach(a => this.aliadosMap.set(a.id_aliado, a));
      },
      error: (err) => console.error('Error al cargar aliados:', err)
    });
    this.subscriptions.push(sub);
  }

  cargarCreditos(): void {
    this.cargando = true;
    const sub = this.creditoService.obtenerCreditos().subscribe({
      next: (creditos) => {
        // ✅ FILTRAR SOLO ENTREGADOS Y VENCIDOS
        this.creditos = creditos.filter(c =>
          c.estado_credito === 'ENTREGADO' || c.estado_credito === 'VENCIDO'
        );

        this.creditosFiltrados = [...this.creditos];

        // Cargar calendarios de pago para cada crédito
        this.cargarCalendariosTodos();
      },
      error: (err) => {
        console.error('Error al cargar créditos:', err);
        this.cargando = false;
        this.mostrarError('Error al cargar los créditos');
      }
    });
    this.subscriptions.push(sub);
  }

  cargarCalendariosTodos(): void {
    let completados = 0;
    const total = this.creditos.length;

    if (total === 0) {
      this.cargando = false;
      return;
    }

    this.creditos.forEach(credito => {
      // Cargar calendario de pago
      const subCal = this.calendarioPagoService.obtenerPorCredito(credito.id_credito).subscribe({
        next: (calendario) => {
          this.calendarioPorCredito.set(credito.id_credito, calendario);

          // Cargar pagos registrados
          const subPagos = this.pagoService.obtenerPagosPorCredito(credito.id_credito).subscribe({
            next: (pagos) => {
              this.pagosPorCredito.set(credito.id_credito, pagos || []);

              completados++;
              if (completados === total) {
                // Calcular viewData para todos
                this.creditos.forEach(c => this.calcularViewData(c));
                this.cargando = false;
              }
            },
            error: () => {
              completados++;
              if (completados === total) {
                this.creditos.forEach(c => this.calcularViewData(c));
                this.cargando = false;
              }
            }
          });
          this.subscriptions.push(subPagos);
        },
        error: (err) => {
          console.error(`Error al cargar calendario para crédito ${credito.id_credito}:`, err);
          completados++;
          if (completados === total) {
            this.creditos.forEach(c => this.calcularViewData(c));
            this.cargando = false;
          }
        }
      });
      this.subscriptions.push(subCal);
    });
  }

  // ============================================
  // CÁLCULOS PRINCIPALES
  // ============================================
  calcularViewData(credito: any): void {
    if (!credito) return;

    const calendario = this.calendarioPorCredito.get(credito.id_credito) || [];
    const esVencido = credito.estado_credito === 'VENCIDO';

    // Datos básicos
    const totalSemanas = this.obtenerTotalSemanas(credito);
    const pagoSemanal = Number(credito.pago_semanal) || 0;

    // Cliente y aliado
    const cliente = this.clientesMap.get(credito.cliente_id);
    const nombreCliente = cliente
      ? `${cliente.nombre_cliente || ''} ${cliente.app_cliente || ''}`.trim()
      : 'N/A';

    const aliado = this.aliadosMap.get(credito.aliado_id);
    const nombreAliado = aliado ? aliado.nom_aliado.trim() : 'N/A';

    // Día de pago
    const diaPago = this.getDiaPago(credito);

    // Calcular período actual
    const periodoActual = this.calcularPeriodoActual(credito);

    if (esVencido) {
      // ✅ CRÉDITO VENCIDO
      const saldoPendiente = Number(credito.saldo_pendiente) || 0;
      const ultimoPagado = this.calcularUltimoPagoCompletado(calendario);
      const proximoPagoNum = Math.min(ultimoPagado + 1, totalSemanas);
      const proximaFecha = this.obtenerProximaFechaVencido(calendario, ultimoPagado);

      credito.viewData = {
        nombreCliente,
        nombreAliado,
        diaPago,
        pagosRealizados: ultimoPagado,
        totalSemanas,
        pagosPendientes: totalSemanas - ultimoPagado,
        pagoSemanal,
        proximaFecha: this.formatearFecha(proximaFecha),
        proximaFechaRaw: proximaFecha,
        totalPagado: this.calcularTotalPagado(calendario),
        saldoPendiente,
        proximoPagoNum,
        diasAtraso: 0, // No aplica en vencidos
        periodosAtrasados: totalSemanas - ultimoPagado,
        totalAtrasado: saldoPendiente, // Total atrasado = Saldo pendiente
        estadoPago: { texto: 'VENCIDO', clase: 'text-danger font-weight-bold', filaClase: 'fila-vencida table-danger' },
        periodoActual
      };
    } else {
      // ✅ CRÉDITO ENTREGADO
      const pagosRealizados = this.calcularPagosRealizados(calendario);
      const totalPagado = this.calcularTotalPagado(calendario);
      const saldoPendiente = Number(credito.saldo_pendiente) || 0;
      const proximoPagoNum = Math.min(pagosRealizados + 1, totalSemanas);

      // Calcular atrasos
      const { diasAtraso, periodosAtrasados, totalAtrasado } = this.calcularAtrasos(calendario);

      // Próxima fecha
      const proximaFecha = this.calcularProximaFecha(calendario, pagosRealizados);

      // Estado de pago
      const estadoPago = this.getEstadoPago(diasAtraso, periodosAtrasados, pagosRealizados, totalSemanas);

      credito.viewData = {
        nombreCliente,
        nombreAliado,
        diaPago,
        pagosRealizados,
        totalSemanas,
        pagosPendientes: totalSemanas - pagosRealizados,
        pagoSemanal,
        proximaFecha: this.formatearFecha(proximaFecha),
        proximaFechaRaw: proximaFecha,
        totalPagado,
        saldoPendiente,
        proximoPagoNum,
        diasAtraso,
        periodosAtrasados,
        totalAtrasado,
        estadoPago,
        periodoActual
      };
    }
  }

  calcularPeriodoActual(credito: any): number {
    if (!credito?.fecha_primer_pago) return 1;

    const fechaPrimerPago = this.parsearFecha(credito.fecha_primer_pago);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const frecuencia = this.obtenerFrecuenciaPago(credito);
    const diffDias = Math.floor((hoy.getTime() - fechaPrimerPago.getTime()) / (1000 * 60 * 60 * 24));
    const periodo = Math.floor(diffDias / frecuencia) + 1;

    const totalSemanas = this.obtenerTotalSemanas(credito);
    return Math.max(1, Math.min(periodo, totalSemanas));
  }

  obtenerTotalSemanas(credito: any): number {
    return Number(credito.no_pagos || credito.plazo || credito.duracion_semanas || 16);
  }

  obtenerFrecuenciaPago(credito: any): number {
    const totalPagos = this.obtenerTotalSemanas(credito);
    const plazoMeses = credito.plazo_meses || 4;

    if (plazoMeses === 4) {
      if (totalPagos === 4) return 30;
      if (totalPagos === 8) return 15;
      if (totalPagos === 16) return 7;
    }

    return 7; // Por defecto semanal
  }

  getTipoCalendario(credito: any): string {
    const frecuencia = this.obtenerFrecuenciaPago(credito);
    if (frecuencia === 30) return 'Mensual';
    if (frecuencia === 15) return 'Quincenal';
    return 'Semanal';
  }

  getDiaPago(credito: any): string {
    if (!credito?.fecha_primer_pago) return 'N/A';
    const fecha = this.parsearFecha(credito.fecha_primer_pago);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
  }

  // ============================================
  // CÁLCULOS PARA ENTREGADOS
  // ============================================
  calcularPagosRealizados(calendario: CalendarioPago[]): number {
    return calendario.filter(p => {
      const estado = String(p.estatus).toUpperCase();
      const montoPagado = Number(p.monto_pagado) || 0;
      const montoEsperado = Number(p.total_semana) || 0;

      return estado === 'PAGADO' && montoPagado >= (montoEsperado - 0.5);
    }).length;
  }

  calcularTotalPagado(calendario: CalendarioPago[]): number {
    return calendario.reduce((sum, p) => sum + (Number(p.monto_pagado) || 0), 0);
  }

  calcularAtrasos(calendario: CalendarioPago[]): { diasAtraso: number; periodosAtrasados: number; totalAtrasado: number } {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let maxDiasAtraso = 0;
    let periodosAtrasados = 0;
    let totalAtrasado = 0;

    for (const pago of calendario) {
      const estado = String(pago.estatus).toUpperCase();
      const montoPagado = Number(pago.monto_pagado) || 0;
      const montoEsperado = Number(pago.total_semana) || 0;
      const fechaVencimiento = this.parsearFecha(pago.fecha_vencimiento);

      // Validar si está pendiente o parcial
      const esPendiente = estado === 'PENDIENTE' || estado === 'VENCIDO';
      const esParcial = estado === 'PAGO PARCIAL' && montoPagado < (montoEsperado - 0.5);

      if (esPendiente || esParcial) {
        // Calcular días de atraso con 1 día de gracia
        const diffDias = Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDias > 0) { // El día siguiente al vencimiento ya es atraso
          maxDiasAtraso = Math.max(maxDiasAtraso, diffDias);
          periodosAtrasados++;

          // ✅ CORRECCIÓN CRÍTICA: SIEMPRE restar lo pagado
          // No importa el estatus, si se pagó algo, solo sumar la DIFERENCIA
          const deudaReal = Math.max(0, montoEsperado - montoPagado);
          totalAtrasado += deudaReal;
        }
      }
    }

    return {
      diasAtraso: maxDiasAtraso,
      periodosAtrasados,
      totalAtrasado: Math.round(totalAtrasado * 100) / 100
    };
  }

  calcularProximaFecha(calendario: CalendarioPago[], pagosRealizados: number): string {
    // Buscar el primer pago no completado
    const proximoPago = calendario.find(p => {
      const estado = String(p.estatus).toUpperCase();
      const montoPagado = Number(p.monto_pagado) || 0;
      const montoEsperado = Number(p.total_semana) || 0;

      return estado !== 'PAGADO' || montoPagado < (montoEsperado - 0.5);
    });

    return proximoPago?.fecha_vencimiento || '';
  }

  // ============================================
  // CÁLCULOS PARA VENCIDOS
  // ============================================
  calcularUltimoPagoCompletado(calendario: CalendarioPago[]): number {
    let ultimoPago = 0;

    for (const pago of calendario) {
      const estado = String(pago.estatus).toUpperCase();
      const montoPagado = Number(pago.monto_pagado) || 0;
      const montoEsperado = Number(pago.total_semana) || 0;

      // Solo contar pagos completos (no parciales)
      if (estado === 'PAGADO' && montoPagado >= (montoEsperado - 0.5)) {
        ultimoPago = Math.max(ultimoPago, pago.numero_pago);
      }
    }

    return ultimoPago;
  }

  obtenerProximaFechaVencido(calendario: CalendarioPago[], ultimoPagoCompleto: number): string {
    // La próxima fecha es la del siguiente pago no completado
    const proximoPago = calendario.find(p => p.numero_pago > ultimoPagoCompleto);
    return proximoPago?.fecha_vencimiento || '';
  }

  // ============================================
  // ESTADO DE PAGO
  // ============================================
  getEstadoPago(diasAtraso: number, periodosAtrasados: number, pagosRealizados: number, totalSemanas: number): { texto: string; clase: string; filaClase: string } {

    if (pagosRealizados >= totalSemanas) {
      return {
        texto: 'COMPLETADO',
        clase: 'text-primary font-weight-bold',
        filaClase: 'fila-completada'
      };
    }

    if (diasAtraso === 0 && periodosAtrasados === 0) {
      return {
        texto: 'AL DÍA',
        clase: 'text-success font-weight-bold',
        filaClase: 'fila-al-dia'
      };
    }

    if (periodosAtrasados > 0) {
      return {
        texto: `${diasAtraso} DÍAS ATRASO`,
        clase: 'text-danger font-weight-bold',
        filaClase: 'fila-atrasada'
      };
    }

    return {
      texto: 'AL DÍA',
      clase: 'text-success font-weight-bold',
      filaClase: 'fila-al-dia'
    };
  }

  // ============================================
  // MODAL Y PAGOS
  // ============================================
  abrirModalSeleccion(credito: any): void {
    if (!this.registradoPor) {
      this.mostrarError('No se pudo identificar al usuario');
      return;
    }

    this.creditoSeleccionado = credito;

    const viewData = credito.viewData;
    this.diasAtraso = viewData?.diasAtraso || 0;
    this.periodosAtrasados = viewData?.periodosAtrasados || 0;
    this.totalAtrasado = viewData?.totalAtrasado || 0;
    this.ultimoPagoCompleto = viewData?.pagosRealizados || 0;

    this.moraAcumulada = this.calcularMoraPendiente(credito);
    this.carteraAtrasada = viewData?.totalAtrasado || 0;

    // Usar la fecha raw si está disponible, de lo contrario intentar parsear la formateada
    const proximaFechaRaw = viewData?.proximaFechaRaw;
    const proximaFechaStr = viewData?.proximaFecha;

    if (proximaFechaRaw) {
      this.proximaFechaPago = this.parsearFecha(proximaFechaRaw);
    } else if (proximaFechaStr) {
      this.proximaFechaPago = this.parsearFecha(proximaFechaStr);
    } else {
      this.proximaFechaPago = new Date();
    }

    this.montoPago = credito.pago_semanal || 0;
    this.moratorios = this.moraAcumulada;
    this.numeroPagoSeleccionado = viewData?.proximoPagoNum || 1;

    this.modalSeleccionAbierto = true;
  }

  abrirModalPago(tipo: string): void {
    this.modalSeleccionAbierto = false;
    setTimeout(() => {
      this.modalPagoAbierto = true;
      this.tipoPago = tipo;
      this.metodoPago = '';

      if (tipo === 'ADELANTO') {
        this.moratorios = 0;
      }
    }, 100);
  }

  cerrarModalSeleccion(): void {
    this.modalSeleccionAbierto = false;
    this.creditoSeleccionado = null;
  }

  cerrarModalPago(): void {
    this.modalPagoAbierto = false;
    this.montoPago = 0;
    this.metodoPago = '';
    this.moratorios = 0;
    this.tipoPago = 'PAGO';
  }

  async registrarPago(): Promise<void> {
    if (!this.montoPago || this.montoPago <= 0) {
      await this.mostrarAdvertencia('El monto debe ser mayor a 0');
      return;
    }

    if (!this.metodoPago) {
      await this.mostrarAdvertencia('Seleccione un método de pago');
      return;
    }

    this.procesandoPago = true;

    const pagoData = {
      credito_id: this.creditoSeleccionado.id_credito,
      numero_pago: this.numeroPagoSeleccionado,
      moratorios: Number(this.moratorios) || 0,
      pago_registrado: Number(this.montoPago),
      tipo_pago: `${this.tipoPago} - ${this.metodoPago}`.toUpperCase(),
      registrado_por: this.registradoPor
    };

    const sub = this.pagoService.registrarPago(pagoData).subscribe({
      next: () => {
        this.mostrarExito('Pago registrado exitosamente');
        this.procesandoPago = false;
        this.cerrarModalPago();
        setTimeout(() => this.cargarCreditos(), 1000);
      },
      error: (err) => {
        console.error('Error al registrar pago:', err);
        this.mostrarError('Error al registrar el pago');
        this.procesandoPago = false;
      }
    });
    this.subscriptions.push(sub);
  }

  calcularMoraPendiente(credito: any): number {
    if (!credito) return 0;
    const calendario = this.calendarioPorCredito.get(credito.id_credito) || [];
    return calendario.reduce((sum, p) => sum + (Number(p.mora_acumulada) || 0), 0);
  }

  calcularAdeudoYFuturo(credito: any): { adeudo: number; saldoFuturo: number } {
    if (!credito) return { adeudo: 0, saldoFuturo: 0 };
    const totalAtrasado = credito.viewData?.totalAtrasado || 0;
    const saldoPendiente = Number(credito.saldo_pendiente) || 0;
    return {
      adeudo: totalAtrasado,
      saldoFuturo: Math.max(0, saldoPendiente - totalAtrasado)
    };
  }

  obtenerSemanasDisponibles(): any[] {
    if (!this.creditoSeleccionado) return [];

    const calendario = this.calendarioPorCredito.get(this.creditoSeleccionado.id_credito) || [];
    const pagosRealizados = this.creditoSeleccionado.viewData?.pagosRealizados || 0;

    return calendario
      .filter(p => p.numero_pago > pagosRealizados)
      .map(p => ({
        numero: p.numero_pago,
        texto: this.getEstadoSemana(p.numero_pago).texto,
        disabled: false,
        fecha: this.parsearFecha(p.fecha_vencimiento)
      }));
  }

  getEstadoSemana(numeroPago: number): { texto: string; clase: string; disabled: boolean } {
    const calendario = this.calendarioPorCredito.get(this.creditoSeleccionado.id_credito) || [];
    const pago = calendario.find(p => p.numero_pago === numeroPago);

    if (!pago) return { texto: '', clase: '', disabled: true };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVencimiento = this.parsearFecha(pago.fecha_vencimiento);
    const diffDias = Math.floor((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return { texto: `VENCIDA (${Math.abs(diffDias)} días atrás)`, clase: 'text-danger', disabled: false };
    }
    if (diffDias === 0) {
      return { texto: 'VENCE HOY', clase: 'text-warning', disabled: false };
    }
    return { texto: `Vence en ${diffDias} días`, clase: 'text-info', disabled: false };
  }

  // ============================================
  // DETALLES Y EXPANSIÓN
  // ============================================
  toggleFilaDetalle(creditoId: number): void {
    this.filaExpandida = this.filaExpandida === creditoId ? null : creditoId;
  }

  getDetallesPagos(creditoId: number): any[] {
    const pagos = this.pagosPorCredito.get(creditoId) || [];
    return pagos.map((pago, index) => ({
      numeroPago: pago.numero_pago || index + 1,
      fecha: pago.fecha_operacion || pago.fecha_pago,
      montoTotal: (Number(pago.pago_registrado) || 0) + (Number(pago.moratorios) || 0),
      capital: pago.capital_pagado || 0,
      intereses: pago.interes_pagado || 0,
      mora: pago.moratorios || 0,
      tipoPago: pago.tipo_pago || 'NORMAL',
      registradoPor: pago.registrado_por || 'Sistema'
    }));
  }

  // ============================================
  // FILTROS
  // ============================================
  buscar(): void {
    this.creditosFiltrados = this.creditos.filter(credito => {
      const coincideAliado = this.filtroAliado.length
        ? this.filtroAliado.includes(credito.aliado_id)
        : true;

      const coincideCliente = this.filtroCliente
        ? (credito.viewData?.nombreCliente || '').toLowerCase().includes(this.filtroCliente.toLowerCase())
        : true;

      const coincideEstado = this.filtroEstado
        ? credito.estado_credito === this.filtroEstado
        : true;

      const creditoDiaPago = credito.viewData?.diaPago || this.getDiaPago(credito);
      const coincideDia = this.filtroDiaPago
        ? creditoDiaPago === this.filtroDiaPago
        : true;

      return coincideAliado && coincideCliente && coincideEstado && coincideDia;
    });
  }

  limpiarFiltros(): void {
    this.filtroAliado = [];
    this.filtroEstado = '';
    this.filtroCliente = '';
    this.filtroDiaPago = '';
    this.creditosFiltrados = [...this.creditos];
  }

  onAliadoChange(event: any, idAliado: number): void {
    if (event.target.checked) {
      this.filtroAliado.push(idAliado);
    } else {
      this.filtroAliado = this.filtroAliado.filter(id => id !== idAliado);
    }
  }

  esAliadoSeleccionado(idAliado: number): boolean {
    return this.filtroAliado.includes(idAliado);
  }

  // ============================================
  // TOTALES
  // ============================================
  calcularTotalCartera(): number {
    return this.creditosFiltrados.reduce((sum, c) =>
      sum + (Number(c.saldo_pendiente) || 0), 0);
  }

  calcularTotalAtrasadoGeneral(): number {
    return this.creditosFiltrados.reduce((sum, c) =>
      sum + (c.viewData?.totalAtrasado || 0), 0);
  }

  calcularTotalAPagarGeneral(): number {
    return this.creditosFiltrados.reduce((sum, c) =>
      sum + (Number(c.total_a_pagar) || 0), 0);
  }

  calcularTotalPagadoGeneral(): number {
    return this.creditosFiltrados.reduce((sum, c) =>
      sum + (c.viewData?.totalPagado || 0), 0);
  }

  calcularTotalPagosRealizados(): number {
    return this.creditosFiltrados.reduce((sum, c) =>
      sum + (c.viewData?.pagosRealizados || 0), 0);
  }

  calcularTotalPagosProgramados(): number {
    return this.creditosFiltrados.reduce((sum, c) =>
      sum + (c.viewData?.totalSemanas || 0), 0);
  }

  contarCreditosAlDia(): number {
    return this.creditosFiltrados.filter(c =>
      c.estado_credito === 'ENTREGADO' && (c.viewData?.totalAtrasado || 0) === 0
    ).length;
  }

  contarCreditosAtrasados(): number {
    return this.creditosFiltrados.filter(c =>
      c.estado_credito === 'ENTREGADO' && (c.viewData?.totalAtrasado || 0) > 0
    ).length;
  }

  contarCreditosActivos(): number {
    return this.creditosFiltrados.filter(c => c.estado_credito === 'ENTREGADO').length;
  }

  contarCreditosVencidos(): number {
    return this.creditosFiltrados.filter(c => c.estado_credito === 'VENCIDO').length;
  }

  calcularPorcentajeAtrasado(): number {
    const total = this.calcularTotalCartera();
    const atrasado = this.calcularTotalAtrasadoGeneral();
    return total === 0 ? 0 : (atrasado / total) * 100;
  }

  // ============================================
  // UTILIDADES
  // ============================================
  parsearFecha(fecha: string | Date): Date {
    if (!fecha) return new Date();

    if (typeof fecha === 'string') {
      // Caso 1: YYYY-MM-DD o ISO
      if (fecha.includes('-')) {
        const [year, month, day] = fecha.split('T')[0].split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      }

      // Caso 2: DD/MM/YYYY
      if (fecha.includes('/')) {
        const [day, month, year] = fecha.split('/').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      }
    }

    const d = new Date(fecha);
    if (isNaN(d.getTime())) return new Date(); // Fallback si es inválida
    d.setHours(0, 0, 0, 0);
    return d;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    const date = this.parsearFecha(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto || 0);
  }

  getNombreCliente(credito: any): string {
    return credito.viewData?.nombreCliente || 'N/A';
  }

  getNombreAliado(aliadoId: number): string {
    return this.aliadosMap.get(aliadoId)?.nom_aliado || 'N/A';
  }

  getCreditoId(credito: any): string {
    return credito.id_credito || 'N/A';
  }

  calcularProximoNumeroPago(credito: any): number {
    return credito.viewData?.proximoPagoNum || 1;
  }

  // calcularPagosRealizados(credito: any): number {
  //   return credito.viewData?.pagosRealizados || 0;
  // }

  calcularSemanaActualCliente(credito: any): number {
    return credito.viewData?.periodoActual || 1;
  }

  calcularPagosPendientes(credito: any): number {
    const realizados = credito.viewData?.pagosRealizados || 0;
    const total = credito.viewData?.totalSemanas || this.obtenerTotalSemanas(credito);
    return Math.max(0, total - realizados);
  }

  calcularPagoSemanal(credito: any): number {
    return Number(credito.pago_semanal) || 0;
  }

  // calcularTotalPagado(credito: any): number {
  //   return credito.viewData?.totalPagado || 0;
  // }

  calcularFechaSemana(credito: any, numeroPago: number): Date {
    const calendario = this.calendarioPorCredito.get(credito.id_credito) || [];
    const pago = calendario.find(p => p.numero_pago === numeroPago);

    if (pago?.fecha_vencimiento) {
      return this.parsearFecha(pago.fecha_vencimiento);
    }

    // Fallback: calcular fecha manualmente
    if (!credito?.fecha_primer_pago) return new Date();

    const fechaPrimerPago = this.parsearFecha(credito.fecha_primer_pago);
    const frecuencia = this.obtenerFrecuenciaPago(credito);
    const fechaPago = new Date(fechaPrimerPago);
    fechaPago.setDate(fechaPrimerPago.getDate() + ((numeroPago - 1) * frecuencia));

    return fechaPago;
  }

  formatearSemanaActual(): string {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes, ...

    // Calcular el Lunes de esta semana
    // Si hoy es domingo (0), el lunes fue hace 6 días. Si es lunes (1), hace 0 días.
    const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diffLunes);

    // Calcular el Sábado de esta semana (Lunes + 5 días)
    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);

    const getDiaMes = (d: Date) => {
      const dia = d.getDate();
      const mes = d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
      return `${dia}-${mes}`;
    };

    return `Semana ${getDiaMes(lunes)} al ${getDiaMes(sabado)}`;
  }

  getTotalPago(): number {
    return (this.montoPago || 0) + (this.moratorios || 0);
  }

  get hayCreditos(): boolean {
    return this.creditos.length > 0;
  }

  // ============================================
  // ALERTAS
  // ============================================
  mostrarExito(mensaje: string): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#28a745'
    });
  }

  mostrarError(mensaje: string): Promise<any> {
    return Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#dc3545'
    });
  }

  mostrarAdvertencia(mensaje: string): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      title: 'Advertencia',
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#ffc107'
    });
  }
}
