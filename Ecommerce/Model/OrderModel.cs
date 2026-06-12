using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.Models
{
    public class OrderModel
    {
        [Key]
        public int OrderID { get; set; }

        [Required]
        [MaxLength(20)]
        public string OrderNumber { get; set; }     // e.g "ORD-0001"

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal FinalAmount { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";
        // Pending → Confirmed → Processing → Shipped → Delivered → Cancelled

        [MaxLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }

        // ─── Foreign Keys ─────────────────────────────────
        public int UserID { get; set; }
        public int AddressID { get; set; }

        // ─── Navigation Properties ─────────────────────────
        public UserModel User { get; set; }
        public AddressModel Address { get; set; }
        public ICollection<OrderItemModel> OrderItems { get; set; }
        public PaymentModel Payment { get; set; }
    }
}