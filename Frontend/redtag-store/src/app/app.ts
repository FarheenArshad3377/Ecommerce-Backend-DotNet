import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { selectIsLoggedIn, selectUser } from '../store/auth/auth.selectors';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.component.scss'
})
export class App implements OnInit {
  private store = inject(Store);
  private router = inject(Router);

  isAdminUser = signal(false);
  isOnAdminRoute = signal(false);

  ngOnInit(): void {
    combineLatest([
      this.store.select(selectIsLoggedIn),
      this.store.select(selectUser)
    ]).subscribe(([loggedIn, user]) => {
      console.log('🔍 App root — loggedIn:', loggedIn, 'user:', user);
      const isAdmin = loggedIn && !!user?.role && user.role.toLowerCase() === 'admin';
      this.isAdminUser.set(isAdmin);
    });

    this.isOnAdminRoute.set(this.router.url.startsWith('/admin'));
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isOnAdminRoute.set(event.urlAfterRedirects.startsWith('/admin'));
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}