import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { selectUser, selectIsLoggedIn } from '../../../store/auth/auth.selectors';
import { AuthActions } from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent {
  private store = inject(Store);
  private router = inject(Router);

  user = toSignal(this.store.select(selectUser), { initialValue: null });
  isLoggedIn = toSignal(this.store.select(selectIsLoggedIn), { initialValue: false });

  // Login form state
  email = '';
  password = '';
  formError = signal('');

  // Logout confirmation modal
  showLogoutConfirm = signal(false);

onLoginSubmit(): void {
  this.formError.set('');

  if (!this.email || !this.password) {
    this.formError.set('Email aur password dono zaroori hain.');
    return;
  }

  this.store.dispatch(AuthActions.login({
    payload: {
      email: this.email,
      password: this.password
    }
  }));
}

  requestLogout(): void {
    this.showLogoutConfirm.set(true);
  }

  confirmLogout(): void {
    this.store.dispatch(AuthActions.logout());
    this.showLogoutConfirm.set(false);
    this.router.navigate(['/home']);
  }

  cancelLogout(): void {
    this.showLogoutConfirm.set(false);
  }
}