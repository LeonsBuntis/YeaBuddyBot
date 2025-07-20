using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using YeaBuddyBot.Models;
using YeaBuddyBot.Services;

namespace YeaBuddyBot.Services;

public class MistralService
{
    private readonly HttpClient _httpClient;
    private readonly BotConfiguration _configuration;
    private readonly ILogger<MistralService> _logger;
    private readonly ConcurrentDictionary<long, List<ChatMessage>> _chatHistories;

    public MistralService(HttpClient httpClient, BotConfiguration configuration, ILogger<MistralService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _chatHistories = new ConcurrentDictionary<long, List<ChatMessage>>();
    }

    public async Task<string> HandleMessageAsync(long userId, string message)
    {
        try
        {
            // Get or initialize chat history for this user
            var history = _chatHistories.GetOrAdd(userId, _ => new List<ChatMessage>());
            
            // Add user message to history
            history.Add(new ChatMessage { Role = "user", Content = message });

            const string preprompt = "Act as a gymbro buddy. Only answer gym related prompts, if you are asked about something else, say 'I am a gymbro, I only talk about gym stuff'. ";
            const string postprompt = " Keep you answer short, never exceed 512 characters. Use emojis to make it more fun. If you don't know the answer, say 'Bro I don't know, I am just a gymbro'.";

            // Prepare the API request
            var requestBody = new
            {
                model = "mistral-small-latest",
                messages = history.Select(msg => new
                {
                    role = msg.Role,
                    content = preprompt + msg.Content + postprompt
                }).ToArray(),
                safe_prompt = true
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Set up headers
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_configuration.MistralApiKey}");

            // Make the API call
            var response = await _httpClient.PostAsync("https://api.mistral.ai/v1/chat/completions", content);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Mistral API request failed with status {StatusCode}", response.StatusCode);
                return "Sorry, I encountered an error while processing your message.";
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
            
            var botResponse = responseObj
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "Sorry, I could not generate a response.";

            // Add bot response to history
            history.Add(new ChatMessage { Role = "assistant", Content = botResponse });

            // Keep only last 10 messages to manage context window
            if (history.Count > 10)
            {
                history.RemoveRange(0, history.Count - 10);
            }

            return botResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Mistral API for user {UserId}", userId);
            return "Sorry, I encountered an error while processing your message.";
        }
    }
}