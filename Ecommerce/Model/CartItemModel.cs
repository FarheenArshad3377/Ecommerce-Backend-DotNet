using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.Models
{
    public class CartItemModel
    {
        [Key]
        public int CartItemID { get; set; }

        [Required]
        [Range(1, 100)]
        public int Quantity { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // ─── Foreign Keys ─────────────────────────────────
        public int CartID { get; set; }
        public int ProductID { get; set; }

        // ─── Navigation Properties ─────────────────────────
        public CartModel Cart { get; set; }
        public ProductModel Product { get; set; }
    }
}