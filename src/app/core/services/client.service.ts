import { inject, Injectable } from '@angular/core';
import {
  Firestore, collection, collectionData, doc, getDoc, query, where, addDoc, updateDoc, deleteDoc, DocumentReference
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private firestore: Firestore = inject(Firestore);

  // Obtiene todos los clientes de una empresa
  getClientsByEmpresa(empresaId: string): Observable<Client[]> {
    const clientsRef = collection(this.firestore, 'clientes');
    const q = query(clientsRef, where('empresaId', '==', empresaId));
    return collectionData(q, { idField: 'id' }) as Observable<Client[]>;
  }

  // Obtiene múltiples clientes por sus IDs
  getClientsByIds(ids: string[]): Observable<Client[]> {
    if (ids.length === 0) {
        return from([]);
    }
    const clientsRef = collection(this.firestore, 'clientes');
    const q = query(clientsRef, where('id', 'in', ids));
    return collectionData(q, { idField: 'id' }) as Observable<Client[]>;
  }

  // Obtiene un cliente específico por su ID
  getClientById(id: string): Observable<Client | undefined> {
    const clientDocRef = doc(this.firestore, 'clientes', id);
    return from(getDoc(clientDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Client;
        }
        return undefined;
      })
    );
  }

  // Añade un nuevo cliente
  addClient(client: Partial<Client>): Observable<DocumentReference> {
    const clientsRef = collection(this.firestore, 'clientes');
    return from(addDoc(clientsRef, client));
  }

  // Actualiza un cliente existente
  updateClient(id: string, client: Partial<Client>): Observable<void> {
    const clientDocRef = doc(this.firestore, 'clientes', id);
    return from(updateDoc(clientDocRef, client));
  }

  // Elimina un cliente
  deleteClient(id: string): Observable<void> {
    const clientDocRef = doc(this.firestore, 'clientes', id);
    return from(deleteDoc(clientDocRef));
  }
}
