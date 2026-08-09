import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  response: string;
  contextProducts: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    score: number;
    imageUrl?: string; // mapping fallback handle karne ke liye
    productName?: string; // database mapping name override handles
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'https://ecommerce-backend.runasp.net/api/chat';

  sendMessage(userMsg: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, { message: userMsg });
  }
}