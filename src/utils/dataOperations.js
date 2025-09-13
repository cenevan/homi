import Papa from 'papaparse';

// Data operations that can be easily replaced with database calls later

// Inventory Operations
export const loadInventoryData = async () => {
  try {
    const response = await fetch('/inventory.csv');
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
    console.error('Error loading inventory data:', error);
    return [];
  }
};

export const deleteInventoryItem = async (itemId) => {
  try {
    // In the future, this will be a database DELETE operation
    const items = await loadInventoryData();
    const itemToDelete = items.find(item => item.id === itemId);
    const updatedItems = items.filter(item => item.id !== itemId);

    // Convert back to CSV format
    const csv = Papa.unparse(updatedItems);

    // For now, we'll simulate the file update
    // In production, this would need server-side handling
    console.log('Item deleted (simulated):', itemId);
    console.log('Updated CSV data:', csv);

    // TODO: In production, send CSV data to backend to update inventory.csv file
    // await updateInventoryFile(csv);

    return { success: true, data: updatedItems, deletedItem: itemToDelete };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error: error.message };
  }
};

export const addInventoryItem = async (item) => {
  try {
    // In the future, this will be a database INSERT operation
    const items = await loadInventoryData();

    // Generate new ID (in database, this would be auto-generated)
    const maxId = Math.max(...items.map(i => parseInt(i.id) || 0));
    const newItem = {
      ...item,
      id: (maxId + 1).toString(),
      status: 'available',
      date_added: new Date().toISOString().split('T')[0]
    };

    const updatedItems = [...items, newItem];

    // Convert back to CSV format
    const csv = Papa.unparse(updatedItems);

    console.log('Item added (simulated):', newItem);
    console.log('Updated CSV data:', csv);

    return { success: true, data: updatedItems, newItem };
  } catch (error) {
    console.error('Error adding item:', error);
    return { success: false, error: error.message };
  }
};

// Shopping List Operations
export const loadShoppingListData = async () => {
  try {
    const response = await fetch('/shopping-list.csv');
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
    console.error('Error loading shopping list data:', error);
    return [];
  }
};

export const addShoppingListItem = async (item) => {
  try {
    // In the future, this will be a database INSERT operation
    const items = await loadShoppingListData();

    // Generate new ID
    const maxId = Math.max(...items.map(i => parseInt(i.id) || 0), 0);
    const newItem = {
      ...item,
      id: (maxId + 1).toString(),
      date_added: new Date().toISOString().split('T')[0],
      status: 'needed'
    };

    const updatedItems = [...items, newItem];

    // Convert back to CSV format
    const csv = Papa.unparse(updatedItems);

    console.log('Shopping item added (simulated):', newItem);
    console.log('Updated shopping list CSV data:', csv);

    return { success: true, data: updatedItems, newItem };
  } catch (error) {
    console.error('Error adding shopping item:', error);
    return { success: false, error: error.message };
  }
};

export const deleteShoppingListItem = async (itemId) => {
  try {
    // In the future, this will be a database DELETE operation
    const items = await loadShoppingListData();
    const updatedItems = items.filter(item => item.id !== itemId);

    // Convert back to CSV format
    const csv = Papa.unparse(updatedItems);

    console.log('Shopping item deleted (simulated):', itemId);
    console.log('Updated shopping list CSV data:', csv);

    return { success: true, data: updatedItems };
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    return { success: false, error: error.message };
  }
};