import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<ToastMessage | null>(null);

  show(text: string, type: 'success' | 'error' = 'success', duration = 2500) {
    this.toast.set({ text, type });
    setTimeout(() => this.toast.set(null), duration);
  }
}