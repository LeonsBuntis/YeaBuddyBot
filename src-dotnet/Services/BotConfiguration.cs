using Microsoft.Extensions.Configuration;

namespace YeaBuddyBot.Services;

public class BotConfiguration
{
    public string TelegramBotToken { get; }
    public string MistralApiKey { get; }

    public BotConfiguration(IConfiguration configuration)
    {
        TelegramBotToken = configuration["BOT_TOKEN"] 
            ?? throw new ArgumentException("BOT_TOKEN environment variable is required");
        
        MistralApiKey = configuration["MISTRAL_API_KEY"] 
            ?? throw new ArgumentException("MISTRAL_API_KEY environment variable is required");
    }
}