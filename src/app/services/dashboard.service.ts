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
  porcentajeTotalDeudaAtrasada: number;
  moraCorriente: number;
  porcentajeMoraCorriente: number;

  // Ingresos
  ingresosTotalGeneral: number;
  ingresosCapitalTotal: number;
  ingresosInteresesTotal: number;
  ingresosMoratoriosTotal: number;
  totalDeudaAtrasada: number;

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
  tendenciaMorosidad?: string;
  incomeTrend?: any[];
  portfolioTrend?: any[];

  // Resumen de Entregas
  resumenEntregado?: { cantidad: number, monto: number };
  resumenVencido?: { cantidad: number, monto: number };
  resumenDevolucion?: { cantidad: number, monto: number };
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

    // CACHE BUSTER: Forzar nueva petición siempre
    params = params.append('_t', new Date().getTime().toString());

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

  getDashboardTrends(periodo: string = '6M'): Observable<any> {
    let params = new HttpParams().set('periodo', periodo);
    return this.http.get(`${this.baseUrl}/dashboard-trends`, { params });
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
      case 'sin-filtro':
        return {};
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

      // Para los indicadores de CARTERA (Mora, Vencida, Corriente), necesitamos TODO el universo de créditos activos,
      // no solo los del periodo seleccionado. Por eso pedimos capital y pagos sin filtros de fecha.
      const globalFilters = { ...filters };
      delete globalFilters.startDate;
      delete globalFilters.endDate;
      // Mantener filtros de aliado/ubicación si existen, pero quitar fechas para ver la foto completa

      Promise.all([
        this.getCapitalCarteraReport(globalFilters).toPromise(), // Global para cartera completa
        this.getMinistracionesReport(filters).toPromise(),       // APLICA FILTRO: Este sí respeta el periodo (ministraciones del mes)
        this.getDetallePagosReport(globalFilters).toPromise(),   // Global para calcular mora de todos (Ingresos se filtra internamente)
        this.getResumenCarteraReport(globalFilters).toPromise(), // Global para cartera completa
        this.getDashboardTrends(filtros.periodo === 'anio' ? '1Y' : '6M').toPromise()
      ]).then(([capitalData, ministracionesData, pagosData, resumenData, trendsData]) => {
        const dashboardData = this.transformToDashboardData(
          capitalData,
          ministracionesData,
          pagosData,
          resumenData,
          trendsData,
          filtros.periodo || 'mes',
          filters
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
    trendsData: any,
    periodo: string,
    filters: any
  ): DashboardData {
    // Transformar datos del reporte de capital
    const summary = capitalData?.summary;
    const totals = capitalData?.totals;
    const capitalRows = capitalData?.data || [];

    // Transformar datos de ministraciones
    const ministraciones = ministracionesData?.data?.data || { entregados: [], devolucion: [], pendientes: [] };
    const todosCreditosPeriodo = [
      ...(ministraciones.entregados || []),
      ...(ministraciones.devolucion || []),
      ...(ministraciones.pendientes || [])
    ];

    // Transformar datos de resumen (aquí está el total de créditos)
    const resumenRows = resumenData?.data || [];
    const resumenTotals = resumenData?.totals || {};

    // Transformar datos de pagos
    const pagos = pagosData?.data || [];

    // Calcular datos del dashboard
    // Calcular distribución personalizada por ciclo (16 semanas)
    const {
      corriente,
      vencida,
      idsVencidos,
      countCorriente,
      countVencida
    } = this.calculateCarteraByCycle(capitalRows);

    // Obtener IDs válidos de créditos (existentes en capitalRows)
    // FILTRO EXACTO FINANCIAL HISTORY: Solo 'ENTREGADO' o 'VENCIDO'
    // Los demás (LIQUIDADO, CANCELADO, ETC) no suman.
    const validCreditIds = new Set<number>(
      capitalRows
        .filter((c: any) => c.estado_credito === 'ENTREGADO' || c.estado_credito === 'VENCIDO')
        .map((c: any) => Number(c.id_credito))
    );

    // Calcular Mora de Cartera Corriente (solo pagos vencidos de créditos corrientes)
    const moraCorriente = this.calculateMoraCorriente(pagos, idsVencidos, validCreditIds);

    // Cartera Vencida (Personalizada: Cliente terminó ciclo y sigue debiendo)
    const carteraVencida = vencida;

    // Cartera en Mora (Total Vencida + Mora de Corrientes)
    const carteraMora = Math.round((carteraVencida + moraCorriente) * 100) / 100;

    // --- DEBUG LOGS FOR USER ---
    try {
      // console.group('--- DETALLE DE MORA DASHBOARD ---');
      // console.log('Mora Vencida (Fuera de Ciclo):', this.formatearMonedaDebugging(carteraVencida));
      // console.log('Mora Corriente (En Ciclo):', this.formatearMonedaDebugging(moraCorriente));
      // console.log('Total Mora:', this.formatearMonedaDebugging(carteraMora));

      // Créditos Vencidos (Fuera de Ciclo)
      const detalleVencidos = capitalRows
        .filter((c: any) => c.id_credito && idsVencidos.has(Number(c.id_credito)))
        .map((c: any) => ({
          ID: c.id_credito,
          Cliente: (c.nombre_cliente || c.cliente_nombre || '').trim(),
          Saldo: parseFloat(c.saldo_total_pendiente || 0),
          Estado: c.estado_cartera
        }));

      // if (detalleVencidos.length > 0) {
      //   // console.log('1. CRÉDITOS EN CARTERA VENCIDA (Fuera de Ciclo):');
      //   // console.table(detalleVencidos);
      // }

      // Créditos en Mora Corriente (Dentro de Ciclo)
      const idsMoraCorriente = new Set(pagos
        .filter((p: any) => {
          const idNum = Number(p.id_credito);
          const diasAtraso = Number(p.dias_atraso || 0);
          const pendiente = (parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0)) + parseFloat(p.mora_acumulada || 0);
          return idNum && diasAtraso > 0 && pendiente > 0.01 && !idsVencidos.has(idNum);
        })
        .map((p: any) => Number(p.id_credito))
      );

      const detalleCorrientes = capitalRows
        .filter((c: any) => c.id_credito && idsMoraCorriente.has(Number(c.id_credito)))
        .map((c: any) => {
          const idNum = Number(c.id_credito);
          const pagosAtrasados = pagos.filter((p: any) => {
            const idInt = Number(p.id_credito);
            const diasAtraso = Number(p.dias_atraso || 0);
            const pendiente = (parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0)) + parseFloat(p.mora_acumulada || 0);
            return idInt === idNum && diasAtraso > 0 && pendiente > 0.01;
          });

          const montoAtraso = pagosAtrasados.reduce((sum: number, p: any) =>
            sum + (parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0)) + parseFloat(p.mora_acumulada || 0), 0
          );

          return {
            ID: c.id_credito,
            Cliente: (c.nombre_cliente || c.cliente_nombre || '').trim(),
            'Monto Atraso': Math.round(montoAtraso * 100) / 100,
            '# Pagos Atrasados': pagosAtrasados.length,
            'Máx Días Atraso': pagosAtrasados.length > 0 ? Math.max(...pagosAtrasados.map((p: any) => p.dias_atraso || 0)) : 0,
            Detalle: pagosAtrasados.map((p: any) => `${p.estatus || '?'}`).join(', ')
          };
        });

      // if (detalleCorrientes.length > 0) {
      //   console.log('2. CRÉDITOS CON MORA CORRIENTE (Dentro de Ciclo):');
      //   console.table(detalleCorrientes);
      // }

      console.groupEnd();
    } catch (e) {
      console.error('Error en logs de debugging:', e);
      if (console.groupEnd) console.groupEnd();
    }
    // ----------------------------

    // Calcular Clientes Únicos en Mora (Vencidos + Corrientes con atraso)
    const clientsMoraSet = new Set<string>();

    // 1. Clientes con Cartera Vencida (Saldo > 0)
    capitalRows.forEach((c: any) => {
      if (c.estado_cartera === 'CARTERA VENCIDA' && parseFloat(c.saldo_total_pendiente || 0) > 0) {
        clientsMoraSet.add(c.nombre_cliente || c.cliente_nombre);
      }
    });

    // 2. Clientes con Mora Corriente (Arras de pagos atrasados)
    pagos.forEach((p: any) => {
      if (!p.pagado && p.dias_atraso > 0) {
        clientsMoraSet.add(p.cliente_nombre);
      }
    });

    const clientesMoraCount = clientsMoraSet.size;

    // Filtrar pagos por fechas del dashboard para calcular ingresos
    let pagosFiltrados = pagos;
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      pagosFiltrados = pagos.filter((p: any) => {
        if (!p.fecha_pago) return false;
        const fp = new Date(p.fecha_pago);
        return fp >= start && fp <= end;
      });
    }

    // Calcular datos del dashboard
    const dashboardData: DashboardData = {
      // 1. TOTAL DE CRÉDITOS ENTREGADOS (de resumen-cartera)
      totalCreditosCount: capitalRows.length || 0,

      // 2. Cartera Total (suma de saldo_total_pendiente de créditos ENTREGADOS)
      carteraTotal: totals?.saldoPendiente || 0,

      // 3. Cartera Corriente (Personalizada: Dentro del ciclo de 16 semanas)
      carteraCorriente: corriente,

      // 4. Cartera Vencida 
      carteraVencida: carteraVencida,

      // 5. Cartera en Mora
      carteraMora: carteraMora,

      // 6. Totales de créditos por estado (calculados por ciclo)
      totalCreditos: capitalRows.length || 0,
      creditosVigentes: countCorriente,
      creditosVencidos: countVencida,

      // 7. Clientes únicos de créditos entregados
      clientesVigentes: this.getUniqueClients(capitalRows),
      clientesMora: clientesMoraCount,

      // 8. Porcentajes
      porcentajeCarteraVencida: this.calculatePorcentaje(
        carteraVencida,
        totals?.saldoPendiente || 0
      ),
      moraCorriente: Math.round(moraCorriente * 100) / 100,
      porcentajeMoraCorriente: this.calculatePorcentaje(
        Math.round(moraCorriente * 100) / 100,
        totals?.saldoPendiente || 0
      ),
      porcentajeCarteraMora: this.calculatePorcentaje(
        carteraMora,
        totals?.saldoPendiente || 0
      ),
      porcentajeTotalDeudaAtrasada: this.calculatePorcentaje(
        carteraMora,
        totals?.saldoPendiente || 0
      ),

      // 9. Créditos por estado (de ministraciones)

      // Ingresos (basado en pagos realizados)
      ingresosTotalGeneral: this.calculateTotalIngresos(pagosFiltrados),
      ingresosCapitalTotal: this.calculateCapitalPagado(pagosFiltrados),
      ingresosInteresesTotal: this.calculateInteresesPagados(pagosFiltrados),
      ingresosMoratoriosTotal: this.calculateMoratoriosPagados(pagosFiltrados),
      totalDeudaAtrasada: carteraMora,

      // Ministraciones
      ministracionesEntregados: this.calculateTotalMinistraciones(ministraciones.entregados),
      ministracionesDevolucion: this.calculateTotalMinistraciones(ministraciones.devolucion),
      ministracionesTotal: this.calculateTotalMinistraciones(ministraciones.entregados) -
        this.calculateTotalMinistraciones(ministraciones.devolucion),

      // Aliados
      topAliados: this.getTopAliados(capitalRows),
      moraPorAliado: this.getMoraPorAliado(capitalRows, pagos, idsVencidos),

      // Alertas
      proximosVencimientos: this.getProximosVencimientos(pagos),
      alertasMora: this.getAlertasMora(pagos),
      creditosEntregados: this.getCreditosEntregadosHoy(ministraciones.entregados),
      creditosDia: this.getCreditosDelDia(todosCreditosPeriodo),

      // Estadísticas
      tasaMorosidad: this.calculateTasaMorosidad(
        carteraMora,
        totals?.saldoPendiente || 0
      ),
      ingresosPeriodo: this.calculateTotalIngresos(pagosFiltrados),

      // Datos para gráficos (serán procesados en el componente)
      distribucionCartera: this.getDistribucionCarteraDataPersonalizada({ corriente, vencida, enCurso: 0, mora: carteraMora }),
      distribucionIngresos: this.getDistribucionIngresosData(pagos),
      moraPorAliadoChart: this.getMoraPorAliadoChartData(capitalRows, pagos, idsVencidos),

      // Tendencias reales
      incomeTrend: trendsData?.data?.incomeTrend || [],
      portfolioTrend: trendsData?.data?.portfolioTrend || [],

      // Totales generales
      // Totales generales
      totalPagosCount: pagos.length || 0,
      clientesDia: this.getUniqueClients(todosCreditosPeriodo),

      // Resumen de Entregas (Totales e Importes)
      resumenEntregado: {
        cantidad: todosCreditosPeriodo.filter((c: any) => c.estado_credito === 'ENTREGADO').length,
        monto: todosCreditosPeriodo.filter((c: any) => c.estado_credito === 'ENTREGADO').reduce((sum: number, c: any) => sum + parseFloat(c.total_a_pagar || 0), 0)
      },
      resumenVencido: {
        cantidad: capitalRows.filter((c: any) => c.estado_credito === 'VENCIDO').length,
        monto: capitalRows.filter((c: any) => c.estado_credito === 'VENCIDO').reduce((sum: number, c: any) => sum + parseFloat(c.saldo_total_pendiente || 0), 0)
      },
      resumenDevolucion: {
        cantidad: todosCreditosPeriodo.filter((c: any) => c.estado_credito === 'DEVOLUCIÓN' || c.estado_credito === 'DEVOLUCION').length,
        monto: todosCreditosPeriodo.filter((c: any) => c.estado_credito === 'DEVOLUCIÓN' || c.estado_credito === 'DEVOLUCION').reduce((sum: number, c: any) => sum + parseFloat(c.total_a_pagar || 0), 0)
      }
    };

    return dashboardData;
  }

  // Métodos auxiliares para transformar datos
  private getUniqueClients(creditos: any[]): number {
    const uniqueClients = new Set(creditos.map(c => c.cliente_nombre));
    return uniqueClients.size;
  }

  private getClientsWithMoraFromPagos(pagos: any[]): number {
    const clientsWithMora = new Set(
      pagos
        .filter(p => !p.pagado && p.dias_atraso > 0)
        .map(p => p.cliente_nombre)
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

  private calculateTotalDeudaAtrasada(pagos: any[]): number {
    return pagos
      .filter(p => !p.pagado && (p.dias_atraso > 0))
      .reduce((sum, p) => sum + (parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0)), 0);
  }

  private getTopAliados(creditos: any[]): any[] {
    const aliadosMap = new Map();

    creditos.forEach(credito => {
      const aliasOriginal = credito.nom_aliado || '';
      const nombreNormalizado = this.normalizeAliadoName(aliasOriginal);
      if (!nombreNormalizado) return;

      if (!aliadosMap.has(nombreNormalizado)) {
        aliadosMap.set(nombreNormalizado, {
          nombre: nombreNormalizado,
          creditos: 0,
          cartera: 0,
          entregados: 0
        });
      }

      const data = aliadosMap.get(nombreNormalizado);
      data.creditos++;
      data.cartera += parseFloat(credito.saldo_total_pendiente || 0);
      data.entregados += parseFloat(credito.total_a_pagar || 0);
    });

    return Array.from(aliadosMap.values())
      .sort((a, b) => b.cartera - a.cartera)
      .slice(0, 5); // Top 5 aliados
  }

  private getMoraPorAliado(creditos: any[], pagos: any[], idsVencidos: Set<number>): any[] {
    const moraMap = new Map();

    // 1. Agregar Cartera Vencida (Saldo Total)
    creditos.forEach(c => {
      const id = c.id_credito;
      const nombreNormalizado = this.normalizeAliadoName(c.nom_aliado);
      if (!nombreNormalizado) return;
      const saldo = parseFloat(c.saldo_total_pendiente || 0);

      if (idsVencidos.has(id) && saldo > 0) {
        if (!moraMap.has(nombreNormalizado)) {
          moraMap.set(nombreNormalizado, {
            nombre: nombreNormalizado,
            moraCorriente: 0,
            moraVencida: 0,
            creditosSet: new Set()
          });
        }
        const data = moraMap.get(nombreNormalizado);
        data.moraVencida += saldo;
        data.creditosSet.add(id);
      }
    });

    // 2. Agregar Mora Corriente (Arrears from Pagos)
    pagos.forEach(p => {
      const id = p.id_credito;
      // Si el crédito ya es considerado Vencido, ya contamos todo su saldo en moraVencida
      if (idsVencidos.has(id)) return;

      if (!p.pagado && p.dias_atraso > 0) {
        const nombreNormalizado = this.normalizeAliadoName(p.nom_aliado);
        if (!nombreNormalizado) return;
        const deuda = parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0);

        if (deuda > 0) {
          if (!moraMap.has(nombreNormalizado)) {
            moraMap.set(nombreNormalizado, {
              nombre: nombreNormalizado,
              moraCorriente: 0,
              moraVencida: 0,
              creditosSet: new Set()
            });
          }
          const data = moraMap.get(nombreNormalizado);
          data.moraCorriente += deuda;
          data.creditosSet.add(id);
        }
      }
    });

    return Array.from(moraMap.values())
      .map((item: any) => ({
        nombre: item.nombre,
        moraCorriente: item.moraCorriente,
        moraVencida: item.moraVencida,
        moraTotal: item.moraCorriente + item.moraVencida,
        mora: item.moraCorriente + item.moraVencida, // Alias for template
        creditos: item.creditosSet.size
      }))
      .sort((a, b) => b.moraTotal - a.moraTotal); // Ordenar por mora total
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
          telefono: p.telefono,
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
          telefono: p.telefono,
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
            aliado: p.nom_aliado?.trim(),
            telefono: p.telefono
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
    return entregados
      .map(e => ({
        cliente: e.cliente_nombre,
        monto_aprobado: parseFloat(e.total_a_pagar || 0),
        fecha: e.fecha_ministracion,
        aliado: e.nom_aliado?.trim()
      }));
  }

  private getCreditosDelDia(entregados: any[]): any[] {
    return entregados
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
      case 'sin-filtro':
        fechaLimite = new Date(0); // 1970-01-01
        break;
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

  private getMoraPorAliadoChartData(creditos: any[], pagos: any[], idsVencidos: Set<number>): any {
    const moraPorAliado = this.getMoraPorAliado(creditos, pagos, idsVencidos);
    return {
      labels: moraPorAliado.map(a => a.nombre),
      moraCorriente: moraPorAliado.map(a => a.moraCorriente),
      moraVencida: moraPorAliado.map(a => a.moraVencida)
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
      'sin-filtro': 'Histórico Completo',
      hoy: 'Hoy',
      semana: 'Esta semana',
      mes: 'Este mes',
      trimestre: 'Este trimestre'
    };
    return periodos[periodo] || 'Periodo no especificado';
  }

  exportarDashboard(params: any) {
    return this.http.get(
      `${environment.apiUrl}/dashboard/exportar`,
      {
        params,
        responseType: 'blob'
      }
    );
  }


  // Nuevo método para calcular cartera basada en ciclo dinámico (numero_pagos)
  private calculateCarteraByCycle(creditos: any[]): {
    corriente: number,
    vencida: number,
    enCurso: number,
    idsVencidos: Set<number>,
    countCorriente: number,
    countVencida: number
  } {
    let carteraCorriente = 0;
    let carteraVencida = 0;
    let countCorriente = 0;
    let countVencida = 0;
    const idsVencidos = new Set<number>();

    creditos.forEach(c => {
      const saldo = parseFloat(c.saldo_total_pendiente || 0);
      if (saldo <= 0) return;

      const id = c.id_credito;

      // 1. Priorizar el estado que ya viene calculado de la BD
      if (c.estado_cartera === 'CARTERA VENCIDA') {
        carteraVencida += saldo;
        countVencida++;
        if (id) idsVencidos.add(Number(id));
        return;
      }

      if (c.estado_cartera === 'CARTERA CORRIENTE' || c.estado_cartera === 'EN CURSO') {
        carteraCorriente += saldo;
        countCorriente++;
        return;
      }

      // 2. Fallback: Cálculo manual si no hay estado_cartera o es 'REGULAR'
      const hoy = new Date();

      // Si la BD nos envía la fecha de término exacta (más preciso para mensuales/quincenales)
      if (c.fecha_termino) {
        const fechaTermino = new Date(c.fecha_termino);
        // Margen de 7 días "de cajón"
        const fechaLimiteGracia = new Date(fechaTermino.getTime() + (7 * 24 * 60 * 60 * 1000));

        // Si ya pasó la fecha de término + 7 días y tiene algún pago vencido
        if (hoy > fechaLimiteGracia && (c.pagos_vencidos > 0 || c.estado_cartera === 'CARTERA VENCIDA')) {
          carteraVencida += saldo;
          countVencida++;
          if (id) idsVencidos.add(Number(id));
        } else {
          carteraCorriente += saldo;
          countCorriente++;
        }
        return;
      }

      // Si no hay fecha_termino, calculamos aproximado según tipo_vencimiento
      const numPagos = c.numero_pagos || 16;
      let diasPorPeriodo = 7;
      if (c.tipo_vencimiento === 'MENSUAL') diasPorPeriodo = 30;
      else if (c.tipo_vencimiento === 'QUINCENAL') diasPorPeriodo = 15;

      const diasCiclo = numPagos * diasPorPeriodo;

      // Intentar obtener fecha de inicio
      const fechaStr = c.fecha_ministracion || c.fecha_inicio || c.fecha_entrega;

      if (fechaStr) {
        const fechaInicio = new Date(fechaStr);
        const diffTime = Math.abs(hoy.getTime() - fechaInicio.getTime());
        const diasTranscurridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diasTranscurridos <= diasCiclo) {
          // Dentro del ciclo: Es cartera corriente
          carteraCorriente += saldo;
          countCorriente++;
        } else {
          // Fuera del ciclo: Es cartera vencida
          carteraVencida += saldo;
          countVencida++;
          if (id) idsVencidos.add(Number(id));
        }
      } else {
        // Fallback total si no hay ni estado ni fecha
        carteraCorriente += saldo;
        countCorriente++;
      }
    });

    return {
      corriente: Math.round(carteraCorriente * 100) / 100,
      vencida: Math.round(carteraVencida * 100) / 100,
      enCurso: 0,
      idsVencidos,
      countCorriente,
      countVencida
    };
  }

  private calculateMoraCorriente(pagos: any[], idsVencidos: Set<number>, validCreditIds: Set<number>): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // console.group('=== MORA CORRIENTE ===');
    // console.log(`Total pagos recibidos del backend: ${pagos.length}`);

    // 1. Agrupar pagos por crédito (créditos ENTREGADO no vencidos con pagos atrasados)
    const pagosPorCredito = new Map<number, Map<number, any>>();

    pagos.forEach(p => {
      const idCredito = Number(p.id_credito);
      const numPago = Number(p.numero_pago);
      if (!idCredito || !numPago) return;

      // Excluir créditos VENCIDO
      const estadoCredito = String(p.estado_credito || '').toUpperCase();
      if (estadoCredito === 'VENCIDO') return;

      // Solo créditos válidos (ENTREGADO u otros activos)
      if (!validCreditIds.has(idCredito)) return;

      // Para el dashboard, cualquier pago atrasado con al menos 1 día de atraso
      // de un crédito ENTREGADO debe contarse como mora corriente.
      // No excluimos aquí créditos porque el ciclo terminó, solo excluimos créditos VENCIDO.

      if (!pagosPorCredito.has(idCredito)) {
        pagosPorCredito.set(idCredito, new Map());
      }
      const pagosDelCredito = pagosPorCredito.get(idCredito)!;

      // Deduplicar por número de pago: conservar el de mayor monto_pagado
      if (!pagosDelCredito.has(numPago)) {
        pagosDelCredito.set(numPago, p);
      } else {
        const existingMonto = Number(pagosDelCredito.get(numPago)?.monto_pagado) || 0;
        const nuevoMonto = Number(p.monto_pagado) || 0;
        if (nuevoMonto > existingMonto) pagosDelCredito.set(numPago, p);
      }
    });

    // console.log(`Créditos ENTREGADO con ciclo activo: ${pagosPorCredito.size}`);

    let granTotal = 0;
    const detallesMora: any[] = [];

    // 2. Procesar cada crédito — misma lógica que financial-history.calcularAtrasos
    pagosPorCredito.forEach((pagosMap, idCredito) => {
      let deudaCredito = 0;
      const pagosContados: any[] = [];

      pagosMap.forEach(p => {
        // Parsear fecha de vencimiento
        let fechaVencimiento: Date;
        try {
          if (!p.fecha_vencimiento) return;
          const cleanFecha = String(p.fecha_vencimiento).split('T')[0];
          if (cleanFecha.includes('/')) {
            const [d, m, y] = cleanFecha.split('/').map(Number);
            fechaVencimiento = new Date(y, m - 1, d, 0, 0, 0, 0);
          } else {
            const [y, m, d] = cleanFecha.split('-').map(Number);
            fechaVencimiento = new Date(y, m - 1, d, 0, 0, 0, 0);
          }
          fechaVencimiento.setHours(0, 0, 0, 0);
        } catch { return; }

        // Solo pagos vencidos (fecha_vencimiento < HOY)
        if (fechaVencimiento >= hoy) return;

        // REGLA CLAVE (SQL): WHERE cp.pagado = false
        // Usar directamente el booleano 'pagado' de la BD es más seguro que el string 'estatus'
        if (p.pagado === true || String(p.pagado) === 'true') return;

        const montoEsperado = Number(p.total_semana) || 0;
        const montoPagado = Number(p.monto_pagado) || 0;

        // Suma: total_semana - monto_pagado
        const faltante = Math.max(0, montoEsperado - montoPagado);
        if (faltante > 0.01) {
          deudaCredito += faltante;
          pagosContados.push({
            '#': p.numero_pago,
            estatus: p.estatus, // Mantener estatus para debugging
            esperado: montoEsperado,
            pagado: montoPagado,
            faltante: Math.round(faltante * 100) / 100
          });
        }
      });

      if (deudaCredito > 0.01) {
        granTotal += deudaCredito;
        const deudaRedondeada = Math.round(deudaCredito * 100) / 100;
        detallesMora.push({ ID: idCredito, Mora: deudaRedondeada });
        // Log detallado por crédito
        // console.group(`[Crédito ${idCredito}] Mora: $${deudaRedondeada.toFixed(2)}`);
        // console.table(pagosContados);
        // console.groupEnd();
      }
    });

    const totalMora = Math.round(granTotal * 100) / 100;

    // console.log(`%c💰 Total Mora Corriente: $${totalMora.toFixed(2)}`, 'color: red; font-size: 16px; font-weight: bold;');
    // console.log(`%c📊 Créditos con mora: ${detallesMora.length}`, 'color: orange; font-weight: bold;');
    // console.table(detallesMora.sort((a, b) => a.ID - b.ID));
    // console.groupEnd();

    return totalMora;
  }

  private formatearMonedaDebugging(valor: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }

  private calculatePorcentaje(parte: number, total: number): number {
    if (!total) return 0;
    return parseFloat(((parte / total) * 100).toFixed(2));
  }

  private getDistribucionCarteraDataPersonalizada(distribucion: { corriente: number, vencida: number, enCurso: number, mora?: number }): any {
    return {
      vencida: distribucion.vencida,
      corriente: distribucion.corriente,
      mora: distribucion.mora || 0
    };
  }

  private normalizeAliadoName(name: string): string {
    if (!name) return '';
    let normalized = name.trim().toUpperCase();

    // Reglas de unificación
    if (normalized.includes('MARISELA')) return 'MARISELA';
    if (normalized.includes('OFICINA')) return 'OFICINA';
    if (normalized.includes('REBECA')) return 'REBECA';
    if (normalized.includes('YANNI')) return 'YANNI';

    // Para cualquier otro, quitar texto entre paréntesis y limpiar
    return normalized.split('(')[0].trim() || normalized;
  }

}