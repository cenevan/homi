import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Inventory from './components/Inventory';
import MyInventory from './components/MyInventory';
import ShoppingList from './components/ShoppingList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/my-inventory" element={<MyInventory />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;