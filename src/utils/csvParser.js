import Papa from 'papaparse';

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