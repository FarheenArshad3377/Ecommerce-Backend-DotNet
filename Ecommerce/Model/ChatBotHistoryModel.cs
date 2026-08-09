using System;
using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Model
{
    public class ChatBotHistoryModel
    {
        [Key]
        public int Id { get; set; }

        public int UserID { get; set; }

        public string UserMessage { get; set; } = string.Empty;

        public string BotResponse { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}