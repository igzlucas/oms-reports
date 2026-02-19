export interface Equipment {
  id?: string; // ID único de Firestore
  customerId: string; // ID del cliente al que pertenece

  nombre: string; // Ej: "Motor Principal", "Generador de estribor"
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  // Podríamos añadir otros detalles como 'horasDeUso', 'ultimaRevision', etc.
}
