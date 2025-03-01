import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


interface Reporte {
  reporteId: number;
  fecha: string;
  empresa: string;
  empresaDireccion: string;
  cliente: string;
  clienteDireccion: string;
  persona: string;
  equipo: string;
  problema: string;
  trabajo: string;
  monto: number;
  moneda: string;
  observaciones: string;
}

interface ApiResponse {
  reportes: Reporte[];
  pagination: {
    totalPages: number;
    totalRecordsPage: number;
    totalRecords: number;
    page: number;
  };
}

interface Detalle {
  cantidad: number;
  descripcion: string;
  precio: number;
  total: number;
}




@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private apiUrl = 'https://sn8gmljs-8082.usw3.devtunnels.ms/api/v1/reporte';

  constructor(private http: HttpClient) {}

  sendReport(reportData: any): Observable<any> { 
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post<any>(this.apiUrl, reportData, { headers });
  }


  getReportes(pageNumber: number = 1, pageRecords: number = 10): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}?empresaId=${environment.bussines.id}&pageNumber=${pageNumber}&pageRecords=${pageRecords}`);
  }

  getDetallesReporte(reporteId: number){
    return this.http.get<Detalle[]>(`${this.apiUrl}/${reporteId}`);
  }

  getNumeroReportes(){
    return this.http.get(`${this.apiUrl}/numero/${environment.bussines.id}`);
  }
}
