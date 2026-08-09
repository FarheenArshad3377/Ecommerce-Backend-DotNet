using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Ecommerce.Services.AI
{
    public class EmbeddingService : IEmbeddingService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public EmbeddingService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<float[]> GenerateEmbeddingAsync(string text)
        {
            try
            {
                var apiKey = _configuration["Gemini:ApiKey"];

                // Updated model endpoint
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={apiKey}";

                var requestBody = new
                {
                    content = new
                    {
                        parts = new[]
                        {
                            new { text = text }
                        }
                    },
                    outputDimensionality = 768 // keep 768 dims for Qdrant compatibility
                };

                var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, jsonContent);

                if (!response.IsSuccessStatusCode)
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();

                    // 🚨 Crash karne ke bajaye console/debug window me error log karein
                    Console.WriteLine($"[Gemini API Warning]: {response.StatusCode} - {errorResponse}");

                    // Fallback mechanism: 768-dimensional khali values array bhej dein takay database vectors/Qdrant queries break na hon
                    return new float[768];
                }

                var jsonResponse = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonResponse);

                var values = doc.RootElement
                    .GetProperty("embedding")
                    .GetProperty("values");

                var embeddings = new List<float>();
                foreach (var element in values.EnumerateArray())
                {
                    embeddings.Add(element.GetSingle());
                }

                return embeddings.ToArray();
            }
            catch (Exception ex)
            {
                // 🛡️ Safe fallback block for system network drops or timeouts
                Console.WriteLine($"[EmbeddingService Exception]: {ex.Message}");
                return new float[768];
            }
        }
    }
}