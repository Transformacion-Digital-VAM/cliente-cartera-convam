import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { IngresosService, IngresoItem, TotalesIngresos } from '../../../../services/ingresos.service';
import { GastosService, CategoriaGasto, GastoItem, TotalesGastos, CrearGastoDTO } from '../../../../services/gastos.service';
import { AliadoService } from '../../../../services/aliado.service';
import { AuthService } from '../../../../services/auth.service';
import { FormatoMonedaPipe } from '../../../../shared/pipes/formato-moneda.pipe';
import { FormatoFechaPipe } from '../../../../shared/pipes/formato-fecha.pipe';

@Component({
  selector: 'app-expenses-income',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ScrollingModule, FormatoMonedaPipe, FormatoFechaPipe],
  templateUrl: './expenses-income.component.html',
  styleUrl: './expenses-income.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpensesIncomeComponent implements OnInit {
  // Pestaña activa: 'gastos' | 'ingresos' | 'balance'
  tabActiva: 'ingresos' | 'gastos' | 'balance' = 'ingresos';

  // ==========================================
  // DATOS DE INGRESOS
  // ==========================================
  ingresos: IngresoItem[] = [];
  totales: TotalesIngresos = {
    total_ingresos: 0,
    total_capital: 0,
    total_mora: 0,
    total_recaudado: 0,
    cantidad_pagos: 0
  };
  aliados: any[] = [];
  cargando: boolean = false;

  // Filtros de Ingresos
  filtroPeriodo: string = 'todos';
  fechaInicio: string = '';
  fechaFin: string = '';
  filtroCliente: string = '';
  filtrosAliados: string[] = [];
  dropdownAliadosAbierto: boolean = false;

  // ==========================================
  // DATOS DE GASTOS
  // ==========================================
  gastos: GastoItem[] = [];
  categorias: CategoriaGasto[] = [];
  totalesGastos: TotalesGastos = {
    total_gastos: 0,
    cantidad_gastos: 0,
    categoria_principal: 'Ninguna',
    por_categoria: []
  };
  cargandoGastos: boolean = false;

  // Filtros de Gastos
  filtroPeriodoGastos: string = 'todos';
  fechaInicioGastos: string = '';
  fechaFinGastos: string = '';
  filtroCategoriaGasto: string = '';
  filtroMetodoPagoGasto: string = '';
  filtroEstatusGasto: string = '';
  busquedaGasto: string = '';

  // Estado del Modal de Gastos
  modalGastoAbierto: boolean = false;
  modoEdicionGasto: boolean = false;
  gastoSeleccionadoId: number | null = null;
  guardandoGasto: boolean = false;

  formularioGasto: CrearGastoDTO = {
    categoria_id: 0,
    concepto: '',
    descripcion: '',
    monto: 0,
    fecha_gasto: '',
    metodo_pago: 'EFECTIVO',
    referencia: '',
    estatus: 'PAGADO'
  };

  // Modal para agregar nueva categoría rápida
  modalCategoriaAbierto: boolean = false;
  guardandoCategoria: boolean = false;
  nuevaCategoria = {
    nombre: '',
    descripcion: ''
  };

  // Opciones de Métodos de Pago
  metodosPago: string[] = [
    'EFECTIVO',
    'TRANSFERENCIA',
    'TARJETA DE DÉBITO',
    'TARJETA DE CRÉDITO',
    'CHEQUE',
    'OTRO'
  ];

  constructor(
    private ingresosService: IngresosService,
    private gastosService: GastosService,
    private aliadoService: AliadoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  // ==========================================
  // TRACK BY FUNCTIONS (optimizan el *ngFor)
  // ==========================================
  trackByIngreso(index: number, item: IngresoItem): number {
    return item.id_credito;
  }

  trackByGasto(index: number, item: GastoItem): number {
    return item.id_gasto;
  }

  ngOnInit(): void {
    this.cargarAliados();
    this.cargarCategorias();
    this.cargarGastos();
    this.cargarIngresos();
  }

  cambiarTab(tab: 'gastos' | 'ingresos' | 'balance'): void {
    this.tabActiva = tab;
    if (tab === 'gastos' && this.gastos.length === 0) {
      this.cargarGastos();
    } else if (tab === 'ingresos' && this.ingresos.length === 0) {
      this.cargarIngresos();
    }
  }

  // ==========================================
  // MÉTODOS DE INGRESOS (EXISTENTES)
  // ==========================================
  cargarAliados(): void {
    this.aliadoService.obtenerAliados().subscribe({
      next: (aliados) => {
        this.aliados = aliados || [];
      },
      error: (err) => console.error('Error al cargar aliados:', err)
    });
  }

  cargarIngresos(): void {
    this.cargando = true;

    const filtros: any = {};

    if (this.filtroCliente.trim()) {
      filtros.cliente = this.filtroCliente.trim();
    }

    if (this.filtrosAliados.length > 0) {
      filtros.aliados = this.filtrosAliados.join(',');
    }

    if (this.filtroPeriodo === 'rango') {
      if (this.fechaInicio) filtros.fecha_inicio = this.fechaInicio;
      if (this.fechaFin) filtros.fecha_fin = this.fechaFin;
    } else if (this.filtroPeriodo !== 'todos') {
      filtros.periodo = this.filtroPeriodo;
      if (this.fechaInicio) filtros.fecha_inicio = this.fechaInicio;
      if (this.fechaFin) filtros.fecha_fin = this.fechaFin;
    }

    this.ingresosService.obtenerIngresos(filtros).subscribe({
      next: (res) => {
        this.ingresos = res.data || [];
        this.totales = res.totales || {
          total_ingresos: res.ingresos || 0,
          total_capital: 0,
          total_mora: 0,
          total_recaudado: 0,
          cantidad_pagos: this.ingresos.length
        };
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar ingresos:', err);
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  seleccionarPeriodo(periodo: string): void {
    this.filtroPeriodo = periodo;
    const hoy = new Date();

    if (periodo === 'todos') {
      this.fechaInicio = '';
      this.fechaFin = '';
    } else if (periodo === 'hoy') {
      const hoyStr = this.formatoFechaISO(hoy);
      this.fechaInicio = hoyStr;
      this.fechaFin = hoyStr;
    } else if (periodo === 'semana') {
      const diaSemana = hoy.getDay();
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() + diffLunes);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);

      this.fechaInicio = this.formatoFechaISO(lunes);
      this.fechaFin = this.formatoFechaISO(domingo);
    } else if (periodo === 'quincena') {
      const anio = hoy.getFullYear();
      const mes = hoy.getMonth();
      const dia = hoy.getDate();

      if (dia <= 15) {
        this.fechaInicio = this.formatoFechaISO(new Date(anio, mes, 1));
        this.fechaFin = this.formatoFechaISO(new Date(anio, mes, 15));
      } else {
        const ultimoDia = new Date(anio, mes + 1, 0).getDate();
        this.fechaInicio = this.formatoFechaISO(new Date(anio, mes, 16));
        this.fechaFin = this.formatoFechaISO(new Date(anio, mes, ultimoDia));
      }
    } else if (periodo === 'mes') {
      const anio = hoy.getFullYear();
      const mes = hoy.getMonth();
      const ultimoDia = new Date(anio, mes + 1, 0).getDate();
      this.fechaInicio = this.formatoFechaISO(new Date(anio, mes, 1));
      this.fechaFin = this.formatoFechaISO(new Date(anio, mes, ultimoDia));
    }

    this.cargarIngresos();
  }

  aplicarFiltros(): void {
    this.cargarIngresos();
  }

  limpiarFiltros(): void {
    this.filtroPeriodo = 'todos';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filtroCliente = '';
    this.filtrosAliados = [];
    this.dropdownAliadosAbierto = false;
    this.cargarIngresos();
  }

  toggleAliado(nomAliado: string): void {
    const idx = this.filtrosAliados.indexOf(nomAliado);
    if (idx === -1) {
      this.filtrosAliados = [...this.filtrosAliados, nomAliado];
    } else {
      this.filtrosAliados = this.filtrosAliados.filter(a => a !== nomAliado);
    }
  }

  esAliadoSeleccionado(nomAliado: string): boolean {
    return this.filtrosAliados.includes(nomAliado);
  }

  etiquetaFiltroAliados(): string {
    if (this.filtrosAliados.length === 0) return 'TODOS LOS ALIADOS';
    if (this.filtrosAliados.length === 1) return this.filtrosAliados[0].trim();
    return `${this.filtrosAliados.length} aliados seleccionados`;
  }

  toggleDropdownAliados(event: Event): void {
    event.stopPropagation();
    this.dropdownAliadosAbierto = !this.dropdownAliadosAbierto;
  }

  cerrarDropdownAliados(): void {
    this.dropdownAliadosAbierto = false;
  }

  exportarExcel(): void {
    if (!this.ingresos || this.ingresos.length === 0) return;

    const datosExportar = this.ingresos.map(item => ({
      'ID Crédito': item.id_credito,
      'Cliente': item.nombre_completo,
      'Aliado': item.nom_aliado,
      'No. Pago': `${item.numero_pago}/${item.no_pagos}`,
      'Frecuencia': item.tipo_vencimiento,
      'Fecha de Pago': this.formatearFecha(item.fecha_pago),
      'Capital Recuperado ($)': Number(item.capital) || 0,
      'Ingreso Interés ($)': Number(item.interes) || 0,
      'Mora Pagada ($)': Number(item.mora_acumulada) || 0,
      'Total Pagado ($)': Number(item.monto_pagado) || 0,
      'Estatus': item.estatus
    }));

    datosExportar.push({
      'ID Crédito': '' as any,
      'Cliente': 'TOTALES',
      'Aliado': '',
      'No. Pago': '',
      'Frecuencia': '',
      'Fecha de Pago': '',
      'Capital Recuperado ($)': this.totales.total_capital,
      'Ingreso Interés ($)': this.totales.total_ingresos,
      'Mora Pagada ($)': this.totales.total_mora,
      'Total Pagado ($)': this.totales.total_recaudado,
      'Estatus': `${this.totales.cantidad_pagos} pagos`
    });

    const worksheet = XLSX.utils.json_to_sheet(datosExportar);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ingresos');

    const fechaActual = this.formatoFechaISO(new Date());
    XLSX.writeFile(workbook, `Ingresos_CONVAM_${fechaActual}.xlsx`);
  }

  // ==========================================
  // MÉTODOS DE GASTOS
  // ==========================================
  cargarCategorias(): void {
    this.gastosService.obtenerCategorias().subscribe({
      next: (res) => {
        this.categorias = res.data || [];
      },
      error: (err) => console.error('Error al cargar categorías de gasto:', err)
    });
  }

  cargarGastos(): void {
    this.cargandoGastos = true;

    const filtros: any = {};

    if (this.filtroCategoriaGasto) {
      filtros.categoria_id = this.filtroCategoriaGasto;
    }

    if (this.filtroMetodoPagoGasto) {
      filtros.metodo_pago = this.filtroMetodoPagoGasto;
    }

    if (this.filtroEstatusGasto) {
      filtros.estatus = this.filtroEstatusGasto;
    }

    if (this.busquedaGasto.trim()) {
      filtros.busqueda = this.busquedaGasto.trim();
    }

    if (this.filtroPeriodoGastos === 'rango') {
      if (this.fechaInicioGastos) filtros.fecha_inicio = this.fechaInicioGastos;
      if (this.fechaFinGastos) filtros.fecha_fin = this.fechaFinGastos;
    } else if (this.filtroPeriodoGastos !== 'todos') {
      filtros.periodo = this.filtroPeriodoGastos;
      if (this.fechaInicioGastos) filtros.fecha_inicio = this.fechaInicioGastos;
      if (this.fechaFinGastos) filtros.fecha_fin = this.fechaFinGastos;
    }

    this.gastosService.obtenerGastos(filtros).subscribe({
      next: (res) => {
        this.gastos = res.data || [];
        this.totalesGastos = res.totales || {
          total_gastos: 0,
          cantidad_gastos: 0,
          categoria_principal: 'Ninguna',
          por_categoria: []
        };
        this.cargandoGastos = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar gastos:', err);
        this.cargandoGastos = false;
        this.cdr.markForCheck();
      }
    });
  }

  seleccionarPeriodoGastos(periodo: string): void {
    this.filtroPeriodoGastos = periodo;
    const hoy = new Date();

    if (periodo === 'todos') {
      this.fechaInicioGastos = '';
      this.fechaFinGastos = '';
    } else if (periodo === 'hoy') {
      const hoyStr = this.formatoFechaISO(hoy);
      this.fechaInicioGastos = hoyStr;
      this.fechaFinGastos = hoyStr;
    } else if (periodo === 'semana') {
      const diaSemana = hoy.getDay();
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() + diffLunes);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);

      this.fechaInicioGastos = this.formatoFechaISO(lunes);
      this.fechaFinGastos = this.formatoFechaISO(domingo);
    } else if (periodo === 'quincena') {
      const anio = hoy.getFullYear();
      const mes = hoy.getMonth();
      const dia = hoy.getDate();

      if (dia <= 15) {
        this.fechaInicioGastos = this.formatoFechaISO(new Date(anio, mes, 1));
        this.fechaFinGastos = this.formatoFechaISO(new Date(anio, mes, 15));
      } else {
        const ultimoDia = new Date(anio, mes + 1, 0).getDate();
        this.fechaInicioGastos = this.formatoFechaISO(new Date(anio, mes, 16));
        this.fechaFinGastos = this.formatoFechaISO(new Date(anio, mes, ultimoDia));
      }
    } else if (periodo === 'mes') {
      const anio = hoy.getFullYear();
      const mes = hoy.getMonth();
      const ultimoDia = new Date(anio, mes + 1, 0).getDate();
      this.fechaInicioGastos = this.formatoFechaISO(new Date(anio, mes, 1));
      this.fechaFinGastos = this.formatoFechaISO(new Date(anio, mes, ultimoDia));
    }

    this.cargarGastos();
  }

  aplicarFiltrosGastos(): void {
    this.cargarGastos();
  }

  limpiarFiltrosGastos(): void {
    this.filtroPeriodoGastos = 'todos';
    this.fechaInicioGastos = '';
    this.fechaFinGastos = '';
    this.filtroCategoriaGasto = '';
    this.filtroMetodoPagoGasto = '';
    this.filtroEstatusGasto = '';
    this.busquedaGasto = '';
    this.cargarGastos();
  }

  // Modal Gasto
  abrirModalNuevoGasto(): void {
    this.modoEdicionGasto = false;
    this.gastoSeleccionadoId = null;
    this.formularioGasto = {
      categoria_id: this.categorias.length > 0 ? this.categorias[0].id_categoria_gasto : 0,
      concepto: '',
      descripcion: '',
      monto: 0,
      fecha_gasto: this.formatoFechaISO(new Date()),
      metodo_pago: 'EFECTIVO',
      referencia: '',
      estatus: 'PAGADO'
    };
    this.modalGastoAbierto = true;
  }

  abrirModalEditarGasto(item: GastoItem): void {
    this.modoEdicionGasto = true;
    this.gastoSeleccionadoId = item.id_gasto;
    this.formularioGasto = {
      categoria_id: item.categoria_id,
      concepto: item.concepto,
      descripcion: item.descripcion || '',
      monto: Number(item.monto) || 0,
      fecha_gasto: item.fecha_gasto ? this.formatoFechaISO(new Date(item.fecha_gasto)) : this.formatoFechaISO(new Date()),
      metodo_pago: item.metodo_pago || 'EFECTIVO',
      referencia: item.referencia || '',
      estatus: item.estatus || 'PAGADO'
    };
    this.modalGastoAbierto = true;
  }

  cerrarModalGasto(): void {
    this.modalGastoAbierto = false;
    this.modoEdicionGasto = false;
    this.gastoSeleccionadoId = null;
  }

  guardarGasto(): void {
    if (!this.formularioGasto.categoria_id || Number(this.formularioGasto.categoria_id) === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obligatorio',
        text: 'Por favor selecciona una categoría para el gasto.'
      });
      return;
    }

    if (!this.formularioGasto.concepto || !this.formularioGasto.concepto.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obligatorio',
        text: 'Por favor ingresa el concepto o motivo del gasto.'
      });
      return;
    }

    const monto = Number(this.formularioGasto.monto);
    if (isNaN(monto) || monto <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'El monto del gasto debe ser mayor a 0.'
      });
      return;
    }

    this.guardandoGasto = true;
    const currentUser = this.authService.getCurrentUser() || this.authService.getUserData();

    const payload: CrearGastoDTO = {
      categoria_id: Number(this.formularioGasto.categoria_id),
      concepto: this.formularioGasto.concepto.trim(),
      descripcion: this.formularioGasto.descripcion?.trim() || '',
      monto: monto,
      fecha_gasto: this.formularioGasto.fecha_gasto || this.formatoFechaISO(new Date()),
      metodo_pago: this.formularioGasto.metodo_pago || 'EFECTIVO',
      referencia: this.formularioGasto.referencia?.trim() || '',
      estatus: this.formularioGasto.estatus || 'PAGADO',
      registrado_por: currentUser?.id_usuario || undefined
    };

    if (this.modoEdicionGasto && this.gastoSeleccionadoId) {
      this.gastosService.actualizarGasto(this.gastoSeleccionadoId, payload).subscribe({
        next: () => {
          this.guardandoGasto = false;
          this.cerrarModalGasto();
          Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'El gasto ha sido modificado exitosamente.',
            timer: 1800,
            showConfirmButton: false
          });
          this.cargarGastos();
        },
        error: (err) => {
          this.guardandoGasto = false;
          console.error('Error al actualizar gasto:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar',
            text: err?.error?.error || 'No fue posible guardar los cambios del gasto.'
          });
        }
      });
    } else {
      this.gastosService.crearGasto(payload).subscribe({
        next: () => {
          this.guardandoGasto = false;
          this.cerrarModalGasto();
          Swal.fire({
            icon: 'success',
            title: '¡Gasto Registrado!',
            text: 'El gasto se ha guardado correctamente.',
            timer: 1800,
            showConfirmButton: false
          });
          this.cargarGastos();
        },
        error: (err) => {
          this.guardandoGasto = false;
          console.error('Error al registrar gasto:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error al registrar',
            text: err?.error?.error || 'No fue posible guardar el gasto.'
          });
        }
      });
    }
  }

  confirmarEliminarGasto(item: GastoItem): void {
    Swal.fire({
      title: '¿Eliminar este gasto?',
      html: `
        <p>¿Estás seguro de eliminar el gasto <strong>"${item.concepto}"</strong> por un monto de <strong>${this.formatearMoneda(item.monto)}</strong>?</p>
        <small class="text-muted">Esta acción no se puede deshacer.</small>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-trash"></i> Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.gastosService.eliminarGasto(item.id_gasto).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El gasto ha sido eliminado correctamente.',
              timer: 1500,
              showConfirmButton: false
            });
            this.cargarGastos();
          },
          error: (err) => {
            console.error('Error al eliminar gasto:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.error || 'No fue posible eliminar el gasto.'
            });
          }
        });
      }
    });
  }

  // Modal Nueva Categoría
  abrirModalNuevaCategoria(): void {
    this.nuevaCategoria = { nombre: '', descripcion: '' };
    this.modalCategoriaAbierto = true;
  }

  cerrarModalNuevaCategoria(): void {
    this.modalCategoriaAbierto = false;
  }

  guardarNuevaCategoria(): void {
    if (!this.nuevaCategoria.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obligatorio',
        text: 'Por favor escribe el nombre de la nueva categoría.'
      });
      return;
    }

    this.guardandoCategoria = true;
    this.gastosService.crearCategoria(this.nuevaCategoria).subscribe({
      next: (res) => {
        this.guardandoCategoria = false;
        this.cerrarModalNuevaCategoria();
        Swal.fire({
          icon: 'success',
          title: 'Categoría guardada',
          text: `La categoría "${res.data.nombre}" se agregó al catálogo.`,
          timer: 1600,
          showConfirmButton: false
        });
        this.cargarCategorias();
        // Si el formulario de gasto está abierto, seleccionarla automáticamente
        if (this.modalGastoAbierto && res.data?.id_categoria_gasto) {
          this.formularioGasto.categoria_id = res.data.id_categoria_gasto;
        }
      },
      error: (err) => {
        this.guardandoCategoria = false;
        console.error('Error al crear categoría:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.error || 'No se pudo registrar la categoría.'
        });
      }
    });
  }

  exportarGastosExcel(): void {
    if (!this.gastos || this.gastos.length === 0) return;

    const datosExportar = this.gastos.map(item => ({
      'ID Gasto': item.id_gasto,
      'Fecha': this.formatearFecha(item.fecha_gasto),
      'Categoría': item.categoria_nombre,
      'Concepto': item.concepto,
      'Descripción': item.descripcion || '',
      'Método de Pago': item.metodo_pago,
      'Referencia / Folio': item.referencia || '',
      'Registrado Por': item.registrado_por_nombre || 'Sistema',
      'Monto ($)': Number(item.monto) || 0,
      'Estatus': item.estatus
    }));

    datosExportar.push({
      'ID Gasto': '' as any,
      'Fecha': '',
      'Categoría': '',
      'Concepto': 'TOTAL DE GASTOS',
      'Descripción': '',
      'Método de Pago': '',
      'Referencia / Folio': '',
      'Registrado Por': '',
      'Monto ($)': this.totalesGastos.total_gastos,
      'Estatus': `${this.totalesGastos.cantidad_gastos} registros` as any
    });

    const worksheet = XLSX.utils.json_to_sheet(datosExportar);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

    const fechaActual = this.formatoFechaISO(new Date());
    XLSX.writeFile(workbook, `Gastos_CONVAM_${fechaActual}.xlsx`);
  }

  // Cálculos de Balance
  calcularPromedioGasto(): number {
    if (!this.totalesGastos.cantidad_gastos || this.totalesGastos.cantidad_gastos === 0) return 0;
    return this.totalesGastos.total_gastos / this.totalesGastos.cantidad_gastos;
  }

  calcularBalanceNeto(): number {
    return (this.totales.total_ingresos || 0) - (this.totalesGastos.total_gastos || 0);
  }

  calcularFlujoEfectivoNeto(): number {
    return (this.totales.total_recaudado || 0) - (this.totalesGastos.total_gastos || 0);
  }

  // ==========================================
  // UTILIDADES
  // ==========================================
  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto || 0);
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return 'N/A';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  private formatoFechaISO(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
