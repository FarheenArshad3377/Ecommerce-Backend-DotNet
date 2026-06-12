using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.Models
{
    public class OrderItemModel
    {
        [Key]
        public int OrderItemID { get; set; }

        [Required]
        [Range(1, 1000)]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }      // Price at time of order

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }     // Quantity * UnitPrice

        // ─── Foreign Keys ─────────────────────────────────
        public int OrderID { get; set; }
        public int ProductID { get; set; }

        // ─── Navigation Properties ─────────────────────────
        public OrderModel Order { get; set; }
        public ProductModel Product { get; set; }
    }
}