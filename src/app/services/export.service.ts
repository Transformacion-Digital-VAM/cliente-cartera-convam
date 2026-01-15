import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from '@angular/common';

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  filename?: string;
  includeCharts?: boolean;
  includeTables?: boolean;
  includeSummary?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  exportToExcel(data: any, options: ExportOptions = { format: 'excel' }): void {
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Resumen del Dashboard
    const summaryData = this.prepareSummaryData(data);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Hoja 2: Cartera General
    if (data.carteraGeneral) {
      const carteraSheet = XLSX.utils.json_to_sheet(data.carteraGeneral);
      XLSX.utils.book_append_sheet(workbook, carteraSheet, 'Cartera');
    }

    // Hoja 3: Vencimientos
    if (data.vencimientos) {
      const vencimientosSheet = XLSX.utils.json_to_sheet(data.vencimientos);
      XLSX.utils.book_append_sheet(workbook, vencimientosSheet, 'Vencimientos');
    }

    // Hoja 4: Alertas de Mora
    if (data.alertas) {
      const alertasSheet = XLSX.utils.json_to_sheet(data.alertas);
      XLSX.utils.book_append_sheet(workbook, alertasSheet, 'Alertas');
    }

    // Hoja 5: Aliados
    if (data.aliados) {
      const aliadosSheet = XLSX.utils.json_to_sheet(data.aliados);
      XLSX.utils.book_append_sheet(workbook, aliadosSheet, 'Aliados');
    }

    // Generar archivo
    const filename = options.filename || `dashboard_${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  exportToPDF(data: any, options: ExportOptions = { format: 'pdf' }): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    let yPos = margin;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE DASHBOARD', 105, yPos, { align: 'center' });
    yPos += 10;

    // Fecha
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${formatDate(new Date(), 'dd/MM/yyyy HH:mm', 'en-US')}`, margin, yPos);
    yPos += 5;
    doc.text(`Período: ${data.periodo || 'N/A'}`, margin, yPos);
    yPos += 10;

    // Resumen del Dashboard
    this.addSummaryToPDF(doc, data, margin, yPos);
    yPos += 60;

    // Cartera General
    if (data.carteraGeneral && data.carteraGeneral.length > 0) {
      doc.addPage();
      this.addCarteraToPDF(doc, data.carteraGeneral, margin);
    }

    // Vencimientos
    if (data.vencimientos && data.vencimientos.length > 0) {
      doc.addPage();
      this.addVencimientosToPDF(doc, data.vencimientos, margin);
    }

    // Guardar PDF
    const filename = options.filename || `dashboard_${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.pdf`;
    doc.save(filename);
  }

  exportToCSV(data: any[], options: ExportOptions = { format: 'csv' }): void {
    const csvData = this.convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const filename = options.filename || `dashboard_${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.csv`;
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
      { 'Métrica': 'Período Analizado', 'Valor': data.periodo || 'N/A' },
      { 'Métrica': 'Cartera Total', 'Valor': this.formatCurrency(data.carteraTotal || 0) },
      { 'Métrica': 'Créditos Totales', 'Valor': data.totalCreditosCount || 0 },
      { 'Métrica': 'Clientes Activos', 'Valor': data.clientesVigentes || 0 },
      { 'Métrica': 'Cartera Corriente', 'Valor': this.formatCurrency(data.carteraCorriente || 0) },
      { 'Métrica': 'Cartera Vencida', 'Valor': this.formatCurrency(data.carteraVencida || 0) },
      { 'Métrica': 'Cartera en Mora', 'Valor': this.formatCurrency(data.carteraMora || 0) },
      { 'Métrica': 'Tasa de Morosidad', 'Valor': `${data.tasaMorosidad || 0}%` },
      { 'Métrica': 'Ingresos del Período', 'Valor': this.formatCurrency(data.ingresosPeriodo || 0) },
      { 'Métrica': 'Ministraciones Netas', 'Valor': this.formatCurrency(data.ministracionesTotal || 0) }
    ];
  }

  private addSummaryToPDF(doc: jsPDF, data: any, margin: number, yPos: number): void {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DEL DASHBOARD', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryData = [
      ['Métrica', 'Valor'],
      ['Cartera Total', this.formatCurrency(data.carteraTotal || 0)],
      ['Total Créditos', data.totalCreditosCount || 0],
      ['Clientes Activos', data.clientesVigentes || 0],
      ['Cartera Corriente', this.formatCurrency(data.carteraCorriente || 0)],
      ['Cartera Vencida', this.formatCurrency(data.carteraVencida || 0)],
      ['Cartera en Mora', this.formatCurrency(data.carteraMora || 0)],
      ['Tasa de Morosidad', `${data.tasaMorosidad || 0}%`],
      ['Ingresos Período', this.formatCurrency(data.ingresosPeriodo || 0)],
      ['Ministraciones Netas', this.formatCurrency(data.ministracionesTotal || 0)]
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }
    });
  }

  private addCarteraToPDF(doc: jsPDF, carteraData: any[], margin: number): void {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CARTERA GENERAL', margin, 20);

    const tableData = carteraData.map(item => [
      item.nombre || 'N/A',
      item.creditos || 0,
      this.formatCurrency(item.cartera || 0),
      this.formatCurrency(item.entregados || 0),
      `${item.porcentaje || 0}%`
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: [['Aliado', 'Créditos', 'Cartera', 'Entregados', '% Total']],
      body: tableData,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }
    });
  }

  private addVencimientosToPDF(doc: jsPDF, vencimientos: any[], margin: number): void {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PRÓXIMOS VENCIMIENTOS', margin, 20);

    const tableData = vencimientos.map(item => [
      item.cliente || 'N/A',
      item.credito_id || 'N/A',
      this.formatCurrency(item.monto || 0),
      formatDate(item.fecha, 'dd/MM/yyyy', 'en-US'),
      item.dias || 0,
      item.aliado || 'N/A'
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: [['Cliente', 'Crédito', 'Monto', 'Fecha', 'Días', 'Aliado']],
      body: tableData,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' }
    });
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