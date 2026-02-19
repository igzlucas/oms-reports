import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    HeaderComponent, 
    SidebarComponent, 
    FooterComponent
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {

  public isSidebarOpen$: Observable<boolean>;

  constructor(private sidebarService: SidebarService) {
    this.isSidebarOpen$ = this.sidebarService.isSidebarOpen$;
  }

  closeSidebar(): void {
    // La lógica aquí no cambia, solo llama al servicio
    this.sidebarService.closeSidebar();
  }
}
