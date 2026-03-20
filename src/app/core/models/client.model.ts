export interface Equipment {
  nombre: string;
}

export interface Client {
  id: string;
  empresaId: string;
  nombre: string;
  email: string;
  phone: string;
  address: string;
  equipos: Equipment[];
}
