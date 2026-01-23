import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService, DashboardData } from '../../../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { config } from 'rxjs';

Chart.register(...registerables);


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('distribucionChart') distribucionChartRef!: ElementRef;
  @ViewChild('ingresosChart') ingresosChartRef!: ElementRef;
  @ViewChild('moraAliadoChart') moraAliadoChartRef!: ElementRef;
  @ViewChild('evolucionChart') evolucionChartRef!: ElementRef;

  // Variables del dashboard
  periodoDashboard: string = 'sin-filtro';
  cargandoDashboard: boolean = false;
  fechaActual: Date = new Date();


  // Filtros de fecha
  fechaInicio: string = '';
  fechaFin: string = '';
  mostrarFiltrosPersonalizados: boolean = false;


  //Proximos vencimientos
  diasVencimiento: number = 3; // Por defecto 3 días
  vencimientosFiltrados: any[] = [];
  todosVencimientos: any[] = [];
  mostrarTodosVencimientos: boolean = false;



  // Datos del dashboard
  dashboardData!: DashboardData;

  // Gráficos
  distribucionChart!: Chart;
  ingresosChart!: Chart;
  moraAliadoChart!: Chart;
  evolucionChart!: Chart;
  tipoGraficoDistribucion: any = 'pie';
  periodoIngresos: string = '6M';
  periodoEvolucion: string = 'monthly';

  private refreshInterval: any;

  constructor(private dashboardService: DashboardService) {
    this.inicializarDatosVacios();
    this.inicializarFechasPorDefecto();
  }

  ngOnInit(): void {
    this.actualizarDashboard(true);

    // Configurar actualización automática cada 1 minuto
    this.refreshInterval = setInterval(() => {
      console.log('Actualizando dashboard automáticamente...');
      this.actualizarDashboard();
    }, 60000); // 60,000 ms = 1 minuto
  }


  ngOnDestroy(): void {
    // Limpiar el intervalo al destruir el componente
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  // Inicializar fechas por defecto
  private inicializarFechasPorDefecto(): void {
    this.actualizarFechasPorPeriodo();
  }

  private formatearFechaInput(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  // Obtener fecha de hoy en formato YYYY-MM-DD
  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Cambio en el selector de período
  onPeriodoChange(): void {
    if (this.periodoDashboard === 'personalizado') {
      this.mostrarFiltrosPersonalizados = true;
      return;
    }

    this.mostrarFiltrosPersonalizados = false;
    this.actualizarFechasPorPeriodo();
    this.actualizarDashboard();
  }

  // Actualizar fechas según el período seleccionado
  private actualizarFechasPorPeriodo(): void {
    if (this.periodoDashboard === 'sin-filtro') {
      this.fechaInicio = '';
      this.fechaFin = '';
      return;
    }

    const hoy = new Date();
    let fechaInicio: Date;

    switch (this.periodoDashboard) {
      case 'hoy':
        fechaInicio = hoy;
        break;
      case 'semana':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'trimestre':
        fechaInicio = new Date(hoy);
        fechaInicio.setMonth(hoy.getMonth() - 3);
        break;
      case 'anio':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        break;
      default:
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }

    this.fechaInicio = this.formatearFechaInput(fechaInicio);
    this.fechaFin = this.formatearFechaInput(hoy);
  }

  // Validar que las fechas sean correctas
  validarFechas(): void {
    if (this.fechaInicio && this.fechaFin) {
      const inicio = new Date(this.fechaInicio);
      const fin = new Date(this.fechaFin);

      if (inicio > fin) {
        // Si la fecha inicio es mayor que fin, intercambiarlas
        const temp = this.fechaInicio;
        this.fechaInicio = this.fechaFin;
        this.fechaFin = temp;
      }

      // Limitar fecha fin a hoy máximo
      const hoy = new Date();
      const hoyStr = this.formatearFechaInput(hoy);
      if (this.fechaFin > hoyStr) {
        this.fechaFin = hoyStr;
      }
    }
  }

  // Verificar si las fechas son válidas
  fechasValidas(): boolean {
    if (this.periodoDashboard === 'personalizado') {
      return !!this.fechaInicio && !!this.fechaFin;
    }
    return true;
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.periodoDashboard = 'sin-filtro';
    this.mostrarFiltrosPersonalizados = false;
    this.actualizarFechasPorPeriodo();
    this.actualizarDashboard();
  }

  // Actualizar dashboard con filtros
  actualizarDashboard(ignoreDateFilter: boolean = false): void {
    this.cargandoDashboard = true;

    const filtros = {
      startDate: ignoreDateFilter ? '' : this.fechaInicio,
      endDate: ignoreDateFilter ? '' : this.fechaFin,
      periodo: ignoreDateFilter ? 'sin-filtro' : this.periodoDashboard,
      vencimiento: !ignoreDateFilter
    };

    this.dashboardService.getDashboardData(filtros)
      .subscribe({
        next: (data: DashboardData) => {
          this.dashboardData = data;
          this.todosVencimientos = data.proximosVencimientos || [];

          // Inicializar filtros
          this.inicializarFiltrosVencimientos();

          this.cargandoDashboard = false;
            this.crearGraficos();

          console.log('Datos recibidos:', data);
          console.log('Vencimientos:', this.todosVencimientos);
          console.log('Vencimientos filtrados:', this.vencimientosFiltrados);
        },
        error: (error) => {
          console.error('Error al cargar dashboard:', error);
          this.cargandoDashboard = false;
          this.inicializarDatosVacios();
        }
      });
  }


  private inicializarFiltrosVencimientos(): void {
      this.vencimientosFiltrados = this.todosVencimientos.filter(v =>
      v.dias <= this.diasVencimiento && v.dias > 0
    );

    // Si no hay urgentes, mostrar primeros 10 de todos los vencimientos
    if (this.vencimientosFiltrados.length === 0 && this.todosVencimientos.length > 0) {
      this.vencimientosFiltrados = this.todosVencimientos.slice(0, 10);
    }
  }

  filtrarVencimientos(): void {
    console.log('Filtrando vencimientos. Días seleccionados:', this.diasVencimiento);
    console.log('Total vencimientos:', this.todosVencimientos.length);

    if (this.diasVencimiento === 999) {
      // Mostrar todos los vencimientos futuros
      this.vencimientosFiltrados = this.todosVencimientos;
      this.mostrarTodosVencimientos = true;
    } else {
      // Filtrar por días
      this.vencimientosFiltrados = this.todosVencimientos.filter(v =>
        v.dias <= this.diasVencimiento && v.dias > 0
      );
      this.mostrarTodosVencimientos = false;

      console.log('Vencimientos filtrados:', this.vencimientosFiltrados);
    }
  }


  getClaseDias(dias: number): string {
    if (dias <= 1) return 'badge badge-danger';
    if (dias <= 3) return 'badge badge-warning';
    if (dias <= 7) return 'badge badge-info';
    return 'badge badge-secondary';
  }

  getClaseEstado(estado: string): string {
    switch (estado) {
      case 'VENCIDO': return 'badge badge-danger';
      case 'MAÑANA': return 'badge badge-danger';
      case 'PRÓXIMO': return 'badge badge-warning';
      case 'ESTA SEMANA': return 'badge badge-info';
      default: return 'badge badge-secondary';
    }
  }

  getStatusClass(estado: string): string {
    if (!estado) return 'badge badge-secondary';
    const s = estado.toUpperCase();
    if (s === 'ACTIVO') return 'badge badge-success';
    if (s === 'INACTIVO') return 'badge badge-danger';
    if (s === 'PENDIENTE' || s === 'PROCESO') return 'badge badge-warning';
    return 'badge badge-secondary';
  }

  // Método para obtener el período seleccionado como texto
  getPeriodoSeleccionado(): string {
    if (this.periodoDashboard === 'personalizado') {
      const inicio = this.formatearFechaParaMostrar(this.fechaInicio);
      const fin = this.formatearFechaParaMostrar(this.fechaFin);
      return `${inicio} - ${fin}`;
    }

    const periodos: { [key: string]: string } = {
      'sin-filtro': 'Histórico Completo',
      hoy: 'Hoy',
      semana: 'Esta semana',
      mes: 'Este mes',
      trimestre: 'Este trimestre',
      anio: 'Este año'
    };

    return periodos[this.periodoDashboard] || 'Período no especificado';
  }

  private formatearFechaParaMostrar(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }


  private inicializarDatosVacios(): void {
    this.dashboardData = {
      carteraTotal: 0,
      carteraCorriente: 0,
      carteraVencida: 0,
      carteraMora: 0,
      moraCorriente: 0,
      totalCreditos: 0,
      creditosVigentes: 0,
      creditosVencidos: 0,
      clientesDia: 0,
      clientesVigentes: 0,
      clientesMora: 0,
      porcentajeCarteraVencida: 0,
      porcentajeCarteraMora: 0,
      porcentajeMoraCorriente: 0,
      porcentajeTotalDeudaAtrasada: 0,
      ingresosTotalGeneral: 0,
      ingresosCapitalTotal: 0,
      ingresosInteresesTotal: 0,
      ingresosMoratoriosTotal: 0,
      totalDeudaAtrasada: 0,
      ministracionesEntregados: 0,
      ministracionesDevolucion: 0,
      ministracionesTotal: 0,
      topAliados: [],
      moraPorAliado: [],
      proximosVencimientos: [],
      alertasMora: [],
      creditosEntregados: [],
      creditosDia: [],
      tasaMorosidad: 0,
      ingresosPeriodo: 0,
      distribucionCartera: { vencida: 0, corriente: 0, enCurso: 0 },
      distribucionIngresos: { capital: 0, intereses: 0, moratorios: 0 },
      moraPorAliadoChart: { labels: [], data: [] },
      totalCreditosCount: 0,
      totalPagosCount: 0
    };
  }

  // private crearGraficos(): void {
  //   // Destruir gráficos existentes si los hay
  //   if (this.distribucionChart) {
  //     this.distribucionChart.destroy();
  //   }
  //   if (this.ingresosChart) {
  //     this.ingresosChart.destroy();
  //   }
  //   if (this.moraAliadoChart) {
  //     this.moraAliadoChart.destroy();
  //   }

  //   // Crear gráfico de distribución de cartera
  //   this.crearGraficoDistribucionCartera();

  //   // Crear gráfico de distribución de ingresos
  //   this.crearGraficoDistribucionIngresos();

  //   // Crear gráfico de mora por aliado
  //   this.crearGraficoMoraPorAliado();

  //   // Crear gráfico de evolución de cartera
  //   this.crearGraficoEvolucionCartera();
  // }
  private crearGraficos(): void {
    // Destruir TODOS los gráficos existentes antes de recrearlos
    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }
    if (this.ingresosChart) {
      this.ingresosChart.destroy();
    }
    if (this.moraAliadoChart) {
      this.moraAliadoChart.destroy();
    }
    if (this.evolucionChart) {
      this.evolucionChart.destroy();
    }

    // Crear gráficos
    this.crearGraficoDistribucionCartera();
    this.crearGraficoDistribucionIngresos();
    this.crearGraficoMoraPorAliado();
    this.crearGraficoEvolucionCartera();
  }

  private crearGraficoDistribucionCartera(): void {
    if (!this.distribucionChartRef) return;

    const ctx = this.distribucionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = {
      labels: ['Cartera Corriente', 'Cartera Vencida', 'Cartera Mora'],
      datasets: [{
        data: [
          this.dashboardData.distribucionCartera.corriente,
          this.dashboardData.distribucionCartera.vencida,
          this.dashboardData.distribucionCartera.mora
        ],
        backgroundColor: [
          'rgba(86, 156, 255, 0.7)',
          'rgba(255, 159, 99, 0.7)',
          'rgba(255, 99, 99, 0.7)'
        ],
        borderColor: [
          'rgba(86, 168, 255, 1)',
          'rgb(255, 159, 99)',
          'rgb(255, 99, 99)'
        ],
        borderWidth: 1
      }]
    };

    const config: ChartConfiguration = {
      type: this.tipoGraficoDistribucion,
      data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            display: this.tipoGraficoDistribucion !== 'bar'
          },
          title: {
            display: true,
            text: 'Distribución de Cartera'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = (context.dataset.data as number[])
                  .reduce((a, b) => a + b, 0);
                const percentage = total > 0
                  ? ((value / total) * 100).toFixed(1)
                  : '0';

                return `${label}: ${this.formatearMoneda(value)} (${percentage}%)`;
              }
            }
          }
        },
        scales: this.tipoGraficoDistribucion === 'bar'
          ? {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) =>
                  typeof value === 'number'
                    ? this.formatearMoneda(value)
                    : value
              }
            }
          }
          : undefined
      }
    };

    this.distribucionChart = new Chart(ctx, config);
  }


  private crearGraficoDistribucionIngresos(): void {
    if (!this.ingresosChartRef) return;
    const ctx = this.ingresosChartRef.nativeElement.getContext('2d');

    const dataTrend = this.getTrendIngresosData();

    const data = {
      labels: dataTrend.labels,
      datasets: [{
        label: 'Ingresos Mensuales',
        data: dataTrend.data,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };

    const config: ChartConfiguration = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: false,
            text: 'Ingresos Mensuales'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatearMoneda(value as number)
            }
          }
        }
      }
    };

    this.ingresosChart = new Chart(ctx, config);
  }

  //   private getTrendIngresosData(): any {
  //   const trend = this.dashboardData?.incomeTrend || [];

  //   if (trend.length === 0) {
  //     // ✅ Retornar estructura vacía en lugar de datos simulados
  //     return { labels: [], data: [] };
  //   }

  //   const labels = trend.map(t => {
  //     const [year, month] = t.mes.split('-');
  //     const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  //     return d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
  //   });

  //   const data = trend.map(t => parseFloat(t.total || 0));

  //   return { labels, data };
  // }
  private getTrendIngresosData(): any {
    let trend = this.dashboardData?.incomeTrend || [];

    // DEBUG: Ver datos reales que llegan del backend
    console.log('Datos Ingresos (Backend):', trend);

    // FILTRO: Mostrar solo datos a partir de 2026
    trend = trend.filter(t => {
      const fechaStr = t.mes || t.fecha || t.date || t.periodo;
      return fechaStr && String(fechaStr) >= '2026-01';
    });

    if (trend.length === 0) {
      return { labels: [], data: [] };
    }

    const labels = trend.map(t => {
      // Buscar la propiedad de fecha (puede venir como mes, fecha, date, etc.)
      const fechaStr = t.mes || t.fecha || t.date || t.periodo;
      
      if (!fechaStr) return '';
      try {
        // Si es formato ISO completo (ej: 2023-05-01T00:00:00)
        if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
           const d = new Date(fechaStr);
           return d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
        }

        const parts = String(fechaStr).split('-');
        if (parts.length < 2) return fechaStr;
        const [year, month] = parts;
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        return d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      } catch (e) {
        return fechaStr;
      }
    });

    const data = trend.map(t => {
      // Buscar la propiedad de valor (puede venir como total, monto, ingreso, etc.)
      // Usamos ?? para aceptar 0 como valor válido si la propiedad existe
      const val = t.total ?? t.monto ?? t.ingreso ?? t.amount ?? 0;
      
      if (typeof val === 'string') return parseFloat(val.replace(/,/g, '')) || 0;
      return parseFloat(val || 0);
    });

    return { labels, data };
  }

  cambiarPeriodoIngresos(periodo: string): void {
    this.periodoIngresos = periodo;

    this.dashboardService.getDashboardTrends(periodo).subscribe({
      next: (trends) => {
        if (!this.dashboardData) return;

        this.dashboardData.incomeTrend = trends.data.incomeTrend;

        if (this.ingresosChart) {
          this.ingresosChart.destroy();
        }

        this.crearGraficoDistribucionIngresos();
      }
    });
  }


  private crearGraficoMoraPorAliado(): void {
    const ctx = this.moraAliadoChartRef.nativeElement.getContext('2d');

    const data = {
      labels: this.dashboardData.moraPorAliadoChart.labels,
      datasets: [
        {
          label: 'Mora en Ciclo (Corriente)',
          data: this.dashboardData.moraPorAliadoChart.moraCorriente,
          backgroundColor: 'rgba(235, 83, 13, 0.7)',
          borderColor: 'rgb(235, 83, 13)',
          borderWidth: 1
        },
        {
          label: 'Mora Fuera de Ciclo (Vencida)',
          data: this.dashboardData.moraPorAliadoChart.moraVencida,
          backgroundColor: 'rgba(184, 6, 45, 0.7)',
          borderColor: 'rgb(255, 0, 55)',
          borderWidth: 1
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (typeof value === 'number') {
                  return this.formatearMoneda(value);
                }
                return value;
              }
            }
          }
        }
      }
    };

    this.moraAliadoChart = new Chart(ctx, config);
  }

  private crearGraficoEvolucionCartera(): void {
    if (!this.evolucionChartRef) return;
    const ctx = this.evolucionChartRef.nativeElement.getContext('2d');

    const dataTrend = this.getTrendEvolucionData();

    const data = {
      labels: dataTrend.labels,
      datasets: [
        {
          label: 'Cartera Total',
          data: dataTrend.carteraTotal,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Mora Total',
          data: dataTrend.mora,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false,
            text: 'Evolución de Cartera'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                return `${label}: ${this.formatearMoneda(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatearMoneda(value as number)
            }
          }
        }
      }
    };

    this.evolucionChart = new Chart(ctx, config);
  }


  private getTrendEvolucionData(): any {
    let trend = this.dashboardData?.portfolioTrend || [];

    // DEBUG: Ver datos reales que llegan del backend
    console.log('Datos Evolución (Backend):', trend);

    // FILTRO: Mostrar solo datos a partir de 2026
    trend = trend.filter(t => t.mes && t.mes >= '2026-01');

    if (trend.length === 0) {
      return { labels: [], carteraTotal: [], mora: [] };
    }

    const labels = trend.map(t => {
      if (!t.mes) return '';
      try {
        const parts = t.mes.split('-');
        if (parts.length < 2) return t.mes;
        const [year, month] = parts;
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        return d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      } catch (e) {
        return t.mes;
      }
    });

    const carteraTotal = trend.map(t => {
      const val = t.cartera_total || t.carteraTotal;
      if (typeof val === 'string') return parseFloat(val.replace(/,/g, '')) || 0;
      return parseFloat(val || 0);
    });

    const mora = trend.map(t => {
      // Calcular Mora Total = Mora Corriente + Mora Vencida
      const valCorriente = t.mora_corriente || t.moraCorriente;
      const valVencida = t.mora_vencida || t.moraVencida;

      let mCorriente = 0;
      let mVencida = 0;

      if (typeof valCorriente === 'string') mCorriente = parseFloat(valCorriente.replace(/,/g, '')) || 0;
      else mCorriente = parseFloat(valCorriente || 0);

      if (typeof valVencida === 'string') mVencida = parseFloat(valVencida.replace(/,/g, '')) || 0;
      else mVencida = parseFloat(valVencida || 0);

      // Si hay componentes, sumarlos. Si no, usar el campo 'mora' directo.
      if (mCorriente > 0 || mVencida > 0) {
        return mCorriente + mVencida;
      }

      const val = t.mora;
      if (typeof val === 'string') return parseFloat(val.replace(/,/g, '')) || 0;
      return parseFloat(val || 0);
    });

    return { labels, carteraTotal, mora };
  }


  cambiarPeriodoEvolucion(periodo: string): void {
    this.periodoEvolucion = periodo;
    // Para evolución siempre traemos un año para tener buena perspectiva
    this.dashboardService.getDashboardTrends('1Y').subscribe({
      next: (trends) => {
        if (this.dashboardData) {
          this.dashboardData.portfolioTrend = trends.data.portfolioTrend;
          if (this.evolucionChart) {
            this.evolucionChart.destroy();
          }
          this.crearGraficoEvolucionCartera();
        }
      }
    });
  }

  cambiarTipoGrafico(tipo: string): void {
    this.tipoGraficoDistribucion = tipo;
    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }
    this.crearGraficoDistribucionCartera();
  }

  // Métodos auxiliares para el template
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  }

  formatearFecha(fecha: Date | string): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPorcentajeCarteraCorriente(): string {
    if (!this.dashboardData?.carteraTotal) return '0.00';
    const porcentaje = (this.dashboardData.carteraCorriente / this.dashboardData.carteraTotal) * 100;
    return porcentaje.toFixed(2);
  }

  getPorcentajeCarteraAliado(carteraAliado: number): string {
    if (!this.dashboardData?.carteraTotal) return '0.00';
    const porcentaje = (carteraAliado / this.dashboardData.carteraTotal) * 100;
    return porcentaje.toFixed(2);
  }

  getPorcentajeMora(moraAliado: number): string {
    if (!this.dashboardData?.carteraMora) return '0.00';
    const porcentaje = (moraAliado / this.dashboardData.carteraMora) * 100;
    return porcentaje.toFixed(2);
  }

  contactarCliente(alerta: any): void {
    if (alerta.telefono) {
      window.open(`tel:${alerta.telefono}`, '_self');
    } else {
      alert(`No hay teléfono registrado para ${alerta.cliente}`);
    }
  }

  getNombreCliente(credito: any): string {
    return credito.cliente || 'Cliente no disponible';
  }

  exportarDashboard(tipo: 'pdf' | 'excel' | 'csv') {
    const params: any = {
      tipo,
      periodo: this.periodoDashboard,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      diasVencimiento: this.diasVencimiento
    };

    this.dashboardService.exportarDashboard(params)
      .subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_dashboard_${new Date().toISOString().slice(0, 10)}.${tipo === 'excel' ? 'xlsx' : tipo}`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  // ==========================================
  // NUEVO: Función para descargar reportes específicos
  // ==========================================
  descargarReporteEspecifico(tipo: 'ministraciones' | 'capital-cartera' | 'detalle-pagos', formato: 'excel' | 'pdf') {
    const filtros = {
      startDate: this.fechaInicio,
      endDate: this.fechaFin,
      periodo: this.periodoDashboard
    };

    this.dashboardService.descargarReporte(tipo, formato, filtros).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${tipo}_${new Date().toISOString().slice(0, 10)}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error descargando reporte:', err)
    });
  }



}