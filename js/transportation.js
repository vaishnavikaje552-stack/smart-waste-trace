/**
 * SMART WASTE TRACE - TRANSPORTATION & JOURNEY UPDATES CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  AuthService.requireAuth();
  initAppShell('transportation');

  populateBatchSelect();
  renderTransportTable();
  setupTransportForm();
});

function populateBatchSelect() {
  const select = document.getElementById('tr-batch-id');
  if (!select) return;

  const batches = DataStore.getBatches();
  select.innerHTML = batches.map(b => `
    <option value="${b.id}">${b.id} - ${b.wasteType} (${b.vehicleNumber}) - ${b.status}</option>
  `).join('');

  // Auto-fill vehicle and destination on change
  select.addEventListener('change', (e) => {
    const batch = DataStore.getBatchById(e.target.value);
    if (batch) {
      document.getElementById('tr-vehicle').value = batch.vehicleNumber || '';
      document.getElementById('tr-destination').value = batch.assignedCenter || '';
      document.getElementById('tr-location').value = batch.collectionLocation || '';
    }
  });

  // Trigger initial fill
  if (batches.length > 0) {
    select.dispatchEvent(new Event('change'));
  }
}

function renderTransportTable() {
  const tbody = document.getElementById('transport-tbody');
  if (!tbody) return;

  const logs = DataStore.getTransportLogs();

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">No transportation records recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    let statusBadge = 'badge-neutral';
    if (l.transferStatus === 'Delivered') statusBadge = 'badge-completed';
    else if (l.transferStatus === 'In-Transit') statusBadge = 'badge-in-transit';
    else if (l.transferStatus === 'Delayed') statusBadge = 'badge-medium';
    else if (l.transferStatus === 'Route Deviation' || l.transferStatus === 'Disputed Delivery') statusBadge = 'badge-high';

    return `
      <tr>
        <td><a href="batch-details.html?id=${l.batchId}" class="mono" style="font-weight: 700; color: var(--primary-700);">${l.batchId}</a></td>
        <td><span class="mono" style="font-weight: 600;">${l.vehicleNumber}</span></td>
        <td>
          <div style="font-size: 0.85rem; font-weight: 600;"><i class="fa-solid fa-location-dot text-primary"></i> ${l.currentLocation}</div>
          <div style="font-size: 0.72rem; color: var(--slate-400);">${l.gpsCoordinates || '18.5204° N, 73.8567° E'}</div>
        </td>
        <td><div style="font-size: 0.85rem; font-weight: 500;">${l.destination}</div></td>
        <td><span style="font-size: 0.78rem; color: var(--slate-600);">${l.departureTime}</span></td>
        <td><span style="font-size: 0.78rem; color: var(--slate-600);">${l.arrivalTime}</span></td>
        <td>
          <span class="badge ${statusBadge}">
            <span class="badge-dot"></span>${l.transferStatus}
          </span>
        </td>
        <td>
          <a href="chain-of-custody.html?id=${l.batchId}" class="btn btn-secondary btn-sm" title="View Custody Timeline">
            <i class="fa-solid fa-timeline"></i> Timeline
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function setupTransportForm() {
  const form = document.getElementById('transport-update-form');
  if (!form) return;

  // Set default departure to now
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);
  
  const depTimeInput = document.getElementById('tr-departure-time');
  if (depTimeInput && !depTimeInput.value) {
    depTimeInput.value = `${dateStr} ${timeStr}`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const batchId = document.getElementById('tr-batch-id').value;
    const vehicle = document.getElementById('tr-vehicle').value.trim();
    const location = document.getElementById('tr-location').value.trim();
    const destination = document.getElementById('tr-destination').value.trim();
    const departure = document.getElementById('tr-departure-time').value.trim();
    const arrival = document.getElementById('tr-arrival-time').value.trim() || 'Pending';
    const status = document.getElementById('tr-status').value;
    const notes = document.getElementById('tr-notes').value.trim();

    if (!batchId || !vehicle || !location || !destination) {
      showToast('Please fill all mandatory transportation fields.', 'warning');
      return;
    }

    const newLog = {
      id: `TR-${Math.floor(100 + Math.random() * 900)}`,
      batchId,
      vehicleNumber: vehicle,
      currentLocation: location,
      destination,
      departureTime: departure,
      arrivalTime: arrival,
      transferStatus: status,
      gpsCoordinates: '18.5204° N, 73.8567° E',
      notes: notes || 'Simulated live driver update recorded.'
    };

    DataStore.saveTransportLog(newLog);

    // Also update batch status if Delivered or Delayed
    const batch = DataStore.getBatchById(batchId);
    if (batch) {
      if (status === 'Delivered') {
        batch.status = 'Completed';
        batch.receivingConfirmed = true;
      } else if (status === 'Delayed') {
        batch.riskLevel = 'Medium';
      } else if (status === 'Route Deviation') {
        batch.riskLevel = 'High';
        batch.status = 'Discrepancy Flagged';
      }
      DataStore.saveBatch(batch);
    }

    showToast(`Transportation update logged for ${batchId}`, 'success');
    renderTransportTable();
    form.reset();
    populateBatchSelect();
  });
}
