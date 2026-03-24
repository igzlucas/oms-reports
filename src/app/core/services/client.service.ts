import { inject, Injectable } from '@angular/core';
import {
  Firestore, collection, collectionData, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, DocumentReference, getCountFromServer, documentId
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private firestore: Firestore = inject(Firestore);

  getClientsByEmpresa(empresaId: string): Observable<Client[]> {
    const clientsRef = collection(this.firestore, 'clientes');
    const q = query(clientsRef, where('empresaId', '==', empresaId));
    return collectionData(q, { idField: 'id' }) as Observable<Client[]>;
  }

  getClientsByEmpresaOnce(empresaId: string): Observable<Client[]> {
    const clientsRef = collection(this.firestore, 'clientes');
    const q = query(clientsRef, where('empresaId', '==', empresaId));
    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        const clients: Client[] = [];
        querySnapshot.forEach(doc => {
          clients.push({ id: doc.id, ...doc.data() } as Client);
        });
        return clients;
      })
    );
  }

  getClientsCountByEmpresa(empresaId: string): Observable<number> {
    const clientsRef = collection(this.firestore, 'clientes');
    const q = query(clientsRef, where('empresaId', '==', empresaId));
    return from(getCountFromServer(q)).pipe(
      map(snapshot => snapshot.data().count)
    );
  }

  // CORRECCIÓN FINAL: Se usa documentId() para filtrar por el ID del documento.
  getClientsByIds(ids: string[]): Observable<Client[]> {
    if (ids.length === 0) {
        return from([]);
    }
    const clientsRef = collection(this.firestore, 'clientes');
    const q = query(clientsRef, where(documentId(), 'in', ids));
    return collectionData(q, { idField: 'id' }) as Observable<Client[]>;
  }

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

  addClient(client: Partial<Client>): Observable<DocumentReference> {
    const clientsRef = collection(this.firestore, 'clientes');
    return from(addDoc(clientsRef, client));
  }

  updateClient(id: string, client: Partial<Client>): Observable<void> {
    const clientDocRef = doc(this.firestore, 'clientes', id);
    return from(updateDoc(clientDocRef, client));
  }

  deleteClient(id: string): Observable<void> {
    const clientDocRef = doc(this.firestore, 'clientes', id);
    return from(deleteDoc(clientDocRef));
  }
}
