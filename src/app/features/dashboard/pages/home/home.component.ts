
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { CreditoService } from '../../../../services/credito.service';
import { PagoService } from '../../../../services/pago.service';
import { AliadoService } from '../../../../services/aliado.service';
import { ClienteService } from '../../../../services/client.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
Math: any;
new: Date | null | undefined;
getPorcentajeCarteraVencida() {
throw new Error('Method not implemented.');
}
  @ViewChild('distribucionChart') distribucionChartRef!: ElementRef;
  @ViewChild('ingresosChart') ingresosChartRef!: ElementRef;
  
  // ============================================
  // DATOS PRINCIPALES DEL DASHBOARD
  // ============================================
  
  // Cartera
  carteraTotal: number = 0;
  carteraCorriente: number = 0; // Créditos actuales al día
  carteraVencida: number = 0;   // Créditos que pasaron su fecha de último pago
  carteraMora: number = 0;      // Créditos con pagos atrasados
  creditosDia: any[] = [];
  
  // Ingresos (PERÍODO ACTUAL)
  ingresosPeriodo: number = 0;
  ingresosCapitalPeriodo: number = 0;
  ingresosInteresesPeriodo: number = 0;
  ingresosMoratoriosPeriodo: number = 0;
  
  // Totales acumulados (TODOS LOS PAGOS)
  ingresosCapitalTotal: number = 0;
  ingresosInteresesTotal: number = 0;
  ingresosMoratoriosTotal: number = 0;
  ingresosTotalGeneral: number = 0;
  
  // Ministraciones (PERÍODO ACTUAL)
  ministracionesEntregados: number = 0;
  ministracionesDevolucion: number = 0;
  ministracionesTotal: number = 0;
  
  // Estadísticas
  totalCreditos: number = 0;
  creditosVigentes: number = 0;
  creditosVencidos: number = 0;
  creditosMora: number = 0;
  clientesVigentes: number = 0;
  clientesMora: number = 0;
  
  // Tendencias y porcentajes
  porcentajeCarteraVencida: number = 0;
  porcentajeCarteraMora: number = 0;
  tasaMorosidad: number = 0;
  
  // Mora por Aliado
  moraPorAliado: any[] = [];
  
  // Créditos por Aliado
  creditosPorAliado: any[] = [];
  
  // Listados
  proximosVencimientos: any[] = [];
  topAliados: any[] = [];
  alertasMora: any[] = [];
  
  // Configuración
  periodoDashboard: string = 'mes';
  cargandoDashboard: boolean = false;
  
  // Gráficos
  private distribucionChart: any;
  private ingresosChart: any;
  private num(valor: any): number {
    const n = Number(valor);
    return isNaN(n) ? 0 : n;
  }

  
  // Datos crudos
  creditos: any[] = [];
  pagos: any[] = [];
  aliados: any[] = [];
  clientes: any[] = [];

  constructor(
    private creditoService: CreditoService,
    private pagoService: PagoService,
    private aliadoService: AliadoService,
    private clienteService: ClienteService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  ngAfterViewInit(): void {
    
  }

  // ============================================
  // MÉTODOS DE CARGA DE DATOS
  // ============================================

  cargarDatosDashboard(): void {
    this.cargandoDashboard = true;
    
    forkJoin({
      creditos: this.creditoService.obtenerCreditos(),
      pagos: this.pagoService.obtenerPagos(),
      aliados: this.aliadoService.obtenerAliados(),
      clientes: this.clienteService.obtenerClientes()
    }).subscribe({
      next: ({ creditos, pagos, aliados, clientes }) => {
        this.creditos = creditos;
        this.pagos = pagos;
        this.aliados = aliados;
        this.clientes = clientes;
        
        this.calcularMetricasCompletas();
        this.cargandoDashboard = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del dashboard:', error);
        this.cargandoDashboard = false;
      }
    });
  }

  calcularMetricasCompletas(): void {
    // 1. Calcar cartera total (suma de total_a_pagar de todos los créditos)
    this.carteraTotal = this.creditos.reduce((total, credito) => {
      return total + (credito.total_a_pagar || 0);
    }, 0);

    // 2. Calcular estados de cartera
    this.calcularEstadosCartera();
    
    // 3. Calcular ingresos del período (SUMA DE TODOS LOS PAGOS, NO CRÉDITO POR CRÉDITO)
    this.calcularIngresosPeriodo();
    
    // 4. Calcular ingresos totales acumulados (SUMA DE TODOS LOS PAGOS HISTÓRICOS)
    this.calcularIngresosTotales();
    
    // 5. Calcular ministraciones (PERÍODO ACTUAL)
    this.calcularMinistraciones();
    
    // 6. Calcular mora por aliado
    this.calcularMoraPorAliado();
    
    // 7. Calcular créditos por aliado
    this.calcularCreditosPorAliado();
    
    // 8. Calcular porcentajes y tendencias
    this.calcularPorcentajes();
    
    // 9. Generar listados
    this.generarProximosVencimientos();
    this.generarTopAliados();
    this.generarAlertasMora();

    // 10. Calcular créditos del día - AGREGAR ESTA LÍNEA
    this.calcularCreditosDia();
    
    // 11. Inicializar gráficos
    this.inicializarGraficos();

  }

  // ============================================
  // MÉTODOS DE CÁLCULO DE ESTADOS DE CARTERA
  // ============================================

  calcularEstadosCartera(): void {
    const hoy = new Date();
    
    // Reiniciar contadores
    this.carteraCorriente = 0;
    this.carteraVencida = 0;
    this.carteraMora = 0;
    this.creditosVigentes = 0;
    this.creditosVencidos = 0;
    this.creditosMora = 0;
    this.clientesVigentes = 0;
    this.clientesMora = 0;
    
    const clientesSet = new Set();
    const clientesMoraSet = new Set();
    
    this.creditos.forEach(credito => {
      const saldoPendiente = this.calcularSaldoPendiente(credito);
      const estado = this.determinarEstadoCredito(credito, hoy);
      
      clientesSet.add(credito.cliente_id);
      
      switch(estado) {
        case 'vigente':
          this.carteraCorriente += saldoPendiente;
          this.creditosVigentes++;
          break;
          
        case 'vencido':
          this.carteraVencida += saldoPendiente;
          this.creditosVencidos++;
          break;
          
        case 'mora':
          this.carteraMora += saldoPendiente;
          this.creditosMora++;
          clientesMoraSet.add(credito.cliente_id);
          break;
          
        default:
          break;
      }
    });
    
    this.totalCreditos = this.creditos.length;
    this.clientesVigentes = clientesSet.size;
    this.clientesMora = clientesMoraSet.size;
  }

  determinarEstadoCredito(credito: any, fechaReferencia: Date): string {
    const saldoPendiente = this.calcularSaldoPendiente(credito);
    
    // Si ya está liquidado
    if (saldoPendiente <= 0) return 'liquidado';
    
    const proximoPago = this.calcularProximaFechaPago(credito);
    
    // Si no hay fecha de próximo pago
    if (!proximoPago) return 'vigente';
    
    const diasDiferencia = Math.floor(
      (fechaReferencia.getTime() - proximoPago.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diasDiferencia <= 0) return 'vigente';            // Al día
    if (diasDiferencia <= 7) return 'vencido';            // Hasta 7 días de retraso
    return 'mora';                                        // Más de 7 días
  }

  calcularCreditosDia(): void {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Establecer a inicio del día
  
  this.creditosDia = this.creditos.filter(credito => {
    if (!credito.fecha_creacion) return false;
    
    const fechaCredito = new Date(credito.fecha_creacion);
    fechaCredito.setHours(0, 0, 0, 0);
    
    // Comparar solo la fecha (sin hora)
    return fechaCredito.getTime() === hoy.getTime();
  });
}

  calcularSaldoPendiente(credito: any): number {
    const pagosCredito = this.pagos.filter(p => p.credito_id === credito.id_credito);
    const totalPagado = pagosCredito.reduce((sum, pago) => {
      return sum + (pago.capital || 0);
    }, 0);
    
    return (credito.monto_aprobado || 0) - totalPagado;
  }

  calcularProximaFechaPago(credito: any): Date | null {
    if (!credito.fecha_primer_pago) return null;
    
    const pagosCredito = this.pagos.filter(p => p.credito_id === credito.id_credito);
    const pagosRealizados = pagosCredito.length;
    
    const fechaBase = new Date(credito.fecha_primer_pago);
    fechaBase.setDate(fechaBase.getDate() + (pagosRealizados * 7));
    
    return fechaBase;
  }

  // ============================================
  // MÉTODOS DE CÁLCULO DE INGRESOS (PAGOS)
  // ============================================


    calcularIngresosPeriodo(): void {
      const fechaInicio = this.obtenerFechaInicioPeriodo();

      const pagosPeriodo = this.pagos.filter(pago => {
        if (!pago.fecha_operacion) return false;
        const fechaPago = new Date(pago.fecha_operacion);
        return fechaPago >= fechaInicio;
      });

      this.ingresosPeriodo = pagosPeriodo.reduce(
        (sum, pago) => sum + this.num(pago.pago_registrado),
        0
      );

      this.ingresosCapitalPeriodo = pagosPeriodo.reduce(
        (sum, pago) => sum + this.num(pago.capital),
        0
      );

      this.ingresosInteresesPeriodo = pagosPeriodo.reduce(
        (sum, pago) => sum + this.num(pago.intereses),
        0
      );

      this.ingresosMoratoriosPeriodo = pagosPeriodo.reduce(
        (sum, pago) => sum + this.num(pago.moratorios),
        0
      );
    }


  calcularIngresosTotales(): void {

  this.ingresosCapitalTotal = this.pagos.reduce(
    (sum, pago) => sum + this.num(pago.capital),
    0
  );

  this.ingresosInteresesTotal = this.pagos.reduce(
    (sum, pago) => sum + this.num(pago.intereses),
    0
  );

  this.ingresosMoratoriosTotal = this.pagos.reduce(
    (sum, pago) => sum + this.num(pago.moratorios),
    0
  );

  this.ingresosTotalGeneral = this.pagos.reduce(
    (sum, pago) => sum + this.num(pago.pago_registrado),
    0
  );
}


  // ============================================
  // MÉTODOS DE CÁLCULO DE MINISTRACIONES
  // ============================================


  calcularMinistraciones(): void {
  const fechaInicio = this.obtenerFechaInicioPeriodo();

  const creditosPeriodo = this.creditos.filter(credito => {
    if (!credito.fecha_creacion) return false;
    const fechaCredito = new Date(credito.fecha_creacion);
    return fechaCredito >= fechaInicio;
  });

  this.ministracionesEntregados = creditosPeriodo
    .filter(c => c.estado_credito === 'ENTREGADO')
    .reduce((sum, credito) => sum + this.num(credito.monto_aprobado), 0);

  this.ministracionesDevolucion = creditosPeriodo
    .filter(c => c.estado_credito === 'DEVOLUCION')
    .reduce((sum, credito) => sum + this.num(credito.monto_aprobado), 0);

  this.ministracionesTotal =
    this.ministracionesEntregados - this.ministracionesDevolucion;
}


  // ============================================
  // MÉTODOS DE CÁLCULO POR ALIADO
  // ============================================

  calcularMoraPorAliado(): void {
    const hoy = new Date();
    const moraMap = new Map<number, { nombre: string, mora: number }>();

    this.aliados.forEach(aliado => {
      moraMap.set(aliado.id_aliado, {
        nombre: aliado.nom_aliado || aliado.nombre || 'Sin nombre',
        mora: 0
      });
    });

    this.creditos.forEach(credito => {
      const estado = this.determinarEstadoCredito(credito, hoy);
      if (estado === 'mora') {
        const saldoMora = this.calcularSaldoPendiente(credito);
        const aliadoData = moraMap.get(credito.aliado_id);
        if (aliadoData) {
          aliadoData.mora += saldoMora;
        }
      }
    });

    this.moraPorAliado = Array.from(moraMap.values())
      .filter(item => item.mora > 0)
      .sort((a, b) => b.mora - a.mora);
  }

  calcularCreditosPorAliado(): void {
    const creditosMap = new Map<number, { 
      nombre: string, 
      creditos: number, 
      cartera: number,
      entregados: number 
    }>();

    this.aliados.forEach(aliado => {
      creditosMap.set(aliado.id_aliado, {
        nombre: aliado.nom_aliado || aliado.nombre || 'Sin nombre',
        creditos: 0,
        cartera: 0,
        entregados: 0
      });
    });

    this.creditos.forEach(credito => {
      const aliadoData = creditosMap.get(credito.aliado_id);
      if (aliadoData) {
        aliadoData.creditos++;
        aliadoData.cartera += this.calcularSaldoPendiente(credito);
        if (credito.estado_credito === 'ENTREGADO') {
          aliadoData.entregados += (credito.monto_aprobado || 0);
        }
      }
    });

    this.creditosPorAliado = Array.from(creditosMap.values())
      .sort((a, b) => b.cartera - a.cartera);
  }

  // ============================================
  // CÁLCULO DE PORCENTAJES Y TENDENCIAS
  // ============================================

  calcularPorcentajes(): void {
    // Porcentaje de cartera vencida
    this.porcentajeCarteraVencida = this.carteraTotal > 0 ? 
      Math.round((this.carteraVencida / this.carteraTotal) * 100) : 0;
    
    // Porcentaje de cartera en mora
    this.porcentajeCarteraMora = this.carteraTotal > 0 ? 
      Math.round((this.carteraMora / this.carteraTotal) * 100) : 0;
    
    // Tasa de morosidad (cartera en mora / cartera total)
    this.tasaMorosidad = this.carteraTotal > 0 ?
      Math.round((this.carteraMora / this.carteraTotal) * 10000) / 100 : 0;
  }

  // ============================================
  // MÉTODOS DE GENERACIÓN DE LISTADOS
  // ============================================

  generarProximosVencimientos(): void {
    const hoy = new Date();
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() + 30);

    this.proximosVencimientos = this.creditos
      .filter(credito => {
        const proximoPago = this.calcularProximaFechaPago(credito);
        if (!proximoPago) return false;
        
        const saldoPendiente = this.calcularSaldoPendiente(credito);
        // Solo mostrar créditos con saldo pendiente
        return saldoPendiente > 0 && 
               proximoPago >= hoy && 
               proximoPago <= fechaLimite;
      })
      .map(credito => {
        const proximoPago = this.calcularProximaFechaPago(credito)!;
        const dias = Math.ceil((proximoPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          cliente: this.getNombreCliente(credito),
          credito_id: credito.id_credito,
          monto: this.calcularPagoSemanal(credito),
          fecha: proximoPago,
          dias: dias,
          aliado: this.getNombreAliado(credito.aliado_id)
        };
      })
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 10);
  }

  generarTopAliados(): void {
    this.topAliados = this.creditosPorAliado
      .filter(aliado => aliado.cartera > 0)
      .slice(0, 5)
      .map((aliado, index) => ({
        ...aliado,
        ranking: index + 1,
        porcentaje: this.carteraTotal > 0 ? 
          Math.round((aliado.cartera / this.carteraTotal) * 100) : 0
      }));
  }

  generarAlertasMora(): void {
    const hoy = new Date();
    
    this.alertasMora = this.creditos
      .filter(credito => {
        const estado = this.determinarEstadoCredito(credito, hoy);
        const saldoPendiente = this.calcularSaldoPendiente(credito);
        return estado === 'mora' && saldoPendiente > 0;
      })
      .map(credito => {
        const proximoPago = this.calcularProximaFechaPago(credito);
        const diasMora = proximoPago ? 
          Math.floor((hoy.getTime() - proximoPago.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        return {
          cliente: this.getNombreCliente(credito),
          credito_id: credito.id_credito,
          dias_mora: diasMora,
          monto_vencido: this.calcularMontoVencido(credito, hoy),
          saldo_pendiente: this.calcularSaldoPendiente(credito),
          aliado: this.getNombreAliado(credito.aliado_id),
          ultimo_pago: this.obtenerFechaUltimoPago(credito.id_credito)
        };
      })
      .sort((a, b) => b.dias_mora - a.dias_mora)
      .slice(0, 15);
  }

  calcularMontoVencido(credito: any, fechaReferencia: Date): number {
    const proximoPago = this.calcularProximaFechaPago(credito);
    if (!proximoPago) return 0;

    const diasMora = Math.floor(
      (fechaReferencia.getTime() - proximoPago.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diasMora <= 0) return 0;
    
    const pagosVencidos = Math.ceil(diasMora / 7);
    return this.calcularPagoSemanal(credito) * pagosVencidos;
  }

  obtenerFechaUltimoPago(creditoId: number): Date | null {
    const pagosCredito = this.pagos
      .filter(p => p.credito_id === creditoId)
      .sort((a, b) => new Date(b.fecha_operacion).getTime() - new Date(a.fecha_operacion).getTime());
    
    return pagosCredito.length > 0 ? new Date(pagosCredito[0].fecha_operacion) : null;
  }

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================

  obtenerFechaInicioPeriodo(): Date {
    const hoy = new Date();
    const fechaInicio = new Date(hoy);

    switch (this.periodoDashboard) {
      case 'hoy':
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case 'mes':
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        break;
      case 'trimestre':
        fechaInicio.setMonth(fechaInicio.getMonth() - 3);
        break;
      case 'anual':
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
        break;
    }

    return fechaInicio;
  }

  getNombreCliente(credito: any): string {
    const cliente = this.clientes.find(c => c.id_cliente === credito.cliente_id);
    if (!cliente) return 'Cliente no encontrado';
    
    const nombre = cliente.nombre_cliente || cliente.nombre || '';
    const app = cliente.app_cliente || cliente.apellido_paterno || '';
    const apm = cliente.apm_cliente || cliente.apellido_materno || '';
    
    return `${nombre} ${app} ${apm}`.trim();
  }

  getNombreAliado(aliadoId: number): string {
    const aliado = this.aliados.find(a => a.id_aliado === aliadoId);
    if (!aliado) return 'Aliado no encontrado';
    
    return aliado.nom_aliado || aliado.nombre || 'Sin nombre';
  }

  calcularPagoSemanal(credito: any): number {
    if (credito.pago_semanal) return credito.pago_semanal;
    
    // Calcular pago semanal basado en el total a pagar y 16 pagos (4 meses)
    if (credito.total_a_pagar) {
      return credito.total_a_pagar / 16;
    }
    
    return 0;
  }

  formatearMoneda(monto: number): string {
    if (!monto && monto !== 0) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
  }

  formatearFecha(fecha: Date | null): string {
    if (!fecha) return 'Sin fecha';
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatearFechaCompleta(fecha: Date | null): string {
    if (!fecha) return 'Sin fecha';
    return fecha.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getPeriodoTexto(): string {
    const textos: any = {
      hoy: 'Hoy',
      semana: 'Última Semana',
      mes: 'Último Mes',
      trimestre: 'Último Trimestre',
      anual: 'Último Año'
    };
    return textos[this.periodoDashboard] || 'Período Actual';
  }

  getClaseMora(dias: number): string {
    if (dias <= 7) return 'warning';
    if (dias <= 30) return 'danger';
    return 'critical';
  }

  getTextoEstadoCredito(estado: string): string {
    const estados: any = {
      'vigente': 'Al corriente',
      'vencido': 'Vencido',
      'mora': 'En mora',
      'liquidado': 'Liquidado'
    };
    return estados[estado] || estado;
  }

  // ============================================
  // GRÁFICOS
  // ============================================

  inicializarGraficos(): void {
    this.inicializarGraficoDistribucion();
    this.inicializarGraficoIngresos();
  }

  inicializarGraficoDistribucion(): void {
    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }

    const ctx = this.distribucionChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.distribucionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Corriente', 'Vencida', 'En Mora'],
        datasets: [{
          data: [this.carteraCorriente, this.carteraVencida, this.carteraMora],
          backgroundColor: [
            'rgba(40, 167, 69, 0.8)',    // Verde - Corriente
            'rgba(255, 193, 7, 0.8)',    // Amarillo - Vencida
            'rgba(220, 53, 69, 0.8)'     // Rojo - En mora
          ],
          borderColor: [
            'rgba(40, 167, 69, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(220, 53, 69, 1)'
          ],
          borderWidth: 1,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 12
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${context.label}: ${this.formatearMoneda(value)} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  inicializarGraficoIngresos(): void {
    if (this.ingresosChart) {
      this.ingresosChart.destroy();
    }

    const ctx = this.ingresosChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.ingresosChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Capital', 'Intereses', 'Moratorios', 'Total'],
        datasets: [{
          label: 'Ingresos Totales',
          data: [
            this.ingresosCapitalTotal,
            this.ingresosInteresesTotal,
            this.ingresosMoratoriosTotal,
            this.ingresosTotalGeneral
          ],
          backgroundColor: [
            'rgba(97, 90, 254, 0.8)',    // Capital
            'rgba(40, 167, 69, 0.8)',    // Intereses
            'rgba(220, 53, 69, 0.8)',    // Moratorios
            'rgba(255, 193, 7, 0.8)'     // Total
          ],
          borderColor: [
            'rgba(97, 90, 254, 1)',
            'rgba(40, 167, 69, 1)',
            'rgba(220, 53, 69, 1)',
            'rgba(255, 193, 7, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${this.formatearMoneda(context.raw as number)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return '$' + Number(value).toLocaleString('es-MX', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                });
              }
            },
            title: {
              display: true,
              text: 'Monto (MXN)'
            }
          },
          x: {
            ticks: {
              maxRotation: 45
            }
          }
        }
      }
    });
  }

  // ============================================
  // ACTUALIZACIÓN Y ACCIONES
  // ============================================

  actualizarDashboard(): void {
    this.cargarDatosDashboard();
  }

  contactarCliente(alerta: any): void {
    // Implementar lógica de contacto
    console.log('Contactando cliente:', alerta.cliente);
    
    // En una implementación real, esto abriría un modal o redirigiría
    // a la sección de contacto con los datos del cliente
    const mensaje = `Contactar a: ${alerta.cliente}\n` +
                   `Crédito: ${alerta.credito_id}\n` +
                   `Días de mora: ${alerta.dias_mora}\n` +
                   `Monto vencido: ${this.formatearMoneda(alerta.monto_vencido)}`;
    
    alert(mensaje);
  }

  verDetalleCredito(creditoId: number): void {
    // Navegar al detalle del crédito
    console.log('Ver detalle del crédito:', creditoId);
    // this.router.navigate(['/creditos/detalle', creditoId]);
  }

  // ============================================
  // MÉTODOS PARA TEMPLATE
  // ============================================

  getPorcentajeCarteraCorriente(): number {
    return this.carteraTotal > 0 ? 
      Math.round((this.carteraCorriente / this.carteraTotal) * 100) : 0;
  }

  getTotalMinistraciones(): number {
    return this.ministracionesEntregados + this.ministracionesDevolucion;
  }

  getVariacionIngresos(): number {
    // En una implementación real, compararías con el período anterior
    // Por ahora, retornamos 0
    return 0;
  }

  getTendenciaMorosidad(): { clase: string, icono: string, texto: string } {
    // En una implementación real, compararías con el período anterior
    const variacion = 0; // Ejemplo: -5.5 para disminución, 5.5 para aumento
    
    if (variacion > 0) {
      return {
        clase: 'danger',
        icono: 'fas fa-arrow-up',
        texto: `+${Math.abs(variacion)}%`
      };
    } else if (variacion < 0) {
      return {
        clase: 'success',
        icono: 'fas fa-arrow-down',
        texto: `-${Math.abs(variacion)}%`
      };
    } else {
      return {
        clase: 'info',
        icono: 'fas fa-minus',
        texto: '0%'
      };
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES PARA EL TEMPLATE
  // ============================================

  get fechaActual(): Date {
    return new Date();
  }

  getFechaActual(): string {
    return this.formatearFechaCompleta(new Date());
  }

  getPorcentajeMora(aliadoMora: number): number {
    if (!this.carteraMora || this.carteraMora === 0) return 0;
    return Math.round((aliadoMora / this.carteraMora) * 100);
  }

  getPorcentajeCarteraAliado(aliadoCartera: number): number {
    if (!this.carteraTotal || this.carteraTotal === 0) return 0;
    return Math.round((aliadoCartera / this.carteraTotal) * 100);
  }

  // Método para formatear fecha cuando puede ser null/undefined
  formatearFechaSegura(fecha: Date | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    return this.formatearFecha(fecha);
  }

  get creditosEntregados() {
    // Verificar que creditosDia exista antes de usar filter
    if (!this.creditosDia) {
      return [];
    }
    
    // Filtrar créditos entregados - ajusta 'estado' según tu modelo de datos
    return this.creditosDia.filter((c: any) => {
      // Verifica cuál es la propiedad correcta para el estado
      return c.estado_credito === 'ENTREGADO' || 
            c.estado === 'ENTREGADO' || 
            c.estado_entrega === 'ENTREGADO';
    });
  }

}