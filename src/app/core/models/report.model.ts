import { Timestamp } from 'firebase/firestore';
import { Detalle } from './detalle.model'; // Importa la definición correcta

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
  detalles: Detalle[]; // Ahora usa la definición importada y correcta
  status: 'borrador' | 'completado';

  // Campos de la firma y aceptación
  nombreAcepta?: string;
  firma?: string;

  // Campos de la garantía
  diasVigencia: number;
  terminosCondiciones?: string;

  // ---- CAMPOS PARA EL ENLACE PÚBLICO ----
  publicLinkToken?: string;
  publicLinkExpiresAt?: Timestamp;
  pin?: string; // PIN de seguridad para el cliente
  clientStatus?: 'pending' | 'approved' | 'rejected'; // Estado de aprobación del cliente
}
