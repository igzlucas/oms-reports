export interface Report {
    id?: string;
    userId: string;
    cliente: string;
    clienteId: string;
    clienteDireccion: string;
    empresa: string;
    empresaDireccion: string;
    fecha: string;
    persona: string;
    personaRecibe: string;
    equipo: string;
    problema: string;
    trabajoRealizado: string;
    monto: number;
    moneda: string;
    observaciones: string;
    detalles: Detail[];
    firma: string;
  }
  
  export interface Detail {
    cantidad: number;
    descripcion: string;
    valorUnitario: number;
    valorTotal: number;
  }

  export function initialReportData(): Report {
    return {
      userId: '',
      cliente: '',
      clienteId: '',
      clienteDireccion: '',
      empresa: '',
      empresaDireccion: '',
      fecha: new Date().toISOString().substring(0, 10),
      persona: '',
      personaRecibe: '',
      equipo: '',
      problema: '',
      trabajoRealizado: '',
      monto: 0,
      moneda: 'USD',
      observaciones: '',
      detalles: [],
      firma: ''
    };
  }
  