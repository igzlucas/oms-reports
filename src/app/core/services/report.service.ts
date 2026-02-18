import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, DocumentData, CollectionReference } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Report } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private reportsCollection: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) {
    this.reportsCollection = collection(this.firestore, 'reports');
  }

  getReportes(clienteId: string | null, top: number): Observable<Report[]> {
    let q = query(this.reportsCollection);
    if (clienteId) {
      q = query(this.reportsCollection, where('clienteId', '==', clienteId));
    }
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)))
    );
  }

  createReport(report: Report): Observable<any> {
    return from(addDoc(this.reportsCollection, report));
  }

  updateReport(reportId: string, report: Partial<Report>): Observable<void> {
    const reportDoc = doc(this.firestore, `reports/${reportId}`);
    return from(updateDoc(reportDoc, report));
  }

  deleteReport(reportId: string): Observable<void> {
    const reportDoc = doc(this.firestore, `reports/${reportId}`);
    return from(deleteDoc(reportDoc));
  }

  getDetallesReporte(reporteId: string): Promise<Report | null> {
    const reportDoc = doc(this.firestore, `reports/${reporteId}`);
    return getDoc(reportDoc).then(docSnap => {
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Report;
      } else {
        return null;
      }
    });
  }

  getNumeroReportes(): Promise<number> {
    return getDocs(this.reportsCollection).then(snapshot => snapshot.size);
  }

  sendReport(report: Report): Observable<any> {
    if (report.id) {
      return this.updateReport(report.id, report);
    } else {
      return this.createReport(report);
    }
  }
}
