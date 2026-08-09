import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ChatService } from '../../store/services/chat.service';
import { selectIsLoggedIn, selectCurrentUserId } from '../../store/auth/auth.selectors';
import { combineLatest } from 'rxjs';
import { ChatStateService } from '../../store/services/chat-state.service';

interface ChatMessage {
  type: 'text' | 'quick-reply' | 'product';
  text?: string;
  product?: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent implements OnInit {
  private chatService = inject(ChatService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private store = inject(Store);

  private readonly STORAGE_KEY = 'redtag_chat_history';
  private readonly PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
        <rect width="200" height="150" fill="#EAE2D2"/>
        <text x="50%" y="50%" font-family="sans-serif" font-size="12" fill="#999" text-anchor="middle" dy=".3em">No Image</text>
      </svg>
    `);

  isOpen = signal(false);
  userInput = '';
  loading = signal(false);
  isAuthenticated = false; // 🔐 Identifies session state
currentUserId: string | number | null = null;
private chatState = inject(ChatStateService); 
  // Default welcome message helper

 get messages(): ChatMessage[] {
    return this.chatState.messages;
  }
  set messages(val: ChatMessage[]) {
    this.chatState.messages = val;
  }

  private getDefaultMessage(): ChatMessage[] {
    return [{ type: 'text', text: 'Hello! How can I help you today?' }];
  }

  private getStorageKey(userId: string | number): string {
    return `redtag_chat_history_${userId}`;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      combineLatest([
        this.store.select(selectIsLoggedIn),
        this.store.select(selectCurrentUserId)
      ]).subscribe(([isLoggedIn, userId]) => {
        this.isAuthenticated = isLoggedIn;
        this.currentUserId = userId;

        if (!isLoggedIn || !userId) {
          // 👇 Anonymous user: agar service mein pehle se messages hain (isi session mein), unhe mat ukhado
          if (!this.chatState.hasInitialized || this.chatState.messages.length === 0) {
            this.messages = this.getDefaultMessage();
          }
          this.chatState.hasInitialized = true;
          return;
        }

        // Logged-in user: localStorage se load karo (jaisa pehle tha)
        const key = this.getStorageKey(userId);
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed: ChatMessage[] = JSON.parse(saved);
            this.messages = parsed.length ? parsed : this.getDefaultMessage();
          } catch {
            this.messages = this.getDefaultMessage();
          }
        } else {
          this.messages = this.getDefaultMessage();
        }
        this.chatState.hasInitialized = true;
      });
    }
  }


private persist(): void {
  if (!this.isAuthenticated || !this.currentUserId) return;
  if (isPlatformBrowser(this.platformId)) {
    localStorage.setItem(this.getStorageKey(this.currentUserId), JSON.stringify(this.messages));
  }
}

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  private resolveImageUrl(prod: any): string {
    const raw = prod.imageUrl || prod.ImageUrl || prod.image || prod.Image || '';
    if (!raw) return this.PLACEHOLDER_IMG;
    if (raw.startsWith('http')) return raw;
    return `https://ecommerce-backend.runasp.net${raw.startsWith('/') ? '' : '/'}${raw}`;
  }

  private resolveName(prod: any): string {
    return prod.productName || prod.name || prod.ProductName || prod.Name || 'Product';
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const currentQuery = this.userInput;
    this.messages.push({ type: 'quick-reply', text: currentQuery });
    this.userInput = '';
    this.loading.set(true);
    
    // Attempt to persist (Will only execute if logged in)
    this.persist();

    // 🚀 Sab ke liye api call chalegi, chahe authenticated ho ya na ho!
    this.chatService.sendMessage(currentQuery).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.response) {
          this.messages.push({ type: 'text', text: res.response });
        }
        if (res && res.contextProducts) {
          res.contextProducts.forEach((prod: any) => {
            this.messages.push({
              type: 'product',
              product: {
                id: prod.id,
                name: this.resolveName(prod),
                price: prod.price,
                image: this.resolveImageUrl(prod)
              }
            });
          });
        }
        // Save state changes (Will only execute if logged in)
        this.persist();
      },
      error: (err: any) => {
        this.loading.set(false);
        console.error('API Error:', err);
      }
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.src === this.PLACEHOLDER_IMG) return; 
    img.src = this.PLACEHOLDER_IMG;
  }

  viewProduct(productId: number) {
    if (!productId) return;
    this.router.navigate(['/product', productId]);
  }
}