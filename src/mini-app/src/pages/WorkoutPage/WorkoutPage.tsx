import type { FC } from 'react';

import { cloudStorage, sendData } from '@telegram-apps/sdk';
import { useRawInitData } from '@telegram-apps/sdk-react';
import { Button, Headline, Input } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';

import { Page } from '@/components/Page.tsx';

interface Exercise {
  name: string;
  sets: Set[];
}

interface Set {
  reps: number;
  weight: number;
}

interface WorkoutSession {
  exercises: Exercise[];
  startTime: string;
  userId: number;
}

export const WorkoutPage: FC = () => {
  const rawInitData = useRawInitData();
  
  // Parse user ID from raw init data
  const getUserIdFromInitData = (): null | number => {
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
  
  const [session, setSession] = useState<null | WorkoutSession>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showAddSet, setShowAddSet] = useState<null | number>(null);
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
            exercises: [],
            startTime: new Date().toISOString(),
            userId
          };
          if (cloudStorage.setItem.isAvailable()) {
            await cloudStorage.setItem('current_workout_session', JSON.stringify(newSession));
          }
          setSession(newSession);
        }
      } else {
        // Fallback to creating a session in memory if CloudStorage is not available
        const newSession: WorkoutSession = {
          exercises: [],
          startTime: new Date().toISOString(),
          userId
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
          reps: parseInt(newReps),
          weight: parseFloat(newWeight)
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
        completed: true,
        endTime: new Date().toISOString()
      };

      // Send data to bot using Telegram SDK
      if (sendData.isAvailable()) {
        try {
          const workoutData = JSON.stringify(completedWorkout);
          // Use the Telegram SDK sendData method
          sendData(workoutData);
          
          // Clear the current session from CloudStorage
          if (cloudStorage.isSupported() && cloudStorage.deleteItem.isAvailable()) {
            await cloudStorage.deleteItem('current_workout_session');
          }
          
          // The mini-app will be closed by Telegram after sending data
          // So no need to redirect manually
          return;
        } catch (sendDataError) {
          console.warn('sendData not available or failed:', sendDataError);
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
      hour12: false,
      minute: '2-digit' 
    });
  };

  const getPreviousSet = (exercise: Exercise, setIndex: number): null | Set => {
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
          alignItems: 'center', 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <Headline weight="2">Morning Workout</Headline>
            <div style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>
              {formatTime(session.startTime)}
            </div>
          </div>
          <Button 
            mode="filled" 
            onClick={finishWorkout}
            size="s"
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
              alignItems: 'center', 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <h3 style={{ 
                color: 'var(--tg-theme-link-color)', 
                fontSize: '16px',
                fontWeight: '600',
                margin: 0
              }}>
                {exercise.name}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button mode="plain" size="s">📊</Button>
                <Button mode="plain" size="s">⋯</Button>
              </div>
            </div>

            {/* Watch back rounding warning */}
            <div style={{
              alignItems: 'center',
              backgroundColor: 'rgba(255, 204, 0, 0.15)',
              borderRadius: '8px',
              display: 'flex',
              fontSize: '14px',
              gap: '8px',
              marginBottom: '12px',
              padding: '8px 12px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              Watch back rounding
            </div>

            {/* Sets Table Header */}
            <div style={{
              borderBottom: '1px solid var(--tg-theme-separator-color)',
              color: 'var(--tg-theme-hint-color)',
              display: 'grid',
              fontSize: '14px',
              fontWeight: '600',
              gap: '8px',
              gridTemplateColumns: '40px 80px 60px 60px 40px',
              padding: '8px 0'
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
                  alignItems: 'center',
                  borderBottom: setIndex < exercise.sets.length - 1 ? '1px solid var(--tg-theme-separator-color)' : 'none',
                  display: 'grid',
                  gap: '8px',
                  gridTemplateColumns: '40px 80px 60px 60px 40px',
                  padding: '12px 0'
                }}>
                  <div style={{ fontWeight: '600' }}>
                    {setIndex === 0 ? 'W' : (setIndex).toString()}
                  </div>
                  <div style={{ 
                    color: 'var(--tg-theme-hint-color)', 
                    fontSize: '12px' 
                  }}>
                    {previousSet ? `${previousSet.weight} kg x ${previousSet.reps}` : '-'}
                  </div>
                  <div style={{ fontWeight: '600' }}>{set.weight}</div>
                  <div style={{ fontWeight: '600' }}>{set.reps}</div>
                  <div style={{
                    alignItems: 'center',
                    backgroundColor: '#34C759',
                    borderRadius: '50%',
                    color: 'white',
                    display: 'flex',
                    fontSize: '14px',
                    height: '24px',
                    justifyContent: 'center',
                    width: '24px'
                  }}>
                    ✓
                  </div>
                </div>
              );
            })}

            {/* Add Set Form */}
            {showAddSet === exerciseIndex ? (
              <div style={{ 
                backgroundColor: 'var(--tg-theme-secondary-bg-color)', 
                borderRadius: '8px',
                marginTop: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <Input
                    header="Weight (kg)"
                    onChange={(e) => { setNewWeight(e.target.value); }}
                    placeholder="0"
                    style={{ flex: 1 }}
                    type="number"
                    value={newWeight}
                  />
                  <Input
                    header="Reps"
                    onChange={(e) => { setNewReps(e.target.value); }}
                    placeholder="0"
                    style={{ flex: 1 }}
                    type="number"
                    value={newReps}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    disabled={!newWeight || !newReps} 
                    mode="filled" 
                    onClick={() => addSet(exerciseIndex)}
                    size="s"
                    style={{ flex: 1 }}
                  >
                    Add Set
                  </Button>
                  <Button 
                    mode="outline" 
                    onClick={() => { setShowAddSet(null); }} 
                    size="s"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                mode="plain"
                onClick={() => { setShowAddSet(exerciseIndex); }}
                size="s"
                style={{ 
                  color: 'var(--tg-theme-link-color)',
                  fontSize: '14px',
                  marginTop: '8px'
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
            backgroundColor: 'var(--tg-theme-secondary-bg-color)', 
            borderRadius: '8px',
            marginBottom: '16px',
            padding: '16px'
          }}>
            <Input
              header="Exercise Name"
              onChange={(e) => { setNewExerciseName(e.target.value); }}
              placeholder="Enter exercise name"
              style={{ marginBottom: '12px' }}
              value={newExerciseName}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                disabled={!newExerciseName.trim()} 
                mode="filled" 
                onClick={addExercise}
                size="s"
                style={{ flex: 1 }}
              >
                Add Exercise
              </Button>
              <Button 
                mode="outline" 
                onClick={() => { setShowAddExercise(false); }} 
                size="s"
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            mode="filled"
            onClick={() => { setShowAddExercise(true); }}
            size="m"
            style={{ 
              backgroundColor: 'var(--tg-theme-link-color)',
              marginBottom: '16px',
              width: '100%'
            }}
          >
            Add Exercises
          </Button>
        )}

        {/* Cancel Workout Button */}
        <Button
          mode="outline"
          onClick={cancelWorkout}
          size="m"
          style={{ 
            borderColor: '#FF3B30',
            color: '#FF3B30',
            width: '100%'
          }}
        >
          Cancel Workout
        </Button>
      </div>
    </Page>
  );
};