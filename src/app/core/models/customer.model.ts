export interface Customer {
    id: string;
    nombre: string;
    direccion: string;
    email: string;
    telefono?: string;
    selected?: boolean;
  }
  
  export interface CustomerRequest {
    nombre: string;
    direccion: string;
    email: string;
    telefono?: string;
  }
  