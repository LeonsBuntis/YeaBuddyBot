import { Button, Input, Headline } from '@telegram-apps/telegram-ui';
import { useRawInitData } from '@telegram-apps/sdk-react';
import { cloudStorage } from '@telegram-apps/sdk';
import type { FC } from 'react';
import { useState, useEffect } from 'react';

import { Page } from '@/components/Page.tsx';

interface Set {
  weight: number;
  reps: number;
}

interface Exercise {
  name: string;
  sets: Set[];
}

interface WorkoutSession {
  userId: number;
  exercises: Exercise[];
  startTime: string;
}

export const WorkoutPage: FC = () => {
  const rawInitData = useRawInitData();
  
  // Parse user ID from raw init data
  const getUserIdFromInitData = (): number | null => {
    if (!rawInitData) return null;
    try {
      const params = new URLSearchParams(rawInitData);
      const userParam = params.get('user');
      if (userParam) {
        const user = JSON.parse(userParam);
        return user.id;
      }
    } catch (error) {
      console.error('Failed to parse init data:', error);
    }
    return null;
  };

  const userId = getUserIdFromInitData();
  
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showAddSet, setShowAddSet] = useState<number | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [newReps, setNewReps] = useState('');

  useEffect(() => {
    if (userId) {
      loadWorkoutSession();
    }
  }, [userId]);

  const loadWorkoutSession = async () => {
    if (!userId) return;
    
    try {
      if (cloudStorage.isSupported() && cloudStorage.getItem.isAvailable()) {
        const sessionData = await cloudStorage.getItem('current_workout_session');
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData);
          setSession(parsedSession);
        } else {
          // Create new workout session if none exists
          const newSession: WorkoutSession = {
            userId,
            exercises: [],
            startTime: new Date().toISOString()
          };
          if (cloudStorage.setItem.isAvailable()) {
            await cloudStorage.setItem('current_workout_session', JSON.stringify(newSession));
          }
          setSession(newSession);
        }
      } else {
        // Fallback to creating a session in memory if CloudStorage is not available
        const newSession: WorkoutSession = {
          userId,
          exercises: [],
          startTime: new Date().toISOString()
        };
        setSession(newSession);
      }
    } catch (err) {
      setError('Failed to load workout session');
      console.error('Error loading workout:', err);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = async () => {
    if (!userId || !newExerciseName.trim() || !session) return;

    try {
      const updatedSession = {
        ...session,
        exercises: [
          ...session.exercises,
          { name: newExerciseName.trim(), sets: [] }
        ]
      };

      if (cloudStorage.isSupported() && cloudStorage.setItem.isAvailable()) {
        await cloudStorage.setItem('current_workout_session', JSON.stringify(updatedSession));
      }
      setSession(updatedSession);
      setNewExerciseName('');
      setShowAddExercise(false);
    } catch (err) {
      setError('Failed to add exercise');
      console.error('Error adding exercise:', err);
    }
  };

  const addSet = async (exerciseIndex: number) => {
    if (!userId || !newWeight || !newReps || !session) return;

    try {
      const updatedSession = { ...session };
      if (updatedSession.exercises[exerciseIndex]) {
        updatedSession.exercises[exerciseIndex].sets.push({
          weight: parseFloat(newWeight),
          reps: parseInt(newReps)
        });

        if (cloudStorage.isSupported() && cloudStorage.setItem.isAvailable()) {
          await cloudStorage.setItem('current_workout_session', JSON.stringify(updatedSession));
        }
        setSession(updatedSession);
        setNewWeight('');
        setNewReps('');
        setShowAddSet(null);
      } else {
        setError('Invalid exercise');
      }
    } catch (err) {
      setError('Failed to add set');
      console.error('Error adding set:', err);
    }
  };

  const finishWorkout = async () => {
    if (!userId || !session) return;

    try {
      // Prepare the completed workout data
      const completedWorkout = {
        ...session,
        endTime: new Date().toISOString(),
        completed: true
      };

      // Send data to bot using Telegram Web App API
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.sendData) {
        try {
          const workoutData = JSON.stringify(completedWorkout);
          // Use the native Telegram Web App API
          (window as any).Telegram.WebApp.sendData(workoutData);
          
          // Clear the current session from CloudStorage
          if (cloudStorage.isSupported() && cloudStorage.deleteItem.isAvailable()) {
            await cloudStorage.deleteItem('current_workout_session');
          }
          
          // The mini-app will be closed by Telegram after sending data
          // So no need to redirect manually
          return;
        } catch (sendDataError) {
          console.warn('Telegram.WebApp.sendData not available or failed:', sendDataError);
          // Fall through to fallback
        }
      }

      // Fallback: Store locally if sendData is not available
      if (cloudStorage.isSupported()) {
        // Get existing workout history
        if (cloudStorage.getItem.isAvailable()) {
          const historyData = await cloudStorage.getItem('workout_history');
          const history = historyData ? JSON.parse(historyData) : [];
          
          // Add the completed workout to history
          history.push(completedWorkout);
          if (cloudStorage.setItem.isAvailable()) {
            await cloudStorage.setItem('workout_history', JSON.stringify(history));
          }
        }
        
        // Clear the current session
        if (cloudStorage.deleteItem.isAvailable()) {
          await cloudStorage.deleteItem('current_workout_session');
        }
      }

      // Show success message and redirect
      alert('Workout completed! YEAH BUDDY! 💪');
      window.location.href = '/';
    } catch (err) {
      setError('Failed to finish workout');
      console.error('Error finishing workout:', err);
    }
  };

  const cancelWorkout = async () => {
    if (!userId) return;

    if (confirm('Are you sure you want to cancel this workout?')) {
      try {
        if (cloudStorage.isSupported() && cloudStorage.deleteItem.isAvailable()) {
          await cloudStorage.deleteItem('current_workout_session');
        }
        alert('Workout cancelled');
        window.location.href = '/';
      } catch (err) {
        setError('Failed to cancel workout');
        console.error('Error cancelling workout:', err);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getPreviousSet = (exercise: Exercise, setIndex: number): Set | null => {
    if (setIndex > 0) {
      return exercise.sets[setIndex - 1] || null;
    }
    return null;
  };

  if (loading) {
    return (
      <Page back={true}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading workout...
        </div>
      </Page>
    );
  }

  if (error || !session) {
    return (
      <Page back={true}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>{error || 'No workout session found'}</p>
          <Button onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page back={true}>
      <div style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <Headline weight="2">Morning Workout</Headline>
            <div style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>
              {formatTime(session.startTime)}
            </div>
          </div>
          <Button 
            size="s" 
            mode="filled"
            onClick={finishWorkout}
            style={{ backgroundColor: '#34C759' }}
          >
            Finish
          </Button>
        </div>

        {/* Exercises */}
        {session.exercises.map((exercise, exerciseIndex) => (
          <div key={exerciseIndex} style={{ marginBottom: '24px' }}>
            {/* Exercise Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h3 style={{ 
                color: 'var(--tg-theme-link-color)', 
                margin: 0,
                fontSize: '16px',
                fontWeight: '600'
              }}>
                {exercise.name}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="s" mode="plain">📊</Button>
                <Button size="s" mode="plain">⋯</Button>
              </div>
            </div>

            {/* Watch back rounding warning */}
            <div style={{
              backgroundColor: 'rgba(255, 204, 0, 0.15)',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              Watch back rounding
            </div>

            {/* Sets Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 80px 60px 60px 40px',
              gap: '8px',
              padding: '8px 0',
              borderBottom: '1px solid var(--tg-theme-separator-color)',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--tg-theme-hint-color)'
            }}>
              <div>Set</div>
              <div>Previous</div>
              <div>kg</div>
              <div>Reps</div>
              <div></div>
            </div>

            {/* Sets */}
            {exercise.sets.map((set, setIndex) => {
              const previousSet = getPreviousSet(exercise, setIndex);
              return (
                <div key={setIndex} style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 80px 60px 60px 40px',
                  gap: '8px',
                  padding: '12px 0',
                  borderBottom: setIndex < exercise.sets.length - 1 ? '1px solid var(--tg-theme-separator-color)' : 'none',
                  alignItems: 'center'
                }}>
                  <div style={{ fontWeight: '600' }}>
                    {setIndex === 0 ? 'W' : (setIndex).toString()}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--tg-theme-hint-color)' 
                  }}>
                    {previousSet ? `${previousSet.weight} kg x ${previousSet.reps}` : '-'}
                  </div>
                  <div style={{ fontWeight: '600' }}>{set.weight}</div>
                  <div style={{ fontWeight: '600' }}>{set.reps}</div>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#34C759',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px'
                  }}>
                    ✓
                  </div>
                </div>
              );
            })}

            {/* Add Set Form */}
            {showAddSet === exerciseIndex ? (
              <div style={{ 
                padding: '16px', 
                backgroundColor: 'var(--tg-theme-secondary-bg-color)',
                borderRadius: '8px',
                marginTop: '8px'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <Input
                    header="Weight (kg)"
                    placeholder="0"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    type="number"
                    style={{ flex: 1 }}
                  />
                  <Input
                    header="Reps"
                    placeholder="0"
                    value={newReps}
                    onChange={(e) => setNewReps(e.target.value)}
                    type="number"
                    style={{ flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    size="s" 
                    mode="filled" 
                    onClick={() => addSet(exerciseIndex)}
                    disabled={!newWeight || !newReps}
                    style={{ flex: 1 }}
                  >
                    Add Set
                  </Button>
                  <Button 
                    size="s" 
                    mode="outline" 
                    onClick={() => setShowAddSet(null)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="s"
                mode="plain"
                onClick={() => setShowAddSet(exerciseIndex)}
                style={{ 
                  marginTop: '8px',
                  color: 'var(--tg-theme-link-color)',
                  fontSize: '14px'
                }}
              >
                + Add Set
              </Button>
            )}
          </div>
        ))}

        {/* Add Exercise Form */}
        {showAddExercise ? (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'var(--tg-theme-secondary-bg-color)',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <Input
              header="Exercise Name"
              placeholder="Enter exercise name"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              style={{ marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                size="s" 
                mode="filled" 
                onClick={addExercise}
                disabled={!newExerciseName.trim()}
                style={{ flex: 1 }}
              >
                Add Exercise
              </Button>
              <Button 
                size="s" 
                mode="outline" 
                onClick={() => setShowAddExercise(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="m"
            mode="filled"
            onClick={() => setShowAddExercise(true)}
            style={{ 
              width: '100%',
              marginBottom: '16px',
              backgroundColor: 'var(--tg-theme-link-color)'
            }}
          >
            Add Exercises
          </Button>
        )}

        {/* Cancel Workout Button */}
        <Button
          size="m"
          mode="outline"
          onClick={cancelWorkout}
          style={{ 
            width: '100%',
            color: '#FF3B30',
            borderColor: '#FF3B30'
          }}
        >
          Cancel Workout
        </Button>
      </div>
    </Page>
  );
};