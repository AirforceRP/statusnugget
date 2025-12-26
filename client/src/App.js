import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import StatusPage from './components/StatusPage';
import Footer from './components/Footer';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="container">
            <div className="nav-content">
              <Link to="/" className="nav-logo">
                StatusNugget
              </Link>
              <div className="nav-links">
                <Link to="/">Status</Link>
                <Link to="/dashboard">Dashboard</Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<StatusPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

