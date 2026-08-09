import { Injectable } from '@angular/core';

export interface ChatMessage {
  type: 'text' | 'quick-reply' | 'product';
  text?: string;
  product?: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  messages: ChatMessage[] = [];
  hasInitialized = false;
}