import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.model';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.register, AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.registerSuccess, AuthActions.loginSuccess, (state, { response }) => ({
    ...state,
    loading: false,
    token: response.token,
    expiresAt: response.expiresAt,
    user: {
      id: response.userId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role
    }
  })),

  on(AuthActions.registerFailure, AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(AuthActions.logout, () => initialAuthState)
);