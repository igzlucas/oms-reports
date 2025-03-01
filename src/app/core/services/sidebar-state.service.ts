// sidebar-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {

   private isSidebarOpen = new BehaviorSubject<boolean>(false);
   isSidebarOpen$ = this.isSidebarOpen.asObservable();

   toggleSidebar() {
     this.isSidebarOpen.next(!this.isSidebarOpen.value);
   }

   openSidebar() {
     this.isSidebarOpen.next(true);
   }

   closeSidebar() {
     this.isSidebarOpen.next(false);
   }
}
