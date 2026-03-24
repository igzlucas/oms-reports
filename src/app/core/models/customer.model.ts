import { Equipment } from './equipment.model';

export interface Customer {
  id?: string; // El ID es opcional al crear un nuevo cliente
  empresaId: string; // ID de la empresa a la que pertenece
  nombre: string;
  address: string; // Usar 'address' para consistencia con la base de datos
  email: string;
  phone?: string;   // Usar 'phone' para consistencia
  equipos?: Equipment[];
}
