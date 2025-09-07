import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: false
})
export class SplashScreenComponent implements OnInit {
  constructor(private router: Router) {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit() {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
