import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { User } from 'firebase/auth';
import { Empresa } from '../../../core/models/empresa.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private empresaService = inject(EmpresaService);
  private router = inject(Router);

  public isSidebarOpen$: Observable<boolean>;
  public user$: Observable<User | null>;
  public empresa$!: Observable<Empresa | null>;

  constructor() {
    this.isSidebarOpen$ = this.sidebarService.isSidebarOpen$;
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    this.empresa$ = this.empresaService.getEmpresa();
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.closeSidebar();
    });
  }
}
