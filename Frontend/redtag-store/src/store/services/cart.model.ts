export interface CartItemDto {
  cartItemID: number;
  productID: number;
  productName: string;
  imageUrl: string;
  price: number;
  discountPrice: number | null;
  quantity: number;
  stock: number;
}

export interface CartDto {
  cartID: number;
  items: CartItemDto[];
}

export interface ApiResponse<T> {
  data: T;
}