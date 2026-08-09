using Ecommerce.DTOs;

namespace Ecommerce.Services.AI
{
    public interface IChatbotService
    {
        Task<ChatResponseDto> ProcessMessageAsync(string userMessage, int? userId = null);
    }

}
