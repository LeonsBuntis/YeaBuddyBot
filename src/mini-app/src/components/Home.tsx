import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface WorkoutSession {
  id: string;
  userId: string;
  exercises: Array<{
    name: string;
    sets: Array<{
      weight: number;
      reps: number;
    }>;
  }>;
  startTime: string;
  endTime?: string;
}

export function Home() {
  const [userId] = useState('user123'); // In a real app, this would come from auth
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/active-session`);
      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const startWorkout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
        navigate(`/workout/${data.session.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start workout');
      }
    } catch (error) {
      console.error('Error starting workout:', error);
      alert('Failed to start workout');
    } finally {
      setLoading(false);
    }
  };

  const resumeWorkout = () => {
    if (activeSession) {
      navigate(`/workout/${activeSession.id}`);
    }
  };

  return (
    <div className="home">
      <div className="welcome-section">
        <h2>Welcome to YeaBuddy!</h2>
        <p>Track your workouts like a champion. YEAH BUDDY! 💪</p>
      </div>

      {activeSession ? (
        <div className="active-session">
          <h3>Active Workout Session</h3>
          <p>Started: {new Date(activeSession.startTime).toLocaleString()}</p>
          <p>Exercises: {activeSession.exercises.length}</p>
          <button onClick={resumeWorkout} className="btn-primary">
            Resume Workout 🏋️‍♂️
          </button>
        </div>
      ) : (
        <div className="start-workout">
          <h3>Ready to pump some iron?</h3>
          <button 
            onClick={startWorkout} 
            disabled={loading}
            className="btn-primary btn-large"
          >
            {loading ? 'Starting...' : 'Start New Workout 💪'}
          </button>
        </div>
      )}

      <div className="features">
        <h3>Features</h3>
        <ul>
          <li>📊 Track exercises and sets</li>
          <li>⚖️ Log weights and reps</li>
          <li>📝 Workout summaries</li>
          <li>💾 Persistent data storage</li>
        </ul>
      </div>
    </div>
  );
}