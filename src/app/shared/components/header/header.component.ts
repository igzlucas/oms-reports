import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { User } from 'firebase/auth';
import { Router, RouterModule } from '@angular/router';
import { ClickOutsideDirective } from '../../../core/services/click-outside.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isSidebarOpen$: Observable<boolean>;
  user$: Observable<User | null>;
  isDropdownOpen = false;

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isSidebarOpen$ = this.sidebarService.isSidebarOpen$;
    this.user$ = this.authService.user$;
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar(); // Corregido de .toggle() a .toggleSidebar()
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
    this.closeDropdown();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  redirectToProfile() {
    this.router.navigate(['/profile']);
    this.closeDropdown();
  }
}
