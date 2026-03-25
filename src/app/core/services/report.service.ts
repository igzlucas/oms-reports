import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, query, where, addDoc, updateDoc, runTransaction, limit, getCountFromServer, getDocs, deleteDoc } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Report } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private firestore: Firestore = inject(Firestore);

  private reportsCollection = collection(this.firestore, 'reportes');

  getReports(): Observable<Report[]> {
    const q = query(this.reportsCollection);
    return from(getDocs(q)).pipe(
        map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)))
    );
  }

  getReportById(id: string): Observable<Report | null> {
    const reportDoc = doc(this.firestore, `reportes/${id}`);
    return from(getDoc(reportDoc)).pipe(
      map(docSnap => docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Report : null)
    );
  }
  
  getReportByToken(token: string): Observable<Report | null> {
    const q = query(this.reportsCollection, where("publicLinkToken", "==", token), limit(1));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) {
          return null;
        }
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Report;
      })
    );
  }

  getReportsByEmpresa(empresaId: string, count?: number): Observable<Report[]> {
    let q = query(this.reportsCollection, where('empresaId', '==', empresaId));
    if (count) {
      q = query(q, limit(count));
    }
    return from(getDocs(q)).pipe(
        map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)))
    );
  }

  getReportsCountByEmpresa(empresaId: string): Observable<number> {
    const q = query(this.reportsCollection, where('empresaId', '==', empresaId));
    return from(getCountFromServer(q)).pipe(
      map(snapshot => snapshot.data().count)
    );
  }

  async addReport(report: Report): Promise<any> {
    const metadataRef = doc(this.firestore, `empresa/${report.empresaId}/metadata/reports`);

    return runTransaction(this.firestore, async (transaction) => {
      const metadataDoc = await transaction.get(metadataRef);
      const lastId = metadataDoc.exists() ? metadataDoc.data()['lastId'] : 0;
      const newReportId = lastId + 1;

      report.reporteId = newReportId;

      const newReportRef = doc(collection(this.firestore, 'reportes'));
      transaction.set(newReportRef, report);
      transaction.set(metadataRef, { lastId: newReportId }, { merge: true });

      return newReportRef;
    });
  }

  updateReport(id: string, report: Partial<Report>): Promise<void> {
    const reportDoc = doc(this.firestore, `reportes/${id}`);
    return updateDoc(reportDoc, report);
  }

  // --- NUEVA FUNCIÓN PARA LA FIRMA DEL CLIENTE ---
  async updateClientSignature(reportId: string, signatureDataUrl: string, clientName: string): Promise<void> {
    const reportDoc = doc(this.firestore, `reportes/${reportId}`);
    const updateData = {
      firmaCliente: signatureDataUrl,
      nombreClienteFirma: clientName,
      clientStatus: 'approved',
      status: 'completado' // <-- ¡AQUÍ ESTÁ EL CAMBIO!
    };
    return updateDoc(reportDoc, updateData);
  }

  // --- NUEVA FUNCIÓN PARA ELIMINAR REPORTES ---
  deleteReport(id: string): Promise<void> {
    const reportDoc = doc(this.firestore, `reportes/${id}`);
    return deleteDoc(reportDoc);
  }

  getNextReportId(empresaId: string): Observable<number> {
    const metadataDoc = doc(this.firestore, `empresa/${empresaId}/metadata/reports`);
    return from(getDoc(metadataDoc)).pipe(
        switchMap(docSnap => {
            if (docSnap.exists()) {
                return of(docSnap.data()['lastId'] + 1);
            } else {
                return of(1); // If no reports exist, start at 1
            }
        })
    );
  }
}
