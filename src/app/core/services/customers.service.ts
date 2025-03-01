import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface Customer {
  clienteId?: string;
  empresaId: string;
  clienteNombre: string;
  clienteDireccion: string;
  selected?: boolean; // Propiedad opcional
}

export interface CustomerRequest {
  empresaId: string;
  nombre: string;
  direccion: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
    private customerUrl = `${environment.apiUrl}`;
    
    constructor(private http: HttpClient) {}

    getClientes(userId: string): Observable<any> {
      //const params = new HttpParams().set('userId', userId);
      return this.http.get(`${this.customerUrl}/clientes/usuarios?userId=${userId}`);
    }

     // Crear un cliente
  crearCliente(customer: CustomerRequest): Observable<CustomerRequest> {
    return this.http.post<CustomerRequest>(`${this.customerUrl}/clientes`, customer);
  }

  // Actualizar un cliente
  actualizarCliente(clienteId: string, customer: CustomerRequest): Observable<CustomerRequest> {
    return this.http.put<CustomerRequest>(`${this.customerUrl}/clientes/${clienteId}`, customer);
  }

  // Eliminar un cliente
  eliminarCliente(clienteId: string): Observable<any> {
    return this.http.delete<CustomerRequest>(`${this.customerUrl}/clientes/${clienteId}`);
  }

  getNumeroClientes(){
    return this.http.get(`${this.customerUrl}/clientes/numero/${environment.bussines.id}`);
  }

}
