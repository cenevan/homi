import Papa from 'papaparse';

// Inventory Operations (now via API)
export const loadInventoryData = async () => {
  try {
    const response = await fetch('/api/inventory');
    if (!response.ok) throw new Error('Failed to load inventory');
    return await response.json();
  } catch (error) {
    console.error('Error loading inventory data:', error);
    return [];
  }
};

// Database-ready inventory file update function
const updateInventoryFile = async (csvData) => {
  // TODO: Replace with database UPDATE/DELETE operations
  console.log('Updating inventory.csv (simulated):', csvData);
  // In production: await fetch('/api/inventory', { method: 'PUT', body: csvData })
};

export const deleteInventoryItem = async (itemId) => {
  try {
    const response = await fetch(`/api/inventory/${itemId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete item');
    const data = await response.json();
    return { success: true, deletedItem: data.deleted };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error: error.message };
  }
};

export const addInventoryItem = async (item) => {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to add item');
    const newItem = await response.json();
    return { success: true, newItem };
  } catch (error) {
    console.error('Error adding item:', error);
    return { success: false, error: error.message };
  }
};

// Shopping List Operations
export const loadShoppingListData = async () => {
  try {
    const response = await fetch('/api/shopping-list');
    if (!response.ok) throw new Error('Failed to load shopping list');
    return await response.json();
  } catch (error) {
    console.error('Error loading shopping list data:', error);
    return [];
  }
};

export const addShoppingListItem = async (item) => {
  try {
    const response = await fetch('/api/shopping-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to add shopping item');
    const newItem = await response.json();
    return { success: true, newItem };
  } catch (error) {
    console.error('Error adding shopping item:', error);
    return { success: false, error: error.message };
  }
};

export const deleteShoppingListItem = async (itemId) => {
  try {
    console.log('Deleting shopping item with ID:', itemId);
    const response = await fetch(`/api/shopping-list/${itemId}`, { method: 'DELETE' });
    console.log('Delete response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete failed with response:', errorText);
      throw new Error(`Failed to delete shopping item: ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    return { success: false, error: error.message };
  }
};
// Receipt Management Operations
export const loadReceiptsData = async () => {
  try {
    const response = await fetch('/api/receipts');
    if (!response.ok) throw new Error('Failed to load receipts');
    return await response.json();
  } catch (error) {
    console.error('Error loading receipts data:', error);
    return [];
  }
};

// No-op: receipts now persist via API

export const saveReceipt = async (receiptData) => {
  try {
    const response = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: receiptData.name,
        fileName: receiptData.fileName,
        uploadedBy: receiptData.uploadedBy,
        storeName: receiptData.storeName,
        totalCost: receiptData.totalCost,
        notes: receiptData.notes,
      })
    });
    if (!response.ok) throw new Error('Failed to save receipt');
    const newReceipt = await response.json();
    const current = await loadReceiptsData();
    return { success: true, data: [...current, newReceipt], newReceipt };
  } catch (error) {
    console.error('Error saving receipt:', error);
    return { success: false, error: error.message };
  }
};

// Picked-up Items Operations
export const loadPickedUpItemsData = async () => {
  try {
    const response = await fetch('/api/picked-up-items');
    if (!response.ok) throw new Error('Failed to load picked-up items');
    return await response.json();
  } catch (error) {
    console.error('Error loading picked-up items data:', error);
    return [];
  }
};

// Picked-up items API functions
export const addPickedUpItem = async (item) => {
  try {
    const response = await fetch('/api/picked-up-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to add picked-up item');
    const newItem = await response.json();
    return { success: true, newItem };
  } catch (error) {
    console.error('Error adding picked-up item:', error);
    return { success: false, error: error.message };
  }
};

export const markItemAsPaid = async (itemId) => {
  try {
    const response = await fetch(`/api/picked-up-items/${itemId}/mark-paid`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to mark item as paid');
    const updatedItem = await response.json();
    return { success: true, updatedItem };
  } catch (error) {
    console.error('Error marking item as paid:', error);
    return { success: false, error: error.message };
  }
};

export const markItemAsPickedUp = async (shoppingItem, pickedUpBy, receiptData = null) => {
  try {
    console.log('Attempting to pick up item:', shoppingItem);
    console.log('Item ID:', shoppingItem.id);

    // Step 1: Remove from shopping list
    const deleteResult = await deleteShoppingListItem(shoppingItem.id);
    console.log('Delete result:', deleteResult);

    if (!deleteResult.success) {
      return { success: false, error: `Failed to remove from shopping list: ${deleteResult.error}` };
    }

    // Step 2: Create picked-up item record
    const pickedUpItem = {
      item_name: shoppingItem.item_name,
      original_owner: shoppingItem.owner,
      picked_up_by: pickedUpBy,
      category: shoppingItem.category,
      priority: shoppingItem.priority,
      receipt_id: receiptData?.receiptId || '',
      receipt_image: receiptData?.fileName || '',
      store_name: receiptData?.storeName || '',
      cost: receiptData?.cost || '',
      notes: receiptData?.notes || `Picked up for ${shoppingItem.owner}`
    };

    // Step 3: Add to picked-up items via API
    const addResult = await addPickedUpItem(pickedUpItem);
    if (!addResult.success) {
      return { success: false, error: 'Failed to add picked-up item' };
    }

    // Step 4: Refresh data from API
    const updatedPickedUpItems = await loadPickedUpItemsData();
    const updatedShoppingList = await loadShoppingListData();

    return {
      success: true,
      data: updatedPickedUpItems,
      pickedUpItem: addResult.newItem,
      updatedShoppingList
    };
  } catch (error) {
    console.error('Error marking item as picked up:', error);
    return { success: false, error: error.message };
  }
};
