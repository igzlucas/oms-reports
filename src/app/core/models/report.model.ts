import { Timestamp } from 'firebase/firestore';
import { Detalle } from './detalle.model';

export interface Report {
  id: string;
  reporteId: number;
  empresaId: string;
  clientId: string;
  equipo: string;
  fecha: Date | Timestamp;
  problema: string;
  trabajoRealizado: string;
  observaciones: string;
  montoTotal: number;
  moneda: 'USD' | 'MXN';
  detalles: Detalle[];
  status: 'borrador' | 'completado' | 'pendiente';

  // --- NUEVO CAMPO ---
  personaQuienReporta?: string; // Nombre de la persona que levanta el reporte.

  // Campos de la firma del técnico
  nombreAcepta?: string;
  firma?: string;

  // Campos de la firma del cliente
  firmaCliente?: string; // Data URL de la firma del cliente
  nombreClienteFirma?: string; // Nombre del cliente que firma

  // Campos de la garantía
  diasVigencia: number;
  terminosCondiciones?: string;

  // ---- CAMPOS PARA EL ENLACE PÚBLICO ----
  publicLinkToken?: string;
  publicLinkExpiresAt?: Timestamp;
  pin?: string; // PIN de seguridad para el cliente
  clientStatus?: 'pending' | 'approved' | 'rejected'; // Estado de aprobación del cliente
}
