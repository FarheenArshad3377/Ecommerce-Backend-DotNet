using System.Security.Claims;
using Ecommerce.Data;
using Ecommerce.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]                         // Sab endpoints login require karte hain
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Helper: user ka cart lo, agar nahi hai to create karo
        private async Task<CartModel> GetOrCreateCart(int userId)
        {
            var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserID == userId);
            if (cart == null)
            {
                cart = new CartModel { UserID = userId };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }
            return cart;
        }

        // GET: api/cart
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            int userId = GetUserId();

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserID == userId);

            if (cart == null)
                return Ok(new { items = new List<object>(), total = 0 });

            var items = cart.CartItems.Select(ci => new
            {
                ci.CartItemID,
                ci.Quantity,
                Product = new
                {
                    ci.Product.ProductID,
                    ci.Product.ProductName,
                    ci.Product.ImageUrl,
                    Price = ci.Product.DiscountPrice ?? ci.Product.Price,
                    ci.Product.Stock
                },
                ItemTotal = ci.Quantity * (ci.Product.DiscountPrice ?? ci.Product.Price)
            }).ToList();

            decimal total = items.Sum(i => i.ItemTotal);

            return Ok(new { cartId = cart.CartID, items, total });
        }

        // POST: api/cart/add
        [HttpPost("add")]
        public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request)
        {
            int userId = GetUserId();

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null || !product.IsActive)
                return NotFound(new { message = "Product not found." });

            if (product.Stock < request.Quantity)
                return BadRequest(new { message = $"Only {product.Stock} items in stock." });

            var cart = await GetOrCreateCart(userId);

            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CartID == cart.CartID && ci.ProductID == request.ProductId);

            if (existingItem != null)
            {
                int newQty = existingItem.Quantity + request.Quantity;
                if (newQty > product.Stock)
                    return BadRequest(new { message = $"Cannot add more. Only {product.Stock} in stock." });

                existingItem.Quantity = newQty;
            }
            else
            {
                _context.CartItems.Add(new CartItemModel
                {
                    CartID = cart.CartID,
                    ProductID = request.ProductId,
                    Quantity = request.Quantity
                });
            }

            cart.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Item added to cart." });
        }

        // PUT: api/cart/update/5
        [HttpPut("update/{cartItemId}")]
        public async Task<IActionResult> UpdateItem(int cartItemId, [FromBody] UpdateCartItemRequest request)
        {
            int userId = GetUserId();

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .Include(ci => ci.Product)
                .FirstOrDefaultAsync(ci => ci.CartItemID == cartItemId && ci.Cart.UserID == userId);

            if (cartItem == null)
                return NotFound(new { message = "Cart item not found." });

            if (request.Quantity <= 0)
            {
                _context.CartItems.Remove(cartItem);
            }
            else
            {
                if (request.Quantity > cartItem.Product.Stock)
                    return BadRequest(new { message = $"Only {cartItem.Product.Stock} in stock." });

                cartItem.Quantity = request.Quantity;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cart updated." });
        }

        // DELETE: api/cart/remove/5
        [HttpDelete("remove/{cartItemId}")]
        public async Task<IActionResult> RemoveItem(int cartItemId)
        {
            int userId = GetUserId();

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci => ci.CartItemID == cartItemId && ci.Cart.UserID == userId);

            if (cartItem == null)
                return NotFound(new { message = "Cart item not found." });

            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Item removed from cart." });
        }

        // DELETE: api/cart/clear
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            int userId = GetUserId();

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserID == userId);

            if (cart == null)
                return Ok(new { message = "Cart is already empty." });

            _context.CartItems.RemoveRange(cart.CartItems);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cart cleared." });
        }
    }

    // Request DTOs (inline — simple hain)
    public class AddCartItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartItemRequest
    {
        public int Quantity { get; set; }
    }
}