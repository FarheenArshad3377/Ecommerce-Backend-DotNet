export interface Address {
  addressID: number;
  fullName: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

export interface CartItem {
  cartItemID: number;
  quantity: number;
  product: {
    productID: number;
    productName: string;
    imageUrl: string;
    price: number;
    stock: number;
  };
  itemTotal: number;
}

export interface CartResponse {
  cartId: number;
  items: CartItem[];
  total: number;
}

export interface PlaceOrderRequest {
  addressId: number;
  paymentMethod: string;
  notes?: string;
}

export interface PlaceOrderResponse {
  message: string;
  orderId: number;
  orderNumber: string;
  finalAmount: number;
}