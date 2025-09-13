import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadInventoryData,
  deleteInventoryItem,
  addInventoryItem,
  loadShoppingListData,
  addShoppingListItem,
  deleteShoppingListItem
} from '../utils/dataOperations';
import Modal from './Modal';
import './MyInventory.css';

function MyInventory() {
  const [activeTab, setActiveTab] = useState('my-items');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName] = useState(() => localStorage.getItem('userName'));
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletedItemData, setDeletedItemData] = useState(null);
  const navigate = useNavigate();

  // Form states
  const [newItem, setNewItem] = useState({
    item_name: '',
    category: '',
    tag: 'free-to-borrow',
    description: ''
  });

  const [newShoppingItem, setNewShoppingItem] = useState({
    item_name: '',
    category: '',
    priority: 'medium',
    notes: ''
  });

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
      const [inventory, shopping] = await Promise.all([
        loadInventoryData(),
        loadShoppingListData()
      ]);

      // Filter inventory items for current user
      const myItems = inventory.filter(item =>
        item.owner && item.owner.toLowerCase() === userName.toLowerCase()
      );

      // Filter shopping items for current user
      const myShoppingItems = shopping.filter(item =>
        item.owner && item.owner.toLowerCase() === userName.toLowerCase()
      );

      setInventoryItems(myItems);
      setShoppingItems(myShoppingItems);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInventoryItem = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    const result = await deleteInventoryItem(itemToDelete.id);
    if (result.success) {
      setInventoryItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      setShowDeleteModal(false);

      // Show shopping list prompt
      if (result.deletedItem) {
        setDeletedItemData(result.deletedItem);
        setShowShoppingModal(true);
      }
    } else {
      alert('Error deleting item: ' + result.error);
      setShowDeleteModal(false);
    }
    setItemToDelete(null);
  };

  const handleAddToShoppingList = async () => {
    const shoppingItem = {
      item_name: deletedItemData.item_name,
      category: deletedItemData.category,
      priority: 'medium',
      notes: `Need to restock - was: ${deletedItemData.description || 'shared item'}`
    };

    const addResult = await addShoppingListItem({
      ...shoppingItem,
      owner: userName
    });

    if (addResult.success) {
      setShoppingItems(prev => [...prev, addResult.newItem]);
      setActiveTab('shopping-list');
    }

    setShowShoppingModal(false);
    setDeletedItemData(null);
  };

  const handleSkipShoppingList = () => {
    setShowShoppingModal(false);
    setDeletedItemData(null);
  };

  const handleAddInventoryItem = async (e) => {
    e.preventDefault();
    const itemWithOwner = {
      ...newItem,
      owner: userName
    };

    const result = await addInventoryItem(itemWithOwner);
    if (result.success) {
      setInventoryItems(prev => [...prev, result.newItem]);
      setNewItem({
        item_name: '',
        category: '',
        tag: 'free-to-borrow',
        description: ''
      });
      setShowAddForm(false);
    } else {
      alert('Error adding item: ' + result.error);
    }
  };

  const handleAddShoppingItem = async (e) => {
    e.preventDefault();
    const itemWithOwner = {
      ...newShoppingItem,
      owner: userName
    };

    const result = await addShoppingListItem(itemWithOwner);
    if (result.success) {
      setShoppingItems(prev => [...prev, result.newItem]);
      setNewShoppingItem({
        item_name: '',
        category: '',
        priority: 'medium',
        notes: ''
      });
    } else {
      alert('Error adding shopping item: ' + result.error);
    }
  };

  const handleDeleteShoppingItem = async (itemId) => {
    const result = await deleteShoppingListItem(itemId);
    if (result.success) {
      setShoppingItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      alert('Error deleting shopping item: ' + result.error);
    }
  };

  const getTagColor = (tag) => {
    switch (tag) {
      case 'free-to-borrow': return 'tag-blue';
      case 'free-to-take': return 'tag-orange';
      default: return 'tag-gray';
    }
  };

  const getTagLabel = (tag) => {
    switch (tag) {
      case 'free-to-borrow': return 'Free to Borrow';
      case 'free-to-take': return 'Free to Take';
      default: return tag;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  if (loading) {
    return (
      <div className="my-inventory-container">
        <div className="loading">Loading your inventory...</div>
      </div>
    );
  }

  return (
    <div className="my-inventory-container">
      <header className="my-inventory-header">
        <div className="header-content">
          <div>
            <h1>{userName}'s Inventory</h1>
            <p>Manage your shared items and shopping list</p>
          </div>
          <button onClick={() => navigate('/inventory')} className="back-button">
            ← Back to Shared Inventory
          </button>
        </div>
      </header>

      <div className="my-inventory-content">
        <div className="tabs">
          <button
            className={activeTab === 'my-items' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('my-items')}
          >
            My Shared Items ({inventoryItems.length})
          </button>
          <button
            className={activeTab === 'shopping-list' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('shopping-list')}
          >
            Shopping List ({shoppingItems.length})
          </button>
        </div>

        {activeTab === 'my-items' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Items You're Sharing</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="add-button"
              >
                {showAddForm ? 'Cancel' : '+ Add New Item'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddInventoryItem} className="add-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Item Name</label>
                    <input
                      type="text"
                      value={newItem.item_name}
                      onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Sharing Type</label>
                    <select
                      value={newItem.tag}
                      onChange={(e) => setNewItem({...newItem, tag: e.target.value})}
                    >
                      <option value="free-to-borrow">Free to Borrow</option>
                      <option value="free-to-take">Free to Take</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description (optional)</label>
                    <input
                      type="text"
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      placeholder="Any notes about the item"
                    />
                  </div>
                </div>
                <button type="submit" className="submit-button">Add Item</button>
              </form>
            )}

            <div className="items-grid">
              {inventoryItems.length === 0 ? (
                <div className="no-items">
                  You haven't shared any items yet. Add some items to help your roommates!
                </div>
              ) : (
                inventoryItems.map((item) => (
                  <div key={item.id} className="item-card">
                    <div className="item-header">
                      <h3 className="item-name">{item.item_name}</h3>
                      <div className="item-actions">
                        <span className={`tag ${getTagColor(item.tag)}`}>
                          {getTagLabel(item.tag)}
                        </span>
                        <button
                          onClick={() => handleDeleteInventoryItem(item)}
                          className="delete-button"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="item-details">
                      <p><strong>Category:</strong> {item.category}</p>
                      {item.description && (
                        <p><strong>Notes:</strong> {item.description}</p>
                      )}
                      <p><strong>Added:</strong> {new Date(item.date_added).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'shopping-list' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Your Shopping List</h2>
            </div>

            <form onSubmit={handleAddShoppingItem} className="add-form shopping-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    value={newShoppingItem.item_name}
                    onChange={(e) => setNewShoppingItem({...newShoppingItem, item_name: e.target.value})}
                    required
                    placeholder="What do you need to buy?"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={newShoppingItem.category}
                    onChange={(e) => setNewShoppingItem({...newShoppingItem, category: e.target.value})}
                    required
                    placeholder="e.g. Dairy, Produce"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newShoppingItem.priority}
                    onChange={(e) => setNewShoppingItem({...newShoppingItem, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <input
                    type="text"
                    value={newShoppingItem.notes}
                    onChange={(e) => setNewShoppingItem({...newShoppingItem, notes: e.target.value})}
                    placeholder="Any specific requirements"
                  />
                </div>
              </div>
              <button type="submit" className="submit-button">+ Add to Shopping List</button>
            </form>

            <div className="items-grid">
              {shoppingItems.length === 0 ? (
                <div className="no-items">
                  Your shopping list is empty. Add items you need to buy!
                </div>
              ) : (
                shoppingItems.map((item) => (
                  <div key={item.id} className="item-card shopping-card">
                    <div className="item-header">
                      <h3 className="item-name">{item.item_name}</h3>
                      <div className="item-actions">
                        <span className={`priority ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <button
                          onClick={() => handleDeleteShoppingItem(item.id)}
                          className="delete-button"
                        >
                          ×
                        </button>
                      </div>
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
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Item"
          footer={
            <>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="modal-button modal-button-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                className="modal-button modal-button-primary"
              >
                Delete Item
              </button>
            </>
          }
        >
          {itemToDelete && (
            <>
              <p>Are you sure you want to delete this item from the shared inventory?</p>
              <div className="item-preview">
                <h4>{itemToDelete.item_name}</h4>
                <div className="item-meta">
                  <span><strong>Category:</strong> {itemToDelete.category}</span>
                  <span><strong>Type:</strong> {getTagLabel(itemToDelete.tag)}</span>
                </div>
                {itemToDelete.description && (
                  <p style={{margin: '8px 0 0 0', fontSize: '0.9rem', color: '#666'}}>
                    {itemToDelete.description}
                  </p>
                )}
              </div>
              <p><strong>This action cannot be undone.</strong> The item will be removed from everyone's shared inventory.</p>
            </>
          )}
        </Modal>

        {/* Shopping List Prompt Modal */}
        <Modal
          isOpen={showShoppingModal}
          onClose={handleSkipShoppingList}
          title="Add to Shopping List?"
          footer={
            <>
              <button
                onClick={handleSkipShoppingList}
                className="modal-button modal-button-cancel"
              >
                No Thanks
              </button>
              <button
                onClick={handleAddToShoppingList}
                className="modal-button modal-button-secondary"
              >
                Add to Shopping List
              </button>
            </>
          }
        >
          {deletedItemData && (
            <>
              <p><strong>"{deletedItemData.item_name}"</strong> has been removed from the shared inventory.</p>
              <p>Would you like to add it to your shopping list so you can restock it later?</p>
              <div className="item-preview">
                <h4>{deletedItemData.item_name}</h4>
                <div className="item-meta">
                  <span><strong>Category:</strong> {deletedItemData.category}</span>
                  <span><strong>Priority:</strong> Medium</span>
                </div>
                <p style={{margin: '8px 0 0 0', fontSize: '0.9rem', color: '#666'}}>
                  Need to restock - was: {deletedItemData.description || 'shared item'}
                </p>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default MyInventory;