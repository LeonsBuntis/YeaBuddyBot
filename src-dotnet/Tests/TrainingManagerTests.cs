using Xunit;
using YeaBuddyBot.Bot.Training;
using YeaBuddyBot.Models;

namespace YeaBuddyBot.Tests;

public class TrainingManagerTests
{
    [Fact]
    public void StartSession_NewUser_ShouldReturnTrue()
    {
        // Arrange
        var trainingManager = new TrainingManager();
        const long userId = 12345;

        // Act
        var result = trainingManager.StartSession(userId);

        // Assert
        Assert.True(result);
        Assert.True(trainingManager.HasActiveSession(userId));
    }

    [Fact]
    public void StartSession_ExistingUser_ShouldReturnFalse()
    {
        // Arrange
        var trainingManager = new TrainingManager();
        const long userId = 12345;
        trainingManager.StartSession(userId);

        // Act
        var result = trainingManager.StartSession(userId);

        // Assert
        Assert.False(result);
        Assert.True(trainingManager.HasActiveSession(userId));
    }

    [Fact]
    public void AddExercise_WithActiveSession_ShouldReturnTrue()
    {
        // Arrange
        var trainingManager = new TrainingManager();
        const long userId = 12345;
        const string exerciseName = "Bench Press";
        trainingManager.StartSession(userId);

        // Act
        var result = trainingManager.AddExercise(userId, exerciseName);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void AddExercise_WithoutActiveSession_ShouldReturnFalse()
    {
        // Arrange
        var trainingManager = new TrainingManager();
        const long userId = 12345;
        const string exerciseName = "Bench Press";

        // Act
        var result = trainingManager.AddExercise(userId, exerciseName);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void AddSet_WithExercise_ShouldReturnExercise()
    {
        // Arrange
        var trainingManager = new TrainingManager();
        const long userId = 12345;
        const string exerciseName = "Bench Press";
        const double weight = 225.0;
        const int reps = 12;
        
        trainingManager.StartSession(userId);
        trainingManager.AddExercise(userId, exerciseName);

        // Act
        var result = trainingManager.AddSet(userId, weight, reps);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(exerciseName, result.Name);
        Assert.Single(result.Sets);
        Assert.Equal(weight, result.Sets[0].Weight);
        Assert.Equal(reps, result.Sets[0].Reps);
    }

    [Fact]
    public void AddSet_WithoutExercise_ShouldReturnNull()
    {
        // Arrange
        var trainingManager = new TrainingManager();
        const long userId = 12345;
        const double weight = 225.0;
        const int reps = 12;
        
        trainingManager.StartSession(userId);

        // Act
        var result = trainingManager.AddSet(userId, weight, reps);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void FinishSession_WithActiveSession_ShouldReturnSession()
    {
        // Arrange
        var trainingManager = new TrainingManager();
        const long userId = 12345;
        trainingManager.StartSession(userId);

        // Act
        var result = trainingManager.FinishSession(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.False(trainingManager.HasActiveSession(userId));
    }

    [Fact]
    public void FinishSession_WithoutActiveSession_ShouldReturnNull()
    {
        // Arrange
        var trainingManager = new TrainingManager();
        const long userId = 12345;

        // Act
        var result = trainingManager.FinishSession(userId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void FormatSessionSummary_ShouldContainExpectedContent()
    {
        // Arrange
        var session = new TrainingSession
        {
            UserId = 12345,
            StartTime = DateTime.UtcNow.AddMinutes(-30),
            Exercises = new List<Exercise>
            {
                new()
                {
                    Name = "Bench Press",
                    Sets = new List<WorkoutSet>
                    {
                        new() { Weight = 225, Reps = 12 },
                        new() { Weight = 235, Reps = 10 }
                    }
                }
            }
        };
        var trainingManager = new TrainingManager();

        // Act
        var result = trainingManager.FormatSessionSummary(session);

        // Assert
        Assert.Contains("YEAH BUDDY!", result);
        Assert.Contains("Bench Press", result);
        Assert.Contains("225kg x 12 reps", result);
        Assert.Contains("235kg x 10 reps", result);
        Assert.Contains("Duration:", result);
    }

    [Fact]
    public void FormatSetSummary_ShouldContainExpectedContent()
    {
        // Arrange
        var exercise = new Exercise
        {
            Name = "Bench Press",
            Sets = new List<WorkoutSet>
            {
                new() { Weight = 225, Reps = 12 }
            }
        };
        var trainingManager = new TrainingManager();

        // Act
        var result = trainingManager.FormatSetSummary(exercise, 225, 12);

        // Assert
        Assert.Contains("LIGHTWEIGHT BABY!", result);
        Assert.Contains("Bench Press", result);
        Assert.Contains("225lbs x 12 reps", result);
    }
}