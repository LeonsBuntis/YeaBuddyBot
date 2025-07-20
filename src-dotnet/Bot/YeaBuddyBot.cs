using Microsoft.Extensions.Logging;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;
using YeaBuddyBot.Bot.Training;
using YeaBuddyBot.Services;

namespace YeaBuddyBot.Bot;

public class YeaBuddyBot
{
    private readonly ITelegramBotClient _botClient;
    private readonly TrainingManager _trainingManager;
    private readonly MistralService _mistralService;
    private readonly ILogger<YeaBuddyBot> _logger;
    private readonly Dictionary<long, string> _userScenes;

    public YeaBuddyBot(ITelegramBotClient botClient, TrainingManager trainingManager, 
                       MistralService mistralService, ILogger<YeaBuddyBot> logger)
    {
        _botClient = botClient;
        _trainingManager = trainingManager;
        _mistralService = mistralService;
        _logger = logger;
        _userScenes = new Dictionary<long, string>();
    }

    public async Task InitializeAsync()
    {
        try
        {
            await SetupCommandsAsync();
            _logger.LogInformation("Bot initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing bot");
            throw;
        }
    }

    private async Task SetupCommandsAsync()
    {
        var commands = new[]
        {
            new BotCommand { Command = "pumpit", Description = "Start a new training session 🏋️‍♂️" }
        };

        await _botClient.SetMyCommandsAsync(commands);
    }

    public async Task HandleUpdateAsync(Update update)
    {
        try
        {
            switch (update.Type)
            {
                case UpdateType.Message:
                    await HandleMessageAsync(update.Message!);
                    break;
                case UpdateType.CallbackQuery:
                    await HandleCallbackQueryAsync(update.CallbackQuery!);
                    break;
                default:
                    _logger.LogWarning("Unknown update type: {UpdateType}", update.Type);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling update");
        }
    }

    private async Task HandleMessageAsync(Message message)
    {
        if (message.From == null) return;

        var userId = message.From.Id;
        _logger.LogInformation("User {UserId}: message received: {Text}", userId, message.Text);

        // Check if user is in a scene
        if (_userScenes.TryGetValue(userId, out var scene))
        {
            await HandleSceneMessageAsync(message, scene);
            return;
        }

        switch (message.Type)
        {
            case MessageType.Text:
                var text = message.Text!;
                
                if (text.StartsWith('/'))
                {
                    await HandleCommandAsync(message);
                }
                else
                {
                    await HandleTextMessageAsync(message);
                }
                break;
        }
    }

    private async Task HandleCommandAsync(Message message)
    {
        var command = message.Text!.Split(' ')[0].ToLower();
        var userId = message.From!.Id;

        switch (command)
        {
            case "/start":
                await _botClient.SendTextMessageAsync(
                    message.Chat.Id,
                    "Yeah buddy! 💪 Light weight baby! What can I do for you?");
                break;

            case "/pumpit":
                await HandlePumpItCommandAsync(message);
                break;
        }
    }

    private async Task HandlePumpItCommandAsync(Message message)
    {
        var userId = message.From!.Id;

        if (_trainingManager.HasActiveSession(userId))
        {
            await _botClient.SendTextMessageAsync(
                message.Chat.Id,
                "You already have an active training session! FOCUS! 💪\nUse /finish to end your current session.");
            return;
        }

        _trainingManager.StartSession(userId);

        var keyboard = new InlineKeyboardMarkup(new[]
        {
            new[] { InlineKeyboardButton.WithCallbackData("Add Exercise 🎯", "addExercise") },
            new[] { InlineKeyboardButton.WithCallbackData("Finish Workout 🏁", "finish") }
        });

        await _botClient.SendTextMessageAsync(
            message.Chat.Id,
            "LIGHT WEIGHT BABY! 🏋️‍♂️ Training session started!\n\n" +
            "Use the buttons below to control your workout!\n\n" +
            "Let's make these weights fly! YEAH BUDDY! 💪",
            replyMarkup: keyboard);
    }

    private async Task HandleCallbackQueryAsync(CallbackQuery callbackQuery)
    {
        await _botClient.AnswerCallbackQueryAsync(callbackQuery.Id);

        var userId = callbackQuery.From.Id;
        var data = callbackQuery.Data;

        switch (data)
        {
            case "addExercise":
                await EnterSceneAsync(userId, "addExercise", callbackQuery.Message!);
                break;
            case "finish":
                await HandleFinishCommandAsync(callbackQuery.Message!, userId);
                break;
            case "addSet":
                await EnterSceneAsync(userId, "addSet", callbackQuery.Message!);
                break;
        }
    }

    private async Task EnterSceneAsync(long userId, string sceneName, Message message)
    {
        _userScenes[userId] = sceneName;

        switch (sceneName)
        {
            case "addExercise":
                await _botClient.SendTextMessageAsync(message.Chat.Id, "Enter exercise name:");
                break;
            case "addSet":
                await _botClient.SendTextMessageAsync(message.Chat.Id, "Enter weight and reps (e.g., \"225 12\"):");
                break;
        }
    }

    private async Task HandleSceneMessageAsync(Message message, string scene)
    {
        var userId = message.From!.Id;
        
        switch (scene)
        {
            case "addExercise":
                await HandleAddExerciseSceneAsync(message);
                break;
            case "addSet":
                await HandleAddSetSceneAsync(message);
                break;
        }

        // Exit scene after processing
        _userScenes.Remove(userId);
    }

    private async Task HandleAddExerciseSceneAsync(Message message)
    {
        var userId = message.From!.Id;
        var exerciseName = message.Text!;

        _trainingManager.AddExercise(userId, exerciseName);

        var keyboard = new InlineKeyboardMarkup(new[]
        {
            new[] { InlineKeyboardButton.WithCallbackData("Record Set 💪", "addSet") },
            new[] { InlineKeyboardButton.WithCallbackData("Add Another Exercise 🎯", "addExercise") },
            new[] { InlineKeyboardButton.WithCallbackData("Finish Workout 🏁", "finish") }
        });

        await _botClient.SendTextMessageAsync(
            message.Chat.Id,
            $"YEAH BUDDY! Starting {exerciseName}! 🏋️‍♂️\n" +
            "Use the buttons below to record your sets or add more exercises!",
            replyMarkup: keyboard);
    }

    private async Task HandleAddSetSceneAsync(Message message)
    {
        var userId = message.From!.Id;
        var setData = message.Text!;
        var parts = setData.Split(' ');

        if (parts.Length != 2 || !double.TryParse(parts[0], out var weight) || !int.TryParse(parts[1], out var reps))
        {
            await _botClient.SendTextMessageAsync(
                message.Chat.Id,
                "Invalid format! Please use format: \"weight reps\"\nExample: \"225 12\"");
            return;
        }

        var exercise = _trainingManager.AddSet(userId, weight, reps);
        if (exercise == null)
        {
            var keyboard = new InlineKeyboardMarkup(new[]
            {
                new[] { InlineKeyboardButton.WithCallbackData("Add Exercise 🎯", "addExercise") }
            });
            
            await _botClient.SendTextMessageAsync(message.Chat.Id, "Add an exercise first! 💪", replyMarkup: keyboard);
            return;
        }

        var responseKeyboard = new InlineKeyboardMarkup(new[]
        {
            new[] { InlineKeyboardButton.WithCallbackData("Record Another Set 💪", "addSet") },
            new[] { InlineKeyboardButton.WithCallbackData("Add New Exercise 🎯", "addExercise") },
            new[] { InlineKeyboardButton.WithCallbackData("Finish Workout 🏁", "finish") }
        });

        var response = _trainingManager.FormatSetSummary(exercise, weight, reps);
        await _botClient.SendTextMessageAsync(message.Chat.Id, response, replyMarkup: responseKeyboard);
    }

    private async Task HandleFinishCommandAsync(Message message, long userId)
    {
        var session = _trainingManager.FinishSession(userId);
        if (session == null)
        {
            await _botClient.SendTextMessageAsync(
                message.Chat.Id,
                "No active training session! Start one with /pumpit first! 💪");
            return;
        }

        var keyboard = new ReplyKeyboardMarkup(new[]
        {
            new KeyboardButton[] { new("YEAH BUDDY! 🏋️‍♂️") }
        })
        {
            OneTimeKeyboard = true,
            ResizeKeyboard = true
        };

        var summary = _trainingManager.FormatSessionSummary(session);
        await _botClient.SendTextMessageAsync(message.Chat.Id, summary, replyMarkup: keyboard);
    }

    private async Task HandleTextMessageAsync(Message message)
    {
        var userId = message.From!.Id;
        var text = message.Text!;

        try
        {
            _logger.LogInformation("Processing AI message for user {UserId}", userId);
            await _botClient.SendChatActionAsync(message.Chat.Id, ChatAction.Typing);
            
            var response = await _mistralService.HandleMessageAsync(userId, text);
            await _botClient.SendTextMessageAsync(message.Chat.Id, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling text message for user {UserId}", userId);
            await _botClient.SendTextMessageAsync(message.Chat.Id, 
                "Oh shit I'm sorry! An error occurred try again.");
        }
    }

    public async Task StartPollingAsync(CancellationToken cancellationToken = default)
    {
        var receiverOptions = new ReceiverOptions()
        {
            AllowedUpdates = new[] { UpdateType.Message, UpdateType.CallbackQuery }
        };

        _botClient.StartReceiving(
            updateHandler: (_, update, _) => HandleUpdateAsync(update),
            pollingErrorHandler: (_, exception, _) =>
            {
                _logger.LogError(exception, "Polling error occurred");
                return Task.CompletedTask;
            },
            receiverOptions: receiverOptions,
            cancellationToken: cancellationToken);

        await InitializeAsync();
        _logger.LogInformation("Bot started polling for updates");
    }
}