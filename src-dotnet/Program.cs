using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Telegram.Bot;
using YeaBuddyBot.Bot;
using YeaBuddyBot.Bot.Training;
using YeaBuddyBot.Services;

var builder = new HostBuilder()
    .ConfigureAppConfiguration((context, config) =>
    {
        config.AddEnvironmentVariables();
        if (context.HostingEnvironment.IsDevelopment())
        {
            config.AddJsonFile("local.settings.json", optional: true);
        }
    })
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices((context, services) =>
    {
        // Add logging
        services.AddLogging();
        
        // Add configuration
        services.AddSingleton<BotConfiguration>();
        
        // Add HTTP client
        services.AddHttpClient<MistralService>();
        
        // Add bot services
        services.AddSingleton<TrainingManager>();
        services.AddSingleton<MistralService>();
        
        // Add Telegram bot client
        services.AddSingleton<ITelegramBotClient>(provider =>
        {
            var config = provider.GetRequiredService<BotConfiguration>();
            return new TelegramBotClient(config.TelegramBotToken);
        });
        
        // Add main bot service
        services.AddSingleton<YeaBuddyBot.Bot.YeaBuddyBot>();
    })
    .ConfigureLogging(logging =>
    {
        logging.AddConsole();
        logging.SetMinimumLevel(LogLevel.Information);
    });

var host = builder.Build();

// Check if we're running in Azure Functions environment
var isAzureFunction = Environment.GetEnvironmentVariable("AZURE_FUNCTIONS_ENVIRONMENT") != null ||
                      Environment.GetEnvironmentVariable("FUNCTIONS_WORKER_RUNTIME") != null;

if (!isAzureFunction)
{
    // Development mode - start bot polling
    var logger = host.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Starting bot in polling mode (development)...");
    
    var bot = host.Services.GetRequiredService<YeaBuddyBot.Bot.YeaBuddyBot>();
    var cancellationTokenSource = new CancellationTokenSource();
    
    // Handle shutdown gracefully
    Console.CancelKeyPress += (_, e) =>
    {
        e.Cancel = true;
        cancellationTokenSource.Cancel();
    };
    
    try
    {
        await bot.StartPollingAsync(cancellationTokenSource.Token);
        
        // Keep the application running
        await Task.Delay(-1, cancellationTokenSource.Token);
    }
    catch (OperationCanceledException)
    {
        logger.LogInformation("Bot polling cancelled");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error running bot in polling mode");
    }
}
else
{
    // Azure Functions mode
    var logger = host.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Running in Azure Functions environment - webhook mode");
    
    await host.RunAsync();
}
