using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.Models
{
    public class PaymentModel
    {
        [Key]
        public int PaymentID { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(50)]
        public string Method { get; set; }
        // "Card" | "Cash" | "JazzCash" | "EasyPaisa"

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";
        // Pending → Completed → Failed → Refunded

        [MaxLength(200)]
        public string? TransactionID { get; set; }  // Payment gateway se

        public DateTime? PaidAt { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // ─── Foreign Keys ─────────────────────────────────
        public int OrderID { get; set; }

        // ─── Navigation Properties ─────────────────────────
        public OrderModel Order { get; set; }
    }
}