import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.component.html',
//   styleUrls: ['./products.component.scss'] // Agar .scss use kar rahe hain
})
export class ProductsComponent {
  // Baad mein yahan ProductService inject kar ke data layenge
}