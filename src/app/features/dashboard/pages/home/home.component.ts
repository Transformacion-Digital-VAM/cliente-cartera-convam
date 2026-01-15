import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService, DashboardData } from '../../../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  tipoGraficoDistribucion: any = 'doughnut';
  periodoIngresos: string = '6M';
  periodoEvolucion: string = 'monthly';

  private refreshInterval: any;

  constructor(private dashboardService: DashboardService) {
    this.inicializarDatosVacios();
    this.inicializarFechasPorDefecto();
  }

  ngOnInit(): void {
    this.actualizarDashboard();

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
  actualizarDashboard(): void {
    this.cargandoDashboard = true;

    const filtros = {
      startDate: this.fechaInicio,
      endDate: this.fechaFin,
      periodo: this.periodoDashboard
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
    // Por defecto mostrar solo urgentes (3 días o menos)
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
      totalCreditos: 0,
      creditosVigentes: 0,
      creditosVencidos: 0,
      clientesDia: 0,
      clientesVigentes: 0,
      clientesMora: 0,
      porcentajeCarteraVencida: 0,
      porcentajeCarteraMora: 0,
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

  private crearGraficos(): void {
    // Destruir gráficos existentes si los hay
    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }
    if (this.ingresosChart) {
      this.ingresosChart.destroy();
    }
    if (this.moraAliadoChart) {
      this.moraAliadoChart.destroy();
    }

    // Crear gráfico de distribución de cartera
    this.crearGraficoDistribucionCartera();

    // Crear gráfico de distribución de ingresos
    this.crearGraficoDistribucionIngresos();

    // Crear gráfico de mora por aliado
    this.crearGraficoMoraPorAliado();

    // Crear gráfico de evolución de cartera
    this.crearGraficoEvolucionCartera();
  }

  private crearGraficoDistribucionCartera(): void {
    if (!this.distribucionChartRef) return;
    const ctx = this.distribucionChartRef.nativeElement.getContext('2d');
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
      data: data,
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
                const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${this.formatearMoneda(value)} (${percentage}%)`;
              }
            }
          }
        },
        scales: this.tipoGraficoDistribucion === 'bar' ? {
          y: {
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
        } : {}
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

  private getTrendIngresosData(): any {
    // Si no tenemos datos históricos aún o queremos simular para el dashboard inicial
    // Usaremos los datos del periodo actual distribuidos o generaremos datos coherentes
    const labels = [];
    const data = [];
    const hoy = new Date();

    const numMeses = this.periodoIngresos === '3M' ? 3 : (this.periodoIngresos === '1Y' ? 12 : 6);

    for (let i = numMeses - 1; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }));

      // Simulado: El último mes es el dato real del dashboard, el resto son variaciones para demo
      if (i === 0) {
        data.push(this.dashboardData.ingresosPeriodo || 0);
      } else {
        // Variación aleatoria pero coherente para la visualización
        const base = this.dashboardData.ingresosPeriodo || 100000;
        data.push(base * (0.8 + Math.random() * 0.4));
      }
    }

    return { labels, data };
  }

  cambiarPeriodoIngresos(periodo: string): void {
    this.periodoIngresos = periodo;

    // Aquí llamaríamos al servicio para obtener datos históricos específicos si fuera necesario
    // Por ahora actualizamos la visualización con la nueva escala de tiempo
    if (this.ingresosChart) {
      this.ingresosChart.destroy();
    }
    this.crearGraficoDistribucionIngresos();

    // Opcional: Podríamos disparar una recarga de datos con un rango mayor
    // const meses = periodo === '3M' ? 3 : (periodo === '1Y' ? 12 : 6);
    // this.cargarHistoricoInresos(meses);
  }

  private crearGraficoMoraPorAliado(): void {
    const ctx = this.moraAliadoChartRef.nativeElement.getContext('2d');

    const data = {
      labels: this.dashboardData.moraPorAliadoChart.labels,
      datasets: [{
        label: 'Mora por Aliado',
        data: this.dashboardData.moraPorAliadoChart.data,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1
      }]
    };

    const config: ChartConfiguration = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Mora por Aliado'
          }
        },
        scales: {
          y: {
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
          label: 'Mora',
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
    const labels = [];
    const carteraTotal = [];
    const mora = [];
    const hoy = new Date();

    let steps = 12; // Mensual: 12 meses
    if (this.periodoEvolucion === 'quarterly') steps = 8; // Trimestral: 8 trimestres (2 años)
    if (this.periodoEvolucion === 'yearly') steps = 5; // Anual: 5 años

    for (let i = steps - 1; i >= 0; i--) {
      let label = '';
      if (this.periodoEvolucion === 'monthly') {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      } else if (this.periodoEvolucion === 'quarterly') {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - (i * 3), 1);
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        label = `T${quarter} ${d.getFullYear().toString().slice(-2)}`;
      } else {
        label = (hoy.getFullYear() - i).toString();
      }
      labels.push(label);

      // Simulado: Basado en datos actuales con variaciones históricas
      const baseCartera = this.dashboardData.carteraTotal || 5000000;
      const baseMora = this.dashboardData.carteraMora || 250000;

      if (i === 0) {
        carteraTotal.push(baseCartera);
        mora.push(baseMora);
      } else {
        // Simular crecimiento hacia atrás
        const factor = 1 - (i * 0.05);
        carteraTotal.push(baseCartera * factor * (0.95 + Math.random() * 0.1));
        mora.push(baseMora * factor * (0.8 + Math.random() * 0.4));
      }
    }

    return { labels, carteraTotal, mora };
  }

  cambiarPeriodoEvolucion(periodo: string): void {
    this.periodoEvolucion = periodo;
    if (this.evolucionChart) {
      this.evolucionChart.destroy();
    }
    this.crearGraficoEvolucionCartera();
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
    // Implementar lógica para contactar cliente
    console.log('Contactando cliente:', alerta.cliente);
    // Aquí podrías abrir un modal o redirigir a la página de contacto
    alert(`Contactando a ${alerta.cliente}`);
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



}
