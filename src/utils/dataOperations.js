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
