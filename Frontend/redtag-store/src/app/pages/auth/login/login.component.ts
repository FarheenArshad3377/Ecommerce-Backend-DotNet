import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  form: FormGroup;
  showPassword = signal(false);

  isSubmitting = toSignal(this.store.select(selectAuthLoading), { initialValue: false });
  errorMessage = toSignal(this.store.select(selectAuthError), { initialValue: null });

  private errorTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    // Auto-dismiss backend error toast after 5s
    effect(() => {
      const err = this.errorMessage();
      if (this.errorTimer) clearTimeout(this.errorTimer);

      if (err) {
        this.errorTimer = setTimeout(() => this.store.dispatch(AuthActions.clearError()), 5000);
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  dismissError(): void {
    if (this.errorTimer) clearTimeout(this.errorTimer);
    this.store.dispatch(AuthActions.clearError());
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.dispatch(AuthActions.login({ payload: this.form.value }));
  }

  ngOnDestroy(): void {
    if (this.errorTimer) clearTimeout(this.errorTimer);
    this.store.dispatch(AuthActions.clearError());
  }
}