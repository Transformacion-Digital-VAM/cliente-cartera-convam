// -----------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------

// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Subscription, timer, forkJoin } from 'rxjs';
// import Swal from 'sweetalert2';
// import { CreditoService } from '../../../../services/credito.service';
// import { PagoService } from '../../../../services/pago.service';
// import { AliadoService } from '../../../../services/aliado.service';
// import { ClienteService } from '../../../../services/client.service';
// import { AuthService } from '../../../../services/auth.service';

// @Component({
//   selector: 'app-financial-history',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './financial-history.component.html',
//   styleUrls: ['./financial-history.component.css']
// })
// export class FinancialHistoryComponent implements OnInit, OnDestroy {
//   creditos: any[] = [];
//   creditosFiltrados: any[] = [];
//   pagosPorCredito: { [creditoId: number]: any[] } = {};
//   clientes: any[] = [];

//   // Filtros
//   filtroAliado: string = '';
//   filtroCliente: string = '';
//   cargando: boolean = false;

//   // Modales
//   modalSeleccionAbierto: boolean = false;
//   modalPagoAbierto: boolean = false;
//   modalComplementoAbierto: boolean = false;
//   modalAdicionalAbierto: boolean = false;

//   // Fila expandible
//   filaExpandida: number | null = null;
//   detallesPagos: { [creditoId: number]: any[] } = {};

//   creditoSeleccionado: any = null;
//   procesandoPago: boolean = false;

//   // Datos del pago normal
//   montoPago: number = 0;
//   metodoPago: string = '';
//   incluirMoratorio: boolean = false;
//   numeroPago: number = 1;
//   tipoPago: string = 'PAGO NORMAL';
//   moraAPagar: number = 0;

//   // Datos del complemento
//   montoComplemento: number = 0;
//   metodoComplemento: string = '';
//   distribucionComplemento: 'cartera' | 'mora' | 'ambos' = 'ambos';

//   // Datos del adicional
//   montoAdicional: number = 0;
//   metodoAdicional: string = '';

//   // Aliados
//   aliados: any[] = [];
//   metodosPago: string[] = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE'];

//   // Calendario de pagos
//   calendarioPagos: any[] = [];
//   semanasVencidas: any[] = [];
//   semanasPendientes: any[] = [];
//   totalMoraPendiente: number = 0;
//   totalCapitalPendiente: number = 0;

//   // USUARIO
//   usuarioActual: any = null;
//   registradoPor: number = 0;

//   private usuarioSubscription: Subscription = new Subscription();
//   private timerSubscription: Subscription = new Subscription();
//   private usuarioCargado: boolean = false;

//   // Variables para días de atraso y próxima fecha
//   diasAtrasoActual: number = 0;
//   semanasAtraso: number = 0;
//   diasAtrasoSemanaActual: number = 0;
//   moraAcumulada: number = 0;

//   constructor(
//     private creditoService: CreditoService,
//     private pagoService: PagoService,
//     private aliadoService: AliadoService,
//     private clienteService: ClienteService,
//     private authService: AuthService
//   ) { }

//   ngOnInit(): void {
//     this.cargarUsuarioLogueado();
//     this.cargarDatosIniciales();
//   }

//   ngOnDestroy(): void {
//     this.usuarioSubscription.unsubscribe();
//     this.timerSubscription.unsubscribe();
//   }

//   // ============================================
//   // NUEVOS MÉTODOS PARA CÁLCULO DE ATRASOS Y FECHAS
//   // ============================================

//   /**
//    * Calcula los días hábiles entre dos fechas (excluye sábados y domingos)
//    */
//   calcularDiasHabiles(inicio: Date, fin: Date): number {
//     let dias = 0;
//     const diaActual = new Date(inicio);
    
//     while (diaActual < fin) {
//       const diaSemana = diaActual.getDay();
//       if (diaSemana !== 0 && diaSemana !== 6) {
//         dias++;
//       }
//       diaActual.setDate(diaActual.getDate() + 1);
//     }
    
//     return dias;
//   }

//   /**
//    * Calcula la próxima fecha de pago basada en el día de pago
//    */
//   calcularProximaFechaPago(credito: any): string {
//     if (!credito || !credito.fecha_primer_pago) return 'N/A';
    
//     const fechaPrimerPago = new Date(credito.fecha_primer_pago);
//     const hoy = new Date();
    
//     // Calcular semanas transcurridas desde el primer pago
//     const diffTiempo = hoy.getTime() - fechaPrimerPago.getTime();
//     const diffDias = Math.floor(diffTiempo / (1000 * 3600 * 24));
//     const semanasTranscurridas = Math.floor(diffDias / 7);
    
//     // Calcular la próxima fecha de pago
//     let proximaFecha = new Date(fechaPrimerPago);
//     proximaFecha.setDate(proximaFecha.getDate() + ((semanasTranscurridas + 1) * 7));
    
//     // Ajustar si cae en fin de semana
//     const diaSemanaProxima = proximaFecha.getDay();
//     if (diaSemanaProxima === 0) { // Domingo
//       proximaFecha.setDate(proximaFecha.getDate() + 1); // Lunes
//     } else if (diaSemanaProxima === 6) { // Sábado
//       proximaFecha.setDate(proximaFecha.getDate() + 2); // Lunes
//     }
    
//     return this.formatearFecha(proximaFecha.toISOString());
//   }

//   /**
//    * Calcula los días de atraso basados en la fecha del primer pago
//    */
//   calcularDiasAtraso(credito: any): number {
//     if (!credito || !credito.fecha_primer_pago) return 0;
    
//     const fechaPrimerPago = new Date(credito.fecha_primer_pago);
//     const hoy = new Date();
//     const pagosRealizados = this.calcularPagosRealizados(credito);
    
//     // Calcular la fecha en la que debería haber hecho el último pago
//     let fechaUltimoPagoEsperado = new Date(fechaPrimerPago);
//     fechaUltimoPagoEsperado.setDate(fechaUltimoPagoEsperado.getDate() + (pagosRealizados * 7));
    
//     // Ajustar si la fecha esperada cae en fin de semana
//     const diaSemanaEsperado = fechaUltimoPagoEsperado.getDay();
//     if (diaSemanaEsperado === 0) { // Domingo
//       fechaUltimoPagoEsperado.setDate(fechaUltimoPagoEsperado.getDate() + 1); // Lunes
//     } else if (diaSemanaEsperado === 6) { // Sábado
//       fechaUltimoPagoEsperado.setDate(fechaUltimoPagoEsperado.getDate() + 2); // Lunes
//     }
    
//     // Calcular diferencia en días
//     const diffTiempo = hoy.getTime() - fechaUltimoPagoEsperado.getTime();
//     const diffDias = Math.floor(diffTiempo / (1000 * 3600 * 24));
    
//     return Math.max(0, diffDias);
//   }

//   /**
//    * Calcula las semanas de atraso completas
//    */
//   calcularSemanasAtraso(credito: any): number {
//     const diasAtraso = this.calcularDiasAtraso(credito);
//     return Math.floor(diasAtraso / 7);
//   }

//   /**
//    * Calcula los días de atraso de la semana actual (0-6 días)
//    */
//   calcularDiasAtrasoSemanaActual(credito: any): number {
//     const diasAtraso = this.calcularDiasAtraso(credito);
//     return diasAtraso % 7;
//   }

//   /**
//    * CALCULA LA MORA ACUMULADA BASADA EN LOS DÍAS DE ATRASO
//    * Nueva lógica: 
//    * - Cada día de atraso genera mora igual al pago semanal
//    * - Si hay 1 día de atraso: mora = 1 × pago semanal
//    * - Si hay 2 semanas (14 días): mora = 14 × pago semanal / 7 = 2 × pago semanal
//    */
//   calcularMoraAcumulada(credito: any): number {
//     if (!credito) return 0;
    
//     const pagoSemanal = this.calcularPagoSemanal(credito);
//     const diasAtraso = this.calcularDiasAtraso(credito);
    
//     // Si hay al menos 1 día de atraso, se genera mora
//     if (diasAtraso > 0) {
//       // Calcular semanas completas de atraso
//       const semanasCompletasAtraso = Math.floor(diasAtraso / 7);
//       // Calcular días adicionales en la semana actual
//       const diasSemanaActual = diasAtraso % 7;
      
//       // Si hay días en la semana actual, cuenta como semana completa para mora
//       const semanasMora = diasSemanaActual > 0 ? semanasCompletasAtraso + 1 : semanasCompletasAtraso;
      
//       return semanasMora * pagoSemanal;
//     }
    
//     return 0;
//   }

//   /**
//    * Calcula la mora pendiente (mora acumulada - mora pagada)
//    */
//   calcularMoraPendiente(credito: any): number {
//     if (!credito) return 0;
    
//     const moraAcumulada = this.calcularMoraAcumulada(credito);
//     const moraPagada = this.calcularMoratorioTotal(credito);
    
//     return Math.max(0, moraAcumulada - moraPagada);
//   }

//   /**
//    * Calcula la cartera atrasada (pagos semanales no realizados)
//    */
//   calcularCarteraAtrasada(credito: any): number {
//     if (!credito) return 0;
    
//     const pagoSemanal = this.calcularPagoSemanal(credito);
//     const semanasAtraso = this.calcularSemanasAtraso(credito);
    
//     return semanasAtraso * pagoSemanal;
//   }

//   /**
//    * Calcula la cartera pendiente (cartera atrasada - cartera pagada)
//    */
//   calcularCarteraPendiente(credito: any): number {
//     if (!credito) return 0;
    
//     const carteraAtrasada = this.calcularCarteraAtrasada(credito);
//     // Suponiendo que el 70% de los pagos registrados van a cartera
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
//     const carteraPagada = pagos.reduce((sum, pago) => {
//       const totalPago = pago.pago_registrado || 0;
//       return sum + (totalPago * 0.7); // 70% a cartera
//     }, 0);
    
//     return Math.max(0, carteraAtrasada - carteraPagada);
//   }

//   /**
//    * Calcula el monto total de pagos atrasados (cartera + mora)
//    */
//   calcularTotalAtrasado(credito: any): number {
//     const carteraPendiente = this.calcularCarteraPendiente(credito);
//     const moraPendiente = this.calcularMoraPendiente(credito);
//     return carteraPendiente + moraPendiente;
//   }

//   /**
//    * Obtiene el estado del pago (color y texto)
//    */
//   getEstadoPago(credito: any): { texto: string, clase: string } {
//     const diasAtraso = this.calcularDiasAtraso(credito);
    
//     if (diasAtraso === 0) {
//       return { texto: 'AL DÍA', clase: 'text-success' };
//     } else if (diasAtraso <= 3) {
//       return { texto: `${diasAtraso} DÍAS ATRASO`, clase: 'text-warning' };
//     } else if (diasAtraso <= 7) {
//       return { texto: `${diasAtraso} DÍAS ATRASO`, clase: 'text-orange' };
//     } else {
//       return { texto: `${diasAtraso} DÍAS ATRASO`, clase: 'text-danger' };
//     }
//   }

//   // ============================================
//   // MÉTODOS EXISTENTES (MODIFICADOS)
//   // ============================================

//   abrirModalSeleccion(credito: any): void {
//     if (!this.registradoPor || this.registradoPor <= 0) {
//       this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
//       return;
//     }

//     this.creditoSeleccionado = credito;
//     this.modalSeleccionAbierto = true;

//     // Calcular días y semanas de atraso
//     this.diasAtrasoActual = this.calcularDiasAtraso(credito);
//     this.semanasAtraso = this.calcularSemanasAtraso(credito);
//     this.diasAtrasoSemanaActual = this.calcularDiasAtrasoSemanaActual(credito);
//     this.moraAcumulada = this.calcularMoraAcumulada(credito);
    
//     // Actualizar el capital pendiente en el modal
//     this.totalCapitalPendiente = this.calcularCapitalPendiente(credito);
//     this.totalMoraPendiente = this.calcularMoraPendiente(credito);
//   }

//   abrirModalPagoNormal(): void {
//     this.modalPagoAbierto = true;

//     this.numeroPago = this.calcularProximoPago(this.creditoSeleccionado);
//     this.montoPago = this.calcularPagoSemanal(this.creditoSeleccionado);
//     this.metodoPago = '';
    
//     // Incluir moratorio automáticamente si hay atraso
//     this.moraAPagar = this.calcularMoraPendiente(this.creditoSeleccionado);
//     this.incluirMoratorio = this.moraAPagar > 0;
    
//     this.tipoPago = 'PAGO NORMAL';
//   }

//   abrirModalComplemento(): void {
//     this.modalComplementoAbierto = true;

//     // Calcular monto sugerido para complemento
//     const saldoPendiente = this.calcularSaldoPendiente(this.creditoSeleccionado);
//     const moraPendiente = this.calcularMoraPendiente(this.creditoSeleccionado);
//     const carteraPendiente = this.calcularCarteraPendiente(this.creditoSeleccionado);
    
//     // Sugerir el total de mora pendiente + cartera pendiente
//     const montoSugerido = Math.min(saldoPendiente, moraPendiente + carteraPendiente);

//     this.montoComplemento = montoSugerido;
//     this.metodoComplemento = '';
//     this.distribucionComplemento = 'ambos';
//   }

//   // ============================================
//   // MÉTODOS PARA LA TABLA EXPANDIBLE
//   // ============================================

//   toggleFilaDetalle(creditoId: number): void {
//     if (this.filaExpandida === creditoId) {
//       this.filaExpandida = null;
//     } else {
//       this.filaExpandida = creditoId;
//       if (!this.detallesPagos[creditoId]) {
//         this.cargarDetallesPagos(creditoId);
//       }
//     }
//   }

//   cargarDetallesPagos(creditoId: number): void {
//     const credito = this.creditos.find(c => c.id_credito === creditoId);
//     if (!credito) return;

//     const pagos = this.pagosPorCredito[creditoId] || [];
    
//     this.detallesPagos[creditoId] = pagos.map((pago, index) => {
//       return this.calcularDesglosePago(pago, credito, index + 1);
//     });
//   }

//   calcularDesglosePago(pago: any, credito: any, numeroPago: number): any {
//     const pagoSemanal = this.calcularPagoSemanal(credito);
//     const mora = pago.moratorios || 0;
//     const totalPago = pago.pago_registrado || 0;
    
//     const capitalPagado = totalPago * 0.7;
//     const interesesPagados = totalPago * 0.3;
    
//     return {
//       numeroPago: numeroPago,
//       fecha: pago.fecha_operacion || pago.fecha_pago,
//       montoTotal: totalPago,
//       capital: capitalPagado,
//       intereses: interesesPagados,
//       mora: mora,
//       tipoPago: pago.tipo_pago || 'NORMAL'
//     };
//   }

//   // ============================================
//   // MÉTODOS DE CÁLCULO
//   // ============================================

//   calcularCapitalPendiente(credito: any): number {
//     if (!credito) return 0;
    
//     const montoAprobado = Number(credito.monto_aprobado) || Number(credito.monto_solicitado) || 0;
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
    
//     let capitalPagado = 0;
//     pagos.forEach(pago => {
//       const totalPago = pago.pago_registrado || 0;
//       capitalPagado += totalPago * 0.7;
//     });
    
//     return Math.max(0, montoAprobado - capitalPagado);
//   }

//   getNombreCliente(credito: any): string {
//     if (!credito) return 'N/A';

//     if (credito.nombre_cliente) {
//       return `${credito.nombre_cliente} ${credito.app_cliente || ''} ${credito.apm_cliente || ''}`.trim();
//     }

//     if (credito.cliente_id && this.clientes.length > 0) {
//       const cliente = this.clientes.find(c => c.id_cliente === credito.cliente_id);
//       if (cliente) {
//         const nombre = cliente.nombre_cliente || cliente.nombre || '';
//         const app = cliente.app_cliente || cliente.apellido_paterno || '';
//         const apm = cliente.apm_cliente || cliente.apellido_materno || '';
//         return `${nombre} ${app} ${apm}`.trim();
//       }
//     }

//     return 'Cliente no encontrado';
//   }

//   getNombreAliado(aliadoId: number): string {
//     if (!aliadoId) return 'N/A';
//     const aliado = this.aliados.find(a => a.id_aliado === aliadoId);
//     return aliado ? aliado.nom_aliado.trim() : 'N/A';
//   }

//   getDiaPago(credito: any): string {
//     if (!credito || !credito.fecha_primer_pago) return 'N/A';
//     const fecha = new Date(credito.fecha_primer_pago);
//     const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
//     return dias[fecha.getDay()];
//   }

//   calcularPagoSemanal(credito: any): number {
//     if (!credito) return 0;
//     return Number(credito.pago_semanal) || 0;
//   }

//   calcularProximoPago(credito: any): number {
//     if (!credito) return 1;
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
//     return Math.min(pagos.length + 1, 16);
//   }

//   calcularMoratorioTotal(credito: any): number {
//     if (!credito) return 0;
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
//     return pagos.reduce((sum, pago) => sum + (Number(pago.moratorios) || 0), 0);
//   }

//   calcularTotalPagado(credito: any): number {
//     if (!credito) return 0;
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
//     return pagos.reduce((sum, pago) => sum + (Number(pago.pago_registrado) || 0), 0);
//   }

//   calcularSaldoPendiente(credito: any): number {
//     if (!credito) return 0;

//     if (credito.saldo_pendiente !== null && credito.saldo_pendiente !== undefined) {
//       return Number(credito.saldo_pendiente);
//     }

//     const totalAPagar = Number(credito.total_a_pagar) || 0;
//     const totalPagado = this.calcularTotalPagado(credito);
//     return Math.max(0, totalAPagar - totalPagado);
//   }

//   calcularPagosRealizados(credito: any): number {
//     if (!credito) return 0;
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
//     return pagos.length;
//   }

//   calcularPagosPendientes(credito: any): number {
//     return 16 - this.calcularPagosRealizados(credito);
//   }

//   // ============================================
//   // MÉTODOS DE MODALES
//   // ============================================

//   cerrarModalSeleccion(): void {
//     this.modalSeleccionAbierto = false;
//     this.creditoSeleccionado = null;
//   }

//   seleccionarTipoPago(tipo: 'normal' | 'complemento' | 'adicional'): void {
//     this.modalSeleccionAbierto = false;

//     switch (tipo) {
//       case 'normal':
//         this.abrirModalPagoNormal();
//         break;
//       case 'complemento':
//         this.abrirModalComplemento();
//         break;
//       case 'adicional':
//         this.abrirModalAdicional();
//         break;
//     }
//   }

//   cerrarModalPago(): void {
//     this.modalPagoAbierto = false;
//     this.montoPago = 0;
//     this.metodoPago = '';
//     this.incluirMoratorio = false;
//     this.numeroPago = 1;
//     this.tipoPago = 'PAGO NORMAL';
//     this.moraAPagar = 0;
//   }

//   calcularTotalPagoNormal(): number {
//     let total = Number(this.montoPago) || 0;
//     if (this.incluirMoratorio) {
//       total += this.moraAPagar;
//     }
//     return total;
//   }

//   calcularDistribucionComplemento(): { cartera: number, mora: number } {
//     const monto = Number(this.montoComplemento) || 0;

//     const moraPendiente = this.calcularMoraPendiente(this.creditoSeleccionado);
//     const carteraPendiente = this.calcularCarteraPendiente(this.creditoSeleccionado);

//     switch (this.distribucionComplemento) {
//       case 'cartera':
//         return { 
//           cartera: Math.min(monto, carteraPendiente), 
//           mora: 0 
//         };
//       case 'mora':
//         return { 
//           cartera: 0, 
//           mora: Math.min(monto, moraPendiente) 
//         };
//       case 'ambos':
//       default:
//         const totalPendiente = carteraPendiente + moraPendiente;
//         if (totalPendiente === 0) {
//           return { cartera: monto, mora: 0 };
//         }

//         const proporcionCartera = carteraPendiente / totalPendiente;
//         const proporcionMora = moraPendiente / totalPendiente;

//         return {
//           cartera: Math.round(monto * proporcionCartera * 100) / 100,
//           mora: Math.round(monto * proporcionMora * 100) / 100
//         };
//     }
//   }

//   cerrarModalComplemento(): void {
//     this.modalComplementoAbierto = false;
//     this.montoComplemento = 0;
//     this.metodoComplemento = '';
//     this.distribucionComplemento = 'ambos';
//   }

//   abrirModalAdicional(): void {
//     this.modalAdicionalAbierto = true;

//     this.montoAdicional = this.calcularPagoSemanal(this.creditoSeleccionado);
//     this.metodoAdicional = '';
//   }

//   cerrarModalAdicional(): void {
//     this.modalAdicionalAbierto = false;
//     this.montoAdicional = 0;
//     this.metodoAdicional = '';
//   }

//   // ============================================
//   // REGISTRAR PAGOS
//   // ============================================

//   async registrarPagoNormal(): Promise<void> {
//     if (!this.registradoPor || this.registradoPor <= 0) {
//       this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
//       return;
//     }

//     if (!await this.validarPagoNormal()) {
//       return;
//     }

//     this.procesandoPago = true;

//     const pagoData = {
//       credito_id: this.creditoSeleccionado.id_credito,
//       moratorios: this.incluirMoratorio ? this.moraAPagar : 0,
//       pago_registrado: Number(this.montoPago),
//       tipo_pago: `${this.tipoPago} - ${this.metodoPago}`.toUpperCase(),
//       registrado_por: this.registradoPor
//     };

//     this.pagoService.registrarPago(pagoData).subscribe({
//       next: (response) => {
//         this.mostrarExito('Pago normal registrado exitosamente');
//         this.procesandoPago = false;
//         this.cerrarModalPago();
//         this.cargarCreditos();
//       },
//       error: (error) => {
//         console.error('Error al registrar pago:', error);
//         this.mostrarError('Error al registrar el pago');
//         this.procesandoPago = false;
//       }
//     });
//   }

//   async registrarComplemento(): Promise<void> {
//     if (!this.registradoPor || this.registradoPor <= 0) {
//       this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
//       return;
//     }

//     if (!await this.validarComplemento()) {
//       return;
//     }

//     this.procesandoPago = true;

//     const distribucion = this.calcularDistribucionComplemento();

//     const pagoData = {
//       credito_id: this.creditoSeleccionado.id_credito,
//       moratorios: distribucion.mora,
//       pago_registrado: distribucion.cartera,
//       tipo_pago: `COMPLEMENTO - ${this.metodoComplemento}`.toUpperCase(),
//       registrado_por: this.registradoPor
//     };

//     this.pagoService.registrarPago(pagoData).subscribe({
//       next: (response) => {
//         this.mostrarExito('Complemento de pago registrado exitosamente');
//         this.procesandoPago = false;
//         this.cerrarModalComplemento();
//         this.cargarCreditos();
//       },
//       error: (error) => {
//         console.error('Error al registrar complemento:', error);
//         this.mostrarError('Error al registrar el complemento');
//         this.procesandoPago = false;
//       }
//     });
//   }

//   async registrarAdicional(): Promise<void> {
//     if (!this.registradoPor || this.registradoPor <= 0) {
//       this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
//       return;
//     }

//     if (!await this.validarAdicional()) {
//       return;
//     }

//     this.procesandoPago = true;

//     const pagoData = {
//       credito_id: this.creditoSeleccionado.id_credito,
//       moratorios: 0,
//       pago_registrado: Number(this.montoAdicional),
//       tipo_pago: `ADICIONAL - ${this.metodoAdicional}`.toUpperCase(),
//       registrado_por: this.registradoPor
//     };

//     this.pagoService.registrarPago(pagoData).subscribe({
//       next: (response) => {
//         this.mostrarExito('Pago adicional registrado exitosamente');
//         this.procesandoPago = false;
//         this.cerrarModalAdicional();
//         this.cargarCreditos();
//       },
//       error: (error) => {
//         console.error('Error al registrar pago adicional:', error);
//         this.mostrarError('Error al registrar el pago adicional');
//         this.procesandoPago = false;
//       }
//     });
//   }

//   // ============================================
//   // VALIDACIONES
//   // ============================================

//   async validarPagoNormal(): Promise<boolean> {
//     if (!this.montoPago || this.montoPago <= 0) {
//       await this.mostrarAdvertencia('El monto del pago debe ser mayor a 0');
//       return false;
//     }

//     if (!this.metodoPago || this.metodoPago.trim() === '') {
//       await this.mostrarAdvertencia('Debe seleccionar un método de pago');
//       return false;
//     }

//     const saldoPendiente = this.calcularSaldoPendiente(this.creditoSeleccionado);
//     const totalPago = this.calcularTotalPagoNormal();

//     if (totalPago > saldoPendiente + 100) {
//       const resultado = await this.mostrarConfirmacion(
//         `El monto del pago: $${totalPago.toFixed(2)}\n` +
//         `Excede el saldo pendiente: $${saldoPendiente.toFixed(2)}\n\n` +
//         `¿Desea continuar de todas formas?`
//       );

//       if (!resultado.isConfirmed) {
//         return false;
//       }
//     }

//     return true;
//   }

//   async validarComplemento(): Promise<boolean> {
//     if (!this.montoComplemento || this.montoComplemento <= 0) {
//       await this.mostrarAdvertencia('El monto del complemento debe ser mayor a 0');
//       return false;
//     }

//     if (!this.metodoComplemento || this.metodoComplemento.trim() === '') {
//       await this.mostrarAdvertencia('Debe seleccionar un método de pago');
//       return false;
//     }

//     const saldoPendiente = this.calcularSaldoPendiente(this.creditoSeleccionado);

//     if (this.montoComplemento > saldoPendiente + 100) {
//       const resultado = await this.mostrarConfirmacion(
//         `El monto del complemento: $${this.montoComplemento.toFixed(2)}\n` +
//         `Excede el saldo pendiente: $${saldoPendiente.toFixed(2)}\n\n` +
//         `¿Desea continuar de todas formas?`
//       );

//       if (!resultado.isConfirmed) {
//         return false;
//       }
//     }

//     return true;
//   }

//   async validarAdicional(): Promise<boolean> {
//     if (!this.montoAdicional || this.montoAdicional <= 0) {
//       await this.mostrarAdvertencia('El monto adicional debe ser mayor a 0');
//       return false;
//     }

//     if (!this.metodoAdicional || this.metodoAdicional.trim() === '') {
//       await this.mostrarAdvertencia('Debe seleccionar un método de pago');
//       return false;
//     }

//     const saldoPendiente = this.calcularSaldoPendiente(this.creditoSeleccionado);

//     if (this.montoAdicional > saldoPendiente + 100) {
//       const resultado = await this.mostrarConfirmacion(
//         `El monto adicional: $${this.montoAdicional.toFixed(2)}\n` +
//         `Excede el saldo pendiente: $${saldoPendiente.toFixed(2)}\n\n` +
//         `¿Desea continuar de todas formas?`
//       );

//       if (!resultado.isConfirmed) {
//         return false;
//       }
//     }

//     return true;
//   }

//   // ============================================
//   // MÉTODOS DE CARGA DE DATOS
//   // ============================================

//   cargarUsuarioLogueado(): void {
//     this.usuarioActual = this.authService.getUserDataSync();

//     if (this.usuarioActual) {
//       this.registradoPor = this.usuarioActual.id_usuario;
//       this.usuarioCargado = true;
//     } else {
//       this.timerSubscription = timer(3000).subscribe(() => {
//         if (!this.usuarioCargado) {
//           this.usuarioSubscription = this.authService.getUserDataObservable().subscribe({
//             next: (user) => {
//               this.usuarioActual = user;
//               if (user) {
//                 this.registradoPor = user.id_usuario;
//                 this.usuarioCargado = true;
//               }
//             },
//             error: (error) => {
//               console.error('Error al obtener usuario:', error);
//             }
//           });
//         }
//       });
//     }

//     this.verificarUsuarioEnLocalStorage();
//   }

//   verificarUsuarioEnLocalStorage(): void {
//     try {
//       const usuarioStr = localStorage.getItem('user');
//       if (usuarioStr) {
//         const usuario = JSON.parse(usuarioStr);
//         if (usuario && usuario.id_usuario && !this.registradoPor) {
//           this.registradoPor = usuario.id_usuario;
//           this.usuarioActual = usuario;
//           this.usuarioCargado = true;
//         }
//       }
//     } catch (error) {
//       console.error('Error al leer localStorage:', error);
//     }
//   }

//   cargarDatosIniciales(): void {
//     this.cargarAliados();
//     this.cargarClientes();
//     this.cargarCreditos();
//   }

//   cargarClientes(): void {
//     this.clienteService.obtenerClientes().subscribe({
//       next: (clientes) => {
//         this.clientes = clientes;
//       },
//       error: (error) => {
//         console.error('Error al cargar clientes:', error);
//       }
//     });
//   }

//   cargarCreditos(): void {
//     this.cargando = true;
//     this.creditoService.obtenerCreditos().subscribe({
//       next: (creditos) => {
//         this.creditos = creditos.filter(c => c.estado_credito === 'ENTREGADO');
//         this.creditosFiltrados = [...this.creditos];

//         if (this.creditos.length > 0) {
//           this.cargarPagosParaCreditos();
//         } else {
//           this.cargando = false;
//         }
//       },
//       error: (error) => {
//         console.error('Error al cargar créditos:', error);
//         this.cargando = false;
//         this.mostrarError('Error al cargar los créditos');
//       }
//     });
//   }

//   cargarPagosParaCreditos(): void {
//     let creditosPendientes = this.creditos.length;

//     this.creditos.forEach(credito => {
//       this.pagoService.obtenerPagosPorCredito(credito.id_credito).subscribe({
//         next: (pagos) => {
//           this.pagosPorCredito[credito.id_credito] = pagos || [];
          
//           // Calcular valores para este crédito
//           credito.capital_pendiente = this.calcularCapitalPendiente(credito);
//           credito.mora_pendiente = this.calcularMoraPendiente(credito);
//           credito.cartera_pendiente = this.calcularCarteraPendiente(credito);
//           credito.total_atrasado = this.calcularTotalAtrasado(credito);
//           credito.dias_atraso = this.calcularDiasAtraso(credito);
//           credito.semanas_atraso = this.calcularSemanasAtraso(credito);
//           credito.proxima_fecha_pago = this.calcularProximaFechaPago(credito);
//           credito.estado_pago = this.getEstadoPago(credito);
          
//           creditosPendientes--;

//           if (creditosPendientes === 0) {
//             this.cargando = false;
//           }
//         },
//         error: (error) => {
//           console.error(`Error al cargar pagos para crédito ${credito.id_credito}:`, error);
//           this.pagosPorCredito[credito.id_credito] = [];
          
//           // Calcular valores incluso si hay error
//           credito.capital_pendiente = this.calcularCapitalPendiente(credito);
//           credito.mora_pendiente = this.calcularMoraPendiente(credito);
//           credito.cartera_pendiente = this.calcularCarteraPendiente(credito);
//           credito.total_atrasado = this.calcularTotalAtrasado(credito);
//           credito.dias_atraso = this.calcularDiasAtraso(credito);
//           credito.semanas_atraso = this.calcularSemanasAtraso(credito);
//           credito.proxima_fecha_pago = this.calcularProximaFechaPago(credito);
//           credito.estado_pago = this.getEstadoPago(credito);
          
//           creditosPendientes--;

//           if (creditosPendientes === 0) {
//             this.cargando = false;
//           }
//         }
//       });
//     });
//   }

//   cargarAliados(): void {
//     this.aliadoService.obtenerAliados().subscribe({
//       next: (aliados) => {
//         this.aliados = aliados;
//       },
//       error: (error) => {
//         console.error('Error al cargar aliados:', error);
//       }
//     });
//   }

//   // ============================================
//   // FUNCIONES DE FILTROS
//   // ============================================

//   buscar(): void {
//     this.creditosFiltrados = this.creditos.filter(credito => {
//       const coincideAliado = this.filtroAliado ?
//         credito.aliado_id === parseInt(this.filtroAliado) : true;

//       const coincideCliente = this.filtroCliente ?
//         this.getNombreCliente(credito).toLowerCase().includes(this.filtroCliente.toLowerCase()) : true;

//       return coincideAliado && coincideCliente;
//     });
//   }

//   limpiarFiltros(): void {
//     this.filtroAliado = '';
//     this.filtroCliente = '';
//     this.creditosFiltrados = [...this.creditos];
//   }

//   // ============================================
//   // MÉTODOS DE ALERTAS
//   // ============================================

//   mostrarExito(mensaje: string): Promise<any> {
//     return Swal.fire({
//       icon: 'success',
//       title: 'Éxito',
//       text: mensaje,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#28a745',
//       timer: 3000,
//       timerProgressBar: true
//     });
//   }

//   mostrarError(mensaje: string): Promise<any> {
//     return Swal.fire({
//       icon: 'error',
//       title: 'Error',
//       text: mensaje,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#dc3545'
//     });
//   }

//   mostrarAdvertencia(mensaje: string): Promise<any> {
//     return Swal.fire({
//       icon: 'warning',
//       title: 'Advertencia',
//       text: mensaje,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#ffc107'
//     });
//   }

//   mostrarConfirmacion(mensaje: string): Promise<any> {
//     return Swal.fire({
//       icon: 'question',
//       title: 'Confirmación',
//       text: mensaje,
//       showCancelButton: true,
//       confirmButtonText: 'Sí',
//       cancelButtonText: 'No',
//       confirmButtonColor: '#28a745',
//       cancelButtonColor: '#dc3545'
//     });
//   }

//   // ============================================
//   // FUNCIONES DE UTILIDAD
//   // ============================================

//   formatearMoneda(monto: number): string {
//     if (!monto && monto !== 0) return '$0.00';
//     return new Intl.NumberFormat('es-MX', {
//       style: 'currency',
//       currency: 'MXN'
//     }).format(monto);
//   }

//   formatearFecha(fecha: string): string {
//     if (!fecha) return 'No especificada';
//     return new Date(fecha).toLocaleDateString('es-MX');
//   }

//   get hayCreditos(): boolean {
//     return this.creditos.length > 0;
//   }

//   getTotalSemanasVencidas(): number {
//     return this.semanasVencidas.length;
//   }

//   getTotalMoraPendiente(): string {
//     return this.formatearMoneda(this.totalMoraPendiente);
//   }

//   getTotalCapitalPendiente(): string {
//     return this.formatearMoneda(this.totalCapitalPendiente);
//   }

//   getMoraPendiente(credito: any): string {
//     if (!credito) return this.formatearMoneda(0);
//     return this.formatearMoneda(this.calcularMoraPendiente(credito));
//   }

//   getCarteraPendiente(credito: any): string {
//     if (!credito) return this.formatearMoneda(0);
//     return this.formatearMoneda(this.calcularCarteraPendiente(credito));
//   }

//   getTotalAtrasado(credito: any): string {
//     if (!credito) return this.formatearMoneda(0);
//     return this.formatearMoneda(this.calcularTotalAtrasado(credito));
//   }

//   getEstadoTexto(credito: any): string {
//     if (!credito) return 'N/A';
//     return this.getEstadoPago(credito).texto;
//   }

//   getEstadoClase(credito: any): string {
//     if (!credito) return '';
//     return this.getEstadoPago(credito).clase;
//   }
// }

// -----------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------



// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Subscription, timer } from 'rxjs';
// import Swal from 'sweetalert2';
// import { CreditoService } from '../../../../services/credito.service';
// import { PagoService } from '../../../../services/pago.service';
// import { AliadoService } from '../../../../services/aliado.service';
// import { ClienteService } from '../../../../services/client.service';
// import { AuthService } from '../../../../services/auth.service';

// @Component({
//   selector: 'app-financial-history',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './financial-history.component.html',
//   styleUrls: ['./financial-history.component.css']
// })
// export class FinancialHistoryComponent implements OnInit, OnDestroy {
//   creditos: any[] = [];
//   creditosFiltrados: any[] = [];
//   pagosPorCredito: { [creditoId: number]: any[] } = {};
//   clientes: any[] = [];
  
//   // Filtros
//   filtroAliado: string = '';
//   filtroCliente: string = '';
//   cargando: boolean = false;
  
//   // Modales
//   modalSeleccionAbierto: boolean = false;
//   modalPagoAbierto: boolean = false;
  
//   // Fila expandible
//   filaExpandida: number | null = null;
  
//   creditoSeleccionado: any = null;
//   procesandoPago: boolean = false;
  
//   // Datos del pago
//   montoPago: number = 0;
//   metodoPago: string = '';
//   tipoPago: string = 'PAGO NORMAL';
//   moratorios: number = 0;
  
//   // Aliados
//   aliados: any[] = [];
//   metodosPago: string[] = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE'];
  
//   // Variables para cálculos
//   diasAtraso: number = 0;
//   semanasAtraso: number = 0;
//   moraAcumulada: number = 0;
//   carteraAtrasada: number = 0;
//   totalAtrasado: number = 0;
//   ultimoPagoCompleto: number = 0; // Número de la última semana pagada completamente
  
//   // USUARIO
//   usuarioActual: any = null;
//   registradoPor: number = 0;
  
//   private usuarioSubscription: Subscription = new Subscription();
//   private timerSubscription: Subscription = new Subscription();
//   private usuarioCargado: boolean = false;

//   constructor(
//     private creditoService: CreditoService,
//     private pagoService: PagoService,
//     private aliadoService: AliadoService,
//     private clienteService: ClienteService,
//     private authService: AuthService
//   ) { }

//   ngOnInit(): void {
//     this.cargarUsuarioLogueado();
//     this.cargarDatosIniciales();
//   }

//   ngOnDestroy(): void {
//     this.usuarioSubscription.unsubscribe();
//     this.timerSubscription.unsubscribe();
//   }

//   // ============================================
//   // MÉTODOS PARA CALCULAR MORA Y ATRASOS - CORREGIDOS
//   // ============================================

//   // CORREGIDO: Calcular la mora acumulada (pagos incompletos o no pagados)
//   calcularMoraAcumulada(credito: any): number {
//     if (!credito) return 0;
    
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
//     const pagoSemanal = this.calcularPagoSemanal(credito);
    
//     // 1. Ordenar pagos por fecha
//     const pagosOrdenados = [...pagos].sort((a, b) => 
//       new Date(a.fecha_operacion).getTime() - new Date(b.fecha_operacion).getTime()
//     );
    
//     // 2. Calcular semanas desde el primer pago hasta hoy
//     const fechaPrimerPago = new Date(credito.fecha_primer_pago);
//     const hoy = new Date();
//     const diffDias = Math.floor((hoy.getTime() - fechaPrimerPago.getTime()) / (1000 * 3600 * 24));
//     const totalSemanas = Math.min(Math.ceil(diffDias / 7), 16);
    
//     // 3. Inicializar array de semanas
//     const semanas = new Array(totalSemanas).fill(0).map((_, i) => ({
//       numero: i + 1,
//       fecha: new Date(fechaPrimerPago.getTime() + (i * 7 * 24 * 60 * 60 * 1000)),
//       montoEsperado: pagoSemanal,
//       montoPagado: 0,
//       completada: false
//     }));
    
//     // 4. Distribuir pagos a las semanas en orden
//     let pagoIndex = 0;
//     for (const pago of pagosOrdenados) {
//       const pagoPrincipal = Number(pago.pago_registrado) || 0;
//       let montoRestante = pagoPrincipal;
      
//       // Aplicar a semanas en orden (más antiguas primero)
//       for (let i = pagoIndex; i < semanas.length && montoRestante > 0; i++) {
//         const faltante = semanas[i].montoEsperado - semanas[i].montoPagado;
//         const aplicar = Math.min(montoRestante, faltante);
        
//         semanas[i].montoPagado += aplicar;
//         montoRestante -= aplicar;
        
//         // Marcar como completada si pagó completo
//         if (semanas[i].montoPagado >= semanas[i].montoEsperado) {
//           semanas[i].completada = true;
//           pagoIndex = i + 1; // Siguiente semana
//         }
//       }
//     }
    
//     // 5. Calcular mora acumulada (semanas no completadas)
//     let mora = 0;
//     let ultimaCompleta = -1;
    
//     for (let i = 0; i < semanas.length; i++) {
//       if (semanas[i].completada) {
//         ultimaCompleta = i;
//       } else {
//         // Solo acumular mora de semanas que ya deberían haberse pagado
//         if (semanas[i].fecha < hoy) {
//           mora += semanas[i].montoEsperado - semanas[i].montoPagado;
//         }
//       }
//     }
    
//     // Guardar la última semana pagada completamente
//     this.ultimoPagoCompleto = ultimaCompleta + 1;
    
//     return mora;
//   }

//   // CORREGIDO: Calcular días de atraso basado en la última semana pagada completamente
//   calcularDiasAtraso(credito: any): number {
//     if (!credito || !credito.fecha_primer_pago) return 0;
    
//     const fechaPrimerPago = new Date(credito.fecha_primer_pago);
//     const hoy = new Date();
    
//     // Calcular la última semana que debería estar pagada completamente
//     const totalSemanas = this.calcularTotalSemanasTranscurridas(credito);
//     const ultimaSemanaDebida = Math.min(totalSemanas, 16);
    
//     // Obtener la última semana pagada completamente
//     const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);
    
//     // Si está al día, no hay atraso
//     if (ultimaSemanaPagada >= ultimaSemanaDebida) return 0;
    
//     // Calcular fecha de vencimiento de la última semana debida
//     const fechaVencimiento = new Date(fechaPrimerPago);
//     fechaVencimiento.setDate(fechaPrimerPago.getDate() + ((ultimaSemanaDebida - 1) * 7));
    
//     // Ajustar si cae en fin de semana
//     const diaSemana = fechaVencimiento.getDay();
//     if (diaSemana === 0) fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
//     if (diaSemana === 6) fechaVencimiento.setDate(fechaVencimiento.getDate() + 2);
    
//     // Calcular días de diferencia
//     const diffTiempo = hoy.getTime() - fechaVencimiento.getTime();
//     const diffDias = Math.floor(diffTiempo / (1000 * 3600 * 24));
    
//     return Math.max(0, diffDias);
//   }

//   // NUEVO: Calcular última semana pagada completamente
//   calcularUltimaSemanaPagadaCompletamente(credito: any): number {
//     if (!credito) return 0;
    
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
//     const pagoSemanal = this.calcularPagoSemanal(credito);
    
//     // Ordenar pagos por fecha
//     const pagosOrdenados = [...pagos].sort((a, b) => 
//       new Date(a.fecha_operacion).getTime() - new Date(b.fecha_operacion).getTime()
//     );
    
//     let semanasPagadas = 0;
//     let acumulado = 0;
    
//     for (const pago of pagosOrdenados) {
//       const pagoPrincipal = Number(pago.pago_registrado) || 0;
//       acumulado += pagoPrincipal;
      
//       // Cada vez que acumula un pago semanal completo, cuenta una semana
//       while (acumulado >= pagoSemanal) {
//         semanasPagadas++;
//         acumulado -= pagoSemanal;
//       }
//     }
    
//     return semanasPagadas;
//   }

//   // NUEVO: Calcular total de semanas transcurridas
//   calcularTotalSemanasTranscurridas(credito: any): number {
//     if (!credito || !credito.fecha_primer_pago) return 0;
    
//     const fechaPrimerPago = new Date(credito.fecha_primer_pago);
//     const hoy = new Date();
//     const diffDias = Math.floor((hoy.getTime() - fechaPrimerPago.getTime()) / (1000 * 3600 * 24));
    
//     return Math.min(Math.ceil(diffDias / 7), 16);
//   }

//   // CORREGIDO: Calcular semanas atrasadas
//   calcularSemanasAtraso(credito: any): number {
//     const totalSemanas = this.calcularTotalSemanasTranscurridas(credito);
//     const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);
    
//     return Math.max(0, totalSemanas - ultimaSemanaPagada);
//   }

//   // CORREGIDO: Calcular cartera atrasada (semanas no pagadas completamente)
//   calcularCarteraAtrasada(credito: any): number {
//     const semanasAtraso = this.calcularSemanasAtraso(credito);
//     const pagoSemanal = this.calcularPagoSemanal(credito);
    
//     return semanasAtraso * pagoSemanal;
//   }

//   // CORREGIDO: Calcular mora pendiente (mora acumulada menos mora pagada)
//   calcularMoraPendiente(credito: any): number {
//     const moraAcumulada = this.calcularMoraAcumulada(credito);
//     const moraPagada = this.calcularMoratorioTotal(credito);
    
//     return Math.max(0, moraAcumulada - moraPagada);
//   }

//   // CORREGIDO: Calcular total atrasado
//   calcularTotalAtrasado(credito: any): number {
//     const carteraAtrasada = this.calcularCarteraAtrasada(credito);
//     const moraPendiente = this.calcularMoraPendiente(credito);
    
//     return carteraAtrasada + moraPendiente;
//   }

//   // CORREGIDO: Obtener estado del pago
//   getEstadoPago(credito: any): { texto: string, clase: string, filaClase: string } {
//     const diasAtraso = this.calcularDiasAtraso(credito);
//     const moraPendiente = this.calcularMoraPendiente(credito);
//     const semanasAtraso = this.calcularSemanasAtraso(credito);
    
//     if (diasAtraso === 0) {
//       return { 
//         texto: 'AL DÍA', 
//         clase: 'text-success font-weight-bold',
//         filaClase: 'fila-al-dia'
//       };
//     } else if (semanasAtraso > 0 && moraPendiente > 0) {
//       return { 
//         texto: `${semanasAtraso} SEMANA(S) ATRASADA(S)`, 
//         clase: 'text-danger font-weight-bold',
//         filaClase: 'fila-con-mora'
//       };
//     } else if (semanasAtraso > 0) {
//       return { 
//         texto: `${semanasAtraso} SEMANA(S) ATRASADA(S)`, 
//         clase: 'text-warning font-weight-bold',
//         filaClase: 'fila-atrasada'
//       };
//     } else {
//       return { 
//         texto: `${diasAtraso} DÍAS ATRASO`, 
//         clase: 'text-orange font-weight-bold',
//         filaClase: 'fila-atraso-leve'
//       };
//     }
//   }

//   // ============================================
//   // MÉTODOS PARA MODALES
//   // ============================================

//   abrirModalSeleccion(credito: any): void {
//     if (!this.registradoPor || this.registradoPor <= 0) {
//       this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
//       return;
//     }

//     this.creditoSeleccionado = credito;
//     this.modalSeleccionAbierto = true;
    
//     // Calcular valores actualizados
//     this.diasAtraso = this.calcularDiasAtraso(credito);
//     this.semanasAtraso = this.calcularSemanasAtraso(credito);
//     this.moraAcumulada = this.calcularMoraAcumulada(credito);
//     this.carteraAtrasada = this.calcularCarteraAtrasada(credito);
//     this.totalAtrasado = this.calcularTotalAtrasado(credito);
    
//     // Sugerir montos
//     this.montoPago = credito.pago_semanal || 0;
//     this.moratorios = this.calcularMoraPendiente(credito);
//   }

//   abrirModalPago(tipo: string): void {
//     this.modalSeleccionAbierto = false;
//     this.modalPagoAbierto = true;
//     this.tipoPago = tipo;
    
//     // Recalcular valores
//     this.diasAtraso = this.calcularDiasAtraso(this.creditoSeleccionado);
//     this.semanasAtraso = this.calcularSemanasAtraso(this.creditoSeleccionado);
//     this.moraAcumulada = this.calcularMoraAcumulada(this.creditoSeleccionado);
//     this.carteraAtrasada = this.calcularCarteraAtrasada(this.creditoSeleccionado);
    
//     // Configurar valores según tipo de pago
//     switch(tipo) {
//       case 'NORMAL':
//         // Pago normal: sugerir el pago semanal
//         this.montoPago = this.creditoSeleccionado.pago_semanal || 0;
//         // Sugerir pagar la mora pendiente
//         this.moratorios = this.calcularMoraPendiente(this.creditoSeleccionado);
//         break;
//       case 'COMPLEMENTO':
//         // Complemento: sugerir la cartera atrasada
//         this.montoPago = this.carteraAtrasada;
//         // Sugerir pagar toda la mora pendiente
//         this.moratorios = this.calcularMoraPendiente(this.creditoSeleccionado);
//         break;
//       case 'ADICIONAL':
//         // Adicional: sugerir un pago extra
//         this.montoPago = this.creditoSeleccionado.pago_semanal || 0;
//         this.moratorios = 0;
//         break;
//     }
    
//     this.metodoPago = '';
//   }

//   cerrarModalSeleccion(): void {
//     this.modalSeleccionAbierto = false;
//     this.creditoSeleccionado = null;
//   }

//   cerrarModalPago(): void {
//     this.modalPagoAbierto = false;
//     this.montoPago = 0;
//     this.metodoPago = '';
//     this.moratorios = 0;
//     this.tipoPago = 'PAGO NORMAL';
//   }

//   // ============================================
//   // REGISTRAR PAGO
//   // ============================================

//   async registrarPago(): Promise<void> {
//     if (!this.registradoPor || this.registradoPor <= 0) {
//       this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
//       return;
//     }

//     if (!await this.validarPago()) {
//       return;
//     }

//     this.procesandoPago = true;

//     const pagoData = {
//       credito_id: this.creditoSeleccionado.id_credito,
//       moratorios: this.moratorios,
//       pago_registrado: Number(this.montoPago),
//       tipo_pago: `${this.tipoPago} - ${this.metodoPago}`.toUpperCase(),
//       registrado_por: this.registradoPor
//     };

//     console.log('Enviando pago:', pagoData);

//     this.pagoService.registrarPago(pagoData).subscribe({
//       next: (response) => {
//         this.mostrarExito(`${this.tipoPago} registrado exitosamente`);
//         this.procesandoPago = false;
//         this.cerrarModalPago();
        
//         setTimeout(() => {
//           this.cargarCreditos();
//         }, 1000);
//       },
//       error: (error) => {
//         console.error('Error al registrar pago:', error);
//         this.mostrarError('Error al registrar el pago: ' + (error.error?.error || error.message));
//         this.procesandoPago = false;
//       }
//     });
//   }

//   // ============================================
//   // VALIDACIONES
//   // ============================================

//   async validarPago(): Promise<boolean> {
//     if (!this.montoPago || this.montoPago <= 0) {
//       await this.mostrarAdvertencia('El monto del pago debe ser mayor a 0');
//       return false;
//     }

//     if (!this.metodoPago || this.metodoPago.trim() === '') {
//       await this.mostrarAdvertencia('Debe seleccionar un método de pago');
//       return false;
//     }

//     const saldoPendiente = this.creditoSeleccionado.saldo_pendiente || 0;
//     const totalAPagar = Number(this.montoPago) + Number(this.moratorios);

//     if (totalAPagar > saldoPendiente + 1000) {
//       const resultado = await this.mostrarConfirmacion(
//         `El monto total a pagar (${this.formatearMoneda(totalAPagar)}) ` +
//         `excede el saldo pendiente (${this.formatearMoneda(saldoPendiente)}). ` +
//         `¿Desea continuar de todas formas?`
//       );

//       if (!resultado.isConfirmed) {
//         return false;
//       }
//     }

//     return true;
//   }

//   // ============================================
//   // MÉTODOS DE CÁLCULO BÁSICOS
//   // ============================================

//   getNombreCliente(credito: any): string {
//     if (!credito) return 'N/A';

//     if (credito.nombre_cliente) {
//       return `${credito.nombre_cliente} ${credito.app_cliente || ''} ${credito.apm_cliente || ''}`.trim();
//     }

//     if (credito.cliente_id && this.clientes.length > 0) {
//       const cliente = this.clientes.find(c => c.id_cliente === credito.cliente_id);
//       if (cliente) {
//         const nombre = cliente.nombre_cliente || cliente.nombre || '';
//         const app = cliente.app_cliente || cliente.apellido_paterno || '';
//         const apm = cliente.apm_cliente || cliente.apellido_materno || '';
//         return `${nombre} ${app} ${apm}`.trim();
//       }
//     }

//     return 'Cliente no encontrado';
//   }

//   getNombreAliado(aliadoId: number): string {
//     if (!aliadoId) return 'N/A';
//     const aliado = this.aliados.find(a => a.id_aliado === aliadoId);
//     return aliado ? aliado.nom_aliado.trim() : 'N/A';
//   }

//   getDiaPago(credito: any): string {
//     if (!credito || !credito.fecha_primer_pago) return 'N/A';
//     const fecha = new Date(credito.fecha_primer_pago);
//     const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
//     return dias[fecha.getDay()];
//   }

//   calcularPagoSemanal(credito: any): number {
//     if (!credito) return 0;
//     return Number(credito.pago_semanal) || 0;
//   }

//   // CORREGIDO: Calcular próximo número de pago
//   calcularProximoNumeroPago(credito: any): number {
//     const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);
//     return Math.min(ultimaSemanaPagada + 1, 16);
//   }

//   calcularMoratorioTotal(credito: any): number {
//     if (!credito) return 0;
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
//     return pagos.reduce((sum, pago) => sum + (Number(pago.moratorios) || 0), 0);
//   }

//   calcularTotalPagado(credito: any): number {
//     if (!credito) return 0;
//     const pagos = this.pagosPorCredito[credito.id_credito] || [];
//     return pagos.reduce((sum, pago) => {
//       const pagoRegistrado = Number(pago.pago_registrado) || 0;
//       const moratorios = Number(pago.moratorios) || 0;
//       return sum + pagoRegistrado + moratorios;
//     }, 0);
//   }

//   // CORREGIDO: Calcular pagos realizados (semanas pagadas completamente)
//   calcularPagosRealizados(credito: any): number {
//     return this.calcularUltimaSemanaPagadaCompletamente(credito);
//   }

//   calcularPagosPendientes(credito: any): number {
//     const pagosRealizados = this.calcularPagosRealizados(credito);
//     return Math.max(0, 16 - pagosRealizados);
//   }

//   // ============================================
//   // MÉTODOS PARA TABLA EXPANDIBLE
//   // ============================================

//   toggleFilaDetalle(creditoId: number): void {
//     if (this.filaExpandida === creditoId) {
//       this.filaExpandida = null;
//     } else {
//       this.filaExpandida = creditoId;
//     }
//   }

//   getDetallesPagos(creditoId: number): any[] {
//     const pagos = this.pagosPorCredito[creditoId] || [];
//     return pagos.map((pago, index) => ({
//       numeroPago: index + 1,
//       fecha: pago.fecha_operacion || pago.fecha_pago,
//       montoTotal: (Number(pago.pago_registrado) || 0) + (Number(pago.moratorios) || 0),
//       capital: pago.capital_pagado || 0,
//       intereses: pago.interes_pagado || 0,
//       mora: pago.moratorios || 0,
//       tipoPago: pago.tipo_pago || 'NORMAL'
//     }));
//   }

//   // ============================================
//   // MÉTODOS DE CARGA DE DATOS
//   // ============================================

//   cargarUsuarioLogueado(): void {
//     this.usuarioActual = this.authService.getUserDataSync();

//     if (this.usuarioActual) {
//       this.registradoPor = this.usuarioActual.id_usuario;
//       this.usuarioCargado = true;
//     } else {
//       this.timerSubscription = timer(3000).subscribe(() => {
//         if (!this.usuarioCargado) {
//           this.usuarioSubscription = this.authService.getUserDataObservable().subscribe({
//             next: (user) => {
//               this.usuarioActual = user;
//               if (user) {
//                 this.registradoPor = user.id_usuario;
//                 this.usuarioCargado = true;
//               }
//             },
//             error: (error) => {
//               console.error('Error al obtener usuario:', error);
//             }
//           });
//         }
//       });
//     }

//     this.verificarUsuarioEnLocalStorage();
//   }

//   verificarUsuarioEnLocalStorage(): void {
//     try {
//       const usuarioStr = localStorage.getItem('user');
//       if (usuarioStr) {
//         const usuario = JSON.parse(usuarioStr);
//         if (usuario && usuario.id_usuario && !this.registradoPor) {
//           this.registradoPor = usuario.id_usuario;
//           this.usuarioActual = usuario;
//           this.usuarioCargado = true;
//         }
//       }
//     } catch (error) {
//       console.error('Error al leer localStorage:', error);
//     }
//   }

//   cargarDatosIniciales(): void {
//     this.cargarAliados();
//     this.cargarClientes();
//     this.cargarCreditos();
//   }

//   cargarClientes(): void {
//     this.clienteService.obtenerClientes().subscribe({
//       next: (clientes) => {
//         this.clientes = clientes;
//       },
//       error: (error) => {
//         console.error('Error al cargar clientes:', error);
//       }
//     });
//   }

//   cargarCreditos(): void {
//     this.cargando = true;
//     this.creditoService.obtenerCreditos().subscribe({
//       next: (creditos) => {
//         this.creditos = creditos.filter(c => c.estado_credito === 'ENTREGADO');
//         this.creditosFiltrados = [...this.creditos];

//         if (this.creditos.length > 0) {
//           this.cargarPagosParaCreditos();
//         } else {
//           this.cargando = false;
//         }
//       },
//       error: (error) => {
//         console.error('Error al cargar créditos:', error);
//         this.cargando = false;
//         this.mostrarError('Error al cargar los créditos');
//       }
//     });
//   }

//   cargarPagosParaCreditos(): void {
//     let creditosPendientes = this.creditos.length;

//     this.creditos.forEach(credito => {
//       this.pagoService.obtenerPagosPorCredito(credito.id_credito).subscribe({
//         next: (pagos) => {
//           this.pagosPorCredito[credito.id_credito] = pagos || [];
//           creditosPendientes--;

//           if (creditosPendientes === 0) {
//             this.cargando = false;
//           }
//         },
//         error: (error) => {
//           console.error(`Error al cargar pagos para crédito ${credito.id_credito}:`, error);
//           this.pagosPorCredito[credito.id_credito] = [];
//           creditosPendientes--;

//           if (creditosPendientes === 0) {
//             this.cargando = false;
//           }
//         }
//       });
//     });
//   }

//   cargarAliados(): void {
//     this.aliadoService.obtenerAliados().subscribe({
//       next: (aliados) => {
//         this.aliados = aliados;
//       },
//       error: (error) => {
//         console.error('Error al cargar aliados:', error);
//       }
//     });
//   }

//   // ============================================
//   // FILTROS
//   // ============================================

//   buscar(): void {
//     this.creditosFiltrados = this.creditos.filter(credito => {
//       const coincideAliado = this.filtroAliado ?
//         credito.aliado_id === parseInt(this.filtroAliado) : true;

//       const coincideCliente = this.filtroCliente ?
//         this.getNombreCliente(credito).toLowerCase().includes(this.filtroCliente.toLowerCase()) : true;

//       return coincideAliado && coincideCliente;
//     });
//   }

//   limpiarFiltros(): void {
//     this.filtroAliado = '';
//     this.filtroCliente = '';
//     this.creditosFiltrados = [...this.creditos];
//   }

//   // ============================================
//   // MÉTODOS DE ALERTAS
//   // ============================================

//   mostrarExito(mensaje: string): Promise<any> {
//     return Swal.fire({
//       icon: 'success',
//       title: 'Éxito',
//       text: mensaje,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#28a745',
//       timer: 3000,
//       timerProgressBar: true
//     });
//   }

//   mostrarError(mensaje: string): Promise<any> {
//     return Swal.fire({
//       icon: 'error',
//       title: 'Error',
//       text: mensaje,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#dc3545'
//     });
//   }

//   mostrarAdvertencia(mensaje: string): Promise<any> {
//     return Swal.fire({
//       icon: 'warning',
//       title: 'Advertencia',
//       text: mensaje,
//       confirmButtonText: 'Aceptar',
//       confirmButtonColor: '#ffc107'
//     });
//   }

//   mostrarConfirmacion(mensaje: string): Promise<any> {
//     return Swal.fire({
//       icon: 'question',
//       title: 'Confirmación',
//       text: mensaje,
//       showCancelButton: true,
//       confirmButtonText: 'Sí',
//       cancelButtonText: 'No',
//       confirmButtonColor: '#28a745',
//       cancelButtonColor: '#dc3545'
//     });
//   }

//   // ============================================
//   // UTILIDADES
//   // ============================================

//   formatearMoneda(monto: number): string {
//     if (!monto && monto !== 0) return '$0.00';
//     return new Intl.NumberFormat('es-MX', {
//       style: 'currency',
//       currency: 'MXN'
//     }).format(monto);
//   }

//   formatearFecha(fecha: string): string {
//     if (!fecha) return 'No especificada';
//     return new Date(fecha).toLocaleDateString('es-MX');
//   }

//   get hayCreditos(): boolean {
//     return this.creditos.length > 0;
//   }

//   getTotalPago(): number {
//     return (this.montoPago || 0) + (this.moratorios || 0);
//   }
// }




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
  tipoPago: string = 'PAGO NORMAL';
  moratorios: number = 0;
  numeroPagoSeleccionado: number = 1; // NUEVO: número de pago/semana seleccionado
  
  // Aliados
  aliados: any[] = [];
  metodosPago: string[] = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE'];
  
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
  // NUEVO: Métodos para gestión de semanas
  // ============================================

  // Obtener lista de semanas disponibles para pago
  obtenerSemanasDisponibles(): number[] {
    const semanas: number[] = [];
    for (let i = 1; i <= 16; i++) {
      semanas.push(i);
    }
    return semanas;
  }

  // Verificar si una semana está completamente pagada
  estaSemanaPagada(numeroSemana: number): boolean {
    if (!this.creditoSeleccionado) return false;
    
    const pagos = this.pagosPorCredito[this.creditoSeleccionado.id_credito] || [];
    const pagoSemanal = this.calcularPagoSemanal(this.creditoSeleccionado);
    
    // Calcular total pagado hasta esa semana
    let totalPagado = 0;
    for (const pago of pagos) {
      totalPagado += Number(pago.pago_registrado) || 0;
    }
    
    const semanasPagadas = Math.floor(totalPagado / pagoSemanal);
    return numeroSemana <= semanasPagadas;
  }

  // Obtener estado de una semana específica
  getEstadoSemana(numeroSemana: number): { texto: string, clase: string, disabled: boolean } {
    if (!this.creditoSeleccionado) {
      return { texto: '', clase: '', disabled: true };
    }

    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(this.creditoSeleccionado);
    
    if (numeroSemana < ultimaSemanaPagada) {
      return { 
        texto: '✓ PAGADA', 
        clase: 'text-success', 
        disabled: false // Permitir re-pago o ajustes
      };
    } else if (numeroSemana === ultimaSemanaPagada + 1) {
      return { 
        texto: '→ SIGUIENTE', 
        clase: 'text-primary font-weight-bold', 
        disabled: false 
      };
    } else if (numeroSemana <= ultimaSemanaPagada + this.semanasAtraso + 1) {
      return { 
        texto: '! ATRASADA', 
        clase: 'text-danger', 
        disabled: false 
      };
    } else {
      return { 
        texto: 'PENDIENTE', 
        clase: 'text-muted', 
        disabled: false 
      };
    }
  }

  // ============================================
  // MÉTODOS PARA CALCULAR FECHAS Y MORA - CORREGIDOS
  // ============================================

  calcularProximaFechaPago(credito: any): Date {
    if (!credito || !credito.fecha_primer_pago) {
      return new Date();
    }
    
    const fechaPrimerPago = new Date(credito.fecha_primer_pago);
    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);
    
    if (ultimaSemanaPagada >= 16) {
      return new Date();
    }
    
    let proximaFecha = new Date(fechaPrimerPago);
    proximaFecha.setDate(fechaPrimerPago.getDate() + (ultimaSemanaPagada * 7));
    
    const diaSemana = proximaFecha.getDay();
    if (diaSemana === 0) {
      proximaFecha.setDate(proximaFecha.getDate() + 1);
    } else if (diaSemana === 6) {
      proximaFecha.setDate(proximaFecha.getDate() + 2);
    }
    
    return proximaFecha;
  }

  calcularDiasAtraso(credito: any): number {
    if (!credito || !credito.fecha_primer_pago) return 0;
    
    const proximaFechaPago = this.calcularProximaFechaPago(credito);
    const hoy = new Date();
    
    if (hoy < proximaFechaPago) return 0;
    
    const diffTiempo = hoy.getTime() - proximaFechaPago.getTime();
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

  getEstadoPago(credito: any): { texto: string, clase: string, filaClase: string } {
    const diasAtraso = this.calcularDiasAtraso(credito);
    const moraPendiente = this.calcularMoraPendiente(credito);
    
    if (diasAtraso === 0) {
      return { 
        texto: 'AL DÍA', 
        clase: 'text-success font-weight-bold',
        filaClase: 'fila-al-dia'
      };
    } else if (diasAtraso > 0 && moraPendiente > 0) {
      return { 
        texto: `${diasAtraso} DÍAS ATRASO`, 
        clase: 'text-danger font-weight-bold',
        filaClase: 'fila-con-mora'
      };
    } else if (diasAtraso > 0) {
      return { 
        texto: `${diasAtraso} DÍAS ATRASO`, 
        clase: 'text-warning font-weight-bold',
        filaClase: 'fila-atrasada'
      };
    } else {
      return { 
        texto: 'AL DÍA', 
        clase: 'text-success font-weight-bold',
        filaClase: 'fila-al-dia'
      };
    }
  }

  // ============================================
  // MÉTODOS PARA MODALES
  // ============================================

  abrirModalSeleccion(credito: any): void {
    if (!this.registradoPor || this.registradoPor <= 0) {
      this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
      return;
    }

    this.creditoSeleccionado = credito;
    this.modalSeleccionAbierto = true;
    
    this.proximaFechaPago = this.calcularProximaFechaPago(credito);
    this.diasAtraso = this.calcularDiasAtraso(credito);
    this.semanasAtraso = this.calcularSemanasAtraso(credito);
    this.moraAcumulada = this.calcularMoraAcumulada(credito);
    this.carteraAtrasada = this.calcularCarteraAtrasada(credito);
    this.totalAtrasado = this.calcularTotalAtrasado(credito);
    this.ultimoPagoCompleto = this.calcularUltimaSemanaPagadaCompletamente(credito);
    
    this.montoPago = credito.pago_semanal || 0;
    this.moratorios = this.calcularMoraPendiente(credito);
    
    // NUEVO: Establecer el número de pago por defecto (siguiente semana a pagar)
    this.numeroPagoSeleccionado = this.calcularProximoNumeroPago(credito);
  }

  abrirModalPago(tipo: string): void {
    this.modalSeleccionAbierto = false;
    this.modalPagoAbierto = true;
    this.tipoPago = tipo;
    
    this.diasAtraso = this.calcularDiasAtraso(this.creditoSeleccionado);
    this.semanasAtraso = this.calcularSemanasAtraso(this.creditoSeleccionado);
    this.moraAcumulada = this.calcularMoraAcumulada(this.creditoSeleccionado);
    this.carteraAtrasada = this.calcularCarteraAtrasada(this.creditoSeleccionado);
    
    // NUEVO: Establecer el número de pago según el tipo
    switch(tipo) {
      case 'NORMAL':
        this.montoPago = this.creditoSeleccionado.pago_semanal || 0;
        this.moratorios = this.calcularMoraPendiente(this.creditoSeleccionado);
        this.numeroPagoSeleccionado = this.calcularProximoNumeroPago(this.creditoSeleccionado);
        break;
      case 'COMPLEMENTO':
        this.montoPago = this.carteraAtrasada;
        this.moratorios = this.calcularMoraPendiente(this.creditoSeleccionado);
        // Para complemento, usar la primera semana atrasada
        const ultimaSemana = this.calcularUltimaSemanaPagadaCompletamente(this.creditoSeleccionado);
        this.numeroPagoSeleccionado = ultimaSemana + 1;
        break;
      case 'ADICIONAL':
        this.montoPago = this.creditoSeleccionado.pago_semanal || 0;
        this.moratorios = 0;
        this.numeroPagoSeleccionado = this.calcularProximoNumeroPago(this.creditoSeleccionado);
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
    this.tipoPago = 'PAGO NORMAL';
    this.numeroPagoSeleccionado = 1;
  }

  // ============================================
  // REGISTRAR PAGO - ACTUALIZADO
  // ============================================

  async registrarPago(): Promise<void> {
    if (!this.registradoPor || this.registradoPor <= 0) {
      this.mostrarError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
      return;
    }

    if (!await this.validarPago()) {
      return;
    }

    this.procesandoPago = true;

    // ACTUALIZADO: Incluir numero_pago en el payload
    const pagoData = {
      credito_id: this.creditoSeleccionado.id_credito,
      numero_pago: this.numeroPagoSeleccionado, // NUEVO: enviar número de pago
      moratorios: this.moratorios,
      pago_registrado: Number(this.montoPago),
      tipo_pago: `${this.tipoPago} - ${this.metodoPago}`.toUpperCase(),
      registrado_por: this.registradoPor
    };

    console.log('Enviando pago:', pagoData);

    this.pagoService.registrarPago(pagoData).subscribe({
      next: (response) => {
        this.mostrarExito(`${this.tipoPago} registrado exitosamente para la semana ${this.numeroPagoSeleccionado}`);
        this.procesandoPago = false;
        this.cerrarModalPago();
        
        setTimeout(() => {
          this.cargarCreditos();
        }, 1000);
      },
      error: (error) => {
        console.error('Error al registrar pago:', error);
        this.mostrarError('Error al registrar el pago: ' + (error.error?.error || error.message));
        this.procesandoPago = false;
      }
    });
  }

  // ============================================
  // VALIDACIONES
  // ============================================

  async validarPago(): Promise<boolean> {
    if (!this.montoPago || this.montoPago <= 0) {
      await this.mostrarAdvertencia('El monto del pago debe ser mayor a 0');
      return false;
    }

    if (!this.metodoPago || this.metodoPago.trim() === '') {
      await this.mostrarAdvertencia('Debe seleccionar un método de pago');
      return false;
    }

    // NUEVO: Validar que se haya seleccionado un número de pago
    if (!this.numeroPagoSeleccionado || this.numeroPagoSeleccionado < 1 || this.numeroPagoSeleccionado > 16) {
      await this.mostrarAdvertencia('Debe seleccionar un número de pago válido (1-16)');
      return false;
    }

    const saldoPendiente = this.creditoSeleccionado.saldo_pendiente || 0;
    const totalAPagar = Number(this.montoPago) + Number(this.moratorios);

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
    const ultimaSemanaPagada = this.calcularUltimaSemanaPagadaCompletamente(credito);
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

  // ============================================
  // MÉTODOS PARA TABLA EXPANDIBLE
  // ============================================

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
    this.creditoService.obtenerCreditos().subscribe({
      next: (creditos) => {
        this.creditos = creditos.filter(c => c.estado_credito === 'ENTREGADO');
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
}





