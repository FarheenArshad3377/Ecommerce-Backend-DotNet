import { Component, signal, inject, effect, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoading, selectIsLoggedIn } from '../../../../store/auth/auth.selectors';

// Standalone validator: checks for a genuinely strong password
function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  const hasMinLen = value.length >= 8;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  const valid = hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial;
  return valid ? null : { weakPassword: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  showSuccess = signal(false);
  passwordFocused = signal(false); // controls the requirements popover

  isSubmitting = this.store.selectSignal(selectAuthLoading);
  errorMessage = this.store.selectSignal(selectAuthError);
  isLoggedIn = this.store.selectSignal(selectIsLoggedIn);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordsMatch });

  // Live-tracks password value so the checklist updates as user types
  private passwordValue = toSignal(this.form.get('password')!.valueChanges, { initialValue: '' });

  passwordRequirements = computed(() => {
    const v = this.passwordValue() || '';
    return {
      hasMinLen: v.length >= 8,
      hasUpper: /[A-Z]/.test(v),
      hasLower: /[a-z]/.test(v),
      hasNumber: /[0-9]/.test(v),
      hasSpecial: /[^A-Za-z0-9]/.test(v),
    };
  });

  passwordAllValid = computed(() => {
    const r = this.passwordRequirements();
    return r.hasMinLen && r.hasUpper && r.hasLower && r.hasNumber && r.hasSpecial;
  });

  constructor() {
    effect(() => {
      if (this.isLoggedIn()) {
        this.showSuccess.set(true);
      }
    });

    // Auto-dismiss backend error toast after 5s so it doesn't sit forever
    effect(() => {
      const err = this.errorMessage();
      if (err) {
        const timer = setTimeout(() => this.store.dispatch(AuthActions.clearError()), 5000);
        return () => clearTimeout(timer);
      }
      return;
    });
  }

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onPasswordFocus(): void {
    this.passwordFocused.set(true);
  }

  onPasswordBlur(): void {
    this.passwordFocused.set(false);
  }

  dismissError(): void {
    this.store.dispatch(AuthActions.clearError());
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const fullName = this.form.value.fullName!.trim();
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.length ? rest.join(' ') : firstName;

    this.store.dispatch(AuthActions.register({
      payload: {
        firstName,
        lastName,
        email: this.form.value.email!,
        password: this.form.value.password!
      }
    }));
  }

  goToLogin(): void {
    this.showSuccess.set(false);
    this.router.navigate(['/login']);
  }
}