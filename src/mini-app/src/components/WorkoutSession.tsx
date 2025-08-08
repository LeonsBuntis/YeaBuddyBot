import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Exercise {
  name: string;
  sets: Array<{
    weight: number;
    reps: number;
  }>;
}

interface WorkoutSession {
  id: string;
  userId: string;
  exercises: Exercise[];
  startTime: string;
  endTime?: string;
}

export function WorkoutSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [reps, setReps] = useState<number | ''>('');

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/workouts/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        alert('Workout session not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      alert('Failed to fetch workout session');
    } finally {
      setLoading(false);
    }
  };

  const addExercise = async () => {
    if (!exerciseName.trim()) {
      alert('Please enter an exercise name');
      return;
    }

    try {
      const response = await fetch(`/api/workouts/${sessionId}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exerciseName: exerciseName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setExerciseName('');
        alert(data.message);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add exercise');
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
      alert('Failed to add exercise');
    }
  };

  const addSet = async () => {
    if (weight === '' || reps === '' || weight <= 0 || reps <= 0) {
      alert('Please enter valid weight and reps');
      return;
    }

    try {
      const response = await fetch(`/api/workouts/${sessionId}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weight: Number(weight), reps: Number(reps) }),
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setWeight('');
        setReps('');
        alert(data.message);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add set');
      }
    } catch (error) {
      console.error('Error adding set:', error);
      alert('Failed to add set');
    }
  };

  const finishWorkout = async () => {
    if (!confirm('Are you sure you want to finish this workout?')) {
      return;
    }

    try {
      const response = await fetch(`/api/workouts/${sessionId}/finish`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.summary);
        navigate('/');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to finish workout');
      }
    } catch (error) {
      console.error('Error finishing workout:', error);
      alert('Failed to finish workout');
    }
  };

  if (loading) {
    return <div className="loading">Loading workout session...</div>;
  }

  if (!session) {
    return <div className="error">Workout session not found</div>;
  }

  const currentExercise = session.exercises[session.exercises.length - 1];

  return (
    <div className="workout-session">
      <header className="session-header">
        <h2>💪 Active Workout</h2>
        <p>Started: {new Date(session.startTime).toLocaleString()}</p>
        <button onClick={() => navigate('/')} className="btn-secondary">
          ← Back to Home
        </button>
      </header>

      <section className="add-exercise">
        <h3>Add Exercise</h3>
        <div className="form-group">
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="Exercise name (e.g., Bench Press)"
            className="form-input"
            onKeyPress={(e) => e.key === 'Enter' && addExercise()}
          />
          <button onClick={addExercise} className="btn-primary">
            Add Exercise 🎯
          </button>
        </div>
      </section>

      {currentExercise && (
        <section className="add-set">
          <h3>Add Set to: {currentExercise.name}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="form-input"
                min="0"
                step="0.5"
              />
            </div>
            <div className="form-group">
              <label>Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="form-input"
                min="1"
              />
            </div>
          </div>
          <button onClick={addSet} className="btn-primary">
            Log Set 📊
          </button>
        </section>
      )}

      <section className="exercises-list">
        <h3>Exercises ({session.exercises.length})</h3>
        {session.exercises.length === 0 ? (
          <p>No exercises added yet. Add your first exercise above!</p>
        ) : (
          session.exercises.map((exercise, exerciseIndex) => (
            <div key={exerciseIndex} className="exercise-card">
              <h4>{exercise.name}</h4>
              {exercise.sets.length === 0 ? (
                <p>No sets logged</p>
              ) : (
                <div className="sets-list">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="set-item">
                      Set {setIndex + 1}: {set.weight}kg × {set.reps} reps
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>

      <section className="workout-actions">
        <button onClick={finishWorkout} className="btn-danger btn-large">
          Finish Workout 🏁
        </button>
      </section>
    </div>
  );
}