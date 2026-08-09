import { Component, OnInit, inject, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../../store/services/cart.service';
import { ToastService } from '../../../store/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID); // Platform identity check inject kiye

  cartItems = this.cartService.items; 
  taxRate = 0;

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => {
      const price = item.discountPrice ?? item.price ?? 0;
      return sum + (price * item.quantity);
    }, 0)
  );

  tax = computed(() => this.subtotal() * this.taxRate);
  total = computed(() => this.subtotal() + this.tax());

  ngOnInit(): void {
    // Only fetch when application reaches the browser environment where token exists
    if (isPlatformBrowser(this.platformId)) {
      this.cartService.loadCart().subscribe({
        error: (err) => {
          console.error('Cart load failed:', err);
          this.toastService.show('Cart items load nahi ho sakay. Please login again.', 'error');
        }
      });
    }
  }

  increaseQty(item: { cartItemID: number; quantity: number; stock: number }) {
    if (item.quantity >= item.stock) return;
    this.cartService.updateQuantity(item.cartItemID, item.quantity + 1).subscribe();
  }

  decreaseQty(item: { cartItemID: number; quantity: number }) {
    if (item.quantity <= 1) return;
    this.cartService.updateQuantity(item.cartItemID, item.quantity - 1).subscribe();
  }

  removeItem(cartItemId: number) {
    this.cartService.removeItem(cartItemId).subscribe({
      next: () => this.toastService.show('Item cart se remove ho gaya', 'success'),
      error: () => this.toastService.show('Remove nahi ho saka', 'error')
    });
  }

  itemPrice(item: { price: number; discountPrice: number | null; quantity: number }): string {
    const price = item.discountPrice ?? item.price ?? 0;
    return (price * item.quantity).toFixed(2);
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }
  // class ke andar:
getImageUrl(path?: string | null): string {
  if (!path) return 'assets/no-image.png';
  if (path.startsWith('http')) return path;
  return `${environment.apiUrl}${path}`;
}
}