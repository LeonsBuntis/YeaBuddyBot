using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Telegram.Bot.Types;
using YeaBuddyBot.Bot;

namespace YeaBuddyBot.Functions;

public class TelegramWebhookFunction
{
    private readonly YeaBuddyBot.Bot.YeaBuddyBot _bot;
    private readonly ILogger<TelegramWebhookFunction> _logger;

    public TelegramWebhookFunction(YeaBuddyBot.Bot.YeaBuddyBot bot, ILogger<TelegramWebhookFunction> logger)
    {
        _bot = bot;
        _logger = logger;
    }

    [Function("TelegramWebhook")]
    public async Task<HttpResponseData> RunAsync(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "webhook")] HttpRequestData req)
    {
        _logger.LogInformation("Webhook triggered: {Method} {Url}", req.Method, req.Url);

        try
        {
            // Only accept POST requests
            if (req.Method != "POST")
            {
                var methodNotAllowedResponse = req.CreateResponse(HttpStatusCode.MethodNotAllowed);
                await methodNotAllowedResponse.WriteStringAsync("Method not allowed");
                return methodNotAllowedResponse;
            }

            // Get the request body
            string requestBody = await req.ReadAsStringAsync() ?? "";
            
            if (string.IsNullOrEmpty(requestBody))
            {
                var badRequestResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequestResponse.WriteStringAsync("Invalid update");
                return badRequestResponse;
            }

            // Parse the update
            var update = JsonSerializer.Deserialize<Update>(requestBody);
            if (update == null)
            {
                var badRequestResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequestResponse.WriteStringAsync("Invalid update");
                return badRequestResponse;
            }

            // Handle the update
            await _bot.HandleUpdateAsync(update);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("OK");
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling webhook");
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteStringAsync("Internal server error");
            return errorResponse;
        }
    }
}