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
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET: api/orders  — User ki apni orders
        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            int userId = GetUserId();

            var orders = await _context.Orders
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Address)
                .Include(o => o.Payment)
                .Where(o => o.UserID == userId)
                .OrderByDescending(o => o.CreatedDate)
                .Select(o => new
                {
                    o.OrderID,
                    o.OrderNumber,
                    o.Status,
                    o.TotalAmount,
                    o.ShippingAmount,
                    o.DiscountAmount,
                    o.FinalAmount,
                    o.CreatedDate,
                    ItemCount = o.OrderItems.Count,
                    Payment = o.Payment == null ? null : new { o.Payment.Method, o.Payment.Status }
                })
                .ToListAsync();

            return Ok(orders);
        }

        // GET: api/orders/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            int userId = GetUserId();
            bool isAdmin = User.IsInRole("Admin");

            var order = await _context.Orders
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Address)
                .Include(o => o.Payment)
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.OrderID == id && (isAdmin || o.UserID == userId));

            if (order == null)
                return NotFound(new { message = "Order not found." });

            return Ok(new
            {
                order.OrderID,
                order.OrderNumber,
                order.Status,
                order.Notes,
                order.TotalAmount,
                order.ShippingAmount,
                order.DiscountAmount,
                order.FinalAmount,
                order.CreatedDate,
                order.UpdatedDate,
                Customer = isAdmin ? new { order.User.FirstName, order.User.LastName, order.User.Email } : null,
                Address = new
                {
                    order.Address.FullName,
                    order.Address.PhoneNumber,
                    order.Address.Street,
                    order.Address.City,
                    order.Address.State,
                    order.Address.Country,
                    order.Address.PostalCode
                },
                Items = order.OrderItems.Select(oi => new
                {
                    oi.OrderItemID,
                    oi.Quantity,
                    oi.UnitPrice,
                    oi.TotalPrice,
                    Product = new
                    {
                        oi.Product.ProductID,
                        oi.Product.ProductName,
                        oi.Product.ImageUrl
                    }
                }),
                Payment = order.Payment == null ? null : new
                {
                    order.Payment.Method,
                    order.Payment.Status,
                    order.Payment.Amount,
                    order.Payment.TransactionID,
                    order.Payment.PaidAt
                }
            });
        }

        // POST: api/orders/place  — Cart se order banao
        [HttpPost("place")]
        public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest request)
        {
            int userId = GetUserId();

            // Address check
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.AddressID == request.AddressId && a.UserID == userId);
            if (address == null)
                return BadRequest(new { message = "Address not found." });

            // Cart fetch
            var cart = await _context.Carts
                .Include(c => c.CartItems).ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserID == userId);

            if (cart == null || !cart.CartItems.Any())
                return BadRequest(new { message = "Cart is empty." });

            // Stock check
            foreach (var item in cart.CartItems)
            {
                if (item.Product.Stock < item.Quantity)
                    return BadRequest(new { message = $"'{item.Product.ProductName}' has only {item.Product.Stock} in stock." });
            }

            // Totals calculate
            decimal totalAmount = cart.CartItems.Sum(ci => ci.Quantity * (ci.Product.DiscountPrice ?? ci.Product.Price));
            decimal shipping = totalAmount >= 1000 ? 0 : 150;   // Free shipping above 1000
            decimal finalAmount = totalAmount + shipping;

            // Order number generate
            string orderNumber = "ORD-" + DateTime.UtcNow.Ticks.ToString().Substring(10, 6);

            var order = new OrderModel
            {
                OrderNumber = orderNumber,
                UserID = userId,
                AddressID = request.AddressId,
                TotalAmount = totalAmount,
                ShippingAmount = shipping,
                FinalAmount = finalAmount,
                Notes = request.Notes,
                Status = "Pending"
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Order items + stock reduce
            foreach (var item in cart.CartItems)
            {
                var orderItem = new OrderItemModel
                {
                    OrderID = order.OrderID,
                    ProductID = item.ProductID,
                    Quantity = item.Quantity,
                    UnitPrice = item.Product.DiscountPrice ?? item.Product.Price,
                    TotalPrice = item.Quantity * (item.Product.DiscountPrice ?? item.Product.Price)
                };
                _context.OrderItems.Add(orderItem);
                item.Product.Stock -= item.Quantity;   // Stock reduce karo
            }

            // Payment record create
            var payment = new PaymentModel
            {
                OrderID = order.OrderID,
                Amount = finalAmount,
                Method = request.PaymentMethod,
                Status = request.PaymentMethod == "Cash" ? "Pending" : "Pending"
            };
            _context.Payments.Add(payment);

            // Cart clear karo
            _context.CartItems.RemoveRange(cart.CartItems);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Order placed successfully!",
                orderId = order.OrderID,
                orderNumber = order.OrderNumber,
                finalAmount = order.FinalAmount
            });
        }

        // PUT: api/orders/5/cancel  — User apni order cancel kar sakta hai
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            int userId = GetUserId();

            var order = await _context.Orders
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderID == id && o.UserID == userId);

            if (order == null)
                return NotFound(new { message = "Order not found." });

            if (order.Status != "Pending" && order.Status != "Confirmed")
                return BadRequest(new { message = $"Cannot cancel order with status '{order.Status}'." });

            order.Status = "Cancelled";
            order.UpdatedDate = DateTime.UtcNow;

            // Stock wapas karo
            foreach (var item in order.OrderItems)
                item.Product.Stock += item.Quantity;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Order cancelled successfully." });
        }

        // ─── Admin Endpoints ─────────────────────────────────────────────────

        // GET: api/orders/admin/all  — Admin: sab orders dekho
        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.Payment)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(o => o.Status == status);

            int total = await query.CountAsync();
            var orders = await query
                .OrderByDescending(o => o.CreatedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    o.OrderID,
                    o.OrderNumber,
                    o.Status,
                    o.FinalAmount,
                    o.CreatedDate,
                    Customer = o.User.FirstName + " " + o.User.LastName,
                    o.User.Email,
                    PaymentStatus = o.Payment == null ? "N/A" : o.Payment.Status
                })
                .ToListAsync();

            return Ok(new { data = orders, total, page, pageSize });
        }

        // PUT: api/orders/admin/5/status  — Admin: status update
        [HttpPut("admin/{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            var validStatuses = new[] { "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled" };
            if (!validStatuses.Contains(request.Status))
                return BadRequest(new { message = "Invalid status." });

            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound(new { message = "Order not found." });

            order.Status = request.Status;
            order.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Order status updated to '{request.Status}'." });
        }
    }

    public class PlaceOrderRequest
    {
        public int AddressId { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? Notes { get; set; }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}