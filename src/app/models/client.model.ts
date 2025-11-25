// modelos/cliente.model.ts
export interface Direccion {
  id_direccion?: number;
  municipio: string;
  localidad: string;
  calle: string;
  numero: string;
}

export interface Cliente {
  id_cliente?: number;
  folio_cliente: string;
  nombre_cliente: string;
  apP_cliente: string;
  apM_cliente: string;
  curp: string;
  rfc: string;
  fecha_nacimiento: string;
  nacionalidad: string;
  direccion_id?: number;
  direccion?: Direccion;
  ocupacion: string;
  ciclo_actual: number;
}

export interface Aval {
  id_aval?: number;
  nombre_aval: string;
  apP_aval: string;
  apM_aval: string;
  rfc: string;
  direccion_id?: number;
  direccion?: Direccion;
  cliente_id?: number;
}