import { Timestamp } from 'firebase/firestore';

export interface Detalle {
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
}

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
  status: 'borrador' | 'completado';

  // Campos de la firma y aceptación
  nombreAcepta?: string;
  firma?: string;

  // Campos de la garantía
  diasGarantia: number;
  terminosCondiciones?: string;

  // ---- CAMPOS PARA EL ENLACE PÚBLICO ----
  publicLinkToken?: string;
  publicLinkExpiresAt?: Timestamp;
  pin?: string; // PIN de seguridad para el cliente
  clientStatus?: 'pending' | 'approved' | 'rejected'; // Estado de aprobación del cliente
}
