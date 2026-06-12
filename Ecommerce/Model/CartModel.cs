using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Models
{
    public class CartModel
    {
        [Key]
        public int CartID { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }

        // ─── Foreign Keys ─────────────────────────────────
        public int UserID { get; set; }

        // ─── Navigation Properties ─────────────────────────
        public UserModel User { get; set; }
        public ICollection<CartItemModel> CartItems { get; set; }
    }
}