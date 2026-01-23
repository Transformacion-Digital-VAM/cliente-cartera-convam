import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import Swal, { SweetAlertResult } from 'sweetalert2';
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
  totalSteps = 4;
  loading = false;

  // IDs para seguimiento entre pasos
  idDireccion: number | null = null;
  idCliente: number | null = null;
  idDireccionAval: number | null = null;
  idAval: number | null = null;

  // Datos de DIRECCIÓN CLIENTE 
  direccion = {
    municipio: 'DOLORES HIDALGO',
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
    nacionalidad: 'MEXICANA',
    ocupacion: '',
    telefono: '',
    ciclo_actual: 1
  };

  // Datos de DIRECCIÓN AVAL
  direccionAval = {
    municipio: 'DOLORES HIDALGO',
    localidad: '',
    calle: '',
    numero: ''
  };

  // Datos del AVAL
  aval = {
    nombre_aval: '',
    app_aval: '',
    apm_aval: '',
    curp: '',
    telefono: ''
  };

  errors: any = {};

  constructor(private clienteService: ClienteService) { }

  // Método para convertir texto a mayúsculas automáticamente
  convertirAMayusculas(event: Event, seccion: string, campo: string) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.toUpperCase();

    // Actualizar el valor en el modelo según la sección
    switch (seccion) {
      case 'direccion':
        if (campo in this.direccion) {
          (this.direccion as any)[campo] = valor;
        }
        break;
      case 'cliente':
        if (campo in this.cliente) {
          (this.cliente as any)[campo] = valor;
        }
        break;
      case 'direccionAval':
        if (campo in this.direccionAval) {
          (this.direccionAval as any)[campo] = valor;
        }
        break;
      case 'aval':
        if (campo in this.aval) {
          (this.aval as any)[campo] = valor;
        }
        break;
    }
  }

  // Validación única para CURP (formato mexicano de 18 caracteres)
  validarCurp(curp: string): boolean {
    if (!curp) return false;

    // Expresión regular para CURP mexicana (18 caracteres)
    const regex = /^[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9A-Z]{2}$/;

    // Limpiar y convertir a mayúsculas (ya viene en mayúsculas)
    const curpLimpia = curp.trim();

    // Validar formato
    if (!regex.test(curpLimpia)) {
      return false;
    }

    // Validar longitud exacta
    if (curpLimpia.length !== 18) {
      return false;
    }

    return true;
  }

  // Mostrar error con SweetAlert2
  mostrarError(titulo: string, mensaje: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'error',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#615afe',
      background: '#ffffff',
      iconColor: '#dc3545',
      customClass: {
        confirmButton: 'swal2-confirm'
      }
    });
  }

  // Mostrar éxito con SweetAlert2
  mostrarExito(titulo: string, mensaje: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'success',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#28a745',
      background: '#ffffff',
      iconColor: '#28a745',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  // Mostrar confirmación con SweetAlert2
  mostrarConfirmacion(titulo: string, mensaje: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'question',
      title: titulo,
      text: mensaje,
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#615afe',
      cancelButtonColor: '#dc3545',
      background: '#ffffff',
      iconColor: '#615afe',
      reverseButtons: true
    });
  }

  // Mostrar carga
  mostrarCarga(mensaje: string): Promise<SweetAlertResult> {
    return Swal.fire({
      title: 'Procesando',
      text: mensaje,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // Cerrar alerta
  cerrarAlerta(): void {
    Swal.close();
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

    if (Object.keys(this.errors).length > 0) {
      this.mostrarError('Error de validación', 'Por favor complete todos los campos requeridos en la dirección');
    }

    return Object.keys(this.errors).length === 0;
  }

  // validarTelefono(telefono: string): boolean {
  //   return telefono.length === 10 && /^[0-9]+$/.test(telefono);
  // }
  validarTelefono(telefono: string): boolean {
    if (!telefono) return false;

    // Eliminar cualquier caracter que no sea número
    const limpio = telefono.replace(/[^0-9]/g, '');

    return limpio.length === 10;
  }
  soloNumerosTelefono() {
    if (!this.cliente.telefono) return;

    // Elimina todo excepto números
    this.cliente.telefono = this.cliente.telefono.replace(/[^0-9]/g, '');
  }



  validarPaso2(): boolean {
    this.errors = {};

    const validaciones = [
      { campo: 'nombre_cliente', valor: this.cliente.nombre_cliente, mensaje: 'El nombre es obligatorio' },
      { campo: 'app_cliente', valor: this.cliente.app_cliente, mensaje: 'El apellido paterno es obligatorio' },
      { campo: 'apm_cliente', valor: this.cliente.apm_cliente, mensaje: 'El apellido materno es obligatorio' },
      { campo: 'ocupacion', valor: this.cliente.ocupacion, mensaje: 'La ocupación es obligatoria' },
      { campo: 'telefono', valor: this.cliente.telefono, mensaje: 'El teléfono es obligatorio' },
    ];

    validaciones.forEach(valid => {
      if (!valid.valor || valid.valor.trim() === '') {
        this.errors[valid.campo] = valid.mensaje;
      }
    });

    if (!this.cliente.curp) {
      this.errors.curp = 'La CURP es obligatoria';
    } else if (!this.validarCurp(this.cliente.curp)) {
      this.errors.curp = 'Formato de CURP inválido. Debe tener 18 caracteres (ej: ABCD123456EFGHIJ78)';
    }

    if (!this.validarTelefono(this.cliente.telefono)) {
      this.errors.telefono = 'El teléfono debe tener 10 dígitos numéricos';
    }

    if (Object.keys(this.errors).length > 0) {
      const mensajes = Object.values(this.errors).join('\n');
      this.mostrarError('Error de validación', `Por favor corrija los siguientes errores:\n${mensajes}`);
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

    if (Object.keys(this.errors).length > 0) {
      this.mostrarError('Error de validación', 'Por favor complete todos los campos requeridos en la dirección del aval');
    }

    return Object.keys(this.errors).length === 0;
  }

  validarPaso4(): boolean {
    this.errors = {};

    const validaciones = [
      { campo: 'nombre_aval', valor: this.aval.nombre_aval, mensaje: 'El nombre del aval es obligatorio' },
      { campo: 'app_aval', valor: this.aval.app_aval, mensaje: 'El apellido paterno del aval es obligatorio' },
      { campo: 'apm_aval', valor: this.aval.apm_aval, mensaje: 'El apellido materno del aval es obligatorio' },
      { campo: 'curp_aval', valor: this.aval.curp, mensaje: 'El CURP del aval es obligatorio' },
      { campo: 'telefono_aval', valor: this.aval.telefono, mensaje: 'El teléfono del aval es obligatorio' }
    ];

    validaciones.forEach(valid => {
      if (!valid.valor || valid.valor.trim() === '') {
        this.errors[valid.campo] = valid.mensaje;
      }
    });

    if (!this.aval.curp) {
      this.errors.curp_aval = 'La CURP del aval es obligatoria';
    } else if (!this.validarCurp(this.aval.curp)) {
      this.errors.curp_aval = 'Formato de CURP inválido. Debe tener 18 caracteres (ej: ABCD123456EFGHIJ78)';
    }

    if (!this.validarTelefono(this.aval.telefono)) {
      this.errors.telefono_aval = 'El teléfono debe tener 10 dígitos numéricos';
    }

    if (Object.keys(this.errors).length > 0) {
      const mensajes = Object.values(this.errors).join('\n');
      this.mostrarError('Error de validación', `Por favor corrija los siguientes errores:\n${mensajes}`);
    }

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
    this.mostrarCarga('Guardando dirección...');

    // Asegurar que todos los campos estén en mayúsculas
    this.direccion.municipio = this.direccion.municipio.toUpperCase();
    this.direccion.localidad = this.direccion.localidad.toUpperCase();
    this.direccion.calle = this.direccion.calle.toUpperCase();

    try {
      const response: any = await this.clienteService.guardarDireccion(this.direccion).toPromise();
      this.idDireccion = response.id_direccion;
      this.currentStep++;
      this.cerrarAlerta();
      // console.log('Dirección cliente guardada con ID:', this.idDireccion);
    } catch (error: any) {
      console.error('Error al guardar dirección:', error);
      this.cerrarAlerta();
      this.mostrarError(
        'Error al guardar dirección',
        error.error?.message || error.message || 'Ocurrió un error inesperado'
      );
    } finally {
      this.loading = false;
    }
  }

  async guardarCliente() {
    if (!this.idDireccion) {
      this.mostrarError('Error', 'No se encontró ID de dirección. Por favor regrese al paso anterior.');
      return;
    }

    this.loading = true;
    this.mostrarCarga('Guardando cliente...');

    // Asegurar que todos los campos estén en mayúsculas
    this.cliente.nombre_cliente = this.cliente.nombre_cliente.toUpperCase();
    this.cliente.app_cliente = this.cliente.app_cliente.toUpperCase();
    this.cliente.apm_cliente = this.cliente.apm_cliente.toUpperCase();
    this.cliente.ocupacion = this.cliente.ocupacion.toUpperCase();
    this.cliente.nacionalidad = this.cliente.nacionalidad.toUpperCase();
    this.cliente.curp = this.cliente.curp.toUpperCase();

    try {
      const datosCliente = {
        ...this.cliente,
        direccion_id: this.idDireccion
      };

      const response: any = await this.clienteService.guardarCliente(datosCliente).toPromise();
      this.idCliente = response.id_cliente;
      this.currentStep++;
      this.cerrarAlerta();
      console.log('Cliente guardado con ID:', this.idCliente);
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      this.cerrarAlerta();
      if (error.error?.error === 'El cliente ya existe') {
        this.mostrarError('Cliente duplicado', 'Ya existe un cliente registrado con esta CURP. Por favor verifique los datos.');
      } else {
        this.mostrarError(
          'Error al guardar cliente',
          error.error?.message || error.message || 'Ocurrió un error inesperado'
        );
      }
    } finally {
      this.loading = false;
    }
  }

  async guardarDireccionAval() {
    this.loading = true;
    this.mostrarCarga('Guardando dirección del aval...');

    // Asegurar que todos los campos estén en mayúsculas
    this.direccionAval.municipio = this.direccionAval.municipio.toUpperCase();
    this.direccionAval.localidad = this.direccionAval.localidad.toUpperCase();
    this.direccionAval.calle = this.direccionAval.calle.toUpperCase();

    try {
      const response: any = await this.clienteService.guardarDireccion(this.direccionAval).toPromise();
      this.idDireccionAval = response.id_direccion;
      this.currentStep++;
      this.cerrarAlerta();
      console.log('Dirección aval guardada con ID:', this.idDireccionAval);
    } catch (error: any) {
      console.error('Error al guardar dirección aval:', error);
      this.cerrarAlerta();
      this.mostrarError(
        'Error al guardar dirección del aval',
        error.error?.message || error.message || 'Ocurrió un error inesperado'
      );
    } finally {
      this.loading = false;
    }
  }

  async guardarAval() {
    if (!this.idDireccionAval || !this.idCliente) {
      this.mostrarError('Error', 'Faltan datos requeridos. Por favor complete los pasos anteriores.');
      return;
    }

    this.loading = true;
    this.mostrarCarga('Guardando aval...');

    // Asegurar que todos los campos estén en mayúsculas
    this.aval.nombre_aval = this.aval.nombre_aval.toUpperCase();
    this.aval.app_aval = this.aval.app_aval.toUpperCase();
    this.aval.apm_aval = this.aval.apm_aval.toUpperCase();
    this.aval.curp = this.aval.curp.toUpperCase();

    try {
      const datosAval = {
        ...this.aval,
        direccion_id: this.idDireccionAval,
        cliente_id: this.idCliente
      };

      const response: any = await this.clienteService.guardarAval(datosAval).toPromise();
      this.idAval = response.id_aval;

      this.cerrarAlerta();

      // Cliente y aval registrados exitosamente
      await this.mostrarExito(
        '¡Registro completado!',
        'Cliente y aval registrados exitosamente en el sistema.'
      );

      this.resetForm();

    } catch (error: any) {
      console.error('Error al guardar aval:', error);
      this.cerrarAlerta();
      this.mostrarError(
        'Error al guardar aval',
        error.error?.message || error.message || 'Ocurrió un error inesperado'
      );
    } finally {
      this.loading = false;
    }
  }

  // Resetear formulario con confirmación
  async resetForm() {
    const resultado = await this.mostrarConfirmacion(
      '¿Reiniciar formulario?',
      '¿Está seguro de que desea reiniciar el formulario? Se perderán todos los datos ingresados.'
    );

    if (resultado.isConfirmed) {
      this.direccion = {
        municipio: 'DOLORES HIDALGO',
        localidad: '',
        calle: '',
        numero: ''
      };

      this.cliente = {
        nombre_cliente: '',
        app_cliente: '',
        apm_cliente: '',
        curp: '',
        nacionalidad: 'MEXICANA',
        ocupacion: '',
        telefono: '',
        ciclo_actual: 1
      };

      this.direccionAval = {
        municipio: 'DOLORES HIDALGO',
        localidad: '',
        calle: '',
        numero: ''
      };

      this.aval = {
        nombre_aval: '',
        app_aval: '',
        apm_aval: '',
        curp: '',
        telefono: ''
      };

      this.idDireccion = null;
      this.idCliente = null;
      this.idDireccionAval = null;
      this.idAval = null;
      this.currentStep = 1;
      this.errors = {};

      this.mostrarExito('Formulario reiniciado', 'El formulario ha sido reiniciado exitosamente.');
    }
  }

  get progreso(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}