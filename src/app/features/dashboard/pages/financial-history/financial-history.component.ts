import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, timer } from 'rxjs';
import Swal from 'sweetalert2';
import { CreditoService } from '../../../../services/credito.service';
import { PagoService } from '../../../../services/pago.service';
import { AliadoService } from '../../../../services/aliado.service';
import { ClienteService } from '../../../../services/client.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-financial-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-history.component.html',
  styleUrls: ['./financial-history.component.css']
})
export class FinancialHistoryComponent implements OnInit, OnDestroy {
  creditos: any[] = [];
  creditosFiltrados: any[] = [];
  pagosPorCredito: { [creditoId: number]: any[] } = {};
  clientes: any[] = [];

  // Filtros
  filtroAliado: string = '';
  filtroCliente: string = '';
  cargando: boolean = false;

  // Modales
  modalSeleccionAbierto: boolean = false;
  modalPagoAbierto: boolean = false;

  // Fila expandible
  filaExpandida: number | null = null;

  creditoSeleccionado: any = null;
  procesandoPago: boolean = false;

  // Datos del pago
  montoPago: number = 0;
  metodoPago: string = '';
  tipoPago: string = 'PAGO';
  moratorios: number = 0;
  numeroPagoSeleccionado: number = 1;

  // Aliados
  aliados: any[] = [];
  // Metodos de pago
  metodosPago: string[] = ['EFECTIVO', 'TRANSFERENCIA'];

  // Variables para cálculos
  diasAtraso: number = 0;
  semanasAtraso: number = 0;
  moraAcumulada: number = 0;
  carteraAtrasada: number = 0;
  totalAtrasado: number = 0;
  proximaFechaPago: Date | null = null;
  ultimoPagoCompleto: number = 0;

  // USUARIO
  usuarioActual: any = null;
  registradoPor: number = 0;

  // CONTADOR DE SEMANAS DEL AÑO
  semanaActual: number = 0;
  fechaInicioSemana: Date = new Date();
  fechaFinSemana: Date = new Date();
  private intervaloActualizacion: any;
  private fechaBaseAjustada: Date = new Date();

  // ESTADÍSTICAS
  statsClientesNuevos: { aliado: string, cantidad: number }[] = [];


  private usuarioSubscription: Subscription = new Subscription();
  private timerSubscription: Subscription = new Subscription();
  private usuarioCargado: boolean = false;

  private calculosCache: Map<string, any> = new Map();
  private ultimaActualizacionCache: number = 0;

  constructor(
    private creditoService: CreditoService,
    private pagoService: PagoService,
    private aliadoService: AliadoService,
    private clienteService: ClienteService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.cargarUsuarioLogueado();
    this.cargarDatosIniciales();
    this.inicializarContadorSemanas();
  }

  ngOnDestroy(): void {
    this.usuarioSubscription.unsubscribe();
    this.timerSubscription.unsubscribe();

    // LIMPIAR INTERVALO DE ACTUALIZACIÓN
    if (this.intervaloActualizacion) {
      clearInterval(this.intervaloActualizacion);
    }
  }


  // ===============================================
  // METODOS DE CACHE
  // ===============================================
  // Agregar estas propiedades a tu componente
  private cacheCalculos: Map<string, {
    valor: any,
    timestamp: number
  }> = new Map();

  private readonly TIEMPO_EXPIRACION_CACHE = 30000; // 30 segundos

  /**
   * Genera una clave única para el caché basada en el crédito y el método
   */
  private generarClaveCache(creditoId: number, metodo: string, extras?: any): string {
    const base = `${creditoId}_${metodo}`;
    if (extras) {
      return `${base}_${JSON.stringify(extras)}`;
    }
    return base;
  }

  /**
   * Obtiene un valor del caché si existe y no ha expirado
   */
  private obtenerDeCache<T>(clave: string): T | null {
    const entrada = this.cacheCalculos.get(clave);

    if (!entrada) return null;

    const ahora = Date.now();
    if (ahora - entrada.timestamp > this.TIEMPO_EXPIRACION_CACHE) {
      this.cacheCalculos.delete(clave);
      return null;
    }

    return entrada.valor as T;
  }

  /**
   * Guarda un valor en el caché
   */
  private guardarEnCache(clave: string, valor: any): void {
    this.cacheCalculos.set(clave, {
      valor,
      timestamp: Date.now()
    });
  }

  /**
   * Invalida el caché de un crédito específico
   */
  private invalidarCacheCredito(creditoId: number): void {
    const clavesAEliminar: string[] = [];

    this.cacheCalculos.forEach((valor, clave) => {
      if (clave.startsWith(`${creditoId}_`)) {
        clavesAEliminar.push(clave);
      }
    });

    clavesAEliminar.forEach(clave => this.cacheCalculos.delete(clave));
  }

  /**
   * Limpia todo el caché
   */
  limpiarCache(): void {
    this.cacheCalculos.clear();
  }

  // ============================================
  // MÉTODOS NUEVOS AGREGADOS
  // ============================================

  // calcularSemanaActualCliente(credito: any): number {
  //   if (!credito || !credito.fecha_primer_pago) return 1;

  //   const hoy = new Date();
  //   hoy.setHours(0, 0, 0, 0);

  //   let fechaPrimerPago: Date;

  //   // Manejo robusto de la fecha para evitar desfases por zona horaria
  //   if (typeof credito.fecha_primer_pago === 'string') {
  //     const fechaStr = credito.fecha_primer_pago.split('T')[0];
  //     const [year, month, day] = fechaStr.split('-').map(Number);
  //     fechaPrimerPago = new Date(year, month - 1, day);
  //   } else {
  //     fechaPrimerPago = new Date(credito.fecha_primer_pago);
  //   }
  //   fechaPrimerPago.setHours(0, 0, 0, 0);

  //   // Si hoy es antes del primer pago, estamos en semana 1
  //   if (hoy < fechaPrimerPago) return 1;

  //   const diffTiempo = hoy.getTime() - fechaPrimerPago.getTime();
  //   const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

  //   // Calcular semana: (días transcurridos / 7) + 1
  //   const semana = Math.floor(diffDias / 7) + 1;

  //   return Math.min(semana, 16);
  // }

  calcularSemanaActualCliente(credito: any): number {
    if (!credito || !credito.fecha_primer_pago) return 1;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Usar el nuevo método para parsear la fecha
    const fechaPrimerPago = this.parsearFechaLocal(credito.fecha_primer_pago);

    // Si hoy es antes del primer pago, estamos en semana 1
    if (hoy < fechaPrimerPago) return 1;

    const diffTiempo = hoy.getTime() - fechaPrimerPago.getTime();
    const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

    // Calcular semana: (días transcurridos / 7) + 1
    const semana = Math.floor(diffDias / 7) + 1;

    return Math.min(semana, 16);
  }

  // calcularFechaSemana(credito: any, numeroSemana: number): Date {
  //   if (!credito || !credito.fecha_primer_pago) return new Date();

  //   const fechaPrimerPago = new Date(credito.fecha_primer_pago);
  //   const fechaSemana = new Date(fechaPrimerPago);

  //   // Sumar (numeroSemana - 1) * 7 días
  //   fechaSemana.setDate(fechaPrimerPago.getDate() + ((numeroSemana - 1) * 7));

  //   // Ajustar si cae en fin de semana
  //   const diaSemana = fechaSemana.getDay();
  //   if (diaSemana === 0) { // Domingo
  //     fechaSemana.setDate(fechaSemana.getDate() + 1);
  //   } else if (diaSemana === 6) { // Sábado
  //     fechaSemana.setDate(fechaSemana.getDate() + 2);
  //   }

  //   return fechaSemana;
  // }
  calcularFechaSemana(credito: any, numeroSemana: number): Date {
    if (!credito || !credito.fecha_primer_pago) return new Date();

    // Usar el nuevo método para parsear la fecha
    const fechaPrimerPago = this.parsearFechaLocal(credito.fecha_primer_pago);
    const fechaSemana = new Date(fechaPrimerPago);

    // Sumar (numeroSemana - 1) * 7 días
    fechaSemana.setDate(fechaPrimerPago.getDate() + ((numeroSemana - 1) * 7));

    // Ajustar si cae en fin de semana
    const diaSemana = fechaSemana.getDay();
    if (diaSemana === 0) { // Domingo
      fechaSemana.setDate(fechaSemana.getDate() + 1);
    } else if (diaSemana === 6) { // Sábado
      fechaSemana.setDate(fechaSemana.getDate() + 2);
    }

    return fechaSemana;
  }

  calcularAdeudoYFuturo(credito: any): { adeudo: number, saldoFuturo: number } {
    if (!credito) return { adeudo: 0, saldoFuturo: 0 };

    const pagoSemanal = this.calcularPagoSemanal(credito);
    const semanasAtrasadas = this.calcularSemanasAtraso(credito);
    const saldoPendiente = Number(credito.saldo_pendiente) || 0;

    // Calcular adeudo (pagos atrasados)
    const adeudo = Math.min(semanasAtrasadas * pagoSemanal, saldoPendiente);

    // Calcular saldo futuro (pagos que faltan por dar sin incluir atrasos)
    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);
    const semanasRestantes = 16 - ultimaSemanaPagada;
    const saldoFuturo = Math.max(0, semanasRestantes * pagoSemanal - adeudo);

    return { adeudo, saldoFuturo };
  }

  obtenerSemanasDisponibles(): { numero: number, texto: string, disabled: boolean, fecha: Date }[] {
    if (!this.creditoSeleccionado) return [];

    const semanas: { numero: number, texto: string, disabled: boolean, fecha: Date }[] = [];
    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(this.creditoSeleccionado);

    // Solo mostrar semanas desde la siguiente a la última pagada hasta la 16
    for (let i = ultimaSemanaPagada + 1; i <= 16; i++) {
      const estado = this.getEstadoSemana(i);
      const fechaSemana = this.calcularFechaSemana(this.creditoSeleccionado, i);

      semanas.push({
        numero: i,
        texto: estado.texto,
        disabled: estado.disabled,
        fecha: fechaSemana
      });
    }

    return semanas;
  }

  getEstadoSemana(numeroSemana: number): { texto: string, clase: string, disabled: boolean } {
    if (!this.creditoSeleccionado) {
      return { texto: '', clase: '', disabled: true };
    }

    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(this.creditoSeleccionado);
    const fechaSemana = this.calcularFechaSemana(this.creditoSeleccionado, numeroSemana);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaSemana.setHours(0, 0, 0, 0);

    const diasDiferencia = Math.floor((fechaSemana.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    // Semana ya pagada
    if (numeroSemana <= ultimaSemanaPagada) {
      return {
        texto: 'PAGADA',
        clase: 'text-success',
        disabled: true
      };
    }

    // Semana vencida (atrasada)
    if (diasDiferencia < 0) {
      return {
        texto: `VENCIDA (${Math.abs(diasDiferencia)} días atrás)`,
        clase: 'text-danger font-weight-bold',
        disabled: false
      };
    }

    // Vence hoy
    if (diasDiferencia === 0) {
      return {
        texto: 'VENCE HOY',
        clase: 'text-warning font-weight-bold',
        disabled: false
      };
    }

    // Semana futura
    return {
      texto: `Vence en ${diasDiferencia} días`,
      clase: 'text-info',
      disabled: false
    };
  }



  abrirModalSeleccion(credito: any): void {
    console.log('🔵 Abriendo modal de selección...', credito);

    if (!this.registradoPor || this.registradoPor <= 0) {
      this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
      return;
    }

    this.creditoSeleccionado = credito;

    // PRE-CALCULAR todos los datos necesarios UNA SOLA VEZ
    try {
      console.log('Calculando datos...');
      this.proximaFechaPago = this.calcularProximaFechaPago(credito);
      this.diasAtraso = this.calcularDiasAtraso(credito);
      this.semanasAtraso = this.calcularSemanasAtraso(credito);
      this.moraAcumulada = this.calcularMoraAcumulada(credito);
      this.carteraAtrasada = this.calcularCarteraAtrasada(credito);
      this.totalAtrasado = this.calcularTotalAtrasado(credito);
      this.ultimoPagoCompleto = this.calcularUltimaSemanaPagadaCompletamente(credito);

      // Valores por defecto para el modal
      this.montoPago = credito.pago_semanal || 0;
      this.moratorios = this.calcularMoraPendiente(credito);
      this.numeroPagoSeleccionado = this.calcularProximoNumeroPago(credito);

      console.log('Datos calculados exitosamente');
      console.log('Mostrando modal...');

      // Mostrar el modal
      this.modalSeleccionAbierto = true;

      console.log('Modal abierto');
    } catch (error) {
      console.error('Error al calcular datos:', error);
      this.mostrarError('Error al preparar los datos del pago');
    }
  }




  abrirModalPago(tipo: string): void {
    console.log('Abriendo modal de pago, tipo:', tipo);

    try {
      this.modalSeleccionAbierto = false;

      // Pequeño delay para permitir que se cierre el modal anterior
      setTimeout(() => {
        this.modalPagoAbierto = true;
        this.tipoPago = tipo;

        // Recalcular valores
        this.diasAtraso = this.calcularDiasAtraso(this.creditoSeleccionado);
        this.semanasAtraso = this.calcularSemanasAtraso(this.creditoSeleccionado);
        this.moraAcumulada = this.calcularMoraAcumulada(this.creditoSeleccionado);
        this.carteraAtrasada = this.calcularCarteraAtrasada(this.creditoSeleccionado);
        this.proximaFechaPago = this.calcularProximaFechaPago(this.creditoSeleccionado);

        switch (tipo) {
          case 'PAGO':
            this.montoPago = this.creditoSeleccionado.pago_semanal || 0;
            this.moratorios = this.calcularMoraPendiente(this.creditoSeleccionado);
            this.numeroPagoSeleccionado = this.calcularProximoNumeroPago(this.creditoSeleccionado);
            break;

          case 'ADELANTO':
            this.montoPago = this.creditoSeleccionado.pago_semanal || 0;
            this.moratorios = 0;
            const proximoPago = this.calcularProximoNumeroPago(this.creditoSeleccionado);
            this.numeroPagoSeleccionado = proximoPago;
            break;
        }

        this.metodoPago = '';
        console.log('Modal de pago configurado');
      }, 100);

    } catch (error) {
      console.error('Error al abrir modal de pago:', error);
      this.mostrarError('Error al abrir el formulario de pago');
    }
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
    this.numeroPagoSeleccionado = 1;
  }

  // ============================================
  // REGISTRAR PAGO - MODIFICADO
  // ============================================


  async registrarPago(): Promise<void> {
    console.log('Iniciando registro de pago...');
    console.log('Datos:', {
      registradoPor: this.registradoPor,
      tipoPago: this.tipoPago,
      montoPago: this.montoPago,
      metodoPago: this.metodoPago,
      moratorios: this.moratorios,
      numeroPago: this.numeroPagoSeleccionado
    });

    if (!this.registradoPor || this.registradoPor <= 0) {
      this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
      return;
    }

    console.log('Validando pago...');
    const esValido = await this.validarPago();
    console.log('Resultado validación:', esValido);

    if (!esValido) {
      console.log(' Validación falló');
      return;
    }

    console.log(' Validación exitosa, procesando...');
    this.procesandoPago = true;

    if (!await this.validarPago()) {
      return;
    }

    this.procesandoPago = true;

    if (this.tipoPago === 'ADELANTO') {
      this.numeroPagoSeleccionado = this.calcularProximoNumeroPago(this.creditoSeleccionado);
    }

    const pagoData = {
      credito_id: this.creditoSeleccionado.id_credito,
      numero_pago: this.numeroPagoSeleccionado,
      moratorios: Number(this.moratorios) || 0,
      pago_registrado: Number(this.montoPago),
      tipo_pago: `${this.tipoPago} - ${this.metodoPago}`.toUpperCase(),
      registrado_por: this.registradoPor
    };

    console.log('Enviando pago:', pagoData);

    this.pagoService.registrarPago(pagoData).subscribe({
      next: (response) => {
        console.log('Pago registrado:', response);

        // INVALIDAR CACHÉ DEL CRÉDITO
        this.invalidarCacheCredito(this.creditoSeleccionado.id_credito);

        // Calcular nuevo saldo pendiente aproximado
        const saldoActual = this.creditoSeleccionado.saldo_pendiente || 0;
        const totalPagado = Number(this.montoPago) + Number(this.moratorios);
        const nuevoSaldo = saldoActual - totalPagado;

        // Verificar si el saldo llegó a 0 o menos (considerando márgenes pequeños)
        if (nuevoSaldo <= 0.01) { // Tolerancia para decimales
          this.actualizarEstadoCreditoAFinalizado();
        } else {
          this.mostrarMensajeExito();
        }
      },
      error: (error) => {
        console.error('Error al registrar pago:', error);
        this.mostrarError('Error al registrar el pago: ' + (error.error?.error || error.message));
        this.procesandoPago = false;
      }
    });
  }

  private actualizarEstadoCreditoAFinalizado(): void {
    this.creditoService.actualizarEstadoCredito(
      this.creditoSeleccionado.id_credito,
      'FINALIZADO'
    ).subscribe({
      next: (response) => {
        console.log('Crédito marcado como FINALIZADO:', response);

        const mensaje = `¡Felicidades! Crédito completamente pagado. Estado actualizado a FINALIZADO.`;
        this.mostrarExito(mensaje);
        this.procesandoPago = false;
        this.cerrarModalPago();

        // Recargar datos
        setTimeout(() => {
          this.cargarCreditos();
        }, 1000);
      },
      error: (error) => {
        console.error('Error al actualizar estado del crédito:', error);

        // Aún así mostrar éxito en el pago
        this.mostrarExito('Pago registrado exitosamente. El crédito ha sido pagado completamente.');
        this.procesandoPago = false;
        this.cerrarModalPago();

        setTimeout(() => {
          this.cargarCreditos();
        }, 1000);
      }
    });
  }

  private mostrarMensajeExito(): void {
    const mensaje = this.tipoPago === 'PAGO'
      ? `Pago registrado exitosamente para la semana ${this.numeroPagoSeleccionado}`
      : `Adelanto registrado exitosamente para la semana ${this.numeroPagoSeleccionado}`;

    this.mostrarExito(mensaje);
    this.procesandoPago = false;
    this.cerrarModalPago();

    setTimeout(() => {
      this.cargarCreditos();
    }, 1000);
  }


  async validarPago(): Promise<boolean> {
    console.log('🔍 Validando pago...');

    try {
      if (!this.montoPago || this.montoPago <= 0) {
        console.log('Validación: monto inválido');
        await this.mostrarAdvertencia('El monto del pago debe ser mayor a 0');
        return false;
      }

      if (!this.metodoPago || this.metodoPago.trim() === '') {
        console.log('Validación: método de pago no seleccionado');
        await this.mostrarAdvertencia('Debe seleccionar un método de pago');
        return false;
      }

      // Para PAGO: validar que se seleccionó semana
      if (this.tipoPago === 'PAGO') {
        if (!this.numeroPagoSeleccionado || this.numeroPagoSeleccionado < 1) {
          console.log('Validación: semana no seleccionada');
          await this.mostrarAdvertencia('Debe seleccionar una semana para el pago');
          return false;
        }

        const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(this.creditoSeleccionado);

        if (this.numeroPagoSeleccionado <= ultimaSemanaPagada) {
          console.log('Validación: semana ya pagada');
          await this.mostrarAdvertencia(`La semana ${this.numeroPagoSeleccionado} ya está pagada. Seleccione una semana posterior.`);
          return false;
        }
      }

      // Para ADELANTO: validar que no haya mora pendiente
      if (this.tipoPago === 'ADELANTO') {
        const moraPendiente = this.calcularMoraPendiente(this.creditoSeleccionado);
        if (moraPendiente > 0) {
          console.log(' Validación: adelanto con mora pendiente');
          await this.mostrarAdvertencia(
            `No puede dar un adelanto si tiene mora pendiente de ${this.formatearMoneda(moraPendiente)}. ` +
            `Debe liquidar primero la mora usando la opción PAGO.`
          );
          return false;
        }

        const diasAtraso = this.calcularDiasAtraso(this.creditoSeleccionado);
        if (diasAtraso > 0) {
          console.log(' Validación: adelanto con días de atraso');
          await this.mostrarAdvertencia(
            `No puede dar un adelanto si tiene ${diasAtraso} días de atraso. ` +
            `Debe ponerse al día primero usando la opción PAGO.`
          );
          return false;
        }

        const proximoPago = this.calcularProximoNumeroPago(this.creditoSeleccionado);
        this.numeroPagoSeleccionado = proximoPago;
      }

      console.log(' Todas las validaciones pasaron');
      return true;

    } catch (error) {
      console.error('Error en validación:', error);
      await this.mostrarError('Error al validar el pago');
      return false;
    }
  }

  // ============================================
  // MÉTODO AUXILIAR PARA PARSEAR FECHAS SIN DESFASE
  // ============================================

  /**
   * Convierte una fecha string o Date a un objeto Date local sin desfase de zona horaria
   * @param fecha - Fecha en formato string (YYYY-MM-DD) o Date
   * @returns Date object ajustado a zona horaria local
   */
  private parsearFechaLocal(fecha: string | Date): Date {
    if (!fecha) return new Date();

    let fechaDate: Date;

    if (typeof fecha === 'string') {
      // Extraer solo la parte de la fecha (sin hora)
      const fechaStr = fecha.split('T')[0];
      const [year, month, day] = fechaStr.split('-').map(Number);

      // Crear fecha en zona horaria local (mes - 1 porque JavaScript usa 0-11)
      fechaDate = new Date(year, month - 1, day);
    } else {
      fechaDate = new Date(fecha);
    }

    // Asegurar que la hora sea medianoche local
    fechaDate.setHours(0, 0, 0, 0);

    return fechaDate;
  }

  // ============================================
  // MÉTODOS DE CÁLCULO BÁSICOS
  // ============================================

  getNombreCliente(credito: any): string {
    if (!credito) return 'N/A';

    if (credito.nombre_cliente) {
      return `${credito.nombre_cliente} ${credito.app_cliente || ''} ${credito.apm_cliente || ''}`.trim();
    }

    if (credito.cliente_id && this.clientes.length > 0) {
      const cliente = this.clientes.find(c => c.id_cliente === credito.cliente_id);
      if (cliente) {
        const nombre = cliente.nombre_cliente || cliente.nombre || '';
        const app = cliente.app_cliente || cliente.apellido_paterno || '';
        const apm = cliente.apm_cliente || cliente.apellido_materno || '';
        return `${nombre} ${app} ${apm}`.trim();
      }
    }

    return 'Cliente no encontrado';
  }

  getNombreAliado(aliadoId: number): string {
    if (!aliadoId) return 'N/A';
    const aliado = this.aliados.find(a => a.id_aliado === aliadoId);
    return aliado ? aliado.nom_aliado.trim() : 'N/A';
  }

  // getDiaPago(credito: any): string {
  //   if (!credito || !credito.fecha_primer_pago) return 'N/A';
  //   const fecha = new Date(credito.fecha_primer_pago);
  //   const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  //   return dias[fecha.getDay()];
  // }
  getDiaPago(credito: any): string {
    if (!credito || !credito.fecha_primer_pago) return 'N/A';

    // Usar el nuevo método para parsear la fecha
    const fecha = this.parsearFechaLocal(credito.fecha_primer_pago);

    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
  }

  calcularPagoSemanal(credito: any): number {
    if (!credito) return 0;
    return Number(credito.pago_semanal) || 0;
  }

  calcularProximoNumeroPago(credito: any): number {
    if (!credito) return 1;
    // Obtener la última semana pagada completamente
    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);
    // El próximo pago es la semana siguiente
    return Math.min(ultimaSemanaPagada + 1, 16);
  }

  calcularMoratorioTotal(credito: any): number {
    if (!credito) return 0;
    const pagos = this.pagosPorCredito[credito.id_credito] || [];
    return pagos.reduce((sum, pago) => sum + (Number(pago.moratorios) || 0), 0);
  }

  calcularTotalPagado(credito: any): number {
    if (!credito) return 0;
    const pagos = this.pagosPorCredito[credito.id_credito] || [];
    return pagos.reduce((sum, pago) => {
      const pagoRegistrado = Number(pago.pago_registrado) || 0;
      const moratorios = Number(pago.moratorios) || 0;
      return sum + pagoRegistrado + moratorios;
    }, 0);
  }

  calcularPagosRealizados(credito: any): number {
    return this.calcularUltimaSemanaPagadaCompletamente(credito);
  }

  calcularPagosPendientes(credito: any): number {
    const pagosRealizados = this.calcularPagosRealizados(credito);
    return Math.max(0, 16 - pagosRealizados);
  }


  calcularProximaFechaPago(credito: any): Date {
    if (!credito || !credito.fecha_primer_pago) {
      return new Date();
    }

    const fechaPrimerPago = new Date(credito.fecha_primer_pago);
    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);

    // Si ya completó las 16 semanas
    if (ultimaSemanaPagada >= 16) {
      return new Date(); // Ya no hay próxima fecha
    }

    // Calcular fecha de la siguiente semana
    let proximaFecha = new Date(fechaPrimerPago);
    proximaFecha.setDate(fechaPrimerPago.getDate() + (ultimaSemanaPagada * 7));

    // Ajustar si cae en fin de semana
    const diaSemana = proximaFecha.getDay();
    if (diaSemana === 0) { // Domingo
      proximaFecha.setDate(proximaFecha.getDate() + 1);
    } else if (diaSemana === 6) { // Sábado
      proximaFecha.setDate(proximaFecha.getDate() + 2);
    }

    return proximaFecha;
  }

  // calcularDiasAtraso(credito: any): number {
  //   if (!credito || !credito.fecha_primer_pago) return 0;

  //   const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);

  //   // Si ya pagó las 16 semanas, no hay atraso
  //   if (ultimaSemanaPagada >= 16) return 0;

  //   // Calcular la fecha de vencimiento de la siguiente semana a pagar
  //   const fechaPrimerPago = new Date(credito.fecha_primer_pago);
  //   let fechaVencimiento = new Date(fechaPrimerPago);
  //   fechaVencimiento.setDate(fechaPrimerPago.getDate() + (ultimaSemanaPagada * 7));

  //   // Ajustar si cae en fin de semana
  //   const diaSemana = fechaVencimiento.getDay();
  //   if (diaSemana === 0) { // Domingo
  //     fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
  //   } else if (diaSemana === 6) { // Sábado
  //     fechaVencimiento.setDate(fechaVencimiento.getDate() + 2);
  //   }

  //   const hoy = new Date();
  //   hoy.setHours(0, 0, 0, 0);
  //   fechaVencimiento.setHours(0, 0, 0, 0);

  //   // Si la fecha de vencimiento es futura o es hoy, no hay atraso
  //   if (fechaVencimiento >= hoy) return 0;

  //   // Calcular días de atraso
  //   const diffTiempo = hoy.getTime() - fechaVencimiento.getTime();
  //   const diffDias = Math.floor(diffTiempo / (1000 * 3600 * 24));

  //   return Math.max(0, diffDias);
  // }
  calcularDiasAtraso(credito: any): number {
    if (!credito) return 0;

    const clave = this.generarClaveCache(credito.id_credito, 'diasAtraso');
    const valorCache = this.obtenerDeCache<number>(clave);

    if (valorCache !== null) {
      return valorCache;
    }

    // Cálculo original...
    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);

    if (ultimaSemanaPagada >= 16) {
      this.guardarEnCache(clave, 0);
      return 0;
    }

    const fechaPrimerPago = new Date(credito.fecha_primer_pago);
    let fechaVencimiento = new Date(fechaPrimerPago);
    fechaVencimiento.setDate(fechaPrimerPago.getDate() + (ultimaSemanaPagada * 7));

    const diaSemana = fechaVencimiento.getDay();
    if (diaSemana === 0) fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
    if (diaSemana === 6) fechaVencimiento.setDate(fechaVencimiento.getDate() + 2);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaVencimiento.setHours(0, 0, 0, 0);

    if (fechaVencimiento >= hoy) {
      this.guardarEnCache(clave, 0);
      return 0;
    }

    const diffTiempo = hoy.getTime() - fechaVencimiento.getTime();
    const diffDias = Math.floor(diffTiempo / (1000 * 3600 * 24));
    const resultado = Math.max(0, diffDias);

    this.guardarEnCache(clave, resultado);
    return resultado;
  }


  calcularUltimaSemanaPagadaCompletamente(credito: any): number {
    if (!credito) return 0;

    const pagos = this.pagosPorCredito[credito.id_credito] || [];
    const pagoSemanal = this.calcularPagoSemanal(credito);

    const pagosOrdenados = [...pagos].sort((a, b) =>
      new Date(a.fecha_operacion).getTime() - new Date(b.fecha_operacion).getTime()
    );

    let semanasPagadas = 0;
    let acumulado = 0;

    for (const pago of pagosOrdenados) {
      const pagoPrincipal = Number(pago.pago_registrado) || 0;
      acumulado += pagoPrincipal;

      while (acumulado >= pagoSemanal) {
        semanasPagadas++;
        acumulado -= pagoSemanal;
      }
    }

    return Math.min(semanasPagadas, 16);
  }

  calcularSemanasAtraso(credito: any): number {
    const diasAtraso = this.calcularDiasAtraso(credito);
    return Math.floor(diasAtraso / 7);
  }

  calcularCarteraAtrasada(credito: any): number {
    if (!credito) return 0;

    const pagoSemanal = this.calcularPagoSemanal(credito);
    const semanasAtraso = this.calcularSemanasAtraso(credito);

    return semanasAtraso * pagoSemanal;
  }


  //   calcularMoraAcumulada(credito: any): number {
  //   if (!credito) return 0;

  //   try {
  //     const pagos = this.pagosPorCredito[credito.id_credito] || [];
  //     const pagoSemanal = this.calcularPagoSemanal(credito);
  //     const fechaPrimerPago = new Date(credito.fecha_primer_pago);
  //     const hoy = new Date();

  //     const semanasTranscurridas = this.calcularSemanasTranscurridas(credito);
  //     const semanasPagadasCompletamente = this.calcularUltimaSemanaPagadaCompletamente(credito);

  //     // LÍMITE DE SEGURIDAD: No calcular más de 20 semanas
  //     const limiteSeguro = Math.min(semanasTranscurridas, 20);

  //     const totalPagadoPrincipal = pagos.reduce((sum, pago) => {
  //       return sum + (Number(pago.pago_registrado) || 0);
  //     }, 0);

  //     let mora = 0;

  //     for (let semana = 1; semana <= limiteSeguro; semana++) {
  //       let fechaVencimiento = new Date(fechaPrimerPago);
  //       fechaVencimiento.setDate(fechaPrimerPago.getDate() + ((semana - 1) * 7));

  //       const diaSemana = fechaVencimiento.getDay();
  //       if (diaSemana === 0) fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
  //       if (diaSemana === 6) fechaVencimiento.setDate(fechaVencimiento.getDate() + 2);

  //       if (hoy > fechaVencimiento) {
  //         if (semana > semanasPagadasCompletamente) {
  //           mora += pagoSemanal;
  //         }
  //       }
  //     }

  //     const pagosParciales = Math.max(0, totalPagadoPrincipal - (semanasPagadasCompletamente * pagoSemanal));
  //     mora = Math.max(0, mora - pagosParciales);

  //     return mora;
  //   } catch (error) {
  //     console.error('Error en calcularMoraAcumulada:', error);
  //     return 0;
  //   }
  // }

  calcularMoraAcumulada(credito: any): number {
    if (!credito) return 0;

    const clave = this.generarClaveCache(credito.id_credito, 'moraAcumulada');
    const valorCache = this.obtenerDeCache<number>(clave);

    if (valorCache !== null) {
      return valorCache;
    }

    try {
      const pagos = this.pagosPorCredito[credito.id_credito] || [];
      const pagoSemanal = this.calcularPagoSemanal(credito);
      const fechaPrimerPago = new Date(credito.fecha_primer_pago);
      const hoy = new Date();

      const semanasTranscurridas = this.calcularSemanasTranscurridas(credito);
      const semanasPagadasCompletamente = this.calcularUltimaSemanaPagadaCompletamente(credito);

      const limiteSeguro = Math.min(semanasTranscurridas, 20);

      const totalPagadoPrincipal = pagos.reduce((sum, pago) => {
        return sum + (Number(pago.pago_registrado) || 0);
      }, 0);

      let mora = 0;

      for (let semana = 1; semana <= limiteSeguro; semana++) {
        let fechaVencimiento = new Date(fechaPrimerPago);
        fechaVencimiento.setDate(fechaPrimerPago.getDate() + ((semana - 1) * 7));

        const diaSemana = fechaVencimiento.getDay();
        if (diaSemana === 0) fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
        if (diaSemana === 6) fechaVencimiento.setDate(fechaVencimiento.getDate() + 2);

        if (hoy > fechaVencimiento) {
          if (semana > semanasPagadasCompletamente) {
            mora += pagoSemanal;
          }
        }
      }

      const pagosParciales = Math.max(0, totalPagadoPrincipal - (semanasPagadasCompletamente * pagoSemanal));
      mora = Math.max(0, mora - pagosParciales);

      this.guardarEnCache(clave, mora);
      return mora;
    } catch (error) {
      console.error('Error en calcularMoraAcumulada:', error);
      return 0;
    }
  }

  calcularSemanasTranscurridas(credito: any): number {
    if (!credito || !credito.fecha_primer_pago) return 0;

    const fechaPrimerPago = new Date(credito.fecha_primer_pago);
    const hoy = new Date();

    const diffTiempo = hoy.getTime() - fechaPrimerPago.getTime();
    const diffDias = Math.floor(diffTiempo / (1000 * 3600 * 24));

    return Math.min(Math.ceil(diffDias / 7), 16);
  }

  calcularMoraPendiente(credito: any): number {
    const moraAcumulada = this.calcularMoraAcumulada(credito);
    const moraPagada = this.calcularMoratorioTotal(credito);

    return Math.max(0, moraAcumulada - moraPagada);
  }

  calcularTotalAtrasado(credito: any): number {
    const carteraAtrasada = this.calcularCarteraAtrasada(credito);
    const moraPendiente = this.calcularMoraPendiente(credito);

    return carteraAtrasada + moraPendiente;
  }

  formatearProximaFechaPago(credito: any): string {
    const fecha = this.calcularProximaFechaPago(credito);

    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);
    if (ultimaSemanaPagada >= 16) {
      return 'CRÉDITO COMPLETADO';
    }

    return this.formatearFecha(fecha.toISOString());
  }

  getEstadoPago(credito: any): { texto: string, clase: string, filaClase: string } {
    const diasAtraso = this.calcularDiasAtraso(credito);
    const moraPendiente = this.calcularMoraPendiente(credito);
    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);
    const semanaActual = this.calcularSemanaActualCliente(credito);
    const totalAtrasado = this.calcularTotalAtrasado(credito);

    // VENCIDO: Semana 16+ y con deuda
    if (semanaActual >= 16 && totalAtrasado > 0) {
      return {
        texto: 'VENCIDO',
        clase: 'text-danger font-weight-bold',
        filaClase: 'fila-vencida table-danger'
      };
    }

    // Crédito completado
    if (ultimaSemanaPagada >= 16) {
      return {
        texto: 'COMPLETADO',
        clase: 'text-primary font-weight-bold',
        filaClase: 'fila-completada'
      };
    }

    // Sin atraso
    if (diasAtraso === 0) {
      return {
        texto: 'AL DÍA',
        clase: 'text-success font-weight-bold',
        filaClase: 'fila-al-dia'
      };
    }

    // Con atraso y mora
    if (diasAtraso > 0 && moraPendiente > 0) {
      return {
        texto: `${diasAtraso} DÍAS ATRASO (CON MORA)`,
        clase: 'text-danger font-weight-bold',
        filaClase: 'fila-con-mora'
      };
    }

    // Con atraso sin mora
    if (diasAtraso > 0) {
      return {
        texto: `${diasAtraso} DÍAS ATRASO`,
        clase: 'text-warning font-weight-bold',
        filaClase: 'fila-atrasada'
      };
    }

    return {
      texto: ' AL DÍA',
      clase: 'text-success font-weight-bold',
      filaClase: 'fila-al-dia'
    };
  }
  toggleFilaDetalle(creditoId: number): void {
    if (this.filaExpandida === creditoId) {
      this.filaExpandida = null;
    } else {
      this.filaExpandida = creditoId;
    }
  }

  getDetallesPagos(creditoId: number): any[] {
    const pagos = this.pagosPorCredito[creditoId] || [];
    return pagos.map((pago, index) => ({
      numeroPago: pago.numero_pago || (index + 1),
      fecha: pago.fecha_operacion || pago.fecha_pago,
      montoTotal: (Number(pago.pago_registrado) || 0) + (Number(pago.moratorios) || 0),
      capital: pago.capital_pagado || 0,
      intereses: pago.interes_pagado || 0,
      mora: pago.moratorios || 0,
      tipoPago: pago.tipo_pago || 'NORMAL'
    }));
  }

  // ============================================
  // MÉTODOS DE CARGA DE DATOS
  // ============================================

  cargarUsuarioLogueado(): void {
    this.usuarioActual = this.authService.getUserDataSync();

    if (this.usuarioActual) {
      this.registradoPor = this.usuarioActual.id_usuario;
      this.usuarioCargado = true;
    } else {
      this.timerSubscription = timer(3000).subscribe(() => {
        if (!this.usuarioCargado) {
          this.usuarioSubscription = this.authService.getUserDataObservable().subscribe({
            next: (user) => {
              this.usuarioActual = user;
              if (user) {
                this.registradoPor = user.id_usuario;
                this.usuarioCargado = true;
              }
            },
            error: (error) => {
              console.error('Error al obtener usuario:', error);
            }
          });
        }
      });
    }

    this.verificarUsuarioEnLocalStorage();
  }

  verificarUsuarioEnLocalStorage(): void {
    try {
      const usuarioStr = localStorage.getItem('user');
      if (usuarioStr) {
        const usuario = JSON.parse(usuarioStr);
        if (usuario && usuario.id_usuario && !this.registradoPor) {
          this.registradoPor = usuario.id_usuario;
          this.usuarioActual = usuario;
          this.usuarioCargado = true;
        }
      }
    } catch (error) {
      console.error('Error al leer localStorage:', error);
    }
  }

  cargarDatosIniciales(): void {
    this.cargarAliados();
    this.cargarClientes();
    this.cargarCreditos();
  }

  cargarClientes(): void {
    this.clienteService.obtenerClientes().subscribe({
      next: (clientes) => {
        this.clientes = clientes;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  cargarCreditos(): void {
    this.cargando = true;
    this.limpiarCache();
    this.creditoService.obtenerCreditos().subscribe({
      next: (creditos) => {
        // Filtrar créditos entregados y verificar si alguno debería estar finalizado
        const creditosFiltrados = creditos.filter(c => {
          if (c.estado_credito === 'ENTREGADO' || c.estado_credito === 'VENCIDO') {
            const saldoPendiente = Number(c.saldo_pendiente) || 0;
            // Si el saldo es 0 o negativo, debería estar FINALIZADO
            if (saldoPendiente <= 0.01) {
              this.verificarYActualizarCredito(c);
              return false; // No mostrar en la lista mientras se actualiza
            }
            return true;
          }
          return false;
        });

        this.creditos = creditosFiltrados;
        this.creditosFiltrados = [...this.creditos];

        // Calcular estadísticas después de cargar créditos
        this.calcularEstadisticasSemanaActual();

        if (this.creditos.length > 0) {
          this.cargarPagosParaCreditos();
        } else {
          this.cargando = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar créditos:', error);
        this.cargando = false;
        this.mostrarError('Error al cargar los créditos');
      }
    });
  }

  private verificarYActualizarCredito(credito: any): void {
    const saldoPendiente = Number(credito.saldo_pendiente) || 0;
    if (saldoPendiente <= 0.01 && credito.estado_credito === 'ENTREGADO') {
      this.creditoService.actualizarEstadoCredito(credito.id_credito, 'FINALIZADO')
        .subscribe({
          next: (response) => {
            console.log(`Crédito ${credito.id_credito} actualizado a FINALIZADO automáticamente`);
          },
          error: (error) => {
            console.error(`Error al actualizar crédito ${credito.id_credito}:`, error);
          }
        });
    }
  }


  verificarCreditosCompletados(): void {
    // Verificar cada crédito en la lista actual
    this.creditos.forEach(credito => {
      const saldoPendiente = Number(credito.saldo_pendiente) || 0;
      const semanasPagadas = this.calcularUltimaSemanaPagadaCompletamente(credito);

      // Si el saldo es 0 y ya pagó las 16 semanas
      if (saldoPendiente <= 0.01 && semanasPagadas >= 16 && credito.estado_credito === 'ENTREGADO') {
        this.creditoService.actualizarEstadoCredito(credito.id_credito, 'FINALIZADO')
          .subscribe({
            next: () => {
              console.log(`Crédito ${credito.id_credito} completado y actualizado`);
              // Actualizar la lista local
              credito.estado_credito = 'FINALIZADO';
            },
            error: (error) => {
              console.error(`Error al actualizar crédito ${credito.id_credito}:`, error);
            }
          });
      }
    });
  }

  cargarPagosParaCreditos(): void {
    let creditosPendientes = this.creditos.length;

    this.creditos.forEach(credito => {
      this.pagoService.obtenerPagosPorCredito(credito.id_credito).subscribe({
        next: (pagos) => {
          this.pagosPorCredito[credito.id_credito] = pagos || [];
          creditosPendientes--;

          if (creditosPendientes === 0) {
            this.cargando = false;
          }
        },
        error: (error) => {
          console.error(`Error al cargar pagos para crédito ${credito.id_credito}:`, error);
          this.pagosPorCredito[credito.id_credito] = [];
          creditosPendientes--;

          if (creditosPendientes === 0) {
            this.cargando = false;
          }
        }
      });
    });
  }

  cargarAliados(): void {
    this.aliadoService.obtenerAliados().subscribe({
      next: (aliados) => {
        this.aliados = aliados;
        // Recalcular estadísticas cuando llegan los nombres de aliados
        this.calcularEstadisticasSemanaActual();
      },
      error: (error) => {
        console.error('Error al cargar aliados:', error);
      }
    });
  }

  // ============================================
  // FILTROS
  // ============================================

  buscar(): void {
    this.creditosFiltrados = this.creditos.filter(credito => {
      const coincideAliado = this.filtroAliado ?
        credito.aliado_id === parseInt(this.filtroAliado) : true;

      const coincideCliente = this.filtroCliente ?
        this.getNombreCliente(credito).toLowerCase().includes(this.filtroCliente.toLowerCase()) : true;

      return coincideAliado && coincideCliente;
    });
  }

  limpiarFiltros(): void {
    this.filtroAliado = '';
    this.filtroCliente = '';
    this.creditosFiltrados = [...this.creditos];
  }

  // ============================================
  // MÉTODOS DE ALERTAS
  // ============================================

  mostrarExito(mensaje: string): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true
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

  mostrarConfirmacion(mensaje: string): Promise<any> {
    return Swal.fire({
      icon: 'question',
      title: 'Confirmación',
      text: mensaje,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545'
    });
  }

  // ============================================
  // UTILIDADES 
  // ============================================

  formatearMoneda(monto: number): string {
    if (!monto && monto !== 0) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  // formatearFecha(fecha: string): string {
  //   if (!fecha) return 'No especificada';
  //   const date = new Date(fecha);
  //   return date.toLocaleDateString('es-MX', {
  //     day: '2-digit',
  //     month: '2-digit',
  //     year: 'numeric'
  //   });
  // }
  formatearFecha(fecha: string): string {
    if (!fecha) return 'No especificada';

    // Usar el nuevo método para parsear la fecha
    const date = this.parsearFechaLocal(fecha);

    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Mexico_City' // Asegurar zona horaria de México
    });
  }

  get hayCreditos(): boolean {
    return this.creditos.length > 0;
  }

  getTotalPago(): number {
    return (this.montoPago || 0) + (this.moratorios || 0);
  }

  // Agrega este método en tu componente
  getCreditoId(credito: any): string {
    return credito.id_credito ||
      credito.credito_id ||
      credito.id ||
      'N/A';
  }


  calcularTotalCartera(): number {
    if (!this.creditosFiltrados || this.creditosFiltrados.length === 0) {
      return 0;
    }

    let total = 0;

    for (const credito of this.creditosFiltrados) {
      // Convertir a número y manejar todos los casos posibles
      const saldo = Number(credito.saldo_pendiente);

      // Verificar si es un número válido y no NaN
      if (!isNaN(saldo) && typeof saldo === 'number' && isFinite(saldo)) {
        total += saldo;
      } else {
        // Si no es válido, sumar 0 y opcionalmente loguear el error
        console.warn(`Saldo pendiente inválido para crédito ${credito.id_credito}:`, credito.saldo_pendiente);
      }
    }

    return total;
  }


  calcularTotalAtrasadoGeneral(): number {
    if (!this.creditosFiltrados || this.creditosFiltrados.length === 0) {
      return 0;
    }

    let total = 0;

    for (const credito of this.creditosFiltrados) {
      const atrasado = this.calcularTotalAtrasado(credito);
      total += atrasado;
    }

    return total;
  }

  // Función auxiliar para convertir cualquier valor a número seguro
  private convertirANumeroSeguro(valor: any): number {
    // Si es null, undefined o vacío
    if (valor === null || valor === undefined || valor === '') {
      return 0;
    }

    // Si ya es número y es válido
    if (typeof valor === 'number' && !isNaN(valor) && isFinite(valor)) {
      return valor;
    }

    // Si es string, intentar limpiar
    if (typeof valor === 'string') {
      // Eliminar caracteres no numéricos excepto punto y signo negativo
      const limpio = valor.replace(/[^\d.-]/g, '');
      const numero = parseFloat(limpio);

      if (!isNaN(numero) && isFinite(numero)) {
        return numero;
      }
      return 0;
    }

    // Intentar convertir cualquier otro tipo
    const numero = Number(valor);
    return (!isNaN(numero) && isFinite(numero)) ? numero : 0;
  }

  // Funciones para calcular otros totales si los necesitas
  calcularTotalAPagarGeneral(): number {
    if (!this.creditosFiltrados) return 0;

    try {
      return this.creditosFiltrados.reduce((total, credito) => {
        const valor = this.convertirANumeroSeguro(credito.total_a_pagar);
        const nuevoTotal = total + valor;

        // Verificar que no sea NaN (por si acaso)
        if (isNaN(nuevoTotal)) {
          console.warn('NaN encontrado en calcularTotalAPagarGeneral:', {
            totalActual: total,
            valorAgregado: valor,
            creditoId: credito.id_credito
          });
          return total; // Mantener el total anterior
        }

        return nuevoTotal;
      }, 0);
    } catch (error) {
      console.error('Error en calcularTotalAPagarGeneral:', error);
      return 0;
    }
  }

  calcularTotalPagadoGeneral(): number {
    if (!this.creditosFiltrados) return 0;

    try {
      return this.creditosFiltrados.reduce((total, credito) => {
        const valorPagado = this.calcularTotalPagado(credito);
        const valor = this.convertirANumeroSeguro(valorPagado);
        const nuevoTotal = total + valor;

        if (isNaN(nuevoTotal)) {
          console.warn('NaN encontrado en calcularTotalPagadoGeneral:', {
            totalActual: total,
            valorAgregado: valor,
            creditoId: credito.id_credito,
            valorPagadoOriginal: valorPagado
          });
          return total;
        }

        return nuevoTotal;
      }, 0);
    } catch (error) {
      console.error('Error en calcularTotalPagadoGeneral:', error);
      return 0;
    }
  }


  // ============================================
  // MÉTODOS CORREGIDOS PARA EL CONTADOR DE SEMANAS
  // ============================================

  /**
   * Inicializa el contador de semanas con el sistema específico
   */
  inicializarContadorSemanas(): void {
    // Calcular semana actual inmediatamente
    this.calcularSemanaActualCorregida();

    // Configurar actualización cada minuto
    this.intervaloActualizacion = setInterval(() => {
      this.calcularSemanaActualCorregida();
    }, 60000);

    // Programar actualización a medianoche
    this.programarActualizacionMedianoche();
  }

  /**
   * Método CORREGIDO para calcular la semana actual según el sistema:*/
  calcularSemanaActualCorregida(): void {
    const hoy = new Date();
    const añoActual = hoy.getFullYear();

    // Determinar el año base para el cálculo
    // Si estamos después del 29 de diciembre, usar el año actual
    // Si estamos antes del 29 de diciembre, usar el año anterior
    let añoBase: number;

    if (hoy >= new Date(añoActual, 11, 29)) { // 29 de diciembre (mes 11 = diciembre)
      añoBase = añoActual;
    } else {
      añoBase = añoActual - 1;
    }

    // Fecha base: 29 de diciembre del año base
    const fechaBase = new Date(añoBase, 11, 29);
    this.fechaBaseAjustada = fechaBase;

    // Calcular diferencia en días entre hoy y la fecha base
    const diffMs = hoy.getTime() - fechaBase.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Calcular semana: dividir días entre 7 (cada semana son 7 días)
    // y ajustar porque la semana 1 comienza en el día 0
    let semana = Math.floor(diffDias / 7) + 1;

    // Ajuste especial: si hoy es sábado (día 6 de la semana), 
    // mostramos la semana que termina ese sábado
    const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    if (diaSemana === 6 && hoy.getHours() < 12) {
      // Si es sábado antes del mediodía, puede que aún estemos en la semana anterior
      // Recalcular con ajuste de 1 día
      semana = Math.floor((diffDias - 1) / 7) + 1;
    }

    // Asegurar que no sea negativa
    this.semanaActual = semana > 0 ? semana : 1;

    // Calcular fechas de inicio y fin de la semana actual
    this.calcularRangoSemanaActual(this.semanaActual, fechaBase);

    // Recalcular estadísticas si cambia la semana
    this.calcularEstadisticasSemanaActual();

    // DEBUG: Mostrar información en consola
    // console.log('Cálculo semana:', {
    //   hoy: hoy.toISOString().split('T')[0],
    //   fechaBase: fechaBase.toISOString().split('T')[0],
    //   diffDias: diffDias,
    //   semanaCalculada: semana,
    //   fechaInicio: this.fechaInicioSemana.toISOString().split('T')[0],
    //   fechaFin: this.fechaFinSemana.toISOString().split('T')[0]
    // });
  }

  /**
   * Calcula el rango de fechas para la semana actual
   */
  calcularRangoSemanaActual(semana: number, fechaBase: Date): void {
    // Calcular fecha de inicio
    // Cada semana comienza 7 días después de la anterior
    let fechaInicio = new Date(fechaBase);
    fechaInicio.setDate(fechaBase.getDate() + ((semana - 1) * 7));
    this.fechaInicioSemana = fechaInicio;

    // Calcular fecha de fin (6 días después del inicio)
    let fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaInicio.getDate() + 5);
    this.fechaFinSemana = fechaFin;
  }

  /**
   * Formatea la semana actual para mostrar
   */
  formatearSemanaActual(): string {
    if (this.semanaActual === 0) {
      return 'SEMANA --';
    }

    const opciones: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short'
    };

    // Asegurarse de que las fechas estén en formato español
    const inicio = this.fechaInicioSemana.toLocaleDateString('es-ES', opciones);
    const fin = this.fechaFinSemana.toLocaleDateString('es-ES', opciones);

    return `SEMANA ${this.semanaActual} (${inicio} - ${fin})`;
  }

  /**
   * Formato simplificado solo con el número de semana
   */
  formatearNumeroSemana(): string {
    return this.semanaActual > 0 ? `SEMANA ${this.semanaActual}` : 'SEMANA --';
  }

  /**
   * Método ALTERNATIVO 
   */
  calcularSemanaAlternativo(): number {
    const hoy = new Date();
    const añoActual = hoy.getFullYear();

    // Obtener el 29 de diciembre del año anterior como punto de inicio
    const fechaInicioSistema = new Date(añoActual - 1, 11, 29);

    // Si hoy es antes del 29 de diciembre del año anterior
    // (estamos en enero del año actual), ajustar
    if (hoy < fechaInicioSistema) {
      fechaInicioSistema.setFullYear(añoActual - 2);
    }

    // Calcular días transcurridos
    const diffMs = hoy.getTime() - fechaInicioSistema.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Calcular semana
    let semana = Math.floor(diffDias / 7) + 1;

    // Ajuste para sábados
    if (hoy.getDay() === 6) {
      semana = Math.floor((diffDias - 1) / 7) + 1;
    }

    return semana > 0 ? semana : 1;
  }

  /**
   * Programa la actualización automática a medianoche
   */
  private programarActualizacionMedianoche(): void {
    const ahora = new Date();

    // Calcular cuánto falta para la próxima medianoche
    const medianoche = new Date(ahora);
    medianoche.setDate(ahora.getDate() + 1);
    medianoche.setHours(0, 0, 0, 0);

    const tiempoHastaMedianoche = medianoche.getTime() - ahora.getTime();

    setTimeout(() => {
      this.calcularSemanaActualCorregida();
      this.programarActualizacionMedianoche(); // Reprogramar para el próximo día
    }, tiempoHastaMedianoche);
  }

  // ============================================
  // NUEVO MÉTODO: ESTADÍSTICAS POR ALIADO
  // ============================================
  calcularEstadisticasSemanaActual(): void {
    if (!this.creditos || this.creditos.length === 0 || !this.fechaBaseAjustada) return;

    const conteo: { [key: string]: number } = {};

    // Inicializar contadores para todos los aliados (para mostrar 0 si no tienen)
    if (this.aliados.length > 0) {
      this.aliados.forEach(a => {
        if (a.nom_aliado) conteo[a.nom_aliado.trim()] = 0;
      });
    }

    this.creditos.forEach(credito => {
      // Usamos fecha_ministracion para determinar cuándo se creó el crédito (cliente nuevo)
      if (credito.fecha_ministracion) {
        let fechaMinistracion: Date;

        // Parseo seguro de fecha
        if (typeof credito.fecha_ministracion === 'string') {
          const fechaStr = credito.fecha_ministracion.split('T')[0];
          const [year, month, day] = fechaStr.split('-').map(Number);
          fechaMinistracion = new Date(year, month - 1, day);
        } else {
          fechaMinistracion = new Date(credito.fecha_ministracion);
        }

        // Calcular semana de este crédito usando la misma lógica que la semana actual
        const diffMs = fechaMinistracion.getTime() - this.fechaBaseAjustada.getTime();
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const semanaCredito = Math.floor(diffDias / 7) + 1;

        // Si la semana del crédito coincide con la semana actual, es un cliente nuevo de esta semana
        if (semanaCredito === this.semanaActual) {
          const nombreAliado = this.getNombreAliado(credito.aliado_id);
          if (nombreAliado !== 'N/A') {
            conteo[nombreAliado] = (conteo[nombreAliado] || 0) + 1;
          }
        }
      }
    });

    // Convertir objeto a array ordenado
    this.statsClientesNuevos = Object.keys(conteo)
      .map(key => ({
        aliado: key,
        cantidad: conteo[key]
      }))
      .sort((a, b) => b.cantidad - a.cantidad); // Ordenar de mayor a menor

    console.log('Clientes nuevos por aliado (Semana ' + this.semanaActual + '):', this.statsClientesNuevos);
  }

  getTotalClientesNuevos(): number {
    return this.statsClientesNuevos.reduce((acc, curr) => acc + curr.cantidad, 0);
  }

  getAliadosConRegistros(): number {
    if (!this.statsClientesNuevos) return 0;
    return this.statsClientesNuevos.filter(s => s.cantidad > 0).length;
  }

  /**
   * VERIFICACIÓN RÁPIDA 
   */
  verificarSemanasConocidas(): void {
    console.log('=== VERIFICACIÓN DE SEMANAS ===');

    // Fechas de prueba
    const pruebas = [
      { fecha: '2025-01-26', esperado: 5 },
      { fecha: '2025-01-19', esperado: 4 },
      { fecha: '2025-01-12', esperado: 3 },
      { fecha: '2025-01-05', esperado: 2 },
      { fecha: '2024-12-29', esperado: 1 },
    ];

    pruebas.forEach(prueba => {
      const testDate = new Date(prueba.fecha);
      const año = testDate.getFullYear();

      // Usar lógica del cálculo
      let añoBase = año;
      if (testDate < new Date(año, 11, 29)) {
        añoBase = año - 1;
      }

      const fechaBase = new Date(añoBase, 11, 29);
      const diffMs = testDate.getTime() - fechaBase.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const semana = Math.floor(diffDias / 7) + 1;

      console.log(`${prueba.fecha}: calculado=${semana}, esperado=${prueba.esperado}, ${semana === prueba.esperado ? '✓' : '✗'}`);
    });
  }

}