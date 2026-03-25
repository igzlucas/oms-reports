import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, DocumentData, CollectionReference } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Customer } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {

  private customersCollection: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) {
    this.customersCollection = collection(this.firestore, 'clientes');
  }

  getCustomers(): Observable<Customer[]> {
    return from(getDocs(this.customersCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)))
    );
  }

  // --- NUEVA FUNCIÓN --- 
  // Obtiene un cliente específico por su ID
  getCustomerById(id: string): Observable<Customer | null> {
    const customerDoc = doc(this.firestore, `clientes/${id}`);
    return from(getDoc(customerDoc)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() } as Customer;
        } else {
          return null;
        }
      })
    );
  }

  addCustomer(customer: Omit<Customer, 'id'>): Observable<any> {
    return from(addDoc(this.customersCollection, customer));
  }

  updateCustomer(id: string, customer: Partial<Customer>): Observable<void> {
    const customerDoc = doc(this.firestore, `clientes/${id}`);
    return from(updateDoc(customerDoc, { ...customer }));
  }

  deleteCustomer(id: string): Observable<void> {
    const customerDoc = doc(this.firestore, `clientes/${id}`);
    return from(deleteDoc(customerDoc));
  }

  getNumeroClientes(): Promise<number> {
    return getDocs(this.customersCollection).then(snapshot => snapshot.size);
  }
}
