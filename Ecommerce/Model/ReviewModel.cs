using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Models
{
    public class ReviewModel
    {
        [Key]
        public int ReviewID { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }             // 1 to 5 stars

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public bool IsApproved { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // ─── Foreign Keys ─────────────────────────────────
        public int UserID { get; set; }
        public int ProductID { get; set; }

        // ─── Navigation Properties ─────────────────────────
        public UserModel User { get; set; }
        public ProductModel Product { get; set; }
    }
}