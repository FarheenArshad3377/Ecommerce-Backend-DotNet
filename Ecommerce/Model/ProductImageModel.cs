using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Models
{
    public class ProductImageModel
    {
        [Key]
        public int ImageID { get; set; }

        [Required]
        [MaxLength(500)]
        public string ImageUrl { get; set; }

        public bool IsMain { get; set; } = false;   // Main thumbnail

        public int DisplayOrder { get; set; } = 0;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // ─── Foreign Keys ─────────────────────────────────
        public int ProductID { get; set; }

        // ─── Navigation Properties ─────────────────────────
        public ProductModel Product { get; set; }
    }
}