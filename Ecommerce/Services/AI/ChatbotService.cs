using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Ecommerce.DTOs;
using Microsoft.Extensions.Configuration;
using Ecommerce.Models; // 👈 Isse ChatHistoryModel class mil jayegi
using Ecommerce.Data;
namespace Ecommerce.Services.AI
{
    public class ChatbotService : IChatbotService
    {
        private readonly IEmbeddingService _embeddingService;
        private readonly IVectorSearchService _vectorSearchService;
        private readonly IPromptService _promptService;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context; // 👈 Database context for saving history

        public ChatbotService(
            IEmbeddingService embeddingService,
            IVectorSearchService vectorSearchService,
            IPromptService promptService,
            HttpClient httpClient,
            IConfiguration configuration,
            AppDbContext context) // 👈 DI Container me add kiya
        {
            _embeddingService = embeddingService;
            _vectorSearchService = vectorSearchService;
            _promptService = promptService;
            _httpClient = httpClient;
            _configuration = configuration;
            _context = context;
        }

        // 🔐 Parameter me int? userId = null add kiya
        public async Task<ChatResponseDto> ProcessMessageAsync(string userMessage, int? userId = null)
        {
            // 1. Convert user query to vector embedding
            var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(userMessage);

            // 2. Fetch top matching products from Qdrant
            var relevantProducts = await _vectorSearchService.SearchSimilarProductsAsync(queryEmbedding, limit: 4);

            // 3. Construct Context-Aware RAG Prompt
            var prompt = _promptService.BuildRAGPrompt(userMessage, relevantProducts);

            // 4. Call Gemini LLM for final generation
            var apiKey = _configuration["Gemini:ApiKey"];
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[] { new { text = prompt } }
                    }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, jsonContent);
            response.EnsureSuccessStatusCode();

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonResponse);

            var aiResponseText = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "Apologies, I couldn't generate a response.";

            // 💾 5. Database Save Guard: Agar userId null nahi hai to hi DB me record save hoga
            // 💾 5. Database Save Guard: Agar userId null nahi hai to hi DB me record save hoga
            // 💾 5. Database Save Guard: Agar userId null nahi hai to hi DB me record save hoga
            if (userId.HasValue)
            {
                try
                {
                    var chatHistory = new Ecommerce.Model.ChatBotHistoryModel
                    {
                        UserID = userId.Value,
                        UserMessage = userMessage,
                        BotResponse = aiResponseText,
                        CreatedAt = DateTime.UtcNow
                    };

                    // Note: Agar _context me property ka naam alag hai to dynamic suggestion use karlein
                    await _context.ChatBotHistories.AddAsync(chatHistory);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ChatBotHistory Save Error]: {ex.Message}");
                }
            }
            else
            {
                Console.WriteLine("Anonymous User Session: Chat history skipped from DB logs.");
            }

            return new ChatResponseDto
            {
                Response = aiResponseText,
                ContextProducts = relevantProducts
            };
        }
    }
}