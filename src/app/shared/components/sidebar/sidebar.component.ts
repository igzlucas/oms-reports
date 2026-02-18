import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarService } from '../../../core/services/sidebar.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  isSidebarOpen = false;
  private sidebarSubscription!: Subscription;

  constructor(private sidebarService: SidebarService) {}

  ngOnInit() {
    this.sidebarSubscription = this.sidebarService.sidebarVisible$.subscribe(
      (isVisible: boolean) => {
        this.isSidebarOpen = isVisible;
      }
    );
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }
}
