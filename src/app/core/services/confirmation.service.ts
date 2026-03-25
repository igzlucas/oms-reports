import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

interface ConfirmationState {
  message: string;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new Subject<ConfirmationState>();
  confirmationState$ = this.confirmationSubject.asObservable();

  constructor() { }

  confirm(message: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.confirmationSubject.next({ message, resolve });
    });
  }
}
