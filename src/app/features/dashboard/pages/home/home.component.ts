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

  // Variables del dashboard
  periodoDashboard: string = 'mes';
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
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    this.fechaInicio = this.formatearFechaInput(inicioMes);
    this.fechaFin = this.formatearFechaInput(hoy);
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
    this.periodoDashboard = 'mes';
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

  // Método para obtener el período seleccionado como texto
  getPeriodoSeleccionado(): string {
    if (this.periodoDashboard === 'personalizado') {
      const inicio = this.formatearFechaParaMostrar(this.fechaInicio);
      const fin = this.formatearFechaParaMostrar(this.fechaFin);
      return `${inicio} - ${fin}`;
    }

    const periodos: { [key: string]: string } = {
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
      ingresosTotalGeneral: 0,
      ingresosCapitalTotal: 0,
      ingresosInteresesTotal: 0,
      ingresosMoratoriosTotal: 0,
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
  }

  private crearGraficoDistribucionCartera(): void {
    const ctx = this.distribucionChartRef.nativeElement.getContext('2d');

    const data = {
      labels: ['Cartera Vencida', 'Cartera Corriente', 'En Curso'],
      datasets: [{
        data: [
          this.dashboardData.distribucionCartera.vencida,
          this.dashboardData.distribucionCartera.corriente,
          this.dashboardData.distribucionCartera.enCurso
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 205, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)'
        ],
        borderWidth: 1
      }]
    };

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
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
        }
      }
    };

    this.distribucionChart = new Chart(ctx, config);
  }

  private crearGraficoDistribucionIngresos(): void {
    const ctx = this.ingresosChartRef.nativeElement.getContext('2d');

    const data = {
      labels: ['Capital', 'Intereses', 'Moratorios'],
      datasets: [{
        label: 'Ingresos',
        data: [
          this.dashboardData.distribucionIngresos.capital,
          this.dashboardData.distribucionIngresos.intereses,
          this.dashboardData.distribucionIngresos.moratorios
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)'
        ],
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
            text: 'Distribución de Ingresos'
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

    this.ingresosChart = new Chart(ctx, config);
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
