using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Ecommerce.DTOs;
using Ecommerce.Services.AI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatbotService _chatbotService;

        public ChatController(IChatbotService chatbotService)
        {
            _chatbotService = chatbotService;
        }

        [HttpPost]
        [AllowAnonymous] // 👈 Dono authenticated aur unauthenticated users ke liye open hai
        public async Task<IActionResult> Ask([FromBody] ChatRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest("Message cannot be empty.");
            }

            // 🔐 Check karein agar user logged-in hai (JWT Token ke sath aya hai)
            int? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int id))
                {
                    userId = id;
                }
            }

            // 🚀 Service ko message aur userId dono pass karein (userId null hogi agar logged-in nahi hai)
            // Note: Aapko apne IChatbotService ke signature me optional یا overload int? userId ka parameter add karna hoga.
            var response = await _chatbotService.ProcessMessageAsync(request.Message, userId);

            return Ok(response);
        }
    }
}