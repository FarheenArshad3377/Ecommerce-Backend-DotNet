import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CheckoutService } from '../../../store/services/checkout.service';
import { ToastService } from '../../../store/services/toast.service';
import { Address, CartResponse, PlaceOrderResponse } from '../../../store/services/checkout.model';
import { environment } from '../../../environments/environment';

type Step = 'address' | 'payment' | 'review' | 'confirmation';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  private checkoutService = inject(CheckoutService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  currentStep = signal<Step>('address');
  loading = signal(false);
  placingOrder = signal(false);

  // Step 1: Address
  addresses = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  showNewAddressForm = signal(false);
  newAddress: Partial<Address> = {
    fullName: '', phoneNumber: '', street: '', city: '', state: '', country: 'Pakistan', postalCode: '', isDefault: false
  };

  // Step 2: Payment
  selectedPaymentMethod = signal<string>('Cash');

  // Step 3: Cart / Review
  cart = signal<CartResponse | null>(null);
  orderNotes = '';

  // Step 4: Confirmation
  orderResult = signal<PlaceOrderResponse | null>(null);

  shipping = computed(() => {
    const total = this.cart()?.total ?? 0;
    return total >= 1000 ? 0 : 150;
  });

  finalTotal = computed(() => (this.cart()?.total ?? 0) + this.shipping());

  steps: { key: Step; label: string }[] = [
    { key: 'address', label: 'Shipping' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' },
    { key: 'confirmation', label: 'Confirmed' }
  ];

  ngOnInit(): void {
    this.loadAddresses();
    this.loadCart();
  }

  private loadAddresses(): void {
    this.checkoutService.getAddresses().subscribe({
      next: (data) => {
        this.addresses.set(data);
        const defaultAddr = data.find(a => a.isDefault) ?? data[0];
        if (defaultAddr) this.selectedAddressId.set(defaultAddr.addressID);
        if (data.length === 0) this.showNewAddressForm.set(true);
      },
      error: () => this.toastService.show('Addresses load nahi ho sakin.', 'error')
    });
  }

  private loadCart(): void {
    this.checkoutService.getCart().subscribe({
      next: (data) => this.cart.set(data),
      error: () => this.toastService.show('Cart load nahi ho saka.', 'error')
    });
  }

  selectAddress(id: number): void {
    this.selectedAddressId.set(id);
    this.showNewAddressForm.set(false);
  }

  toggleNewAddressForm(): void {
    this.showNewAddressForm.update(v => !v);
  }

  saveNewAddress(): void {
    if (!this.newAddress.fullName || !this.newAddress.street || !this.newAddress.city || !this.newAddress.phoneNumber) {
      this.toastService.show('Sab required fields bharein.', 'error');
      return;
    }
    this.checkoutService.addAddress(this.newAddress).subscribe({
      next: (addr) => {
        this.addresses.update(list => [...list, addr]);
        this.selectedAddressId.set(addr.addressID);
        this.showNewAddressForm.set(false);
        this.toastService.show('Address add ho gaya!', 'success');
      },
      error: () => this.toastService.show('Address save nahi ho saka.', 'error')
    });
  }

  goToStep(step: Step): void {
    if (step === 'payment' && !this.selectedAddressId()) {
      this.toastService.show('Pehle shipping address select karein.', 'error');
      return;
    }
    if (step === 'review' && !this.cart()?.items.length) {
      this.toastService.show('Cart khaali hai.', 'error');
      return;
    }
    this.currentStep.set(step);
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod.set(method);
  }

  placeOrder(): void {
    if (!this.selectedAddressId()) {
      this.toastService.show('Address select karein.', 'error');
      return;
    }
    this.placingOrder.set(true);
    this.checkoutService.placeOrder({
      addressId: this.selectedAddressId()!,
      paymentMethod: this.selectedPaymentMethod(),
      notes: this.orderNotes || undefined
    }).subscribe({
      next: (result) => {
        this.orderResult.set(result);
        this.currentStep.set('confirmation');
        this.placingOrder.set(false);
      },
      error: (err) => {
        this.toastService.show(err?.error?.message || 'Order place nahi ho saka.', 'error');
        this.placingOrder.set(false);
      }
    });
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  getImageUrl(path?: string | null): string {
    if (!path) return 'assets/no-image.png';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path}`;
  }

  selectedAddress(): Address | undefined {
    return this.addresses().find(a => a.addressID === this.selectedAddressId());
  }
}