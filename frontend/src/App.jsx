import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomeNavbar from './components/HomeNavbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails';
import TextReader from './pages/TextReader';
import Bookshelves from './pages/Bookshelves';
import Login from './pages/Login';
import Register from './pages/Register';
import ReadingHistory from './pages/ReadingHistory';
import Profile from './pages/Profile';

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (term) => {
    setSearchTerm(term.trim());
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#050608' }}>
      <HomeNavbar onSearchSubmit={handleSearchSubmit} initialQuery={searchTerm} />
      <Routes>
        <Route path="/" element={<Home searchTerm={searchTerm} />} />
        <Route path="/bookshelves" element={<Bookshelves />} />
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/books/:id/read/txt" element={<TextReader />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/history" element={<ReadingHistory />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;