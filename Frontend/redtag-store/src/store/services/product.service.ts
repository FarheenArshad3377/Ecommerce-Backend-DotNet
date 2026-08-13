import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, ProductDetailDto, ProductListDto } from '../services/product.model';
import { environment } from '../../environments/environment';
export interface CreateProductRequest {
  productName: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  sku: string;
  imageUrl?: string;
  isFeatured: boolean;
  categoryID: number;
}
@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/products`;

  // List endpoint — wrapper { data: [...] } ho ya plain array, dono handle karega
  // NOTE: backend default pageSize=12 laga deta hai, isliye ye sirf pehla page dega
  getProducts(): Observable<ProductListDto[]> {
    return this.http.get<any>(this.baseUrl).pipe(
      map(res => res?.data ?? res)
    );
  }

  // Admin listing ke liye — SAARE products ek hi call mein (pagination bypass)
 getAllProductsForAdmin(): Observable<ProductListDto[]> {
  const params = new HttpParams().set('page', '1').set('pageSize', '1000');
  return this.http.get<any>(this.baseUrl, { params }).pipe(
    map(res => Array.isArray(res) ? res : (res?.data ?? []))
  );
}

  // Single product endpoint — response khud hi object hai, wrapper nahi
  getProductById(id: number): Observable<ProductDetailDto> {
    return this.http.get<ProductDetailDto>(`${this.baseUrl}/${id}`);
  }

  // ─── Category page ke liye — filters + pagination support ───
  getProductsByCategory(
    categoryId?: number,
    page: number = 1,
    pageSize: number = 12,
    sortBy: string = 'newest'
  ): Observable<{ data: ProductListDto[]; total: number; page: number; pageSize: number; totalPages: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy);

    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get<{ data: ProductListDto[]; total: number; page: number; pageSize: number; totalPages: number }>(
      this.baseUrl,
      { params }
    );
  }

  searchProducts(query: string, limit: number = 6): Observable<ProductListDto[]> {
    return this.http.get<ProductListDto[]>(
      `${environment.apiUrl}/api/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  getFilteredProducts(params: {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStockOnly?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
    page?: number;
    pageSize?: number;
  }): Observable<{ data: ProductListDto[]; total: number; page: number; pageSize: number; totalPages: number }> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<any>(`${environment.apiUrl}/api/products/filter`, { params: httpParams });
  }

  getRecentlyViewed(excludeProductId?: number) {
    let url = `${environment.apiUrl}/api/RecentlyViewed?take=10`;
    if (excludeProductId) {
      url += `&excludeProductId=${excludeProductId}`;
    }
    return this.http.get<any[]>(url);
  }

  addToRecentlyViewed(productId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/RecentlyViewed/${productId}`, {});
  }
// ─── Add ye naye methods ProductService class mein ───

createProduct(product: CreateProductRequest): Observable<any> {
  return this.http.post<any>(this.baseUrl, product);
}

updateProduct(id: number, product: CreateProductRequest): Observable<any> {
  return this.http.put<any>(`${this.baseUrl}/${id}`, product);
}

deleteProduct(id: number): Observable<any> {
  return this.http.delete<any>(`${this.baseUrl}/${id}`);
}
}