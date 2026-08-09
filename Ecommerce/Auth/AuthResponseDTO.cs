namespace Ecommerce.DTOs.Auth
{
    public class AuthResponseDTO
    {
        public int UserId { get; set; }
        public string Token { get; set; }           // JWT Token
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Role { get; set; }
        public DateTime ExpiresAt { get; set; }     // Token kab expire hoga
    }
}