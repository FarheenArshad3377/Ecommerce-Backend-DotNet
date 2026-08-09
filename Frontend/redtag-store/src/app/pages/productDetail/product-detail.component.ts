import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../store/services/product.service';
import { ProductDetailDto, ProductListDto } from '../../../store/services/product.model';
import { CartService } from '../../../store/services/cart.service';
import { ToastService } from '../../../store/services/toast.service';
import { environment } from '../../../environments/environment';

type TabId = 'description' | 'reviews' | 'shipping';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);

  product = signal<ProductDetailDto | null>(null);
  loading = signal(true);
  error = signal('');

  selectedImageIndex = signal(0);
  qty = signal(1);
  activeTab = signal<TabId>('description');

  features = [
    { label: 'Free Shipping', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7v-6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.6" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="18" r="1.6" stroke="currentColor" stroke-width="1.6"/></svg>` },
    { label: 'Easy Returns', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M9 13.5L7 21l5-2.5 5 2.5-2-7.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>` },
    { label: 'Secure Checkout', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` }
  ];

  tabs: { id: TabId; label: string }[] = [
    { id: 'description', label: 'Description' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'shipping', label: 'Shipping Info' }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProduct(id);
      }
    }
  
  );
  }
// constructor/inject section mein
private cartService = inject(CartService);
private toastService = inject(ToastService);

addingToCart = signal(false);

addToCart() {
  const p = this.product();
  if (!p) return;

  this.addingToCart.set(true);
  this.cartService.addToCart(p.productID, this.qty()).subscribe({
    next: () => {
      this.addingToCart.set(false);
      this.toastService.show('Cart mein add ho gaya! 🛒', 'success');
    },
    error: (err) => {
      this.addingToCart.set(false);
      console.error('Add to cart failed:', err);
      this.toastService.show('Add to cart nahi ho saka.', 'error');
    }
  });
}
  private loadProduct(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.selectedImageIndex.set(0);
    this.qty.set(1);

    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product.set(data);
        this.loading.set(false);
        this.saveProductToHistory(data.productID);
      },
      
      error: (err) => {
        console.error('Product load failed:', err);
        this.error.set('Product nahi mil saka.');
        this.loading.set(false);
      }
    });
  }
  private saveProductToHistory(productId: number): void {
  this.productService.addToRecentlyViewed(productId).subscribe({
    next: () => {
      console.log('Product view history added successfully for ID:', productId);
    },
    error: (err) => {
      // Agar user login nahi hai ya token ka issue hai to console mein pata chal jayega
      console.error('Failed to add product to recently viewed:', err);
    }
  });
}
getImageUrl(path?: string | null): string {
  if (!path) return 'assets/no-image.png';
  return `${environment.apiUrl}${path}`;
}
  // images ab object array hai, isliye imageUrl nikalna hai
getGalleryImages(): string[] {
  const p = this.product();
  if (!p) return [];
  const rawImages = p.images && p.images.length > 0
    ? p.images.map(img => img.imageUrl)
    : [p.imageUrl];
  return rawImages.map(img => this.getImageUrl(img));
}

  getMainImage(): string {
    const images = this.getGalleryImages();
    return images[this.selectedImageIndex()] || '';
  }

  // ⚠️ bina argument ke — HTML mein hasDiscount() aise hi call ho raha hai
  hasDiscount(): boolean {
    const p = this.product();
    return !!p && !!p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;
  }

  formatPrice(price: number | null): string {
    if (price === null) return '0.00';
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  increaseQty() {
    this.qty.update(q => q + 1);
  }

  decreaseQty() {
    if (this.qty() > 1) this.qty.update(q => q - 1);
  }



buyNow(): void {
  const p = this.product();
  if (!p) return;

  this.cartService.addToCart(p.productID, this.qty()).subscribe({
    next: () => this.router.navigate(['/checkout']),
    error: (err) => {
      console.error('Buy now failed:', err);
      this.toastService.show('Kuch masla hua, dobara try karein.', 'error');
    }
  });
}
}