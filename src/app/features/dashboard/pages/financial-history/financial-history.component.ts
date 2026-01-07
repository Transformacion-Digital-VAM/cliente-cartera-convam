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

  private usuarioSubscription: Subscription = new Subscription();
  private timerSubscription: Subscription = new Subscription();
  private usuarioCargado: boolean = false;

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
  }

  ngOnDestroy(): void {
    this.usuarioSubscription.unsubscribe();
    this.timerSubscription.unsubscribe();
  }

  // ============================================
  // MÉTODOS NUEVOS AGREGADOS
  // ============================================

  calcularFechaSemana(credito: any, numeroSemana: number): Date {
    if (!credito || !credito.fecha_primer_pago) return new Date();

    const fechaPrimerPago = new Date(credito.fecha_primer_pago);
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
    if (!this.registradoPor || this.registradoPor <= 0) {
      this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
      return;
    }

    this.creditoSeleccionado = credito;

    // Calcular todos los datos necesarios
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

    // Mostrar el modal
    this.modalSeleccionAbierto = true;
  }


  abrirModalPago(tipo: string): void {
    this.modalSeleccionAbierto = false;
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
        // Para adelanto, el monto sugerido es el pago semanal
        this.montoPago = this.creditoSeleccionado.pago_semanal || 0;
        this.moratorios = 0;

        // Para adelanto, el número de pago es el próximo disponible
        const proximoPago = this.calcularProximoNumeroPago(this.creditoSeleccionado);
        this.numeroPagoSeleccionado = proximoPago;
        break;
    }

    this.metodoPago = '';
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


  // async registrarPago(): Promise<void> {
  //   if (!this.registradoPor || this.registradoPor <= 0) {
  //     this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
  //     return;
  //   }

  //   if (!await this.validarPago()) {
  //     return;
  //   }

  //   this.procesandoPago = true;

  //   // Para ADELANTO, asegurar que tiene el número de pago correcto
  //   if (this.tipoPago === 'ADELANTO') {
  //     this.numeroPagoSeleccionado = this.calcularProximoNumeroPago(this.creditoSeleccionado);
  //   }

  //   const pagoData = {
  //     credito_id: this.creditoSeleccionado.id_credito,
  //     numero_pago: this.numeroPagoSeleccionado,
  //     moratorios: Number(this.moratorios) || 0,
  //     pago_registrado: Number(this.montoPago),
  //     tipo_pago: `${this.tipoPago} - ${this.metodoPago}`.toUpperCase(),
  //     registrado_por: this.registradoPor
  //   };

  //   console.log(' Enviando pago:', pagoData);

  //   this.pagoService.registrarPago(pagoData).subscribe({
  //     next: (response) => {
  //       console.log(' Pago registrado:', response);

  //       const mensaje = this.tipoPago === 'PAGO'
  //         ? ` Pago registrado exitosamente para la semana ${this.numeroPagoSeleccionado}`
  //         : ` Adelanto registrado exitosamente para la semana ${this.numeroPagoSeleccionado}`;

  //       this.mostrarExito(mensaje);
  //       this.procesandoPago = false;
  //       this.cerrarModalPago();

  //       // Recargar datos después de un breve delay
  //       setTimeout(() => {
  //         this.cargarCreditos();
  //       }, 1000);
  //     },
  //     error: (error) => {
  //       console.error(' Error al registrar pago:', error);
  //       this.mostrarError('Error al registrar el pago: ' + (error.error?.error || error.message));
  //       this.procesandoPago = false;
  //     }
  //   });
  // }
  async registrarPago(): Promise<void> {
  if (!this.registradoPor || this.registradoPor <= 0) {
    this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
    return;
  }

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

  // ============================================
  // VALIDACIONES - MODIFICADO
  // ============================================

  // async validarPago(): Promise<boolean> {
  //   if (!this.montoPago || this.montoPago <= 0) {
  //     await this.mostrarAdvertencia('El monto del pago debe ser mayor a 0');
  //     return false;
  //   }

  //   if (!this.metodoPago || this.metodoPago.trim() === '') {
  //     await this.mostrarAdvertencia('Debe seleccionar un método de pago');
  //     return false;
  //   }

  //   // Para PAGO: validar que se seleccionó semana
  //   if (this.tipoPago === 'PAGO' && (!this.numeroPagoSeleccionado || this.numeroPagoSeleccionado < 1)) {
  //     await this.mostrarAdvertencia('Debe seleccionar una semana para el pago');
  //     return false;
  //   }

  //   // Para ADELANTO: validar que no haya mora pendiente
  //   if (this.tipoPago === 'ADELANTO') {
  //     const moraPendiente = this.calcularMoraPendiente(this.creditoSeleccionado);
  //     if (moraPendiente > 0) {
  //       await this.mostrarAdvertencia('No puede dar un adelanto si tiene mora pendiente. Use PAGO primero.');
  //       return false;
  //     }
  //   }

  //   const saldoPendiente = this.creditoSeleccionado.saldo_pendiente || 0;
  //   const totalAPagar = Number(this.montoPago) + Number(this.moratorios);

  //   if (totalAPagar > saldoPendiente + 1000) {
  //     const resultado = await this.mostrarConfirmacion(
  //       `El monto total a pagar (${this.formatearMoneda(totalAPagar)}) ` +
  //       `excede el saldo pendiente (${this.formatearMoneda(saldoPendiente)}). ` +
  //       `¿Desea continuar de todas formas?`
  //     );

  //     if (!resultado.isConfirmed) {
  //       return false;
  //     }
  //   }

  //   return true;
  // }

  async validarPago(): Promise<boolean> {
    if (!this.montoPago || this.montoPago <= 0) {
      await this.mostrarAdvertencia('El monto del pago debe ser mayor a 0');
      return false;
    }

    if (!this.metodoPago || this.metodoPago.trim() === '') {
      await this.mostrarAdvertencia('Debe seleccionar un método de pago');
      return false;
    }

    // Para PAGO: validar que se seleccionó semana
    if (this.tipoPago === 'PAGO') {
      if (!this.numeroPagoSeleccionado || this.numeroPagoSeleccionado < 1) {
        await this.mostrarAdvertencia('Debe seleccionar una semana para el pago');
        return false;
      }

      const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(this.creditoSeleccionado);

      // Validar que no intente pagar una semana ya pagada
      if (this.numeroPagoSeleccionado <= ultimaSemanaPagada) {
        await this.mostrarAdvertencia(`La semana ${this.numeroPagoSeleccionado} ya está pagada. Seleccione una semana posterior.`);
        return false;
      }
    }

    // Para ADELANTO: validar que no haya mora pendiente
    if (this.tipoPago === 'ADELANTO') {
      const moraPendiente = this.calcularMoraPendiente(this.creditoSeleccionado);
      if (moraPendiente > 0) {
        await this.mostrarAdvertencia(
          `No puede dar un adelanto si tiene mora pendiente de ${this.formatearMoneda(moraPendiente)}. ` +
          `Debe liquidar primero la mora usando la opción PAGO.`
        );
        return false;
      }

      const diasAtraso = this.calcularDiasAtraso(this.creditoSeleccionado);
      if (diasAtraso > 0) {
        await this.mostrarAdvertencia(
          `No puede dar un adelanto si tiene ${diasAtraso} días de atraso. ` +
          `Debe ponerse al día primero usando la opción PAGO.`
        );
        return false;
      }

      // Para adelanto, asignar automáticamente el número de pago
      const proximoPago = this.calcularProximoNumeroPago(this.creditoSeleccionado);
      this.numeroPagoSeleccionado = proximoPago;
    }

    const saldoPendiente = this.creditoSeleccionado.saldo_pendiente || 0;
    const totalAPagar = Number(this.montoPago) + Number(this.moratorios);

    // Validar que no exceda demasiado el saldo pendiente
    if (totalAPagar > saldoPendiente + 1000) {
      const resultado = await this.mostrarConfirmacion(
        `El monto total a pagar (${this.formatearMoneda(totalAPagar)}) ` +
        `excede el saldo pendiente (${this.formatearMoneda(saldoPendiente)}). ` +
        `¿Desea continuar de todas formas?`
      );

      if (!resultado.isConfirmed) {
        return false;
      }
    }

    return true;
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

  getDiaPago(credito: any): string {
    if (!credito || !credito.fecha_primer_pago) return 'N/A';
    const fecha = new Date(credito.fecha_primer_pago);
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

  // calcularProximaFechaPago(credito: any): Date {
  //   if (!credito || !credito.fecha_primer_pago) {
  //     return new Date();
  //   }

  //   const fechaPrimerPago = new Date(credito.fecha_primer_pago);
  //   const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);

  //   if (ultimaSemanaPagada >= 16) {
  //     return new Date();
  //   }

  //   let proximaFecha = new Date(fechaPrimerPago);
  //   proximaFecha.setDate(fechaPrimerPago.getDate() + (ultimaSemanaPagada * 7));

  //   const diaSemana = proximaFecha.getDay();
  //   if (diaSemana === 0) {
  //     proximaFecha.setDate(proximaFecha.getDate() + 1);
  //   } else if (diaSemana === 6) {
  //     proximaFecha.setDate(proximaFecha.getDate() + 2);
  //   }

  //   return proximaFecha;
  // }
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

  calcularDiasAtraso(credito: any): number {
    if (!credito || !credito.fecha_primer_pago) return 0;

    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);

    // Si ya pagó las 16 semanas, no hay atraso
    if (ultimaSemanaPagada >= 16) return 0;

    // Calcular la fecha de vencimiento de la siguiente semana a pagar
    const fechaPrimerPago = new Date(credito.fecha_primer_pago);
    let fechaVencimiento = new Date(fechaPrimerPago);
    fechaVencimiento.setDate(fechaPrimerPago.getDate() + (ultimaSemanaPagada * 7));

    // Ajustar si cae en fin de semana
    const diaSemana = fechaVencimiento.getDay();
    if (diaSemana === 0) { // Domingo
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
    } else if (diaSemana === 6) { // Sábado
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 2);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaVencimiento.setHours(0, 0, 0, 0);

    // Si la fecha de vencimiento es futura o es hoy, no hay atraso
    if (fechaVencimiento >= hoy) return 0;

    // Calcular días de atraso
    const diffTiempo = hoy.getTime() - fechaVencimiento.getTime();
    const diffDias = Math.floor(diffTiempo / (1000 * 3600 * 24));

    return Math.max(0, diffDias);
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

  calcularMoraAcumulada(credito: any): number {
    if (!credito) return 0;

    const pagos = this.pagosPorCredito[credito.id_credito] || [];
    const pagoSemanal = this.calcularPagoSemanal(credito);
    const fechaPrimerPago = new Date(credito.fecha_primer_pago);
    const hoy = new Date();

    const semanasTranscurridas = this.calcularSemanasTranscurridas(credito);
    const semanasPagadasCompletamente = this.calcularUltimaSemanaPagadaCompletamente(credito);

    const totalPagadoPrincipal = pagos.reduce((sum, pago) => {
      return sum + (Number(pago.pago_registrado) || 0);
    }, 0);

    let deberiaHaberPagado = 0;
    let mora = 0;

    for (let semana = 1; semana <= semanasTranscurridas; semana++) {
      let fechaVencimiento = new Date(fechaPrimerPago);
      fechaVencimiento.setDate(fechaPrimerPago.getDate() + ((semana - 1) * 7));

      const diaSemana = fechaVencimiento.getDay();
      if (diaSemana === 0) fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
      if (diaSemana === 6) fechaVencimiento.setDate(fechaVencimiento.getDate() + 2);

      if (hoy > fechaVencimiento) {
        deberiaHaberPagado += pagoSemanal;

        if (semana > semanasPagadasCompletamente) {
          mora += pagoSemanal;
        }
      }
    }

    const pagosParciales = Math.max(0, totalPagadoPrincipal - (semanasPagadasCompletamente * pagoSemanal));
    mora = Math.max(0, mora - pagosParciales);

    return mora;
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

  // getEstadoPago(credito: any): { texto: string, clase: string, filaClase: string } {
  //   const diasAtraso = this.calcularDiasAtraso(credito);
  //   const moraPendiente = this.calcularMoraPendiente(credito);

  //   if (diasAtraso === 0) {
  //     return { 
  //       texto: 'AL DÍA', 
  //       clase: 'text-success font-weight-bold',
  //       filaClase: 'fila-al-dia'
  //     };
  //   } else if (diasAtraso > 0 && moraPendiente > 0) {
  //     return { 
  //       texto: `${diasAtraso} DÍAS ATRASO`, 
  //       clase: 'text-danger font-weight-bold',
  //       filaClase: 'fila-con-mora'
  //     };
  //   } else if (diasAtraso > 0) {
  //     return { 
  //       texto: `${diasAtraso} DÍAS ATRASO`, 
  //       clase: 'text-warning font-weight-bold',
  //       filaClase: 'fila-atrasada'
  //     };
  //   } else {
  //     return { 
  //       texto: 'AL DÍA', 
  //       clase: 'text-success font-weight-bold',
  //       filaClase: 'fila-al-dia'
  //     };
  //   }
  // }

  // ============================================
  // MÉTODOS PARA TABLA EXPANDIBLE
  // ============================================

  getEstadoPago(credito: any): { texto: string, clase: string, filaClase: string } {
    const diasAtraso = this.calcularDiasAtraso(credito);
    const moraPendiente = this.calcularMoraPendiente(credito);
    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);

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

  // cargarCreditos(): void {
  //   this.cargando = true;
  //   this.creditoService.obtenerCreditos().subscribe({
  //     next: (creditos) => {
  //       this.creditos = creditos.filter(c => c.estado_credito === 'ENTREGADO');
  //       this.creditosFiltrados = [...this.creditos];

  //       if (this.creditos.length > 0) {
  //         this.cargarPagosParaCreditos();
  //       } else {
  //         this.cargando = false;
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error al cargar créditos:', error);
  //       this.cargando = false;
  //       this.mostrarError('Error al cargar los créditos');
  //     }
  //   });
  // }
  cargarCreditos(): void {
  this.cargando = true;
  this.creditoService.obtenerCreditos().subscribe({
    next: (creditos) => {
      // Filtrar créditos entregados y verificar si alguno debería estar finalizado
      const creditosFiltrados = creditos.filter(c => {
        if (c.estado_credito === 'ENTREGADO') {
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

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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


}