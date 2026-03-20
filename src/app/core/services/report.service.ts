import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, query, where, orderBy, limit, addDoc, updateDoc, increment } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Report } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private firestore: Firestore = inject(Firestore);

  // CORREGIDO: La colección es 'reportes' (plural en español), no 'reports'
  private reportsCollection = collection(this.firestore, 'reportes');

  getReports(): Observable<Report[]> {
    return collectionData(this.reportsCollection, { idField: 'id' }) as Observable<Report[]>;
  }

  getReportById(id: string): Observable<Report | null> {
    const reportDoc = doc(this.firestore, `reportes/${id}`);
    return from(getDoc(reportDoc)).pipe(
      map(docSnap => docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Report : null)
    );
  }
  
  getReportByToken(token: string): Observable<Report | null> {
    const q = query(this.reportsCollection, where("publicLinkToken", "==", token));
    return from(collectionData(q, { idField: 'id' })).pipe(
      map(reports => reports.length > 0 ? reports[0] as Report : null)
    );
  }

  getReportsByEmpresa(empresaId: string, count?: number): Observable<Report[]> {
    let q = query(this.reportsCollection, where('empresaId', '==', empresaId));
    if (count) {
      q = query(q, limit(count));
    }
    return collectionData(q, { idField: 'id' }) as Observable<Report[]>;
  }

  addReport(report: Report): Promise<any> {
    return addDoc(this.reportsCollection, report);
  }

  updateReport(id: string, report: Partial<Report>): Promise<void> {
    const reportDoc = doc(this.firestore, `reportes/${id}`);
    return updateDoc(reportDoc, report);
  }

  getNextReportId(empresaId: string): Observable<number> {
    // Esta ruta ya estaba bien, la dejamos como está.
    const metadataDoc = doc(this.firestore, `empresas/${empresaId}/metadata/reports`);
    return from(getDoc(metadataDoc)).pipe(
        switchMap(docSnap => {
            if (docSnap.exists()) {
                return of(docSnap.data()['lastId'] + 1);
            } else {
                return of(1);
            }
        })
    );
  }
}
