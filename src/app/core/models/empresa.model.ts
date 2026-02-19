export interface CuentaBancaria {
  banco: string;
  numero: string;
}

export interface Empresa {
  id?: string;
  nombre: string;
  direccion: string;
  telefonos: string[];
  correo: string;
  logoUrl?: string;
  cuentasBancarias: CuentaBancaria[];
}
