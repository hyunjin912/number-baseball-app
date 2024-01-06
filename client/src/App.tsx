import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import Container from './components/Container';
import PlayPage from './pages/PlayPage';
import RoomPage from './pages/RoomPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Container />}>
        <Route index element={<LoginPage />} />
        <Route path="/room" element={<RoomPage />} />
        <Route path="/play" element={<PlayPage />} />
      </Route>
    </Routes>
  );
}

export default App;
