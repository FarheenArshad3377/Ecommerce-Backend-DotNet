import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../store/services/product.service';
import { environment } from '../../../environments/environment';
import { ProductListDto } from '../../../store/services/product.model';
import { ProductFormModalComponent } from '../product-form-modal/product-form-modal.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductFormModalComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  products: ProductListDto[] = [];
  loading: boolean = true;

  isModalOpen: boolean = false;
  productBeingEdited: ProductListDto | null = null;

  isDeleteConfirmOpen: boolean = false;
  productToDelete: ProductListDto | null = null;
  deleting: boolean = false;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAllProductsForAdmin().subscribe({
      next: (data) => {
        this.products = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  trackByProductId(index: number, product: ProductListDto): any {
    return product.productID;
  }

  getLowStockCount(): number {
    return this.products.filter(product => product.stock <= 20).length;
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return 'assets/fallback-placeholder.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.apiUrl}${imageUrl}`;
  }

  openAddProductModal(): void {
    this.productBeingEdited = null;
    this.isModalOpen = true;
  }

  openEditModal(product: ProductListDto): void {
    this.productBeingEdited = { ...product };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.productBeingEdited = null;
  }

  onProductSaved(): void {
    this.closeModal();
    this.loadProducts();
  }

  openDeleteConfirm(product: ProductListDto): void {
    this.productToDelete = product;
    this.isDeleteConfirmOpen = true;
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.isDeleteConfirmOpen = false;
    this.productToDelete = null;
  }

  confirmDelete(): void {
    if (!this.productToDelete) return;

    this.deleting = true;
    (this.productService as any).deleteProduct(this.productToDelete.productID).subscribe({
      next: () => {
        this.deleting = false;
        this.isDeleteConfirmOpen = false;
        this.productToDelete = null;
        this.loadProducts();
      },
      error: (err: any) => {
        console.error('Error deleting product:', err);
        this.deleting = false;
      }
    });
  }
}