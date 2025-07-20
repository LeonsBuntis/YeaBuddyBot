using System.Collections.Concurrent;
using System.Text;
using YeaBuddyBot.Models;

namespace YeaBuddyBot.Bot.Training;

public class TrainingManager
{
    private readonly ConcurrentDictionary<long, TrainingSession> _activeSessions;

    public TrainingManager()
    {
        _activeSessions = new ConcurrentDictionary<long, TrainingSession>();
    }

    public bool StartSession(long userId)
    {
        var newSession = new TrainingSession
        {
            UserId = userId,
            Exercises = new List<Exercise>(),
            StartTime = DateTime.UtcNow
        };

        return _activeSessions.TryAdd(userId, newSession);
    }

    public bool AddExercise(long userId, string exerciseName)
    {
        if (!_activeSessions.TryGetValue(userId, out var session))
            return false;

        session.Exercises.Add(new Exercise
        {
            Name = exerciseName,
            Sets = new List<WorkoutSet>()
        });

        return true;
    }

    public Exercise? AddSet(long userId, double weight, int reps)
    {
        if (!_activeSessions.TryGetValue(userId, out var session) || !session.Exercises.Any())
            return null;

        var currentExercise = session.Exercises.Last();
        currentExercise.Sets.Add(new WorkoutSet { Weight = weight, Reps = reps });
        
        return currentExercise;
    }

    public TrainingSession? FinishSession(long userId)
    {
        _activeSessions.TryRemove(userId, out var session);
        return session;
    }

    public bool HasActiveSession(long userId)
    {
        return _activeSessions.ContainsKey(userId);
    }

    public string FormatSessionSummary(TrainingSession session)
    {
        var duration = Math.Round((DateTime.UtcNow - session.StartTime).TotalMinutes);
        var summary = new StringBuilder();
        
        summary.AppendLine("YEAH BUDDY! Training session completed! 💪");
        summary.AppendLine();
        summary.AppendLine($"Duration: {duration} minutes");
        summary.AppendLine();
        summary.AppendLine("Exercises:");

        foreach (var exercise in session.Exercises)
        {
            summary.AppendLine();
            summary.AppendLine($"{exercise.Name}:");
            
            for (int i = 0; i < exercise.Sets.Count; i++)
            {
                var set = exercise.Sets[i];
                summary.AppendLine($"Set {i + 1}: {set.Weight}kg x {set.Reps} reps");
            }
        }

        return summary.ToString();
    }

    public string FormatSetSummary(Exercise exercise, double weight, int reps)
    {
        var response = new StringBuilder();
        response.AppendLine($"LIGHTWEIGHT BABY! Set logged for {exercise.Name}:");
        response.AppendLine($"{weight}lbs x {reps} reps 💪");
        response.AppendLine();
        response.AppendLine("Sets this exercise:");

        for (int i = 0; i < exercise.Sets.Count; i++)
        {
            var set = exercise.Sets[i];
            response.AppendLine($"{i + 1}. {set.Weight}lbs x {set.Reps} reps");
        }

        return response.ToString();
    }
}