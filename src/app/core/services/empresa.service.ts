import { Injectable } from '@angular/core';
import { Firestore, collection, doc, updateDoc, addDoc, getDoc, DocumentReference, DocumentSnapshot } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { switchMap, take, map } from 'rxjs/operators';
import { Empresa } from '../models/empresa.model';
import { AuthService } from './auth.service';
import { User } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  constructor(private firestore: Firestore, private authService: AuthService) { }

  getEmpresaById(id: string): Observable<Empresa | null> {
    const empresaDocRef = doc(this.firestore, `empresa/${id}`);
    return from(getDoc(empresaDocRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() } as Empresa;
        } else {
          console.error(`No se encontró una empresa con el ID: ${id}`);
          return null;
        }
      })
    );
  }

  // --- FUNCIÓN CORREGIDA PARA DESENREDAR EL ERROR ---
  getEmpresa(): Observable<Empresa | null> {
    return this.authService.user$.pipe(
      take(1), // Tomamos el primer usuario emitido y nos desuscribimos.
      switchMap((user: User | null) => {
        // Si no hay usuario, devolvemos un observable que emite 'null'.
        if (!user) {
          return of(null);
        }
        // Si hay usuario, buscamos su documento en la base de datos.
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        return from(getDoc(userDocRef)); // Devolvemos el observable de la consulta.
      }),
      switchMap((userDocSnap: DocumentSnapshot | null) => {
        // Recibimos el resultado de la consulta anterior.
        if (!userDocSnap || !userDocSnap.exists() || !userDocSnap.data()['empresaId']) {
          console.error('El documento del usuario no existe o no tiene un empresaId asociado.');
          return of(null); // Devolvemos un observable que emite 'null'.
        }
        // Si todo está bien, obtenemos el ID de la empresa.
        const empresaId = userDocSnap.data()['empresaId'];
        // Y finalmente, llamamos a la función que busca la empresa por ID.
        return this.getEmpresaById(empresaId);
      })
    );
  }

  createEmpresa(empresa: Omit<Empresa, 'id'>): Observable<DocumentReference> {
    const empresaCollection = collection(this.firestore, 'empresa');
    return from(addDoc(empresaCollection, empresa));
  }

  updateEmpresa(id: string, empresa: Partial<Empresa>): Observable<void> {
    const empresaDocRef = doc(this.firestore, `empresa/${id}`);
    const updateData = { ...empresa };
    return from(updateDoc(empresaDocRef, updateData));
  }

  assignEmpresaToUser(userId: string, empresaId: string): Observable<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return from(updateDoc(userDocRef, { empresaId: empresaId }));
  }
}
