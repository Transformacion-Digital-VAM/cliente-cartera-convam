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
  moraCorriente: number;
  totalCreditos: number;
  creditosVigentes: number;
  creditosVencidos: number;
  clientesVigentes: number;
  clientesMora: number;
  porcentajeCarteraVencida: number;
  porcentajeCarteraMora: number;
  porcentajeMoraCorriente: number;
  porcentajeTotalDeudaAtrasada: number;

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

      Promise.all([
        this.getCapitalCarteraReport(filters).toPromise(),
        this.getMinistracionesReport(filters).toPromise(),
        this.getDetallePagosReport(filters).toPromise(),
        this.getResumenCarteraReport(filters).toPromise(),
        this.getDashboardTrends(filtros.periodo === 'anio' ? '1Y' : '6M').toPromise()
      ]).then(([capitalData, ministracionesData, pagosData, resumenData, trendsData]) => {
        const dashboardData = this.transformToDashboardData(
          capitalData,
          ministracionesData,
          pagosData,
          resumenData,
          trendsData,
          filtros.periodo || 'mes'
        );
        observer.next(dashboardData);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // ============================================
// MÉTODOS CORREGIDOS PARA DASHBOARD SERVICE
// ============================================

// 1. Método principal de transformación corregido
private transformToDashboardData(
  capitalData: any,
  ministracionesData: any,
  pagosData: any,
  resumenData: any,
  trendsData: any,
  periodo: string
): DashboardData {
  const capitalRows = capitalData?.data || [];
  const totals = capitalData?.totals || {};
  const ministraciones = ministracionesData?.data?.data || { 
    entregados: [], 
    devolucion: [], 
    pendientes: [] 
  };
  const pagos = pagosData?.data || [];
  const resumenTotals = resumenData?.totals || {};

  console.log('=== DEBUG DASHBOARD ===');
  console.log('Capital Rows:', capitalRows.length);
  console.log('Totals:', totals);
  console.log('Pagos:', pagos.length);
  
  // DEBUG: Ver estructura de créditos
  if (capitalRows.length > 0) {
    console.log('Primer crédito:', capitalRows[0]);
    console.log('Estados de créditos únicos:', [...new Set(capitalRows.map((c: any) => c.estado_credito))]);
  }
  
  // DEBUG: Ver estructura de pagos
  if (pagos.length > 0) {
    console.log('Primer pago:', pagos[0]);
    const pagosNoPagados = pagos.filter((p: any) => !p.pagado);
    console.log('Pagos no pagados:', pagosNoPagados.length);
    if (pagosNoPagados.length > 0) {
      console.log('Primer pago no pagado:', pagosNoPagados[0]);
    }
  }

  // CALCULAR CARTERA TOTAL: Suma de saldo_total_pendiente de créditos activos
  // Usar los totales del backend que ya vienen calculados
  const carteraTotal = parseFloat(totals?.saldoPendiente || 0);

  console.log('Cartera Total (desde totals.saldoPendiente):', carteraTotal);

  // CALCULAR CARTERA POR CICLO
  const { 
    corriente, 
    vencida, 
    idsVencidos, 
    countCorriente, 
    countVencida,
    idsCorrientes
  } = this.calculateCarteraByCycleFixed(capitalRows);

  console.log('Cartera Corriente (saldo pendiente):', corriente);
  console.log('Cartera Vencida (saldo pendiente):', vencida);
  console.log('Créditos corrientes:', countCorriente);
  console.log('Créditos vencidos:', countVencida);

  // CALCULAR MORA DE CARTERA CORRIENTE
  const moraCorriente = this.calculateMoraCorrienteFixed(pagos, idsCorrientes);
  console.log('Mora Corriente (pagos atrasados):', moraCorriente);

  // CARTERA EN MORA TOTAL = Mora Corriente + Cartera Vencida
  const carteraMora = moraCorriente + vencida;
  console.log('Cartera Mora Total:', carteraMora);

  // ========================================================================
  // CORRECCIÓN DE GRÁFICA: Sincronizar último mes con datos reales
  // ========================================================================
  let portfolioTrend = trendsData?.data?.portfolioTrend || [];
  
  if (portfolioTrend.length > 0) {
    // Asegurar orden cronológico
    portfolioTrend.sort((a: any, b: any) => a.mes.localeCompare(b.mes));
    
    const ultimo = portfolioTrend[portfolioTrend.length - 1];
    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    
    // Si el último dato de la gráfica corresponde al mes actual, sobrescribimos
    // sus valores con los totales calculados en tiempo real para que coincidan.
    if (ultimo.mes === mesActual) {
      console.log('Sincronizando gráfica con totales reales:', { carteraTotal, carteraMora });
      ultimo.cartera_total = carteraTotal;
      ultimo.mora = carteraMora;
      ultimo.mora_corriente = moraCorriente;
      ultimo.mora_vencida = vencida;
    }
  }

  const dashboardData: DashboardData = {
    totalCreditosCount: resumenTotals?.totalCreditos || 0,
    
    // VALORES CORREGIDOS
    carteraTotal: carteraTotal,
    carteraCorriente: corriente,
    carteraVencida: vencida,
    carteraMora: carteraMora,
    moraCorriente: moraCorriente,
    
    totalCreditos: resumenTotals?.totalCreditos || 0,
    creditosVigentes: countCorriente,
    creditosVencidos: countVencida,
    
    clientesVigentes: this.getUniqueClients(capitalRows),
    clientesMora: this.getClientsWithMoraFixed(pagos, capitalRows, idsVencidos),
    
    // Porcentajes corregidos
    porcentajeCarteraVencida: this.calculatePorcentaje(vencida, carteraTotal),
    porcentajeCarteraMora: this.calculatePorcentaje(carteraMora, carteraTotal),
    porcentajeMoraCorriente: this.calculatePorcentaje(moraCorriente, carteraTotal),
    porcentajeTotalDeudaAtrasada: this.calculatePorcentaje(carteraMora, carteraTotal),
    
    // Ingresos
    ingresosTotalGeneral: this.calculateTotalIngresos(pagos),
    ingresosCapitalTotal: this.calculateCapitalPagado(pagos),
    ingresosInteresesTotal: this.calculateInteresesPagados(pagos),
    ingresosMoratoriosTotal: this.calculateMoratoriosPagados(pagos),
    totalDeudaAtrasada: carteraMora,
    
    // Ministraciones
    ministracionesEntregados: this.calculateTotalMinistraciones(ministraciones.entregados),
    ministracionesDevolucion: this.calculateTotalMinistraciones(ministraciones.devolucion),
    ministracionesTotal: this.calculateTotalMinistraciones(ministraciones.entregados) -
      this.calculateTotalMinistraciones(ministraciones.devolucion),
    
    // Aliados
    topAliados: this.getTopAliadosFixed(capitalRows),
    moraPorAliado: this.getMoraPorAliadoFixed(capitalRows, pagos, idsVencidos, idsCorrientes),
    
    // Alertas
    proximosVencimientos: this.getProximosVencimientos(pagos),
    alertasMora: this.getAlertasMoraFixed(pagos, capitalRows),
    creditosEntregados: this.getCreditosEntregadosHoy(ministraciones.entregados),
    creditosDia: this.getCreditosDelDia([
      ...(ministraciones.entregados || []),
      ...(ministraciones.devolucion || []),
      ...(ministraciones.pendientes || [])
    ]),
    
    // Estadísticas
    tasaMorosidad: this.calculatePorcentaje(carteraMora, carteraTotal),
    ingresosPeriodo: this.calculateIngresosPeriodo(pagos, periodo),
    
    // Gráficos
    distribucionCartera: {
      corriente: corriente,
      vencida: vencida,
      mora: carteraMora
    },
    distribucionIngresos: this.getDistribucionIngresosData(pagos),
    moraPorAliadoChart: this.getMoraPorAliadoChartDataFixed(
      capitalRows, 
      pagos, 
      idsVencidos, 
      idsCorrientes
    ),
    
    // Tendencias
    incomeTrend: trendsData?.data?.incomeTrend || [],
    portfolioTrend: portfolioTrend,
    
    totalPagosCount: pagos.length || 0,
    clientesDia: this.getUniqueClients([
      ...(ministraciones.entregados || []),
      ...(ministraciones.devolucion || []),
      ...(ministraciones.pendientes || [])
    ])
  };

  console.log('=== DASHBOARD DATA FINAL ===');
  console.log('Cartera Total:', dashboardData.carteraTotal);
  console.log('Cartera Corriente:', dashboardData.carteraCorriente);
  console.log('Cartera Vencida:', dashboardData.carteraVencida);
  console.log('Cartera Mora:', dashboardData.carteraMora);
  console.log('========================');

  return dashboardData;
}

// 2. Método corregido para calcular cartera por ciclo
private calculateCarteraByCycleFixed(creditos: any[]): {
  corriente: number,
  vencida: number,
  idsVencidos: Set<number>,
  countCorriente: number,
  countVencida: number,
  idsCorrientes: Set<number>
} {
  const hoy = new Date();
  const DIAS_CICLO = 16 * 7; // 112 días
  
  let carteraCorriente = 0;
  let carteraVencida = 0;
  let countCorriente = 0;
  let countVencida = 0;
  const idsVencidos = new Set<number>();
  const idsCorrientes = new Set<number>();

  creditos.forEach((c: any) => {
    // Considerar todos los créditos con saldo pendiente, no filtrar por estado
    const saldo = parseFloat(c.saldo_total_pendiente || 0);
    if (saldo <= 0) return; // Si ya pagó todo, no contar
    
    const id = parseInt(c.id_credito);
    const fechaStr = c.fecha_ministracion || c.fecha_inicio || c.fecha_entrega;
    
    if (!fechaStr) {
      // Si no hay fecha, usar estado_cartera para clasificar
      if (c.estado_cartera === 'CARTERA VENCIDA') {
        carteraVencida += saldo;
        countVencida++;
        idsVencidos.add(id);
      } else {
        // Por defecto es corriente
        carteraCorriente += saldo;
        countCorriente++;
        idsCorrientes.add(id);
      }
      return;
    }
    
    const fechaInicio = new Date(fechaStr);
    const diffTime = hoy.getTime() - fechaInicio.getTime();
    const diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diasTranscurridos <= DIAS_CICLO) {
      // DENTRO del ciclo = CORRIENTE
      carteraCorriente += saldo;
      countCorriente++;
      idsCorrientes.add(id);
    } else {
      // FUERA del ciclo = VENCIDA
      carteraVencida += saldo;
      countVencida++;
      idsVencidos.add(id);
    }
  });

  return {
    corriente: carteraCorriente,
    vencida: carteraVencida,
    idsVencidos,
    countCorriente,
    countVencida,
    idsCorrientes
  };
}

// 3. Método corregido para calcular mora corriente
private calculateMoraCorrienteFixed(pagos: any[], idsCorrientes: Set<number>): number {
  let moraCorriente = 0;
  const hoy = new Date();
  
  pagos.forEach((p: any) => {
    const id = parseInt(p.id_credito);
    
    // Solo pagos de créditos CORRIENTES (no vencidos)
    if (!idsCorrientes.has(id)) return;
    
    // Solo pagos NO pagados
    if (p.pagado) return;
    
    // Verificar si está vencido
    if (!p.fecha_vencimiento) return;
    
    const fechaVenc = new Date(p.fecha_vencimiento);
    const diasAtraso = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
    
    // Solo si está atrasado (fecha vencimiento < hoy)
    if (diasAtraso > 0) {
      const montoPendiente = parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0);
      moraCorriente += montoPendiente;
    }
  });
  
  return moraCorriente;
}

// 4. Método corregido para clientes con mora
private getClientsWithMoraFixed(
  pagos: any[], 
  creditos: any[], 
  idsVencidos: Set<number>
): number {
  const clientesConMora = new Set<string>();
  const hoy = new Date();
  
  // 1. Clientes con créditos vencidos (fuera de ciclo)
  creditos.forEach((c: any) => {
    const id = parseInt(c.id_credito);
    if (idsVencidos.has(id)) {
      clientesConMora.add(c.cliente_nombre);
    }
  });
  
  // 2. Clientes con pagos atrasados
  pagos.forEach((p: any) => {
    if (p.pagado) return;
    
    if (p.fecha_vencimiento) {
      const fechaVenc = new Date(p.fecha_vencimiento);
      const diasAtraso = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasAtraso > 0) {
        clientesConMora.add(p.cliente_nombre);
      }
    }
  });
  
  return clientesConMora.size;
}

// 5. Método corregido para top aliados
private getTopAliadosFixed(creditos: any[]): any[] {
  const aliadosMap = new Map();

  creditos.forEach((credito: any) => {
    // Considerar todos los créditos con saldo pendiente
    const saldo = parseFloat(credito.saldo_total_pendiente || 0);
    if (saldo <= 0) return;
    
    const aliado = credito.nom_aliado?.trim() || 'Sin Aliado';
    const totalAPagar = parseFloat(credito.total_a_pagar || 0);

    if (!aliadosMap.has(aliado)) {
      aliadosMap.set(aliado, {
        nombre: aliado,
        creditos: 0,
        cartera: 0,
        entregados: 0
      });
    }

    const data = aliadosMap.get(aliado);
    data.creditos++;
    data.cartera += saldo;
    data.entregados += totalAPagar;
  });

  return Array.from(aliadosMap.values())
    .sort((a, b) => b.cartera - a.cartera)
    .slice(0, 5);
}

// 6. Método corregido para mora por aliado
private getMoraPorAliadoFixed(
  creditos: any[], 
  pagos: any[], 
  idsVencidos: Set<number>,
  idsCorrientes: Set<number>
): any[] {
  const moraMap = new Map();
  const hoy = new Date();

  // 1. Mora de créditos VENCIDOS (todo el saldo pendiente)
  creditos.forEach((c: any) => {
    const id = parseInt(c.id_credito);
    if (!idsVencidos.has(id)) return;
    
    const aliado = c.nom_aliado?.trim() || 'Sin Aliado';
    const saldo = parseFloat(c.saldo_total_pendiente || 0);
    
    if (saldo > 0) {
      if (!moraMap.has(aliado)) {
        moraMap.set(aliado, {
          nombre: aliado,
          moraCorriente: 0,
          moraVencida: 0,
          creditos: new Set()
        });
      }
      
      const data = moraMap.get(aliado);
      data.moraVencida += saldo;
      data.creditos.add(id);
    }
  });

  // 2. Mora de créditos CORRIENTES (solo pagos atrasados)
  pagos.forEach((p: any) => {
    const id = parseInt(p.id_credito);
    if (!idsCorrientes.has(id)) return; 
    if (p.pagado) return;
    
    if (!p.fecha_vencimiento) return;
    
    const fechaVenc = new Date(p.fecha_vencimiento);
    const diasAtraso = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasAtraso > 0) {
      const aliado = p.nom_aliado?.trim() || 'Sin Aliado';
      const montoPendiente = parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0);
      
      if (montoPendiente > 0) {
        if (!moraMap.has(aliado)) {
          moraMap.set(aliado, {
            nombre: aliado,
            moraCorriente: 0,
            moraVencida: 0,
            creditos: new Set()
          });
        }
        
        const data = moraMap.get(aliado);
        data.moraCorriente += montoPendiente;
        data.creditos.add(id);
      }
    }
  });

  return Array.from(moraMap.values())
    .map((item: any) => ({
      nombre: item.nombre,
      moraCorriente: item.moraCorriente,
      moraVencida: item.moraVencida,
      mora: item.moraCorriente + item.moraVencida,
      creditos: item.creditos.size
    }))
    .filter(item => item.mora > 0)
    .sort((a, b) => b.mora - a.mora);
}

// 7. Método corregido para alertas de mora
private getAlertasMoraFixed(pagos: any[], creditos: any[]): any[] {
  const alertasMap = new Map();
  const hoy = new Date();
  
  // Crear mapa de créditos para obtener info adicional
  const creditosMap = new Map();
  creditos.forEach((c: any) => {
    creditosMap.set(parseInt(c.id_credito), c);
  });

  pagos.forEach((p: any) => {
    if (p.pagado) return;
    
    if (!p.fecha_vencimiento) return;
    
    const fechaVenc = new Date(p.fecha_vencimiento);
    const diasAtraso = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasAtraso > 0) {
      const key = `${p.id_credito}`;
      const montoPendiente = parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0);
      
      if (!alertasMap.has(key)) {
        const credito = creditosMap.get(parseInt(p.id_credito));
        alertasMap.set(key, {
          cliente: p.cliente_nombre,
          dias_mora: diasAtraso,
          monto_vencido: montoPendiente,
          saldo_pendiente: parseFloat(credito?.saldo_total_pendiente || 0),
          aliado: p.nom_aliado?.trim() || 'Sin Aliado',
          telefono: p.telefono
        });
      } else {
        const alerta = alertasMap.get(key);
        alerta.monto_vencido += montoPendiente;
        alerta.dias_mora = Math.max(alerta.dias_mora, diasAtraso);
      }
    }
  });

  return Array.from(alertasMap.values())
    .sort((a: any, b: any) => b.dias_mora - a.dias_mora)
    .slice(0, 10);
}

// 8. Método corregido para datos de gráfico mora por aliado
private getMoraPorAliadoChartDataFixed(
  creditos: any[], 
  pagos: any[], 
  idsVencidos: Set<number>,
  idsCorrientes: Set<number>
): any {
  const moraPorAliado = this.getMoraPorAliadoFixed(
    creditos, 
    pagos, 
    idsVencidos, 
    idsCorrientes
  );
  
  return {
    labels: moraPorAliado.map((a: any) => a.nombre),
    moraCorriente: moraPorAliado.map((a: any) => a.moraCorriente),
    moraVencida: moraPorAliado.map((a: any) => a.moraVencida)
  };
}

private calculateCarteraTotal(creditos: any[]): number {
  return creditos
    .filter(c => c.estado_credito === 'ENTREGADO' || c.estado_credito === 'VENCIDO')
    .reduce((sum, c) => sum + parseFloat(c.total_a_pagar || 0), 0);
}

// Nuevo método para calcular Cartera Corriente según requerimiento
private calculateCarteraCorriente(creditos: any[]): number {
  const hoy = new Date();
  const DIAS_CICLO = 16 * 7;
  let carteraCorriente = 0;

  creditos.forEach(c => {
    if (c.estado_credito === 'ENTREGADO') {
      const fechaStr = c.fecha_ministracion || c.fecha_inicio || c.fecha_entrega;
      if (fechaStr) {
        const fechaInicio = new Date(fechaStr);
        const diffTime = Math.abs(hoy.getTime() - fechaInicio.getTime());
        const diasTranscurridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Solo créditos dentro del ciclo de 16 semanas
        if (diasTranscurridos <= DIAS_CICLO) {
          const totalAPagar = parseFloat(c.total_a_pagar || 0);
          const saldoPendiente = parseFloat(c.saldo_total_pendiente || 0);
          carteraCorriente += (totalAPagar - saldoPendiente);
        }
      }
    }
  });

  return carteraCorriente;
}

// Modifica el método calculateCarteraByCycle para mantener consistencia
private calculateCarteraByCycle(creditos: any[]): {
  corriente: number,
  vencida: number,
  enCurso: number,
  idsVencidos: Set<number>,
  countCorriente: number,
  countVencida: number
} {
  const hoy = new Date();
  // 16 semanas * 7 días = 112 días
  const DIAS_CICLO = 16 * 7;

  let carteraCorriente = 0; // Saldo pendiente de créditos dentro del ciclo
  let carteraVencida = 0;   // Saldo pendiente de créditos fuera del ciclo
  let countCorriente = 0;
  let countVencida = 0;
  const idsVencidos = new Set<number>();

  creditos.forEach(c => {
    // Solo considerar créditos ENTREGADOs para la clasificación por ciclo
    if (c.estado_credito !== 'ENTREGADO') return;
    
    const saldo = parseFloat(c.saldo_total_pendiente || 0);
    if (saldo <= 0) return;

    // Intentar obtener fecha de inicio
    const fechaStr = c.fecha_ministracion || c.fecha_inicio || c.fecha_entrega;
    const id = c.id_credito;

    if (fechaStr) {
      const fechaInicio = new Date(fechaStr);
      const diffTime = Math.abs(hoy.getTime() - fechaInicio.getTime());
      const diasTranscurridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diasTranscurridos <= DIAS_CICLO) {
        // Dentro del ciclo (<= 16 semanas): Es cartera corriente
        carteraCorriente += saldo;
        countCorriente++;
      } else {
        // Fuera del ciclo: Es cartera vencida
        carteraVencida += saldo;
        countVencida++;
        if (id) idsVencidos.add(id);
      }
    } else {
      // Fallback - usar estado_cartera si no hay fecha
      if (c.estado_cartera === 'CARTERA VENCIDA') {
        carteraVencida += saldo;
        countVencida++;
        if (id) idsVencidos.add(id);
      } else {
        carteraCorriente += saldo;
        countCorriente++;
      }
    }
  });

  return {
    corriente: carteraCorriente,
    vencida: carteraVencida,
    enCurso: 0,
    idsVencidos,
    countCorriente,
    countVencida
  };
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

  private getMoraPorAliado(creditos: any[], pagos: any[], idsVencidos: Set<number>): any[] {
    const moraMap = new Map();

    // 1. Agregar Cartera Vencida (Saldo Total)
    creditos.forEach(c => {
      const id = c.id_credito;
      const aliado = c.nom_aliado?.trim();
      if (!aliado) return;
      const saldo = parseFloat(c.saldo_total_pendiente || 0);

      if (idsVencidos.has(id) && saldo > 0) {
        if (!moraMap.has(aliado)) {
          moraMap.set(aliado, {
            nombre: aliado,
            moraCorriente: 0,
            moraVencida: 0,
            creditosSet: new Set()
          });
        }
        const data = moraMap.get(aliado);
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
        const aliado = p.nom_aliado?.trim();
        if (!aliado) return;
        const deuda = parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0);

        if (deuda > 0) {
          if (!moraMap.has(aliado)) {
            moraMap.set(aliado, {
              nombre: aliado,
              moraCorriente: 0,
              moraVencida: 0,
              creditosSet: new Set()
            });
          }
          const data = moraMap.get(aliado);
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

  // ==========================================
  // NUEVO: Método genérico para descargar reportes (Excel/PDF)
  // ==========================================
  descargarReporte(
    tipoReporte: 'ministraciones' | 'capital-cartera' | 'detalle-pagos', 
    formato: 'excel' | 'pdf', 
    filtros: any = {}
  ): Observable<Blob> {
    let params = new HttpParams().set('format', formato);
    
    // Agregar filtros existentes (fechas, etc.)
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.append(key, filtros[key]);
        }
      });
    }

    return this.http.get(`${this.baseUrl}/${tipoReporte}`, { params, responseType: 'blob' });
  }

  // Nuevo método para calcular cartera basada en ciclo de 16 semanas
  

  private calculateMoraCorriente(pagos: any[], idsVencidos: Set<number>): number {
    return pagos
      .filter(p => !p.pagado && (p.dias_atraso > 0) && !idsVencidos.has(p.id_credito))
      .reduce((sum, p) => sum + (parseFloat(p.total_semana || 0) - parseFloat(p.monto_pagado || 0)), 0);
  }

  private calculatePorcentaje(parte: number, total: number): number {
    if (!total) return 0;
    return parseFloat(((parte / total) * 100).toFixed(2));
  }


  

}
