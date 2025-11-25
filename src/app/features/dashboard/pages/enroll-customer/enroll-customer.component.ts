import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ClienteService } from '../../../../services/client.service';

@Component({
  selector: 'app-enroll-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './enroll-customer.component.html',
  styleUrls: ['./enroll-customer.component.css']
})
export class EnrollCustomerComponent {
  currentStep = 1;
  totalSteps = 5;
  loading = false;
  
  // IDs para seguimiento entre pasos
  idDireccion: number | null = null;
  idCliente: number | null = null;
  idDireccionAval: number | null = null;
  idAval: number | null = null;

  // Datos de DIRECCIÓN CLIENTE 
  direccion = {
    municipio: '',
    localidad: '',
    calle: '',
    numero: ''
  };

  // Datos del CLIENTE 
  cliente = {
    nombre_cliente: '',
    app_cliente: '',
    apm_cliente: '',
    curp: '',
    nacionalidad: 'Mexicana',
    ocupacion: '',
    ciclo_actual: 1
  };

  // Datos de DIRECCIÓN AVAL (Paso 3)
  direccionAval = {
    municipio: '',
    localidad: '',
    calle: '',
    numero: ''
  };

  // Datos del AVAL (Paso 4)
  aval = {
    nombre_aval: '',
    app_aval: '',
    apm_aval: '',
    curp: ''
  };

  // Datos de la SOLICITUD (Paso 5)
  solicitud = {
    usuario_id: 3,
    monto_solicitado: 0,
    tasa_interes: 0,
    tasa_moratoria: 0,
    plazo_meses: 0,
    no_pagos: 0,
    tipo_vencimiento: '',
    seguro: false,
    observaciones: '' 
  };

  errors: any = {};

  constructor(private clienteService: ClienteService) {}

  // Validaciones
  validarCurp(curp: string): boolean {
    if (!curp) return false;
    const regex = /^[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9A-Z]{2}$/;
    return regex.test(curp.toUpperCase());
  }

  validarcurp(curp: string): boolean {
    if (!curp) return false;
    const regex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    return regex.test(curp.toUpperCase());
  }

  // Validaciones para cada paso
  validarPaso1(): boolean {
    this.errors = {};
    
    const validaciones = [
      { campo: 'municipio', valor: this.direccion.municipio, mensaje: 'El municipio es obligatorio' },
      { campo: 'localidad', valor: this.direccion.localidad, mensaje: 'La localidad es obligatoria' },
      { campo: 'calle', valor: this.direccion.calle, mensaje: 'La calle es obligatoria' },
      { campo: 'numero', valor: this.direccion.numero, mensaje: 'El número es obligatorio' }
    ];

    validaciones.forEach(valid => {
      if (!valid.valor || valid.valor.trim() === '') {
        this.errors[valid.campo] = valid.mensaje;
      }
    });

    return Object.keys(this.errors).length === 0;
  }

  validarPaso2(): boolean {
    this.errors = {};
    
    const validaciones = [
      { campo: 'nombre_cliente', valor: this.cliente.nombre_cliente, mensaje: 'El nombre es obligatorio' },
      { campo: 'app_cliente', valor: this.cliente.app_cliente, mensaje: 'El apellido paterno es obligatorio' },
      { campo: 'apm_cliente', valor: this.cliente.apm_cliente, mensaje: 'El apellido materno es obligatorio' },
      { campo: 'ocupacion', valor: this.cliente.ocupacion, mensaje: 'La ocupación es obligatoria' }
    ];

    validaciones.forEach(valid => {
      if (!valid.valor || valid.valor.trim() === '') {
        this.errors[valid.campo] = valid.mensaje;
      }
    });

    if (!this.cliente.curp) {
      this.errors.curp = 'La CURP es obligatoria';
    } else if (!this.validarCurp(this.cliente.curp)) {
      this.errors.curp = 'Formato de CURP inválido';
    }

    return Object.keys(this.errors).length === 0;
  }

  validarPaso3(): boolean {
    this.errors = {};
    
    const validaciones = [
      { campo: 'municipio_aval', valor: this.direccionAval.municipio, mensaje: 'El municipio del aval es obligatorio' },
      { campo: 'localidad_aval', valor: this.direccionAval.localidad, mensaje: 'La localidad del aval es obligatoria' },
      { campo: 'calle_aval', valor: this.direccionAval.calle, mensaje: 'La calle del aval es obligatoria' },
      { campo: 'numero_aval', valor: this.direccionAval.numero, mensaje: 'El número del aval es obligatorio' }
    ];

    validaciones.forEach(valid => {
      if (!valid.valor || valid.valor.trim() === '') {
        this.errors[valid.campo] = valid.mensaje;
      }
    });

    return Object.keys(this.errors).length === 0;
  }

  validarPaso4(): boolean {
    this.errors = {};
    
    const validaciones = [
      { campo: 'nombre_aval', valor: this.aval.nombre_aval, mensaje: 'El nombre del aval es obligatorio' },
      { campo: 'app_aval', valor: this.aval.app_aval, mensaje: 'El apellido paterno del aval es obligatorio' },
      { campo: 'apm_aval', valor: this.aval.apm_aval, mensaje: 'El apellido materno del aval es obligatorio' },
      { campo: 'curp_aval', valor: this.aval.curp, mensaje: 'El curp del aval es obligatorio' }
    ];

    validaciones.forEach(valid => {
      if (!valid.valor || valid.valor.trim() === '') {
        this.errors[valid.campo] = valid.mensaje;
      }
    });

    if (this.aval.curp && !this.validarcurp(this.aval.curp)) {
      this.errors.curp_aval = 'Formato de curp inválido';
    }

    return Object.keys(this.errors).length === 0;
  }

  validarPaso5(): boolean {
    this.errors = {};
    
    const validaciones = [
      { campo: 'monto_solicitado', valor: this.solicitud.monto_solicitado, mensaje: 'El monto solicitado es obligatorio', condicion: (v: any) => !v || v <= 0 },
      { campo: 'tasa_interes', valor: this.solicitud.tasa_interes, mensaje: 'La tasa de interés es obligatoria', condicion: (v: any) => !v || v <= 0 },
      { campo: 'tasa_moratoria', valor: this.solicitud.tasa_moratoria, mensaje: 'La tasa moratoria es obligatoria', condicion: (v: any) => !v || v <= 0 },
      { campo: 'plazo_meses', valor: this.solicitud.plazo_meses, mensaje: 'El plazo en meses es obligatorio', condicion: (v: any) => !v || v <= 0 },
      { campo: 'no_pagos', valor: this.solicitud.no_pagos, mensaje: 'El número de pagos es obligatorio', condicion: (v: any) => !v || v <= 0 },
      { campo: 'tipo_vencimiento', valor: this.solicitud.tipo_vencimiento, mensaje: 'El tipo de vencimiento es obligatorio', condicion: (v: any) => !v }
    ];

    validaciones.forEach(valid => {
      if (valid.condicion(valid.valor)) {
        this.errors[valid.campo] = valid.mensaje;
      }
    });

    return Object.keys(this.errors).length === 0;
  }

  // Navegación entre pasos
  async siguientePaso() {
    if (this.currentStep === 1 && this.validarPaso1()) {
      await this.guardarDireccion();
    } else if (this.currentStep === 2 && this.validarPaso2()) {
      await this.guardarCliente();
    } else if (this.currentStep === 3 && this.validarPaso3()) {
      await this.guardarDireccionAval();
    } else if (this.currentStep === 4 && this.validarPaso4()) {
      await this.guardarAval();
    } else if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  pasoAnterior() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Métodos para guardar cada entidad
  async guardarDireccion() {
    this.loading = true;
    
    try {
      const response: any = await this.clienteService.guardarDireccion(this.direccion).toPromise();
      this.idDireccion = response.id_direccion;
      this.currentStep++;
      console.log('Dirección cliente guardada con ID:', this.idDireccion);
    } catch (error: any) {
      console.error('Error al guardar dirección:', error);
      alert('Error al guardar la dirección: ' + (error.error?.message || error.message));
    } finally {
      this.loading = false;
    }
  }

  async guardarCliente() {
    if (!this.idDireccion) {
      alert('Error: No se encontró ID de dirección');
      return;
    }

    this.loading = true;
    
    try {
      const datosCliente = {
        ...this.cliente,
        direccion_id: this.idDireccion,
        curp: this.cliente.curp.toUpperCase()
      };

      const response: any = await this.clienteService.guardarCliente(datosCliente).toPromise();
      this.idCliente = response.id_cliente;
      this.currentStep++;
      console.log('Cliente guardado con ID:', this.idCliente);
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      if (error.error?.error === 'El cliente ya existe') {
        alert('Error: Ya existe un cliente con esta CURP');
      } else {
        alert('Error al guardar el cliente: ' + (error.error?.message || error.message));
      }
    } finally {
      this.loading = false;
    }
  }

  async guardarDireccionAval() {
    this.loading = true;
    
    try {
      const response: any = await this.clienteService.guardarDireccion(this.direccionAval).toPromise();
      this.idDireccionAval = response.id_direccion;
      this.currentStep++;
      console.log('Dirección aval guardada con ID:', this.idDireccionAval);
    } catch (error: any) {
      console.error('Error al guardar dirección aval:', error);
      alert('Error al guardar la dirección del aval: ' + (error.error?.message || error.message));
    } finally {
      this.loading = false;
    }
  }

  async guardarAval() {
    if (!this.idDireccionAval || !this.idCliente) {
      alert('Error: Faltan datos requeridos');
      return;
    }

    this.loading = true;
    
    try {
      const datosAval = {
        ...this.aval,
        direccion_id: this.idDireccionAval,
        cliente_id: this.idCliente,
        curp: this.aval.curp.toUpperCase()
      };

      const response: any = await this.clienteService.guardarAval(datosAval).toPromise();
      this.idAval = response.id_aval;
      this.currentStep++;
      console.log('Aval guardado con ID:', this.idAval);
    } catch (error: any) {
      console.error('Error al guardar aval:', error);
      alert('Error al guardar el aval: ' + (error.error?.message || error.message));
    } finally {
      this.loading = false;
    }
  }

  // Registrar cliente completo
  async registrarCliente() {
    if (!this.validarPaso5()) {
      alert('Por favor completa todos los campos requeridos en la solicitud');
      return;
    }

    if (!this.idCliente) {
      alert('Error: No se encontró ID de cliente');
      return;
    }

    this.loading = true;

    try {
      const datosSolicitud = {
        ...this.solicitud,
        cliente_id: this.idCliente
      };

      console.log('Enviando solicitud:', datosSolicitud);

      const response: any = await this.clienteService.guardarSolicitud(datosSolicitud).toPromise();
      
      alert('Cliente y aval registrados exitosamente');
      this.resetForm();
      
    } catch (error: any) {
      console.error('Error completo:', error);
      
      if (error.error && error.error.errores) {
        const erroresBackend = error.error.errores;
        let mensajeError = 'Errores en el formulario:\n';
        
        erroresBackend.forEach((err: any) => {
          this.errors[err.path] = err.msg;
          mensajeError += `• ${err.msg}\n`;
        });
        
        alert(mensajeError);
      } else {
        const mensaje = error.error?.message || error.message || 'Error desconocido del servidor';
        alert('Error al registrar solicitud: ' + mensaje);
      }
    } finally {
      this.loading = false;
    }
  }

  // Resetear formulario
  resetForm() {
    this.direccion = {
      municipio: '',
      localidad: '',
      calle: '',
      numero: ''
    };

    this.cliente = {
      nombre_cliente: '',
      app_cliente: '',
      apm_cliente: '',
      curp: '',
      nacionalidad: 'Mexicana',
      ocupacion: '',
      ciclo_actual: 1
    };

    this.direccionAval = {
      municipio: '',
      localidad: '',
      calle: '',
      numero: ''
    };

    this.aval = {
      nombre_aval: '',
      app_aval: '',
      apm_aval: '',
      curp: ''
    };

    this.solicitud = {
      usuario_id: 3,
      monto_solicitado: 0,
      tasa_interes: 0,
      tasa_moratoria: 0,
      plazo_meses: 0,
      no_pagos: 0,
      tipo_vencimiento: '',
      seguro: false, 
      observaciones: ''
    };

    this.idDireccion = null;
    this.idCliente = null;
    this.idDireccionAval = null;
    this.idAval = null;
    this.currentStep = 1;
    this.errors = {};
  }

  get progreso(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}