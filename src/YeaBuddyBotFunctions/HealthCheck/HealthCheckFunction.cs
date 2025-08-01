using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;

namespace YeaBuddyBotFunctions.HealthCheck;

public class HealthCheckFunction()
{
    [Function("HealthCheck")]
    public IActionResult Run([HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequest req)
    {
        return new OkObjectResult("It's alive!");
    }
}
