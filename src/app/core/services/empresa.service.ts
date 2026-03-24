import { Injectable } from '@angular/core';
import { Firestore, collection, doc, updateDoc, addDoc, getDoc, DocumentReference } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Empresa } from '../models/empresa.model';
import { AuthService } from './auth.service';
import { User } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  constructor(private firestore: Firestore, private authService: AuthService) { }

  // Obtiene la empresa asociada al usuario logueado
  getEmpresa(): Observable<Empresa | null> {
    return this.authService.user$.pipe(
      take(1), // Toma el primer valor emitido y se completa.
      switchMap(async (user: User | null) => {
        if (!user) {
          return null;
        }

        // 1. Obtener los datos del usuario para encontrar el ID de la empresa
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists() || !userDocSnap.data()['empresaId']) {
          console.error('El documento del usuario no tiene un empresaId asociado.');
          return null;
        }

        const empresaId = userDocSnap.data()['empresaId'];

        // 2. Obtener los datos de la empresa con ese ID
        const empresaDocRef = doc(this.firestore, `empresa/${empresaId}`);
        const empresaDocSnap = await getDoc(empresaDocRef);

        if (!empresaDocSnap.exists()) {
          console.error(`No se encontró una empresa con el ID: ${empresaId}`);
          return null;
        }

        // 3. Devolver el objeto de empresa completo
        return { id: empresaDocSnap.id, ...empresaDocSnap.data() } as Empresa;
      })
    );
  }

  // Crea una nueva empresa
  createEmpresa(empresa: Omit<Empresa, 'id'>): Observable<DocumentReference> {
    const empresaCollection = collection(this.firestore, 'empresa');
    return from(addDoc(empresaCollection, empresa));
  }

  // Actualiza una empresa existente
  updateEmpresa(id: string, empresa: Partial<Empresa>): Observable<void> {
    const empresaDocRef = doc(this.firestore, `empresa/${id}`);
    const updateData = { ...empresa };
    return from(updateDoc(empresaDocRef, updateData));
  }

  // Asigna una empresa a un usuario
  assignEmpresaToUser(userId: string, empresaId: string): Observable<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return from(updateDoc(userDocRef, { empresaId: empresaId }));
  }
}
