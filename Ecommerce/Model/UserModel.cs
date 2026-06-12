using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Models
{
    public class UserModel
    {
        [Key]
        public int UserID { get; set; }

        [Required]
        [MinLength(2)]
        [MaxLength(50)]
        public string FirstName { get; set; }

        [Required]
        [MinLength(2)]
        [MaxLength(50)]
        public string LastName { get; set; }

        [Required]
        [MaxLength(100)]
        [EmailAddress]                              // Email format validate karega
        public string Email { get; set; }           // NOT nullable — Required hai

        [Required]
        public string PasswordHash { get; set; }    // NOT nullable — Required hai

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }    // Optional — nullable ✅

        [Required]
        public string Role { get; set; } = "Customer";  // "Customer" or "Admin"

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }

        // ─── Navigation Properties ────────────────────────
        public ICollection<AddressModel> Addresses { get; set; }  // User ke addresses
        public CartModel Cart { get; set; }                        // User ka cart
        public ICollection<OrderModel> Orders { get; set; }       // User ki orders
        public ICollection<ReviewModel> Reviews { get; set; }     // User ke reviews
    }
}