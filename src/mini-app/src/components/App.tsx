import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutSession } from './WorkoutSession';
import { Home } from './Home';

export function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>💪 YeaBuddy Fitness Tracker</h1>
          <p>YEAH BUDDY! Light weight baby!</p>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workout/:sessionId" element={<WorkoutSession />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
