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
    const response = await fetch(`/api/shopping-list/${itemId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete shopping item');
    return { success: true };
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    return { success: false, error: error.message };
  }
};
// Receipt Management Operations
export const loadReceiptsData = async () => {
  try {
    const response = await fetch('/receipts.csv');
    const csvText = await response.text();

    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (result.errors.length > 0) {
      console.error('CSV parsing errors:', result.errors);
    }

    return result.data;
  } catch (error) {
    console.error('Error loading receipts data:', error);
    return [];
  }
};

const updateReceiptsFile = async (csvData) => {
  // TODO: Replace with database INSERT/UPDATE operations
  console.log('Updating receipts.csv (simulated):', csvData);
  // In production: await fetch('/api/receipts', { method: 'PUT', body: csvData })
};

export const saveReceipt = async (receiptData) => {
  try {
    // Step 1: Load current receipts (database SELECT in future)
    const receipts = await loadReceiptsData();

    // Step 2: Create new receipt record (database INSERT in future)
    const maxId = Math.max(...receipts.map(r => parseInt(r.id) || 0), 0);
    const newReceipt = {
      id: (maxId + 1).toString(),
      receipt_name: receiptData.name,
      file_name: receiptData.fileName,
      uploaded_by: receiptData.uploadedBy,
      upload_date: new Date().toISOString().split('T')[0],
      store_name: receiptData.storeName || '',
      total_cost: receiptData.totalCost || '',
      notes: receiptData.notes || ''
    };

    const updatedReceipts = [...receipts, newReceipt];

    // Step 3: Update CSV file (database INSERT operation in future)
    const csv = Papa.unparse(updatedReceipts);
    await updateReceiptsFile(csv);

    return { success: true, data: updatedReceipts, newReceipt };
  } catch (error) {
    console.error('Error saving receipt:', error);
    return { success: false, error: error.message };
  }
};

// Picked-up Items Operations
export const loadPickedUpItemsData = async () => {
  try {
    const response = await fetch('/picked-up-items.csv');
    const csvText = await response.text();

    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (result.errors.length > 0) {
      console.error('CSV parsing errors:', result.errors);
    }

    return result.data;
  } catch (error) {
    console.error('Error loading picked-up items data:', error);
    return [];
  }
};

// Database-ready CSV file update functions (to be replaced with database operations)
const updateShoppingListFile = async (csvData) => {
  // TODO: Replace with database UPDATE/DELETE operations
  // For now, this simulates file writing
  console.log('Updating shopping-list.csv (simulated):', csvData);
  // In production: await fetch('/api/shopping-list', { method: 'PUT', body: csvData })
};

const updatePickedUpItemsFile = async (csvData) => {
  // TODO: Replace with database INSERT operation
  // For now, this simulates file writing
  console.log('Updating picked-up-items.csv (simulated):', csvData);
  // In production: await fetch('/api/picked-up-items', { method: 'PUT', body: csvData })
};

export const markItemAsPickedUp = async (shoppingItem, pickedUpBy, receiptData = null) => {
  try {
    // Step 1: Remove from shopping list (database DELETE operation in future)
    const deleteResult = await deleteShoppingListItem(shoppingItem.id);
    if (!deleteResult.success) {
      return { success: false, error: 'Failed to remove from shopping list' };
    }

    // Step 2: Create picked-up item record (database INSERT operation in future)
    const pickedUpItems = await loadPickedUpItemsData();
    const maxId = Math.max(...pickedUpItems.map(i => parseInt(i.id) || 0), 0);

    const pickedUpItem = {
      id: (maxId + 1).toString(),
      item_name: shoppingItem.item_name,
      original_owner: shoppingItem.owner,
      picked_up_by: pickedUpBy,
      category: shoppingItem.category,
      priority: shoppingItem.priority,
      date_picked_up: new Date().toISOString().split('T')[0],
      receipt_id: receiptData?.receiptId || '',
      receipt_image: receiptData?.fileName || '',
      store_name: receiptData?.storeName || '',
      cost: receiptData?.cost || '',
      notes: receiptData?.notes || `Picked up for ${shoppingItem.owner}`
    };

    const updatedPickedUpItems = [...pickedUpItems, pickedUpItem];

    // Step 3: Update CSV files (database operations in future)
    const shoppingListCsv = Papa.unparse(deleteResult.data);
    const pickedUpItemsCsv = Papa.unparse(updatedPickedUpItems);

    await Promise.all([
      updateShoppingListFile(shoppingListCsv),
      updatePickedUpItemsFile(pickedUpItemsCsv)
    ]);

    return {
      success: true,
      data: updatedPickedUpItems,
      pickedUpItem,
      updatedShoppingList: deleteResult.data
    };
  } catch (error) {
    console.error('Error marking item as picked up:', error);
    return { success: false, error: error.message };
  }
};
