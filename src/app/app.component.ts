import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Platform } from '@ionic/angular';
import { AuthService } from './services/auth.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  private authSub: Subscription | undefined;
  
  // Inject services using inject() function
  private router = inject(Router);
  private platform = inject(Platform);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Inisialisasi tambahan bisa ditambahkan di sini
    });
  }

  ngOnInit() {
    // Subscribe to authentication state changes
    this.authSub = this.authService.isLoggedIn$.subscribe((isAuthenticated: boolean) => {
      const currentPath = this.router.url;
      // Don't redirect if we're already on the splash screen or login page
      if (!isAuthenticated && !currentPath.includes('splash') && !currentPath.includes('login')) {
        // Redirect to splash screen if not authenticated
        this.ngZone.run(() => {
          this.router.navigate(['/splash']);
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
      this.authSub = undefined;
    }
  }
}
