import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoading, selectIsLoggedIn } from '../../../../store/auth/auth.selectors';

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
  showSuccess = signal(false);   // 👈 naya signal

  isSubmitting = this.store.selectSignal(selectAuthLoading);
  errorMessage = this.store.selectSignal(selectAuthError);
  isLoggedIn = this.store.selectSignal(selectIsLoggedIn);   // 👈 naya selector

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
    // agreeTerms hata diya kyunke checkbox HTML mein comment out hai
  }, { validators: this.passwordsMatch });

  constructor() {
    // 👈 naya effect — jab login/register success ho, popup dikhao
    effect(() => {
      if (this.isLoggedIn()) {
        this.showSuccess.set(true);
      }
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

  goToLogin(): void {  // 👈 naya method
    this.showSuccess.set(false);
    this.router.navigate(['/login']);
  }
}