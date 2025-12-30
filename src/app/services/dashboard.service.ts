import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PeriodoDashboard {
  value: string;
  label: string;
}

export interface DashboardData {
  clientesDia: any;
  carteraTotal: number;
  carteraCorriente: number;
  carteraVencida: number;
  carteraMora: number;
  totalCreditos: number;
  creditosVigentes: number;
  creditosVencidos: number;
  clientesVigentes: number;
  clientesMora: number;
  porcentajeCarteraVencida: number;
  porcentajeCarteraMora: number;

  // Ingresos
  ingresosTotalGeneral: number;
  ingresosCapitalTotal: number;
  ingresosInteresesTotal: number;
  ingresosMoratoriosTotal: number;

  // Ministraciones
  ministracionesEntregados: number;
  ministracionesDevolucion: number;
  ministracionesTotal: number;

  // Aliados
  topAliados: any[];
  moraPorAliado: any[];

  // Alertas
  proximosVencimientos: any[];
  alertasMora: any[];
  creditosEntregados: any[];
  creditosDia: any[];

  // Estadísticas
  tasaMorosidad: number;
  ingresosPeriodo: number;

  // Gráficos
  distribucionCartera: any;
  distribucionIngresos: any;
  moraPorAliadoChart: any;

  // Totales generales
  totalCreditosCount: number;
  totalPagosCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = `${environment.apiUrl}/reporte/tesoreria`;

  constructor(private http: HttpClient) { }

  getMinistracionesReport(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.append(key, filters[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/ministraciones`, { params });
  }

  getCapitalCarteraReport(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.append(key, filters[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/capital-cartera`, { params });
  }

  getDetallePagosReport(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.append(key, filters[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/detalle-pagos`, { params });
  }

  getResumenCarteraReport(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.append(key, filters[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/resumen-cartera`, { params });
  }



  private getFiltersByPeriod(filtros: any): any {
    if (filtros.startDate && filtros.endDate) {
      return {
        startDate: filtros.startDate,
        endDate: filtros.endDate
      };
    }

    const periodo = filtros.periodo || 'mes';
    const now = new Date();
    let startDate: string;
    let endDate: string = now.toISOString().split('T')[0];

    switch (periodo) {
      case 'hoy':
        startDate = now.toISOString().split('T')[0];
        break;
      case 'semana':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'trimestre':
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(now.getMonth() - 3);
        startDate = quarterAgo.toISOString().split('T')[0];
        break;
      case 'anio':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
      case 'mes':
      default:
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
    }

    return { startDate, endDate };
  }

  getDashboardData(filtros: any = {}): Observable<DashboardData> {
    return new Observable(observer => {
      const filters = this.getFiltersByPeriod(filtros);

      Promise.all([
        this.getCapitalCarteraReport(filters).toPromise(),
        this.getMinistracionesReport(filters).toPromise(),
        this.getDetallePagosReport(filters).toPromise(),
        this.getResumenCarteraReport(filters).toPromise()
      ]).then(([capitalData, ministracionesData, pagosData, resumenData]) => {
        const dashboardData = this.transformToDashboardData(
          capitalData,
          ministracionesData,
          pagosData,
          resumenData,
          filtros.periodo || 'mes'
        );
        observer.next(dashboardData);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }


  private transformToDashboardData(
    capitalData: any,
    ministracionesData: any,
    pagosData: any,
    resumenData: any,
    periodo: string
  ): DashboardData {
    // Transformar datos del reporte de capital
    const summary = capitalData?.summary;
    const totals = capitalData?.totals;
    const capitalRows = capitalData?.data || [];

    // Transformar datos de ministraciones
    const ministraciones = ministracionesData?.data?.data || { entregados: [], devolucion: [] };

    // Transformar datos de resumen (aquí está el total de créditos)
    const resumenRows = resumenData?.data || [];
    const resumenTotals = resumenData?.totals || {};

    // Transformar datos de pagos
    const pagos = pagosData?.data || [];

    // Calcular datos del dashboard
    const dashboardData: DashboardData = {
      // 1. TOTAL DE CRÉDITOS ENTREGADOS (de resumen-cartera)
      totalCreditosCount: resumenTotals?.totalCreditos || 0,

      // 2. Cartera Total (suma de saldo_total_pendiente de créditos ENTREGADOS)
      carteraTotal: totals?.saldoPendiente || 0,

      // 3. Cartera Corriente (Cartera Corriente con Mora)
      carteraCorriente: summary?.carteraCorrienteMora?.monto || 0,

      // 4. Cartera Vencida (Cartera Vencida)
      carteraVencida: summary?.carteraVencida?.monto || 0,

      // 5. Cartera en Mora (suma de mora_acumulada_total)
      carteraMora: totals?.mora || 0,

      // 6. Totales de créditos por estado (del summary de capital-cartera)
      totalCreditos: summary?.totalCreditos || 0,
      creditosVigentes: summary?.carteraEnCurso?.cantidad || 0,
      creditosVencidos: summary?.carteraVencida?.cantidad || 0,

      // 7. Clientes únicos de créditos entregados
      clientesVigentes: this.getUniqueClients(capitalRows),
      clientesMora: this.getClientsWithMora(capitalRows),

      // 8. Porcentajes
      porcentajeCarteraVencida: summary?.carteraVencida?.porcentaje || 0,
      porcentajeCarteraMora: this.calculatePorcentajeCarteraMora(
        totals?.mora || 0,
        totals?.saldoPendiente || 0
      ),

      // 9. Créditos por estado (de ministraciones)

      // Ingresos (basado en pagos realizados)
      ingresosTotalGeneral: this.calculateTotalIngresos(pagos),
      ingresosCapitalTotal: this.calculateCapitalPagado(pagos),
      ingresosInteresesTotal: this.calculateInteresesPagados(pagos),
      ingresosMoratoriosTotal: this.calculateMoratoriosPagados(pagos),

      // Ministraciones
      ministracionesEntregados: this.calculateTotalMinistraciones(ministraciones.entregados),
      ministracionesDevolucion: this.calculateTotalMinistraciones(ministraciones.devolucion),
      ministracionesTotal: this.calculateTotalMinistraciones(ministraciones.entregados) -
        this.calculateTotalMinistraciones(ministraciones.devolucion),

      // Aliados
      topAliados: this.getTopAliados(capitalRows),
      moraPorAliado: this.getMoraPorAliado(capitalRows),

      // Alertas
      proximosVencimientos: this.getProximosVencimientos(pagos),
      alertasMora: this.getAlertasMora(pagos),
      creditosEntregados: this.getCreditosEntregadosHoy(ministraciones.entregados),
      creditosDia: this.getCreditosDelDia(ministraciones.entregados),

      // Estadísticas
      tasaMorosidad: this.calculateTasaMorosidad(
        totals?.mora || 0,
        totals?.saldoPendiente || 0
      ),
      ingresosPeriodo: this.calculateIngresosPeriodo(pagos, periodo),

      // Datos para gráficos (serán procesados en el componente)
      distribucionCartera: this.getDistribucionCarteraData(capitalRows),
      distribucionIngresos: this.getDistribucionIngresosData(pagos),
      moraPorAliadoChart: this.getMoraPorAliadoChartData(capitalRows),

      // Totales generales
      totalPagosCount: pagos.length || 0,
      clientesDia: 0
    };

    return dashboardData;
  }

  // Métodos auxiliares para transformar datos
  private getUniqueClients(creditos: any[]): number {
    const uniqueClients = new Set(creditos.map(c => c.cliente_nombre));
    return uniqueClients.size;
  }

  private getClientsWithMora(creditos: any[]): number {
    const clientsWithMora = new Set(
      creditos
        .filter(c => parseFloat(c.mora_acumulada_total) > 0)
        .map(c => c.cliente_nombre)
    );
    return clientsWithMora.size;
  }

  private calculatePorcentajeCarteraMora(mora: number, carteraTotal: number): number {
    if (!carteraTotal) return 0;
    return parseFloat(((mora / carteraTotal) * 100).toFixed(2));
  }

  private calculateTotalIngresos(pagos: any[]): number {
    return pagos
      .filter(p => p.pagado)
      .reduce((sum, p) => sum + parseFloat(p.total_semana || 0), 0);
  }

  private calculateCapitalPagado(pagos: any[]): number {
    return pagos
      .filter(p => p.pagado)
      .reduce((sum, p) => sum + parseFloat(p.capital || 0), 0);
  }

  private calculateInteresesPagados(pagos: any[]): number {
    return pagos
      .filter(p => p.pagado)
      .reduce((sum, p) => sum + parseFloat(p.interes || 0), 0);
  }

  private calculateMoratoriosPagados(pagos: any[]): number {
    return pagos
      .filter(p => p.pagado)
      .reduce((sum, p) => sum + parseFloat(p.mora_acumulada || 0), 0);
  }

  private calculateTotalMinistraciones(ministraciones: any[]): number {
    return ministraciones.reduce((sum, m) => sum + parseFloat(m.total_a_pagar || 0), 0);
  }

  private getTopAliados(creditos: any[]): any[] {
    const aliadosMap = new Map();

    creditos.forEach(credito => {
      const aliado = credito.nom_aliado?.trim();
      if (!aliado) return;

      if (!aliadosMap.has(aliado)) {
        aliadosMap.set(aliado, {
          nombre: aliado,
          creditos: 0,
          cartera: 0,
          entregados: parseFloat(credito.total_a_pagar || 0)
        });
      }

      const data = aliadosMap.get(aliado);
      data.creditos++;
      data.cartera += parseFloat(credito.saldo_total_pendiente || 0);
    });

    return Array.from(aliadosMap.values())
      .sort((a, b) => b.cartera - a.cartera)
      .slice(0, 5); // Top 5 aliados
  }

  private getMoraPorAliado(creditos: any[]): any[] {
    const moraMap = new Map();

    creditos.forEach(credito => {
      const aliado = credito.nom_aliado?.trim();
      const mora = parseFloat(credito.mora_acumulada_total || 0);

      if (!aliado || mora <= 0) return;

      if (!moraMap.has(aliado)) {
        moraMap.set(aliado, {
          nombre: aliado,
          mora: 0
        });
      }

      const data = moraMap.get(aliado);
      data.mora += mora;
    });

    return Array.from(moraMap.values())
      .sort((a, b) => b.mora - a.mora);
  }

  private getProximosVencimientos(pagos: any[]): any[] {
    const hoy = new Date();

    // Obtener todos los pagos pendientes (no pagados) con sus vencimientos
    const todosVencimientos = pagos
      .filter(p => !p.pagado && p.fecha_vencimiento)
      .map(p => {
        const fechaVencimiento = new Date(p.fecha_vencimiento);
        const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        return {
          cliente: p.cliente_nombre,
          credito_id: p.id_credito,
          numero_pago: p.numero_pago,
          monto: parseFloat(p.total_semana || 0),
          fecha: p.fecha_vencimiento,
          fechaFormateada: fechaVencimiento.toLocaleDateString('es-MX'),
          dias: diasRestantes,
          aliado: p.nom_aliado?.trim(),
          // Para ordenamiento y filtrado
          fechaObj: fechaVencimiento,
          // Estado según días restantes
          estado: this.getEstadoVencimiento(diasRestantes),
          // Para filtros
          esUrgente: diasRestantes <= 3 && diasRestantes > 0,
          esEstaSemana: diasRestantes <= 7 && diasRestantes > 0,
          esFuturo: diasRestantes > 0
        };
      })
      // Solo futuros (no incluir vencidos)
      .filter(p => p.dias > 0)
      // Ordenar por días más cercanos primero
      .sort((a, b) => a.dias - b.dias);

    return todosVencimientos;
  }

  private getEstadoVencimiento(dias: number): string {
    if (dias <= 0) return 'VENCIDO';
    if (dias <= 1) return 'MAÑANA';
    if (dias <= 3) return 'PRÓXIMO';
    if (dias <= 7) return 'ESTA SEMANA';
    return 'FUTURO';
  }


  // Método para obtener TODOS los vencimientos 
  private getTodosVencimientos(pagos: any[]): any[] {
    const hoy = new Date();

    return pagos
      .filter(p => !p.pagado && p.fecha_vencimiento)
      .map(p => {
        const fechaVencimiento = new Date(p.fecha_vencimiento);
        const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        return {
          cliente: p.cliente_nombre,
          credito_id: p.id_credito,
          numero_pago: p.numero_pago,
          monto: parseFloat(p.total_semana || 0),
          fecha: p.fecha_vencimiento,
          dias: diasRestantes,
          aliado: p.nom_aliado?.trim(),
          estado: this.getEstadoVencimiento(diasRestantes)
        };
      })
      .filter(p => p.dias > 0) // Solo futuros
      .sort((a, b) => a.dias - b.dias);
  }


  private getAlertasMora(pagos: any[]): any[] {
    const alertas = pagos
      .filter(p => p.dias_atraso > 0)
      .reduce((acc, p) => {
        const key = `${p.id_credito}-${p.cliente_nombre}`;
        if (!acc[key]) {
          acc[key] = {
            cliente: p.cliente_nombre,
            dias_mora: p.dias_atraso,
            monto_vencido: 0,
            saldo_pendiente: this.getSaldoPendientePorCredito(p.id_credito, pagos),
            aliado: p.nom_aliado?.trim()
          };
        }
        acc[key].monto_vencido += parseFloat(p.total_semana || 0);
        acc[key].dias_mora = Math.max(acc[key].dias_mora, p.dias_atraso);
        return acc;
      }, {});

    return Object.values(alertas)
      .sort((a: any, b: any) => b.dias_mora - a.dias_mora)
      .slice(0, 10); // Limitar a 10 alertas
  }

  private getSaldoPendientePorCredito(idCredito: number, pagos: any[]): number {
    return pagos
      .filter(p => p.id_credito === idCredito && !p.pagado)
      .reduce((sum, p) => sum + parseFloat(p.total_semana || 0), 0);
  }

  private getCreditosEntregadosHoy(entregados: any[]): any[] {
    const hoy = new Date().toISOString().split('T')[0];
    return entregados
      .filter(e => e.fecha_ministracion && e.fecha_ministracion.startsWith(hoy))
      .map(e => ({
        cliente: e.cliente_nombre,
        monto_aprobado: parseFloat(e.total_a_pagar || 0),
        fecha: e.fecha_ministracion,
        aliado: e.nom_aliado?.trim()
      }));
  }

  private getCreditosDelDia(entregados: any[]): any[] {
    const hoy = new Date().toISOString().split('T')[0];
    return entregados
      .filter(e => e.fecha_ministracion && e.fecha_ministracion.startsWith(hoy))
      .map(e => ({
        id: e.id_credito,
        cliente: e.cliente_nombre,
        monto: parseFloat(e.total_a_pagar || 0),
        fecha: e.fecha_ministracion,
        estado: e.estado_credito,
        aliado: e.nom_aliado?.trim()
      }));
  }

  private calculateTasaMorosidad(moraTotal: number, carteraTotal: number): number {
    if (!carteraTotal) return 0;
    return parseFloat(((moraTotal / carteraTotal) * 100).toFixed(2));
  }

  private calculateIngresosPeriodo(pagos: any[], periodo: string): number {
    const hoy = new Date();
    let fechaLimite: Date;

    switch (periodo) {
      case 'hoy':
        fechaLimite = new Date(hoy.setHours(0, 0, 0, 0));
        break;
      case 'semana':
        fechaLimite = new Date(hoy);
        fechaLimite.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        fechaLimite = new Date(hoy);
        fechaLimite.setMonth(hoy.getMonth() - 1);
        break;
      case 'trimestre':
        fechaLimite = new Date(hoy);
        fechaLimite.setMonth(hoy.getMonth() - 3);
        break;
      default:
        fechaLimite = new Date(hoy);
        fechaLimite.setMonth(hoy.getMonth() - 1);
    }

    return pagos
      .filter(p => p.pagado && p.fecha_pago && new Date(p.fecha_pago) >= fechaLimite)
      .reduce((sum, p) => sum + parseFloat(p.total_semana || 0), 0);
  }

  // Métodos para datos de gráficos
  private getDistribucionCarteraData(creditos: any[]): any {
    const distribucion = {
      vencida: 0,
      corriente: 0,
      enCurso: 0
    };

    creditos.forEach(c => {
      const saldo = parseFloat(c.saldo_total_pendiente || 0);
      switch (c.estado_cartera) {
        case 'CARTERA VENCIDA':
          distribucion.vencida += saldo;
          break;
        case 'CARTERA CORRIENTE':
          distribucion.corriente += saldo;
          break;
        case 'EN CURSO':
          distribucion.enCurso += saldo;
          break;
      }
    });

    return distribucion;
  }

  private getDistribucionIngresosData(pagos: any[]): any {
    const ingresos = {
      capital: 0,
      intereses: 0,
      moratorios: 0
    };

    pagos
      .filter(p => p.pagado)
      .forEach(p => {
        ingresos.capital += parseFloat(p.capital || 0);
        ingresos.intereses += parseFloat(p.interes || 0);
        ingresos.moratorios += parseFloat(p.mora_acumulada || 0);
      });

    return ingresos;
  }

  private getMoraPorAliadoChartData(creditos: any[]): any {
    const moraPorAliado = this.getMoraPorAliado(creditos);
    return {
      labels: moraPorAliado.map(a => a.nombre),
      data: moraPorAliado.map(a => a.mora)
    };
  }

  // Método para preparar datos de exportación
  prepareExportData(dashboardData: DashboardData, periodo: string): any {
    return {
      periodo: this.getPeriodoLabel(periodo),
      fechaGeneracion: new Date(),
      carteraTotal: dashboardData.carteraTotal,
      totalCreditosCount: dashboardData.totalCreditosCount,
      clientesVigentes: dashboardData.clientesVigentes,
      carteraCorriente: dashboardData.carteraCorriente,
      carteraVencida: dashboardData.carteraVencida,
      carteraMora: dashboardData.carteraMora,
      tasaMorosidad: dashboardData.tasaMorosidad,
      ingresosPeriodo: dashboardData.ingresosPeriodo,
      ministracionesTotal: dashboardData.ministracionesTotal,

      // Datos para tablas
      carteraGeneral: dashboardData.topAliados,
      vencimientos: dashboardData.proximosVencimientos,
      alertas: dashboardData.alertasMora,
      aliados: dashboardData.moraPorAliado,

      // Datos de ingresos
      ingresos: {
        totalGeneral: dashboardData.ingresosTotalGeneral,
        capital: dashboardData.ingresosCapitalTotal,
        intereses: dashboardData.ingresosInteresesTotal,
        moratorios: dashboardData.ingresosMoratoriosTotal
      },

      // Datos de ministraciones
      ministraciones: {
        entregadas: dashboardData.ministracionesEntregados,
        devolucion: dashboardData.ministracionesDevolucion,
        totalNeto: dashboardData.ministracionesTotal
      }
    };
  }

  private getPeriodoLabel(periodo: string): string {
    const periodos: { [key: string]: string } = {
      hoy: 'Hoy',
      semana: 'Esta semana',
      mes: 'Este mes',
      trimestre: 'Este trimestre'
    };
    return periodos[periodo] || 'Periodo no especificado';
  }

  exportDashboardToBackend(format: string, periodo: string): Observable<any> {
    const params = new HttpParams()
      .set('format', format)
      .set('periodo', periodo);

    return this.http.get(`${this.baseUrl}/exportar-dashboard`, {
      params,
      responseType: 'blob'
    });
  }
}