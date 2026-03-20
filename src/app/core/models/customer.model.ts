import { Equipment } from './equipment.model';

export interface Customer {
  id: string;
  nombre: string;
  direccion: string;
  email: string;
  telefono?: string;
  equipos?: Equipment[];
}
