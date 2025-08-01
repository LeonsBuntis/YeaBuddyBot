using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text;
using System.Text.Json;
using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using YeaBuddyBot.Services;

namespace YeaBuddyBotFunctions.TelegramBot;

public class TelegramBotFunction(ITelegramBotClient botClient, ILogger<TelegramBotFunction> logger, UpdateHandler updateHandler)
{
    [Function("TelegramBotFunction")]
    public async Task<HttpResponseData> RunTelegramBotFunction([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData request, CancellationToken cancellationToken)
    {
        logger.LogInformation("C# HTTP trigger function processed a request.");
        var response = request.CreateResponse(HttpStatusCode.OK);
        try
        {
            var body = await request.ReadAsStringAsync() ?? throw new ArgumentNullException(nameof(request));
            var update = JsonSerializer.Deserialize<Update>(body, JsonBotAPI.Options);
            if (update is null)
            {
                logger.LogWarning("Unable to deserialize Update object.");
                return response;
            }

            // ToDo: we can inject ReceiverOptions through IOptions container
            var receiverOptions = new ReceiverOptions() { DropPendingUpdates = true, AllowedUpdates = [] };

            var me = await botClient.GetMe(cancellationToken);
            logger.LogInformation("Start receiving updates for {BotName}", me.Username ?? "My Awesome Bot");

            // Start receiving updates
            await botClient.ReceiveAsync(updateHandler, receiverOptions, cancellationToken);
        }
        catch (Exception e)
        {
            logger.LogError("Exception: {Message}", e.Message);
        }

        return response;
    }

    [Function("TelegramBotStartWebhook")]
    public async Task<IActionResult> RunTelegramBotStartWebhook([HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequestData request)
    {
        using var client = new HttpClient();

        var functionUrl = Environment.GetEnvironmentVariable("FUNCTION_URL", EnvironmentVariableTarget.Process)
            ?? throw new ArgumentException("Cannot get function url");

        var tgToken = Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN", EnvironmentVariableTarget.Process)
            ?? throw new ArgumentException("Can not get token. Set token in environment setting");

        var response = await client.PostAsync($"https://api.telegram.org/bot{tgToken}/setWebhook", new StringContent($"{{\"url\": \"{functionUrl}\"}}", Encoding.UTF8, "application/json"));
        var responseBody = await response.Content.ReadAsStringAsync();

        return new OkObjectResult(response.IsSuccessStatusCode);
    }
}