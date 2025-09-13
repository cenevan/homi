import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadInventoryData } from '../utils/dataOperations';
import logo from '../logos/logo.png';
import './Inventory.css';

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName] = useState(() => localStorage.getItem('userName'));
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
      case 'free-to-borrow':
        return 'Free to Borrow';
      case 'free-to-take':
        return 'Free to Take';
      default:
        return tag;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.tag === filter;
    const matchesSearch = searchTerm === '' ||
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
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
          <div className="header-brand">
            <img src={logo} alt="Homi" className="header-logo" />
            <div>
              <h1>homi inventory</h1>
              <p>Welcome back, {userName}!</p>
            </div>
          </div>
          <div className="header-buttons">
            <button onClick={() => navigate('/shopping-list')} className="shopping-list-button">
              Shopping Lists
            </button>
            <button onClick={() => navigate('/my-inventory')} className="my-inventory-button">
              My Inventory
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="inventory-content">
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search items, owners, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clear-search"
              >
                ×
              </button>
            )}
          </div>
        </div>

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