import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class BottomNavComponent {
  @Output() navigate = new EventEmitter<string>();

  // Inject services
  private router = inject(Router);

  constructor() {}

  isActive(route: string): boolean {
    // Special handling for root path
    if (route === 'home' && this.router.url === '/home') {
      return true;
    }
    // Special handling for 3d-space route
    if (route === '3d-space' && this.router.url.startsWith('/3d-space')) {
      return true;
    }
    // For other routes
    return this.router.url === `/${route}`;
  }

  async onNavigate(route: string) {
    // Special handling for 3d-space route
    const targetRoute = `/${route}`;
    const currentUrl = this.router.url.split('?')[0]; // Remove query params for comparison
    const isAlreadyThere = route === '3d-space'
      ? currentUrl.startsWith(targetRoute)
      : currentUrl === targetRoute;

    if (isAlreadyThere) return;

    try {
      // Navigate to the target route
      await this.router.navigate([targetRoute]);

      // Emit the event if there are listeners
      if (this.navigate.observed) {
        this.navigate.emit(route);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }
}
