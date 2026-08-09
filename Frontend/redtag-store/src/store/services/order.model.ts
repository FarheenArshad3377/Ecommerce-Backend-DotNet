export interface OrderListItem {
  orderID: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  finalAmount: number;
  createdDate: string;
  itemCount: number;
  payment: { method: string; status: string } | null;
}

export interface OrderDetail {
  orderID: number;
  orderNumber: string;
  status: string;
  notes: string | null;
  totalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  finalAmount: number;
  createdDate: string;
  updatedDate: string | null;
  address: {
    fullName: string;
    phoneNumber: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  items: {
    orderItemID: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: { productID: number; productName: string; imageUrl: string };
  }[];
  payment: {
    method: string;
    status: string;
    amount: number;
    transactionID: string | null;
    paidAt: string | null;
  } | null;
}