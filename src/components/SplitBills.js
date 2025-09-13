import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadInventoryData } from '../utils/dataOperations';
import Modal from './Modal';
import logo from '../logos/logo.png';
import './SplitBills.css';

function SplitBills() {
  const [userName] = useState(() => localStorage.getItem('userName'));
  const [showModal, setShowModal] = useState(false);
  const [splitType, setSplitType] = useState('');
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState({
    from: '',
    to: '',
    amount: '',
    description: ''
  });
  const [users, setUsers] = useState([]);
  const [currentBill, setCurrentBill] = useState({
    name: '',
    payer: '',
    totalAmount: '',
    splitType: '',
    participants: [],
    items: [],
    percentages: {}
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!userName) {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const data = await loadInventoryData();
        const uniqueUsers = [...new Set(data.map(item => item.owner))];
        setUsers(uniqueUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    const loadBills = () => {
      const savedBills = JSON.parse(localStorage.getItem('splitBills') || '[]');
      setBills(savedBills);
    };

    // Load existing bills from localStorage
    loadBills();

    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'splitBills') {
        loadBills();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events within the same tab
    const handleCustomUpdate = () => {
      loadBills();
    };

    window.addEventListener('splitBillsUpdated', handleCustomUpdate);

    fetchUsers();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('splitBillsUpdated', handleCustomUpdate);
    };
  }, [userName, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userName');
    navigate('/');
  };

  const openModal = (type) => {
    setSplitType(type);
    setCurrentBill({
      name: '',
      payer: '',
      totalAmount: '',
      splitType: type,
      participants: [],
      items: [],
      percentages: {}
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSplitType('');
  };

  const handleInputChange = (field, value) => {
    setCurrentBill(prev => ({ ...prev, [field]: value }));
  };

  const handleParticipantToggle = (user) => {
    setCurrentBill(prev => ({
      ...prev,
      participants: prev.participants.includes(user)
        ? prev.participants.filter(p => p !== user)
        : [...prev.participants, user]
    }));
  };

  const handlePercentageChange = (user, percentage) => {
    setCurrentBill(prev => ({
      ...prev,
      percentages: { ...prev.percentages, [user]: parseFloat(percentage) || 0 }
    }));
  };

  const addItem = () => {
    setCurrentBill(prev => ({
      ...prev,
      items: [...prev.items, { name: '', price: '', buyer: '' }]
    }));
  };

  const updateItem = (index, field, value) => {
    setCurrentBill(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (index) => {
    setCurrentBill(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateSplit = () => {
    const { splitType, totalAmount, participants, items, percentages } = currentBill;
    let calculations = {};

    if (splitType === 'even') {
      const amountPerPerson = parseFloat(totalAmount) / participants.length;
      participants.forEach(person => {
        calculations[person] = amountPerPerson;
      });
    } else if (splitType === 'items') {
      const itemsByBuyer = {};
      items.forEach(item => {
        if (item.buyer && item.price) {
          itemsByBuyer[item.buyer] = (itemsByBuyer[item.buyer] || 0) + parseFloat(item.price);
        }
      });
      calculations = itemsByBuyer;
    } else if (splitType === 'percentage') {
      const total = parseFloat(totalAmount);
      Object.keys(percentages).forEach(person => {
        calculations[person] = (total * percentages[person]) / 100;
      });
    }

    return calculations;
  };

  const deleteBill = (billId) => {
    if (window.confirm('Are you sure you want to delete this bill? This will remove all associated debts.')) {
      const updatedBills = bills.filter(bill => bill.id !== billId);
      setBills(updatedBills);
      localStorage.setItem('splitBills', JSON.stringify(updatedBills));
    }
  };

  const saveBill = () => {
    if (!currentBill.name || !currentBill.payer) {
      alert('Please fill in all required fields');
      return;
    }

    if (splitType === 'even' && (currentBill.participants.length === 0 || !currentBill.totalAmount)) {
      alert('Please add participants and total amount');
      return;
    }

    if (splitType === 'items' && currentBill.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (splitType === 'percentage') {
      const totalPercentage = Object.values(currentBill.percentages).reduce((sum, p) => sum + p, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Percentages must add up to 100%');
        return;
      }
    }

    const calculations = calculateSplit();
    const newBill = {
      ...currentBill,
      id: Date.now(),
      calculations,
      createdAt: new Date().toISOString(),
      source: 'manual'
    };

    const updatedBills = [...bills, newBill];
    setBills(updatedBills);
    localStorage.setItem('splitBills', JSON.stringify(updatedBills));
    closeModal();
  };

  const getBillOverview = () => {
    const overview = {};

    // Add debts from bills
    bills.forEach(bill => {
      Object.entries(bill.calculations).forEach(([person, amount]) => {
        if (person !== bill.payer) {
          if (!overview[person]) overview[person] = {};
          if (!overview[person][bill.payer]) overview[person][bill.payer] = 0;
          overview[person][bill.payer] += amount;
        }
      });
    });

    // Subtract payments
    payments.forEach(payment => {
      if (!overview[payment.from]) overview[payment.from] = {};
      if (!overview[payment.from][payment.to]) overview[payment.from][payment.to] = 0;
      overview[payment.from][payment.to] -= parseFloat(payment.amount);

      // Remove entries that are zero or negative
      if (overview[payment.from][payment.to] <= 0) {
        delete overview[payment.from][payment.to];
        if (Object.keys(overview[payment.from]).length === 0) {
          delete overview[payment.from];
        }
      }
    });

    return overview;
  };

  const savePayment = () => {
    if (!currentPayment.from || !currentPayment.to || !currentPayment.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (currentPayment.from === currentPayment.to) {
      alert('From and To cannot be the same person');
      return;
    }

    if (parseFloat(currentPayment.amount) <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    const newPayment = {
      ...currentPayment,
      id: Date.now(),
      amount: parseFloat(currentPayment.amount).toFixed(2),
      createdAt: new Date().toISOString()
    };

    setPayments(prev => [...prev, newPayment]);
    setCurrentPayment({ from: '', to: '', amount: '', description: '' });
    setShowPaymentModal(false);
  };

  const deletePayment = (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment? This will affect the Bills Overview.')) {
      setPayments(prev => prev.filter(payment => payment.id !== paymentId));
    }
  };

  const overview = getBillOverview();

  return (
    <div className="split-bills-container">
      <header className="split-bills-header">
        <div className="header-content">
          <div className="header-brand">
            <img src={logo} alt="Homi" className="header-logo" />
            <div>
              <h1>Split Bills</h1>
              <p>Welcome back, {userName}!</p>
            </div>
          </div>
          <div className="header-buttons">
            <button onClick={() => navigate('/inventory')} className="nav-button">
              Inventory
            </button>
            <button onClick={() => navigate('/shopping-list')} className="nav-button">
              Shopping Lists
            </button>
            <button onClick={() => navigate('/my-inventory')} className="nav-button">
              My Inventory
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="split-bills-content">
        <div className="bills-section">
          <h2>Add a New Bill</h2>
          <div className="add-bill-buttons">
            <button onClick={() => openModal('even')} className="add-bill-btn">
              Even Split
            </button>
            <button onClick={() => openModal('items')} className="add-bill-btn">
              Split by Items
            </button>
            <button onClick={() => openModal('percentage')} className="add-bill-btn">
              Split by Percentage
            </button>
          </div>
        </div>

        <div className="payments-section">
          <h2>Payments</h2>
          <p>Record payments between individuals to update the Bills Overview.</p>
          <button onClick={() => setShowPaymentModal(true)} className="add-payment-btn">
            Record Payment
          </button>
        </div>

        <div className="overview-section">
          <h2>Bills Overview</h2>
          <div className="overview-table-container">
            <table className="overview-table">
              <thead>
                <tr>
                  <th>Owes →</th>
                  {users.map(user => (
                    <th key={user}>{user}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(debtor => (
                  <tr key={debtor}>
                    <td className="debtor-name">{debtor}</td>
                    {users.map(creditor => {
                      const amount = overview[debtor]?.[creditor] || 0;
                      return (
                        <td key={creditor} className={amount > 0 ? 'debt-amount' : 'no-debt'}>
                          {amount > 0 ? `$${amount.toFixed(2)}` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="recent-payments">
          <h2>Recent Payments</h2>
          {payments.length === 0 ? (
            <p>No payments recorded yet.</p>
          ) : (
            <div className="payments-grid">
              {payments.slice(-5).reverse().map(payment => (
                <div key={payment.id} className="payment-card">
                  <p><strong>{payment.from}</strong> paid <strong>{payment.to}</strong></p>
                  <p className="payment-amount">${payment.amount}</p>
                  <p className="payment-description">{payment.description}</p>
                  <p className="payment-date">{new Date(payment.createdAt).toLocaleDateString()}</p>
                  <div className="payment-actions">
                    <button
                      onClick={() => deletePayment(payment.id)}
                      className="delete-payment-btn"
                      title="Delete this payment"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bills-history">
          <h2>Recent Bills</h2>
          {bills.length === 0 ? (
            <p>No bills added yet.</p>
          ) : (
            <div className="bills-grid">
              {bills.map(bill => (
                <div key={bill.id} className={`bill-card ${bill.source === 'shopping_pickup' ? 'shopping-pickup-card' : ''}`}>
                  <h3>{bill.name}</h3>
                  {bill.source === 'shopping_pickup' && (
                    <span className="bill-source-badge">From Shopping Pickup</span>
                  )}
                  <p><strong>Paid by:</strong> {bill.payer}</p>
                  <p><strong>Split type:</strong> {bill.splitType}</p>
                  <p><strong>Date:</strong> {new Date(bill.createdAt).toLocaleDateString()}</p>
                  {bill.sourceData && (
                    <div className="source-details">
                      {bill.sourceData.storeName && (
                        <p><strong>Store:</strong> {bill.sourceData.storeName}</p>
                      )}
                      {bill.sourceData.notes && (
                        <p><strong>Notes:</strong> {bill.sourceData.notes}</p>
                      )}
                    </div>
                  )}
                  <div className="bill-details">
                    <h4>Split breakdown:</h4>
                    {Object.entries(bill.calculations).map(([person, amount]) => (
                      <div key={person} className="split-item">
                        <span>{person}:</span>
                        <span>${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bill-actions">
                    <button
                      onClick={() => deleteBill(bill.id)}
                      className="delete-bill-btn"
                      title="Delete this bill"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={closeModal}>
          <div className="add-bill-modal">
            <h2>Add {splitType === 'even' ? 'Even Split' : splitType === 'items' ? 'Items Split' : 'Percentage Split'} Bill</h2>

            <div className="form-group">
              <label>Bill Name *</label>
              <input
                type="text"
                value={currentBill.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Grocery Shopping, Dinner Out"
              />
            </div>

            <div className="form-group">
              <label>Who Paid the Bill *</label>
              <select
                value={currentBill.payer}
                onChange={(e) => handleInputChange('payer', e.target.value)}
              >
                <option value="">Select payer</option>
                {users.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            {splitType === 'even' && (
              <>
                <div className="form-group">
                  <label>Total Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentBill.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Split Between *</label>
                  <div className="participants-selection">
                    {users.map(user => (
                      <label key={user} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={currentBill.participants.includes(user)}
                          onChange={() => handleParticipantToggle(user)}
                        />
                        <span className="checkbox-text">{user}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {splitType === 'items' && (
              <div className="form-group">
                <label>Items</label>
                <div className="items-list">
                  {currentBill.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                      />
                      <select
                        value={item.buyer}
                        onChange={(e) => updateItem(index, 'buyer', e.target.value)}
                      >
                        <option value="">Who bought this?</option>
                        {users.map(user => (
                          <option key={user} value={user}>{user}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="remove-item-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addItem} className="add-item-btn">
                    Add Item
                  </button>
                </div>
              </div>
            )}

            {splitType === 'percentage' && (
              <>
                <div className="form-group">
                  <label>Total Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentBill.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Assign Percentages</label>
                  <div className="percentages-section">
                    {users.map(user => (
                      <div key={user} className="percentage-row">
                        <span className="user-name">{user}:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={currentBill.percentages[user] || ''}
                          onChange={(e) => handlePercentageChange(user, e.target.value)}
                          placeholder="0"
                        />
                        <span>%</span>
                      </div>
                    ))}
                    <div className="percentage-total">
                      Total: {Object.values(currentBill.percentages).reduce((sum, p) => sum + (p || 0), 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="modal-actions">
              <button onClick={closeModal} className="cancel-btn">Cancel</button>
              <button onClick={saveBill} className="save-btn">Save Bill</button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
          <div className="add-payment-modal">
            <h2>Record Payment</h2>

            <div className="form-group">
              <label>From *</label>
              <select
                value={currentPayment.from}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, from: e.target.value }))}
              >
                <option value="">Select person who paid</option>
                {users.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>To *</label>
              <select
                value={currentPayment.to}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, to: e.target.value }))}
              >
                <option value="">Select person who received payment</option>
                {users.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                step="0.01"
                value={currentPayment.amount}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={currentPayment.description}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional payment description"
              />
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowPaymentModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={savePayment} className="save-btn">Record Payment</button>
            </div>
          </div>
        </Modal>
    </div>
  );
}

export default SplitBills;