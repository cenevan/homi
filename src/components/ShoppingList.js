import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadShoppingListData } from '../utils/dataOperations';
import './ShoppingList.css';

function ShoppingList() {
  const [allShoppingItems, setAllShoppingItems] = useState([]);
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
    loadData();
  }, [userName, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const shopping = await loadShoppingListData();
      setAllShoppingItems(shopping);
    } catch (error) {
      console.error('Error loading shopping data:', error);
    } finally {
      setLoading(false);
    }
  };

  const myShoppingItems = allShoppingItems.filter(item =>
    item.owner && item.owner.toLowerCase() === userName.toLowerCase()
  );

  const othersShoppingItems = allShoppingItems.filter(item =>
    item.owner && item.owner.toLowerCase() !== userName.toLowerCase()
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const filteredMyItems = myShoppingItems.filter(item => {
    const matchesFilter = filter === 'all' || item.priority === filter;
    const matchesSearch = searchTerm === '' ||
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const filteredOthersItems = othersShoppingItems.filter(item => {
    const matchesFilter = filter === 'all' || item.priority === filter;
    const matchesSearch = searchTerm === '' ||
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.owner.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const groupByOwner = (items) => {
    return items.reduce((groups, item) => {
      const owner = item.owner || 'Unknown';
      if (!groups[owner]) {
        groups[owner] = [];
      }
      groups[owner].push(item);
      return groups;
    }, {});
  };

  const groupedOthersItems = groupByOwner(filteredOthersItems);

  if (loading) {
    return (
      <div className="shopping-list-container">
        <div className="loading">Loading shopping lists...</div>
      </div>
    );
  }

  return (
    <div className="shopping-list-container">
      <header className="shopping-list-header">
        <div className="header-content">
          <div>
            <h1>Shared Shopping Lists</h1>
            <p>Coordinate shopping trips with your roommates</p>
          </div>
          <div className="header-buttons">
            <button onClick={() => navigate('/my-inventory')} className="nav-button">
              My Inventory
            </button>
            <button onClick={() => navigate('/inventory')} className="nav-button">
              Shared Inventory
            </button>
          </div>
        </div>
      </header>

      <div className="shopping-list-content">
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search items, categories, owners..."
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
          <h3>Filter by priority:</h3>
          <div className="filter-buttons">
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            >
              All Items ({allShoppingItems.length})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={filter === 'high' ? 'filter-btn active' : 'filter-btn'}
            >
              High Priority ({allShoppingItems.filter(i => i.priority === 'high').length})
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={filter === 'medium' ? 'filter-btn active' : 'filter-btn'}
            >
              Medium Priority ({allShoppingItems.filter(i => i.priority === 'medium').length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={filter === 'low' ? 'filter-btn active' : 'filter-btn'}
            >
              Low Priority ({allShoppingItems.filter(i => i.priority === 'low').length})
            </button>
          </div>
        </div>

        {/* My Shopping List */}
        <div className="list-section my-list-section">
          <div className="section-header">
            <h2>Your Shopping List ({filteredMyItems.length})</h2>
            <button
              onClick={() => navigate('/my-inventory')}
              className="manage-button"
            >
              Manage My List
            </button>
          </div>

          <div className="items-grid">
            {filteredMyItems.length === 0 ? (
              <div className="no-items">
                {filter === 'all' && searchTerm === ''
                  ? 'Your shopping list is empty.'
                  : 'No items match your current filters.'
                }
              </div>
            ) : (
              filteredMyItems.map((item) => (
                <div key={item.id} className="item-card my-item">
                  <div className="item-header">
                    <h3 className="item-name">{item.item_name}</h3>
                    <span className={`priority ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="item-details">
                    <p><strong>Category:</strong> {item.category}</p>
                    {item.notes && (
                      <p><strong>Notes:</strong> {item.notes}</p>
                    )}
                    <p><strong>Added:</strong> {new Date(item.date_added).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Others' Shopping Lists */}
        <div className="list-section others-list-section">
          <div className="section-header">
            <h2>Roommates' Shopping Lists ({filteredOthersItems.length})</h2>
            <p className="section-subtitle">Items your roommates need - offer to pick up while you're shopping!</p>
          </div>

          {Object.keys(groupedOthersItems).length === 0 ? (
            <div className="no-items">
              {filter === 'all' && searchTerm === ''
                ? 'No one else has items on their shopping list.'
                : 'No items from other roommates match your current filters.'
              }
            </div>
          ) : (
            Object.entries(groupedOthersItems).map(([owner, items]) => (
              <div key={owner} className="owner-group">
                <h3 className="owner-name">{owner}'s List ({items.length})</h3>
                <div className="items-grid">
                  {items.map((item) => (
                    <div key={item.id} className="item-card others-item">
                      <div className="item-header">
                        <h4 className="item-name">{item.item_name}</h4>
                        <span className={`priority ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <div className="item-details">
                        <p><strong>Category:</strong> {item.category}</p>
                        {item.notes && (
                          <p><strong>Notes:</strong> {item.notes}</p>
                        )}
                        <p><strong>Added:</strong> {new Date(item.date_added).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ShoppingList;