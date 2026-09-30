import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@angular/common';
import { DashboardData } from './dashboard.service';

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  filename?: string;
  includeCharts?: boolean;
  includeTables?: boolean;
  includeSummary?: boolean;
}

export interface DashboardReportOptions {
  dashboardData: DashboardData;
  periodo: string;
  charts?: {
    distribucion?: string;
    ingresos?: string;
    moraAliado?: string;
    evolucion?: string;
  };
  filename?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  // =========================================================================
  // REPORTE PDF COMPLETO DEL DASHBOARD (HOJA HORIZONTAL / LANDSCAPE)
  // =========================================================================
  exportDashboardReportPDF(options: DashboardReportOptions): void {
    const { dashboardData, periodo, charts, filename } = options;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();   // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);        // 277mm
    let yPos = margin;

    // Colores del tema corporativo CONVAM
    const primaryColor = [30, 58, 138];     // #1E3A8A (Azul corporativo)
    const primaryDark = [15, 23, 42];       // #0F172A (Slate oscuro)
    const textDark = [30, 41, 59];          // #1E293B
    const textMuted = [100, 116, 139];      // #64748B
    const bgCard = [248, 250, 252];         // #F8FAFC
    const borderCard = [226, 232, 240];     // #E2E8F0
    const successColor = [22, 163, 74];     // #16A34A (Verde)
    const dangerColor = [220, 38, 38];      // #DC2626 (Rojo)
    const warningColor = [217, 119, 6];     // #D97706 (Ámbar)

    // Helper para verificar salto de página
    const checkPageBreak = (neededHeight: number): boolean => {
      if (yPos + neededHeight > pageHeight - 14) {
        doc.addPage();
        yPos = margin + 4;
        return true;
      }
      return false;
    };

    // -------------------------------------------------------------
    // 1. ENCABEZADO EJECUTIVO (HORIZONTAL)
    // -------------------------------------------------------------
    const headerHeight = 16;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, yPos, contentWidth, headerHeight, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('CONVAM  •  SISTEMA DE CARTERA', margin + 6, yPos + 6.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 231, 255);
    doc.text('REPORTE EJECUTIVO DEL DASHBOARD GENERAL', margin + 6, yPos + 12);

    doc.setFontSize(8);
    doc.text(`Emisión: ${formatDate(new Date(), 'dd/MM/yyyy HH:mm:ss', 'en-US')}`, pageWidth - margin - 6, yPos + 6.5, { align: 'right' });
    doc.text(`Período: ${periodo || 'Histórico Completo'}`, pageWidth - margin - 6, yPos + 12, { align: 'right' });

    yPos += headerHeight + 3.5;

    // -------------------------------------------------------------
    // 2. MATRIZ DE TOTALES Y KPIS PRINCIPALES (TARJETAS EN 4 COLUMNAS)
    // -------------------------------------------------------------
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('1. RESUMEN EJECUTIVO Y TOTALES DE CARTERA', margin, yPos);
    yPos += 3;

    const colWidth = (contentWidth - 9) / 4; // 4 columnas
    const cardHeight = 13;

    const drawCard = (x: number, y: number, title: string, value: string, subtitle: string, accentRgb: number[]) => {
      // Fondo y borde
      doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
      doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, colWidth, cardHeight, 1.5, 1.5, 'FD');

      // Barra de acento lateral
      doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      doc.roundedRect(x, y, 2.2, cardHeight, 1, 1, 'F');

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(title.toUpperCase(), x + 4.5, y + 3.8);

      // Valor principal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      doc.text(value, x + 4.5, y + 8.5);

      // Subtítulo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(subtitle, x + 4.5, y + 11.8);
    };

    const totalCreds = dashboardData.totalCreditosCount || dashboardData.totalCreditos || 0;
    const pctCorriente = dashboardData.carteraTotal ? ((dashboardData.carteraCorriente / dashboardData.carteraTotal) * 100).toFixed(1) : '0.0';

    // Fila 1: Cartera Total, Cartera Corriente, Cartera Vencida, Mora Total
    drawCard(
      margin,
      yPos,
      'Cartera Total',
      this.formatCurrency(dashboardData.carteraTotal || 0),
      `${totalCreds} créditos registrados`,
      primaryColor
    );

    drawCard(
      margin + colWidth + 3,
      yPos,
      'Cartera Corriente',
      this.formatCurrency(dashboardData.carteraCorriente || 0),
      `${pctCorriente}%  •  ${dashboardData.creditosVigentes || 0} vigentes`,
      successColor
    );

    drawCard(
      margin + (colWidth * 2) + 6,
      yPos,
      'Cartera Vencida',
      this.formatCurrency(dashboardData.carteraVencida || 0),
      `${dashboardData.porcentajeCarteraVencida || 0}%  •  ${dashboardData.creditosVencidos || 0} vencidos`,
      warningColor
    );

    drawCard(
      margin + (colWidth * 3) + 9,
      yPos,
      'Mora Total',
      this.formatCurrency(dashboardData.carteraMora || 0),
      `${dashboardData.porcentajeCarteraMora || 0}%  •  ${dashboardData.clientesMora || 0} clientes mora`,
      dangerColor
    );

    yPos += cardHeight + 2.5;

    // Fila 2: Mora Corriente, Mora Vencida, Ingresos Acumulados, Tasa Morosidad / Cobranza
    drawCard(
      margin,
      yPos,
      'Mora Corriente (Ciclo)',
      this.formatCurrency(dashboardData.moraCorriente || 0),
      `${dashboardData.porcentajeMoraCorriente || 0}% de cartera total`,
      dangerColor
    );

    drawCard(
      margin + colWidth + 3,
      yPos,
      'Mora Vencida (Fuera ciclo)',
      this.formatCurrency(dashboardData.carteraVencida || 0),
      `${dashboardData.porcentajeCarteraVencida || 0}% de cartera total`,
      dangerColor
    );

    drawCard(
      margin + (colWidth * 2) + 6,
      yPos,
      'Ingresos Acumulados',
      this.formatCurrency(dashboardData.ingresosTotalGeneral || 0),
      `Cap: ${this.formatCurrency(dashboardData.ingresosCapitalTotal || 0)}  •  Int: ${this.formatCurrency(dashboardData.ingresosInteresesTotal || 0)}`,
      [37, 99, 235]
    );

    drawCard(
      margin + (colWidth * 3) + 9,
      yPos,
      'Tasa Morosidad / Período',
      `${dashboardData.tasaMorosidad || 0}%`,
      `Ing. Período: ${this.formatCurrency(dashboardData.ingresosPeriodo || 0)}`,
      dashboardData.tasaMorosidad > 10 ? dangerColor : successColor
    );

    yPos += cardHeight + 2.5;

    // Mini barra de resumen de movimientos del período
    if (dashboardData.resumenEntregado || dashboardData.resumenVencido || dashboardData.resumenDevolucion) {
      doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
      doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
      doc.roundedRect(margin, yPos, contentWidth, 7, 1.2, 1.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`Movimientos del Período (${periodo}):`, margin + 4, yPos + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      const entStr = `Entregados: ${dashboardData.resumenEntregado?.cantidad || 0} (${this.formatCurrency(dashboardData.resumenEntregado?.monto || 0)})`;
      const vencStr = `Vencidos: ${dashboardData.resumenVencido?.cantidad || 0} (${this.formatCurrency(dashboardData.resumenVencido?.monto || 0)})`;
      const devStr = `Devolución: ${dashboardData.resumenDevolucion?.cantidad || 0} (${this.formatCurrency(dashboardData.resumenDevolucion?.monto || 0)})`;

      doc.text(entStr, margin + 65, yPos + 4.5);
      doc.text(vencStr, margin + 135, yPos + 4.5);
      doc.text(devStr, margin + 205, yPos + 4.5);

      yPos += 9.5;
    }

    // -------------------------------------------------------------
    // 3. GRÁFICAS DEL DASHBOARD (3 EN LÍNEA EN HORIZONTAL)
    // -------------------------------------------------------------
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('2. GRÁFICAS Y COMPORTAMIENTO DE CARTERA', margin, yPos);
    yPos += 3;

    // Calculamos el ancho de 3 cajas de gráficas lado a lado
    const chartCols = 3;
    const chartBoxWidth = (contentWidth - ((chartCols - 1) * 3)) / chartCols; // ~89.6mm cada una
    const chartBoxHeight = 100; // Gran resolución vertical en la página horizontal

    // Gráfica 1: Distribución de Cartera
    if (charts?.distribucion) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
      doc.roundedRect(margin, yPos, chartBoxWidth, chartBoxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Distribución de Cartera', margin + 3.5, yPos + 5);

      try {
        doc.addImage(charts.distribucion, 'PNG', margin + 2, yPos + 7, chartBoxWidth - 4, chartBoxHeight - 9, undefined, 'FAST');
      } catch (e) {
        console.warn('No se pudo insertar la gráfica de distribución:', e);
      }
    }

    // Gráfica 2: Ingresos Mensuales
    if (charts?.ingresos) {
      const xPos2 = margin + chartBoxWidth + 3;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
      doc.roundedRect(xPos2, yPos, chartBoxWidth, chartBoxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Tendencia de Ingresos Mensuales', xPos2 + 3.5, yPos + 5);

      try {
        doc.addImage(charts.ingresos, 'PNG', xPos2 + 2, yPos + 7, chartBoxWidth - 4, chartBoxHeight - 9, undefined, 'FAST');
      } catch (e) {
        console.warn('No se pudo insertar la gráfica de ingresos:', e);
      }
    }

    // Gráfica 3: Mora por Aliado
    if (charts?.moraAliado) {
      const xPos3 = margin + (chartBoxWidth * 2) + 6;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
      doc.roundedRect(xPos3, yPos, chartBoxWidth, chartBoxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Distribución de Mora por Aliado', xPos3 + 3.5, yPos + 5);

      try {
        doc.addImage(charts.moraAliado, 'PNG', xPos3 + 2, yPos + 7, chartBoxWidth - 4, chartBoxHeight - 9, undefined, 'FAST');
      } catch (e) {
        console.warn('No se pudo insertar la gráfica de mora por aliado:', e);
      }
    }

    // -------------------------------------------------------------
    // 4. TABLAS DE DESGLOSE Y ANÁLISIS (PÁGINA 2)
    // -------------------------------------------------------------
    doc.addPage();
    yPos = margin + 4;

    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. DESGLOSE DETALLADO POR ALIADOS Y CARTERA', margin, yPos);
    yPos += 3;

    // Tabla: Top Aliados por Cartera
    if (dashboardData.topAliados && dashboardData.topAliados.length > 0) {
      const topAliadosRows = dashboardData.topAliados.map((aliado: any, idx: number) => {
        const pct = dashboardData.carteraTotal ? ((aliado.cartera / dashboardData.carteraTotal) * 100).toFixed(2) : '0.00';
        return [
          `${idx + 1}`,
          aliado.nombre || 'N/A',
          `${aliado.creditos || 0}`,
          this.formatCurrency(aliado.cartera || 0),
          this.formatCurrency(aliado.entregados || 0),
          `${pct}%`
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Aliado Comercial', 'Créditos', 'Saldo Cartera', 'Total Colocado', '% Cartera']],
        body: topAliadosRows,
        margin: { left: margin, right: margin },
        theme: 'striped',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: textDark as [number, number, number]
        },
        headStyles: {
          fillColor: primaryColor as [number, number, number],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 45, halign: 'right' },
          4: { cellWidth: 45, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // Tabla: Mora por Aliado
    if (dashboardData.moraPorAliado && dashboardData.moraPorAliado.length > 0) {
      checkPageBreak(40);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
      doc.text('Mora Desglosada por Aliado', margin, yPos);
      yPos += 2;

      const moraRows = dashboardData.moraPorAliado.map((aliado: any) => {
        const pct = dashboardData.carteraMora ? ((aliado.moraTotal / dashboardData.carteraMora) * 100).toFixed(2) : '0.00';
        return [
          aliado.nombre || 'N/A',
          `${aliado.creditos || 0}`,
          this.formatCurrency(aliado.moraCorriente || 0),
          this.formatCurrency(aliado.moraVencida || 0),
          this.formatCurrency(aliado.moraTotal || aliado.mora || 0),
          `${pct}%`
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Aliado Comercial', 'Créditos', 'Mora en Ciclo', 'Mora Fuera Ciclo', 'Mora Total', '% Mora']],
        body: moraRows,
        margin: { left: margin, right: margin },
        theme: 'striped',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: textDark as [number, number, number]
        },
        headStyles: {
          fillColor: [185, 28, 28], // Rojo oscuro
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 45, halign: 'right' },
          3: { cellWidth: 45, halign: 'right' },
          4: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
          5: { cellWidth: 30, halign: 'right' }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // Tabla: Próximos Vencimientos
    if (dashboardData.proximosVencimientos && dashboardData.proximosVencimientos.length > 0) {
      checkPageBreak(40);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
      doc.text('Próximos Vencimientos de Pago', margin, yPos);
      yPos += 2;

      const vencRows = dashboardData.proximosVencimientos.slice(0, 15).map((v: any) => [
        (v.cliente || 'N/A').substring(0, 32),
        v.credito_id ? `#${v.credito_id}` : 'N/A',
        `Pago ${v.numero_pago || 'N/A'}`,
        this.formatCurrency(v.monto || 0),
        v.fecha ? formatDate(v.fecha, 'dd/MM/yyyy', 'en-US') : 'N/A',
        `${v.dias} días`,
        (v.aliado || 'N/A').substring(0, 24)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Cliente', 'Crédito', 'N° Pago', 'Monto a Pagar', 'Vencimiento', 'Plazo', 'Aliado']],
        body: vencRows,
        margin: { left: margin, right: margin },
        theme: 'striped',
        styles: {
          fontSize: 7.2,
          cellPadding: 1.8,
          textColor: textDark as [number, number, number]
        },
        headStyles: {
          fillColor: [14, 116, 144], // Cyan oscuro
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.2
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 38, halign: 'right' },
          4: { cellWidth: 32, halign: 'center' },
          5: { cellWidth: 25, halign: 'center' },
          6: { cellWidth: 42, halign: 'left' }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // Tabla: Alertas de Mora
    if (dashboardData.alertasMora && dashboardData.alertasMora.length > 0) {
      checkPageBreak(40);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
      doc.text('Alertas de Cartera en Mora (Casos Críticos)', margin, yPos);
      yPos += 2;

      const alertaRows = dashboardData.alertasMora.slice(0, 15).map((a: any) => [
        (a.cliente || 'N/A').substring(0, 32),
        `${a.dias_mora || 0} días`,
        this.formatCurrency(a.monto_vencido || 0),
        this.formatCurrency(a.saldo_pendiente || 0),
        (a.aliado || 'N/A').substring(0, 28),
        a.telefono || 'Sin registrar'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Cliente', 'Días Atraso', 'Monto Vencido', 'Saldo Total Pendiente', 'Aliado', 'Teléfono']],
        body: alertaRows,
        margin: { left: margin, right: margin },
        theme: 'striped',
        styles: {
          fontSize: 7.2,
          cellPadding: 1.8,
          textColor: textDark as [number, number, number]
        },
        headStyles: {
          fillColor: [159, 18, 57], // Rosa oscuro / rojo
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.2
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 38, halign: 'right' },
          3: { cellWidth: 42, halign: 'right' },
          4: { cellWidth: 40, halign: 'left' },
          5: { cellWidth: 32, halign: 'center' }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // -------------------------------------------------------------
    // PIE DE PÁGINA EN TODAS LAS PÁGINAS
    // -------------------------------------------------------------
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
      doc.setLineWidth(0.4);
      doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text('CONVAM Microcréditos  •  Reporte Ejecutivo de Cartera', margin, pageHeight - 4.5);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 4.5, { align: 'center' });
      doc.text('Confidencial - Uso Interno', pageWidth - margin, pageHeight - 4.5, { align: 'right' });
    }

    // Guardar o descargar archivo
    const finalFilename = filename || `reporte_dashboard_convam_${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.pdf`;
    doc.save(finalFilename);
  }

  // =========================================================================
  // EXPORTACIÓN A EXCEL
  // =========================================================================
  exportToExcel(data: any, options: ExportOptions = { format: 'excel' }): void {
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Resumen del Dashboard
    const summaryData = this.prepareSummaryData(data);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Hoja 2: Cartera General / Aliados
    if (data.carteraGeneral && data.carteraGeneral.length > 0) {
      const carteraSheet = XLSX.utils.json_to_sheet(data.carteraGeneral);
      XLSX.utils.book_append_sheet(workbook, carteraSheet, 'Top Aliados');
    }

    // Hoja 3: Mora por Aliado
    if (data.aliados && data.aliados.length > 0) {
      const moraSheet = XLSX.utils.json_to_sheet(data.aliados);
      XLSX.utils.book_append_sheet(workbook, moraSheet, 'Mora Aliados');
    }

    // Hoja 4: Vencimientos
    if (data.vencimientos && data.vencimientos.length > 0) {
      const vencimientosSheet = XLSX.utils.json_to_sheet(data.vencimientos);
      XLSX.utils.book_append_sheet(workbook, vencimientosSheet, 'Vencimientos');
    }

    // Hoja 5: Alertas de Mora
    if (data.alertas && data.alertas.length > 0) {
      const alertasSheet = XLSX.utils.json_to_sheet(data.alertas);
      XLSX.utils.book_append_sheet(workbook, alertasSheet, 'Alertas Mora');
    }

    // Generar archivo
    const filename = options.filename || `dashboard_convam_${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  // =========================================================================
  // EXPORTACIÓN A CSV
  // =========================================================================
  exportToCSV(data: any[], options: ExportOptions = { format: 'csv' }): void {
    const csvData = this.convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const filename = options.filename || `dashboard_convam_${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.csv`;
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private prepareSummaryData(data: any): any[] {
    return [
      { 'Métrica': 'Fecha de Reporte', 'Valor': formatDate(new Date(), 'dd/MM/yyyy HH:mm', 'en-US') },
      { 'Métrica': 'Período Analizado', 'Valor': data.periodo || 'Histórico Completo' },
      { 'Métrica': 'Cartera Total', 'Valor': this.formatCurrency(data.carteraTotal || 0) },
      { 'Métrica': 'Créditos Totales', 'Valor': data.totalCreditosCount || 0 },
      { 'Métrica': 'Cartera Corriente', 'Valor': this.formatCurrency(data.carteraCorriente || 0) },
      { 'Métrica': 'Cartera Vencida', 'Valor': this.formatCurrency(data.carteraVencida || 0) },
      { 'Métrica': 'Mora Total', 'Valor': this.formatCurrency(data.carteraMora || 0) },
      { 'Métrica': 'Mora Corriente (En ciclo)', 'Valor': this.formatCurrency(data.moraCorriente || 0) },
      { 'Métrica': 'Tasa de Morosidad', 'Valor': `${data.tasaMorosidad || 0}%` },
      { 'Métrica': 'Ingresos Acumulados', 'Valor': this.formatCurrency(data.ingresosTotalGeneral || 0) },
      { 'Métrica': 'Ingresos del Período', 'Valor': this.formatCurrency(data.ingresosPeriodo || 0) },
      { 'Métrica': 'Ministraciones Netas', 'Valor': this.formatCurrency(data.ministracionesTotal || 0) }
    ];
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Headers
    csvRows.push(headers.join(','));

    // Rows
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(value);
  }
}