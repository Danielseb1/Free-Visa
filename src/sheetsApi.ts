export interface LocationRecord {
  timestamp: string;
  mapUrl: string;
  lat: number;
  lon: number;
}

// Fetch the name of the first sheet to ensure we use the correct range
export async function getFirstSheetName(accessToken: string, spreadsheetId: string): Promise<string> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch spreadsheet metadata.');
  }

  const data = await response.json();
  const sheets = data.sheets || [];
  if (sheets.length === 0) {
    throw new Error('Spreadsheet contains no sheets.');
  }
  return sheets[0].properties.title || 'Sheet1';
}

// Append location details to the spreadsheet
export async function appendLocationRow(
  accessToken: string,
  spreadsheetId: string,
  lat: number,
  lon: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const sheetName = await getFirstSheetName(accessToken, spreadsheetId);
    const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    
    // We append to column A to D: Timestamp, Map URL, Latitude, Longitude
    // Use Amharic/English formatted date string
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:D:append?valueInputOption=USER_ENTERED`;
    
    const body = {
      values: [
        [timestamp, mapUrl, lat, lon]
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || 'Failed to append row to Google Sheets.');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in appendLocationRow:', error);
    return { success: false, error: error.message || String(error) };
  }
}

// Fetch all locations to show in a list or on the map
export async function getAllLocations(
  accessToken: string,
  spreadsheetId: string
): Promise<LocationRecord[]> {
  try {
    const sheetName = await getFirstSheetName(accessToken, spreadsheetId);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:D`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || 'Failed to fetch rows from Google Sheets.');
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Parse rows, skipping header if first row contains 'Date' or isn't a latitude
    if (rows.length <= 1) {
      return [];
    }

    const records: LocationRecord[] = [];
    const startIdx = isHeader(rows[0]) ? 1 : 0;

    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      const timestamp = row[0] || 'N/A';
      const mapUrl = row[1] || '';
      const lat = parseFloat(row[2]);
      const lon = parseFloat(row[3]);

      if (!isNaN(lat) && !isNaN(lon)) {
        records.push({ timestamp, mapUrl, lat, lon });
      }
    }

    return records;
  } catch (error) {
    console.error('Error in getAllLocations:', error);
    throw error;
  }
}

// Quick check if the first row is a header
function isHeader(row: any[]): boolean {
  if (!row || row.length === 0) return false;
  const firstCol = String(row[0]).toLowerCase();
  return firstCol.includes('date') || firstCol.includes('time') || firstCol.includes('ቀን') || isNaN(parseFloat(row[2]));
}

// Create a new spreadsheet with the given title and pre-populate with headers
export async function createNewSpreadsheet(accessToken: string, title: string): Promise<string> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title
      },
      sheets: [
        {
          properties: {
            title: 'Locations'
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to create new spreadsheet.');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Now, write headers to this new spreadsheet
  const headersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Locations!A1:D1?valueInputOption=USER_ENTERED`;
  const headersBody = {
    values: [
      ['Timestamp', 'Map URL', 'Latitude', 'Longitude']
    ]
  };

  const headersResponse = await fetch(headersUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(headersBody)
  });

  if (!headersResponse.ok) {
    console.warn('Failed to write headers to the new spreadsheet, but the sheet was created.');
  }

  return spreadsheetId;
}
