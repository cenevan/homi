import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadInventoryData } from '../utils/csvParser';
import './Inventory.css';

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName] = useState(() => localStorage.getItem('userName'));
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!userName) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const data = await loadInventoryData();
        setItems(data);
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userName, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userName');
    navigate('/');
  };

  const getTagColor = (tag) => {
    switch (tag) {
      case 'free-to-use':
        return 'tag-green';
      case 'free-to-borrow':
        return 'tag-blue';
      case 'free-to-take':
        return 'tag-orange';
      default:
        return 'tag-gray';
    }
  };

  const getTagLabel = (tag) => {
    switch (tag) {
      case 'free-to-use':
        return 'Free to Use';
      case 'free-to-borrow':
        return 'Free to Borrow';
      case 'free-to-take':
        return 'Free to Take';
      default:
        return tag;
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.tag === filter;
  });

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <header className="inventory-header">
        <div className="header-content">
          <div>
            <h1>Homi Inventory</h1>
            <p>Welcome back, {userName}!</p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="inventory-content">
        <div className="filter-section">
          <h3>Filter by type:</h3>
          <div className="filter-buttons">
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setFilter('free-to-use')}
              className={filter === 'free-to-use' ? 'filter-btn active' : 'filter-btn'}
            >
              Free to Use ({items.filter(i => i.tag === 'free-to-use').length})
            </button>
            <button
              onClick={() => setFilter('free-to-borrow')}
              className={filter === 'free-to-borrow' ? 'filter-btn active' : 'filter-btn'}
            >
              Free to Borrow ({items.filter(i => i.tag === 'free-to-borrow').length})
            </button>
            <button
              onClick={() => setFilter('free-to-take')}
              className={filter === 'free-to-take' ? 'filter-btn active' : 'filter-btn'}
            >
              Free to Take ({items.filter(i => i.tag === 'free-to-take').length})
            </button>
          </div>
        </div>

        <div className="items-grid">
          {filteredItems.length === 0 ? (
            <div className="no-items">
              {filter === 'all' ? 'No items available' : `No "${getTagLabel(filter)}" items available`}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-header">
                  <h3 className="item-name">{item.item_name}</h3>
                  <span className={`tag ${getTagColor(item.tag)}`}>
                    {getTagLabel(item.tag)}
                  </span>
                </div>

                <div className="item-details">
                  <p className="item-owner">
                    <strong>Owner:</strong> {item.owner}
                  </p>
                  <p className="item-category">
                    <strong>Category:</strong> {item.category}
                  </p>
                  {item.description && (
                    <p className="item-description">
                      <strong>Notes:</strong> {item.description}
                    </p>
                  )}
                  <p className="item-date">
                    <strong>Added:</strong> {new Date(item.date_added).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Inventory;