import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CartDto, CartItemDto } from './cart.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/cart`;

  items = signal<CartItemDto[]>([]);
  cartCount = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

// Example fix inside CartService mapping if properties mismatch
loadCart() {
  return this.http.get<any>('https://ecommerce-backend.runasp.net/api/cart').pipe(
    tap(response => {
      // 1. Check karein agar array response direct nahi mila balki kisi property ke andar hai
      // C# Entity Framework ya custom wrappers aksar response.items ya response.$values bhejte hain
      const rawItems = Array.isArray(response) 
        ? response 
        : (response.items || response.$values || []);

      const mappedItems = rawItems.map((item: any) => ({
        cartItemID: item.cartItemID || item.id,
        productId: item.productID || item.productId,
        productName: item.productName || item.product?.productName,
        imageUrl: item.imageUrl || item.product?.imageUrl,
        price: item.price || item.product?.price,
        discountPrice: item.discountPrice || item.product?.discountPrice,
        quantity: item.quantity,
        stock: item.stock || item.product?.stock || 10
      }));

      // Ab safely signal update ho jayega bina crash kiye
      this.items.set(mappedItems);
    })
  );
}

  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.baseUrl}/add`, { productId, quantity }).pipe(
      tap(() => this.loadCart().subscribe())   // backend doesn't return cart, so re-fetch
    );
  }

  updateQuantity(cartItemId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${cartItemId}`, { quantity }).pipe(
      tap(() => this.loadCart().subscribe())
    );
  }

  removeItem(cartItemId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/remove/${cartItemId}`).pipe(
      tap(() => this.loadCart().subscribe())
    );
  }
}