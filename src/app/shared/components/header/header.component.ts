import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
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
export class HeaderComponent implements OnInit, OnDestroy {
  isSidebarVisible = false;
  user: User | null = null;
  private sidebarSubscription!: Subscription;
  private userSubscription!: Subscription;
  isDropdownOpen = false;
  name = '';

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sidebarSubscription = this.sidebarService.sidebarVisible$.subscribe(
      (isVisible: boolean) => {
        this.isSidebarVisible = isVisible;
      }
    );
    this.userSubscription = this.authService.user$.subscribe((user: User | null) => {
      this.user = user;
      if (user) {
        this.name = user.displayName || user.email || '';
      }
    });
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  redirectToConfiguracion() {
    this.router.navigate(['/profile']);
    this.closeDropdown();
  }

  selectOption(option: string) {
    if (option === 'profile') {
      this.redirectToConfiguracion();
    } else if (option === 'logout') {
      this.logout();
    }
    this.closeDropdown();
  }
}
