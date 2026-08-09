import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Address, CartResponse, PlaceOrderRequest, PlaceOrderResponse } from './checkout.model';
import { OrderDetail, OrderListItem } from './order.model';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAddresses() {
    return this.http.get<Address[]>(`${this.base}/api/addresses`);
  }

  addAddress(address: Partial<Address>) {
    return this.http.post<Address>(`${this.base}/api/addresses`, address);
  }

  getCart() {
    return this.http.get<CartResponse>(`${this.base}/api/cart`);
  }

  placeOrder(request: PlaceOrderRequest) {
    return this.http.post<PlaceOrderResponse>(`${this.base}/api/orders/place`, request);
  }
  getMyOrders() {
  return this.http.get<OrderListItem[]>(`${this.base}/api/orders`);
}

getOrderById(id: number) {
  return this.http.get<OrderDetail>(`${this.base}/api/orders/${id}`);
}

cancelOrder(id: number) {
  return this.http.put(`${this.base}/api/orders/${id}/cancel`, {});
}
}