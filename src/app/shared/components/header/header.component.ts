// header.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import {CommonModule} from '@angular/common';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { environment } from '../../../../environments/environment';
import { EncryptService } from '../../../core/services/encrypt.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  isDropdownOpen = false;
  datos: any; 
  name: string = ''; 
  isSidebarOpen = false;

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private sidebarService: SidebarStateService,
    private encryptService: EncryptService
  ) { }

  async ngOnInit(): Promise<void> {
    this.datos = (await this.authService.getUserName()) ;
    this.name = this.encryptService.descifrarRsa(this.datos.name.toString()) || 'Invitado';
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  selectOption(option: string) {
    this.closeDropdown();
    if (option === 'profile') {
      this.router.navigate(['/profile']);
    } else if (option === 'logout') {
      this.logout();
    }
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (!(event.target as HTMLElement).closest('.relative')) {
      this.closeDropdown();
    }
  }

  logout(): void {
    this.authService.logout();
  }

  redirectToConfiguracion(): void {
    this.router.navigate([`/configuracion/${environment.users.id}`]);
  }

  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Alterna el estado del sidebar
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }


}
