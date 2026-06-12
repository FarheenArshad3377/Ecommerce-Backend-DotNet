using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.Models
{
    public class ProductModel
    {
        [Key]
        public int ProductID { get; set; }

        [Required]
        [MaxLength(200)]
        public string ProductName { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? DiscountPrice { get; set; }      // Sale price

        [Required]
        public int Stock { get; set; }                   // Kitne available hain

        public string SKU { get; set; }                  // Unique product code e.g "SHOE-001"

        [MaxLength(500)]
        public string? ImageUrl { get; set; }            // Main image

        public bool IsActive { get; set; } = true;       // Show/hide product

        public bool IsFeatured { get; set; } = false;    // Homepage featured

        public double AverageRating { get; set; } = 0;   // Reviews se aayega

        public int TotalReviews { get; set; } = 0;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }       // Last update kab hua

        // ─── Foreign Keys ───────────────────────────────
        public int CategoryID { get; set; }              // Konsi category mein hai

        // ─── Navigation Properties ──────────────────────
        public CategoryModel Category { get; set; }      // Category ka poora object
        public ICollection<ProductImageModel> Images { get; set; }  // Multiple images
        public ICollection<ReviewModel> Reviews { get; set; }       // Product reviews
        public ICollection<CartItemModel> CartItems { get; set; }   // Cart mein kitni baar
        public ICollection<OrderItemModel> OrderItems { get; set; } // Order history
    }
}