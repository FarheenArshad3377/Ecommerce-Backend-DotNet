import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../store/services/product.service';
import { ProductListDto  } from '../../../store/services/product.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './shop.component.html',
})
export class ShopComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products: ProductListDto [] = [];
  loading = true;
  errorMsg = '';

  currentPage = 1;
  totalPages = 1;
  categoryId?: number;
  sortBy = 'newest';

  ngOnInit(): void {
    // Query params change hote hi reload — taake navbar click pe same component reuse ho
    this.route.queryParams.subscribe(params => {
      this.categoryId = params['categoryId'] ? +params['categoryId'] : undefined;
      this.currentPage = params['page'] ? +params['page'] : 1;
      this.sortBy = params['sortBy'] || 'newest';
      this.loadProducts();
    });
  }

  loadProducts(): void {
  this.loading = true;
  this.productService.getProductsByCategory(
    this.categoryId,
    this.currentPage,
    12,
    this.sortBy
  ).subscribe({
    next: (res) => {
      this.products = res.data;
      this.totalPages = res.totalPages;
      this.loading = false;
    },
    error: () => {
      this.errorMsg = 'Failed to load products';
      this.loading = false;
    }
  });
}

  goToPage(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.route.snapshot.queryParams, page },
      queryParamsHandling: 'merge'
    });
  }
}