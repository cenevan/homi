import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadShoppingListData, loadPickedUpItemsData, markItemAsPickedUp, markItemAsPaid, loadReceiptsData, saveReceipt } from '../utils/dataOperations';
import Modal from './Modal';
import ReceiptPreview from './ReceiptPreview';
import logo from '../logos/logo.png';
import './ShoppingList.css';

function ShoppingList() {
  const [allShoppingItems, setAllShoppingItems] = useState([]);
  const [pickedUpItems, setPickedUpItems] = useState([]);
  const [savedReceipts, setSavedReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName] = useState(() => localStorage.getItem('userName'));
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('shopping-lists');
  const [showPickUpModal, setShowPickUpModal] = useState(false);
  const [itemToPickUp, setItemToPickUp] = useState(null);

  // Receipt-related state
  const [receiptOption, setReceiptOption] = useState('none'); // 'none', 'existing', 'new'
  const [selectedReceiptId, setSelectedReceiptId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptName, setReceiptName] = useState('');
  const [receiptStore, setReceiptStore] = useState('');
  const [receiptCost, setReceiptCost] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');

  // Receipt preview state
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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
      const [shopping, pickedUp, receipts] = await Promise.all([
        loadShoppingListData(),
        loadPickedUpItemsData(),
        loadReceiptsData()
      ]);
      setAllShoppingItems(shopping);
      setPickedUpItems(pickedUp);
      setSavedReceipts(receipts);
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

  const handlePickUpItem = (item) => {
    setItemToPickUp(item);
    // Reset all receipt state
    setReceiptOption('none');
    setSelectedReceiptId('');
    setReceiptFile(null);
    setReceiptName('');
    setReceiptStore('');
    setReceiptCost('');
    setReceiptNotes('');
    setShowPickUpModal(true);
  };

  const confirmPickUp = async () => {
    if (!itemToPickUp) return;

    let receiptData = null;

    if (receiptOption === 'existing' && selectedReceiptId) {
      // Use existing receipt
      const selectedReceipt = savedReceipts.find(r => r.id === selectedReceiptId);
      if (selectedReceipt) {
        receiptData = {
          receiptId: selectedReceipt.id,
          fileName: selectedReceipt.file_name,
          cost: receiptCost || selectedReceipt.total_cost,
          notes: receiptNotes || `Picked up for ${itemToPickUp.owner}`,
          storeName: selectedReceipt.store_name
        };
      }
    } else if (receiptOption === 'new' && receiptFile) {
      // Upload new receipt first
      const newReceiptData = {
        name: receiptName || `Receipt - ${new Date().toLocaleDateString()}`,
        fileName: receiptFile.name,
        uploadedBy: userName,
        storeName: receiptStore,
        totalCost: receiptCost,
        notes: receiptNotes
      };

      const receiptResult = await saveReceipt(newReceiptData);
      if (receiptResult.success) {
        setSavedReceipts(receiptResult.data);
        receiptData = {
          receiptId: receiptResult.newReceipt.id,
          fileName: receiptResult.newReceipt.file_name,
          cost: receiptCost,
          notes: receiptNotes || `Picked up for ${itemToPickUp.owner}`,
          storeName: receiptStore
        };
      } else {
        alert('Error saving receipt: ' + receiptResult.error);
        return;
      }
    }

    const result = await markItemAsPickedUp(itemToPickUp, userName, receiptData);

    if (result.success) {
      setAllShoppingItems(result.updatedShoppingList);
      setPickedUpItems(result.data);
      setShowPickUpModal(false);
      setItemToPickUp(null);
    } else {
      alert('Error marking item as picked up: ' + result.error);
    }
  };

  const handleMarkAsPaid = async (itemId) => {
    const result = await markItemAsPaid(itemId);
    if (result.success) {
      // Update the picked-up items list
      setPickedUpItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? result.updatedItem : item
        )
      );
    } else {
      alert('Error marking item as paid: ' + result.error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setReceiptFile(file);
    } else {
      alert('Please select an image or PDF file');
      e.target.value = '';
    }
  };

  const handlePreviewReceipt = (receipt) => {
    setPreviewReceipt(receipt);
    setShowReceiptPreview(true);
  };

  const getSelectedReceipt = () => {
    return savedReceipts.find(r => r.id === selectedReceiptId);
  };

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
          <div className="header-brand">
            <img src={logo} alt="Homi" className="header-logo" />
            <div>
              <h1>Shared Shopping Lists</h1>
              <p>Coordinate shopping trips with your roommates</p>
            </div>
          </div>
          <div className="header-buttons">
            <button onClick={() => navigate('/my-inventory')} className="nav-button">
              My Inventory
            </button>
            <button onClick={() => navigate('/split-bills')} className="nav-button">
              Split Bills
            </button>
            <button onClick={() => navigate('/inventory')} className="nav-button">
              Shared Inventory
            </button>
          </div>
        </div>
      </header>

      <div className="shopping-list-content">
        <div className="tabs">
          <button
            className={activeTab === 'shopping-lists' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('shopping-lists')}
          >
            Shopping Lists ({allShoppingItems.length})
          </button>
          <button
            className={activeTab === 'picked-up' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('picked-up')}
          >
            Items Picked Up For You ({pickedUpItems.filter(item => item.original_owner?.toLowerCase() === userName?.toLowerCase()).length})
          </button>
        </div>

        {activeTab === 'shopping-lists' && (
          <div className="tab-content">
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
                        <button
                          onClick={() => handlePickUpItem(item)}
                          className="pick-up-button"
                        >
                          📋 I'll Pick This Up
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
        )}

        {activeTab === 'picked-up' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Items Picked Up For You ({pickedUpItems.filter(item => item.original_owner?.toLowerCase() === userName?.toLowerCase()).length})</h2>
                <p className="section-subtitle">Items from your shopping list that your roommates have picked up for you</p>
              </div>

              <div className="picked-up-grid">
                {pickedUpItems.filter(item => item.original_owner?.toLowerCase() === userName?.toLowerCase()).length === 0 ? (
                  <div className="no-items">
                    No one has picked up items for you yet. When roommates use "I'll Pick This Up" on your shopping list items, they'll appear here!
                  </div>
                ) : (
                  pickedUpItems
                    .filter(item => item.original_owner?.toLowerCase() === userName?.toLowerCase())
                    .map((item) => (
                    <div key={item.id} className="item-card picked-up-card">
                      <div className="item-header">
                        <h3 className="item-name">{item.item_name}</h3>
                        <div className="pick-up-info">
                          <span className="picked-up-by">
                            Picked up by {item.picked_up_by}
                          </span>
                          {item.cost && (
                            <span className="item-cost">${item.cost}</span>
                          )}
                          {item.paid && (
                            <span className="paid-status">✓ Paid</span>
                          )}
                        </div>
                      </div>
                      <div className="item-details">
                        <p><strong>Category:</strong> {item.category}</p>
                        <p><strong>Date Picked Up:</strong> {new Date(item.date_picked_up).toLocaleDateString()}</p>
                        {item.date_paid && (
                          <p><strong>Date Paid:</strong> {new Date(item.date_paid).toLocaleDateString()}</p>
                        )}
                        {item.notes && (
                          <p><strong>Notes:</strong> {item.notes}</p>
                        )}
                        {item.store_name && (
                          <p><strong>Store:</strong> {item.store_name}</p>
                        )}
                      </div>
                      <div className="item-actions">
                        {item.receipt_image && (
                          <button
                            className="preview-button"
                            onClick={() => setPreviewImage(`/receipts/${item.receipt_image}`)}
                          >
                            View Receipt
                          </button>
                        )}
                        {!item.paid && item.cost && (
                          <button
                            className="pay-button"
                            onClick={() => handleMarkAsPaid(item.id)}
                          >
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pick Up Item Modal */}
          <Modal
            isOpen={showPickUpModal}
            onClose={() => setShowPickUpModal(false)}
            title="Pick Up Item"
            footer={
              <>
                <button
                  onClick={() => setShowPickUpModal(false)}
                  className="modal-button modal-button-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPickUp}
                  className="modal-button modal-button-secondary"
                >
                  Confirm Pick Up
                </button>
              </>
            }
          >
            {itemToPickUp && (
              <>
                <p>You're picking up <strong>"{itemToPickUp.item_name}"</strong> for <strong>{itemToPickUp.owner}</strong>.</p>

                <div className="receipt-section">
                  <h4>Receipt Options</h4>

                  <div className="receipt-options">
                    <label className="receipt-option">
                      <input
                        type="radio"
                        name="receiptOption"
                        value="none"
                        checked={receiptOption === 'none'}
                        onChange={(e) => setReceiptOption(e.target.value)}
                      />
                      No receipt
                    </label>

                    <label className="receipt-option">
                      <input
                        type="radio"
                        name="receiptOption"
                        value="existing"
                        checked={receiptOption === 'existing'}
                        onChange={(e) => setReceiptOption(e.target.value)}
                      />
                      Use existing receipt ({savedReceipts.length} available)
                    </label>

                    <label className="receipt-option">
                      <input
                        type="radio"
                        name="receiptOption"
                        value="new"
                        checked={receiptOption === 'new'}
                        onChange={(e) => setReceiptOption(e.target.value)}
                      />
                      Upload new receipt
                    </label>
                  </div>

                  {receiptOption === 'existing' && (
                    <div className="existing-receipt-section">
                      <label>Select Receipt:</label>
                      <select
                        value={selectedReceiptId}
                        onChange={(e) => setSelectedReceiptId(e.target.value)}
                        className="receipt-select"
                      >
                        <option value="">Choose a receipt...</option>
                        {savedReceipts.map(receipt => (
                          <option key={receipt.id} value={receipt.id}>
                            {receipt.receipt_name} - ${receipt.total_cost} ({receipt.store_name}) - by {receipt.uploaded_by}
                          </option>
                        ))}
                      </select>

                      {selectedReceiptId && getSelectedReceipt() && (
                        <div className="selected-receipt-preview">
                          <div className="receipt-thumbnail-container">
                            <img
                              src={`/${getSelectedReceipt().file_name}`}
                              alt="Receipt thumbnail"
                              className="receipt-thumbnail"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <div className="receipt-thumbnail-error" style={{display: 'none'}}>
                              📄
                            </div>
                          </div>
                          <div className="receipt-details">
                            <p><strong>{getSelectedReceipt().receipt_name}</strong></p>
                            <p>{getSelectedReceipt().store_name} - ${getSelectedReceipt().total_cost}</p>
                            <p>{new Date(getSelectedReceipt().upload_date).toLocaleDateString()}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePreviewReceipt(getSelectedReceipt())}
                            className="preview-button"
                          >
                            👁 View Full Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {receiptOption === 'new' && (
                    <div className="new-receipt-section">
                      <div className="receipt-name-input">
                        <label>Receipt Name:</label>
                        <input
                          type="text"
                          placeholder="e.g., Grocery Run - Jan 25"
                          value={receiptName}
                          onChange={(e) => setReceiptName(e.target.value)}
                          className="receipt-name-field"
                        />
                      </div>

                      <div className="store-input">
                        <label>Store Name (Optional):</label>
                        <input
                          type="text"
                          placeholder="e.g., Target, Walmart"
                          value={receiptStore}
                          onChange={(e) => setReceiptStore(e.target.value)}
                          className="store-field"
                        />
                      </div>

                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="file-input"
                      />
                      {receiptFile && (
                        <p className="file-selected">Selected: {receiptFile.name}</p>
                      )}
                    </div>
                  )}

                  {(receiptOption === 'existing' || receiptOption === 'new') && (
                    <>
                      <div className="cost-input">
                        <label>Cost{receiptOption === 'existing' ? ' (override)' : ''}:</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={receiptOption === 'existing' && selectedReceiptId ?
                            savedReceipts.find(r => r.id === selectedReceiptId)?.total_cost || '0.00' : '0.00'}
                          value={receiptCost}
                          onChange={(e) => setReceiptCost(e.target.value)}
                          className="cost-field"
                        />
                      </div>

                      <div className="notes-input">
                        <label>Notes (Optional):</label>
                        <textarea
                          placeholder="Any additional notes..."
                          value={receiptNotes}
                          onChange={(e) => setReceiptNotes(e.target.value)}
                          className="notes-field"
                          rows="3"
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </Modal>

          {/* Receipt Image Preview Modal */}
          {previewImage && (
            <ReceiptPreview
              imagePath={previewImage}
              onClose={() => setPreviewImage(null)}
            />
          )}

          {/* Receipt Preview Modal */}
          {showReceiptPreview && (
            <ReceiptPreview
              receipt={previewReceipt}
              onClose={() => {
                setShowReceiptPreview(false);
                setPreviewReceipt(null);
              }}
            />
          )}
      </div>
    </div>
  );
}

export default ShoppingList;