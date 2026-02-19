export interface ReportDetail {
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
  total: number;
}

export interface Report {
  id: string; // ID del documento de Firestore
  reporteId: number; // ID numérico del reporte (ej: 24001)
  clienteId: string; // ID del cliente
  equipo: string;
  fecha: string | Date;
  problema: string;
  trabajoRealizado: string;
  observaciones?: string;
  montoTotal: number;
  moneda: 'USD' | 'MXN' | 'EUR';
  terminosCondiciones: string;
  nombreFirmaCliente: string;
  firmaBase64?: string; // Contendrá la imagen de la firma en formato Base64
  detalles: ReportDetail[];
}

export function initialReportData(): Partial<Report> {
  return {
    reporteId: 0,
    clienteId: '',
    equipo: '',
    fecha: new Date(),
    problema: '',
    trabajoRealizado: '<p>A continuación se detalla el trabajo realizado:</p><ul><li>Inspección inicial.</li><li>Diagnóstico del problema.</li><li>Corrección de fallas.</li></ul>',
    observaciones: '',
    montoTotal: 0,
    moneda: 'USD',
    terminosCondiciones: 'El cliente acepta los trabajos y costos descritos en este reporte. La garantía de las refacciones es de 30 días contra defectos de fabricación.',
    nombreFirmaCliente: '',
    detalles: [],
  };
}
