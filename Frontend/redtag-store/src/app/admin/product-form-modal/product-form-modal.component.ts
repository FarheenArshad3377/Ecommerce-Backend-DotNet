import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; 
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product-form-modal.component.html',
  styleUrls: ['./product-form-modal.component.scss']
})
export class ProductFormModalComponent implements OnChanges, OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  @Input() isOpen: boolean = false;
  @Input() editProduct: any = null;
  
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  productForm: FormGroup;
  isSubmitting: boolean = false;
  categories: any[] = [];
  selectedFile: File | null = null;
  imagePreview: string | null = null;

constructor() {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required]],
      sku: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPrice: [null],
      stock: [0, [Validators.required, Validators.min(0)]],
      // 👇 Is line ko change karein (Validators.required add karein)
      description: ['', [Validators.required]], 
      categoryID: [null, [Validators.required]],
      isFeatured: [false],
      isActive: [1]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    // Aapke laye hue Categories Controller ke routes ko yahan call kar rahe hain
    this.http.get<any[]>(`${environment.apiUrl}/api/categories`).subscribe({
      next: (data: any[]) => { 
        this.categories = data; 
      },
      error: (err: any) => console.error('Error loading categories:', err)
    });
  }

ngOnChanges(changes: SimpleChanges): void {
    if (changes['editProduct'] && this.editProduct) {
      console.log('Edit Product Data Incoming:', this.editProduct);

      // Category ID ko safely handle karein (chahe kisi bhi case layout me aaye)
      const rawCatId = this.editProduct.categoryID || this.editProduct.categoryId;
      let targetCategoryId: string | null = null;

      if (rawCatId) {
        targetCategoryId = rawCatId.toString();
      } else if (this.editProduct.category && typeof this.editProduct.category === 'string') {
        // Fallback: Agar ID na mile to string name se match karein
        const matchedCat = this.categories.find(
          c => c.categoryName.toLowerCase() === this.editProduct.category.toLowerCase()
        );
        if (matchedCat) {
          const matchedId = matchedCat.categoryID || matchedCat.categoryId;
          targetCategoryId = matchedId ? matchedId.toString() : null;
        }
      }

      this.productForm.patchValue({
        productName: this.editProduct.productName,
        sku: this.editProduct.sku,
        price: this.editProduct.price,
        discountPrice: this.editProduct.discountPrice,
        stock: this.editProduct.stock,
        description: this.editProduct.description || 'Product details', // 👈 Khali ho to placeholders set karein
        categoryID: targetCategoryId, // 👈 Dropdown matches string/number structure flawlessly now
        isFeatured: this.editProduct.isFeatured || false,
        isActive: this.editProduct.isActive !== undefined ? this.editProduct.isActive : 1
      });
      
      this.imagePreview = this.editProduct.imageUrl ? `${environment.apiUrl}${this.editProduct.imageUrl}` : null;
      this.selectedFile = null;
    } else if (changes['isOpen'] && this.isOpen && !this.editProduct) {
      this.productForm.reset({ price: 0, stock: 0, isActive: 1, isFeatured: false, categoryID: null });
      this.imagePreview = null;
      this.selectedFile = null;
    }
  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  close(): void {
    this.closed.emit();
  }

onSubmit(): void {
    if (this.productForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const formValues = this.productForm.value;

    const formData = new FormData();
    formData.append('productName', formValues.productName);
    formData.append('sku', formValues.sku);
    
    // 👇 Numeric values ko decimal/integer parse safe kar ke append karein
    const basePrice = parseFloat(formValues.price) || 0;
    formData.append('price', basePrice.toString());
    
    if (formValues.discountPrice !== null && formValues.discountPrice !== '' && formValues.discountPrice !== undefined) {
      const discPrice = parseFloat(formValues.discountPrice) || 0;
      formData.append('discountPrice', discPrice.toString());
    }
    
    const currentStock = parseInt(formValues.stock, 10) || 0;
    formData.append('stock', currentStock.toString());
    
    formData.append('description', formValues.description || '');

    // 👇 Category ID strictly integer conversion
    const parsedCategoryId = parseInt(formValues.categoryID, 10) || 0;
    formData.append('categoryID', parsedCategoryId.toString());

    formData.append('isFeatured', formValues.isFeatured ? 'true' : 'false');
    
    // 👇 Controller defaults to checking database state or model rules
    formData.append('isActive', 'true'); 

    if (this.selectedFile) {
      formData.append('imageFile', this.selectedFile, this.selectedFile.name); 
    }

    const url = this.editProduct 
      ? `${environment.apiUrl}/api/products/${this.editProduct.productID}`
      : `${environment.apiUrl}/api/products`;

    const request$ = this.editProduct 
      ? this.http.put(url, formData)
      : this.http.post(url, formData);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.saved.emit();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        
        // 🔥 Yeh log aapko exact field ka naam batayega agar abhi bhi error aye!
        if (err.error && err.error.errors) {
          console.error('❌ STRICT VALIDATION ERRORS:', err.error.errors);
        } else {
          console.error('API Error details:', err);
        }
      }
    });
  }
}