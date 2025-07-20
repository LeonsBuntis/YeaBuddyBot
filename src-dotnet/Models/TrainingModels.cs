using System.Text.Json.Serialization;

namespace YeaBuddyBot.Models;

public class Exercise
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("sets")]
    public List<WorkoutSet> Sets { get; set; } = new();
}

public class WorkoutSet
{
    [JsonPropertyName("weight")]
    public double Weight { get; set; }

    [JsonPropertyName("reps")]
    public int Reps { get; set; }
}

public class TrainingSession
{
    [JsonPropertyName("userId")]
    public long UserId { get; set; }

    [JsonPropertyName("exercises")]
    public List<Exercise> Exercises { get; set; } = new();

    [JsonPropertyName("startTime")]
    public DateTime StartTime { get; set; }
}

public class ChatMessage
{
    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty; // "user" or "assistant"

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;
}