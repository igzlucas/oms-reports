import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // private apiUrl = 'http://localhost:8082/api/v1/config';  // URL de tu backend
  private apiUrl = 'https://sn8gmljs-8082.usw3.devtunnels.ms/api/v1/config';  // URL de tu backend
  constructor(private http: HttpClient) {}
  getConfigById(configId: number): Observable<any> {

    const token = localStorage.getItem('token'); 
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.append('Authorization', `Bearer ${token}`);
    }

    return this.http.get<any>(`${this.apiUrl}/${configId}`, { headers });
  }
}
