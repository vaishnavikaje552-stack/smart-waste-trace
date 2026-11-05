/**
 * SMART WASTE TRACE - PROCESSING CENTERS & RECORDS CONTROLLER
 * Manages facilities, capacity gauges, operator records, and discrepancy detection.
 */

document.addEventListener('DOMContentLoaded', () => {
  AuthService.requireAuth();

  const currentPage = window.location.pathname.split('/').pop();

  if (currentPage === 'processing-centers.html') {
    initAppShell('processing-centers');
    initProcessingCenters();
  } else if (currentPage === 'processing-records.html') {
    initAppShell('processing-records');
    initProcessingRecords();
  }
});

/* ==========================================================================
   PART A: PROCESSING CENTERS MODULE
   ========================================================================== */

function initProcessingCenters() {
  renderCentersGrid();
  setupAddCenterForm();
}

function renderCentersGrid() {
  const container = document.getElementById('processing-centers-container');
  if (!container) return;

  const centers = DataStore.getCenters();

  container.innerHTML = centers.map(c => {
    const utilPercent = Math.min(100, Math.round((c.currentUtilizationKg / c.capacityKg) * 100));
    let progressColor = 'progress-fill-emerald';
    if (utilPercent > 85) progressColor = 'progress-fill-amber';
    if (utilPercent >= 95) progressColor = 'progress-fill-purple';

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${c.name}</div>
            <div class="card-subtitle"><i class="fa-solid fa-location-dot"></i> ${c.location}</div>
          </div>
          <span class="badge ${c.authorized ? 'badge-completed' : 'badge-high'}">
            <span class="badge-dot"></span>${c.authorized ? 'Authorized' : 'Suspended'}
          </span>
        </div>

        <div class="card-body">
          <div style="font-size: 0.8rem; color: var(--slate-600); margin-bottom: 14px;">
            <strong>Type:</strong> ${c.type} <br>
            <span class="mono" style="font-size: 0.75rem; color: var(--slate-400);">Auth Code: ${c.authCode}</span>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 600; margin-bottom: 4px;">
              <span>Daily Capacity Utilization</span>
              <span>${utilPercent}% (${formatKg(c.currentUtilizationKg)} / ${formatKg(c.capacityKg)})</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${progressColor}" style="width: ${utilPercent}%;"></div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: var(--slate-50); padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.82rem;">
            <div>
              <div style="color: var(--slate-500); font-size: 0.72rem; text-transform: uppercase;">Batches Handled</div>
              <div style="font-weight: 800; color: var(--slate-900);">${c.batchesReceived} batches</div>
            </div>
            <div>
              <div style="color: var(--slate-500); font-size: 0.72rem; text-transform: uppercase;">Plant Contact</div>
              <div style="font-weight: 600; color: var(--slate-800);">${c.contactPerson || 'Office Desk'}</div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <span style="font-size: 0.75rem; color: var(--slate-500);"><i class="fa-solid fa-phone"></i> ${c.phone || '+91 98220 00000'}</span>
          <button class="btn btn-secondary btn-sm" onclick="showToast('Facility telemetry sync complete', 'info')">
            <i class="fa-solid fa-arrow-rotate-right"></i> Telemetry
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function setupAddCenterForm() {
  const form = document.getElementById('add-center-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('center-name').value.trim();
    const type = document.getElementById('center-type').value.trim();
    const location = document.getElementById('center-location').value.trim();
    const capacity = Number(document.getElementById('center-capacity').value);
    const authCode = document.getElementById('center-auth-code').value.trim() || `MPCB-GEN-2026-${Math.floor(10 + Math.random() * 90)}`;
    const contact = document.getElementById('center-contact').value.trim();

    if (!name || !location || !capacity) {
      showToast('Please provide center name, location and capacity.', 'warning');
      return;
    }

    const newCenter = {
      id: `PC-${String(DataStore.getCenters().length + 1).padStart(3, '0')}`,
      name,
      type,
      location,
      authorized: true,
      authCode,
      capacityKg: capacity,
      currentUtilizationKg: Math.round(capacity * 0.4),
      batchesReceived: 0,
      contactPerson: contact || 'Plant Supervisor',
      phone: '+91 98220 99887'
    };

    DataStore.saveCenter(newCenter);
    showToast(`Processing Center "${name}" registered successfully!`, 'success');
    closeAddCenterModal();
    renderCentersGrid();
    form.reset();
  });
}

function openAddCenterModal() {
  const modal = document.getElementById('add-center-modal');
  if (modal) modal.classList.add('active');
}

function closeAddCenterModal() {
  const modal = document.getElementById('add-center-modal');
  if (modal) modal.classList.remove('active');
}

/* ==========================================================================
   PART B: PROCESSING RECORDS MODULE
   ========================================================================== */

function initProcessingRecords() {
  populateBatchPicker();
  renderProcessingRecordsTable();
  setupProcessingRecordForm();
}

function populateBatchPicker() {
  const select = document.getElementById('pr-batch-select');
  if (!select) return;

  const batches = DataStore.getBatches();
  select.innerHTML = `<option value="">-- Choose Waste Batch --</option>` + batches.map(b => `
    <option value="${b.id}">${b.id} - ${b.wasteType} (${formatKg(b.collectedQuantityKg)}) - ${b.assignedCenter}</option>
  `).join('');

  select.addEventListener('change', (e) => {
    const batch = DataStore.getBatchById(e.target.value);
    if (batch) {
      document.getElementById('pr-collected-display').value = formatKg(batch.collectedQuantityKg);
      document.getElementById('pr-center-display').value = batch.assignedCenter;
      document.getElementById('pr-received-qty').value = batch.receivedQuantityKg || batch.collectedQuantityKg;
      document.getElementById('pr-processed-qty').value = batch.processedQuantityKg || Math.round(batch.collectedQuantityKg * 0.95);
      calculateLiveDiscrepancy();
    }
  });

  const recInput = document.getElementById('pr-received-qty');
  const procInput = document.getElementById('pr-processed-qty');
  if (recInput) recInput.addEventListener('input', calculateLiveDiscrepancy);
  if (procInput) procInput.addEventListener('input', calculateLiveDiscrepancy);
}

function calculateLiveDiscrepancy() {
  const batchId = document.getElementById('pr-batch-select').value;
  const batch = DataStore.getBatchById(batchId);
  if (!batch) return;

  const collected = Number(batch.collectedQuantityKg) || 0;
  const received = Number(document.getElementById('pr-received-qty').value) || 0;
  const diff = collected - received;
  const diffPercent = collected > 0 ? ((diff / collected) * 100).toFixed(1) : 0;

  const diffEl = document.getElementById('pr-discrepancy-preview');
  if (diffEl) {
    if (diff > 0) {
      diffEl.innerHTML = `<span class="badge ${diffPercent > 5 ? 'badge-high' : 'badge-medium'}">Variance: ${diff} kg (${diffPercent}% shrinkage)</span>`;
    } else if (diff === 0) {
      diffEl.innerHTML = `<span class="badge badge-completed">100% Quantity Match (0 kg variance)</span>`;
    } else {
      diffEl.innerHTML = `<span class="badge badge-low">Surplus: +${Math.abs(diff)} kg recorded</span>`;
    }
  }
}

function renderProcessingRecordsTable() {
  const tbody = document.getElementById('processing-records-tbody');
  if (!tbody) return;

  const records = DataStore.getProcessingRecords();

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">No processing logs recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = records.map(r => {
    const batch = DataStore.getBatchById(r.batchId);
    const collected = batch ? batch.collectedQuantityKg : r.receivedQuantityKg;
    const diff = collected - r.receivedQuantityKg;
    const diffPercent = collected > 0 ? ((diff / collected) * 100).toFixed(1) : 0;

    let discrepancyBadge = '';
    if (diff > 30 || diffPercent > 5) {
      discrepancyBadge = `<span class="badge badge-high"><i class="fa-solid fa-triangle-exclamation"></i> -${diff} kg (${diffPercent}%)</span>`;
    } else if (diff > 0) {
      discrepancyBadge = `<span class="badge badge-medium">-${diff} kg (${diffPercent}%)</span>`;
    } else {
      discrepancyBadge = `<span class="badge badge-completed">Match (0 kg)</span>`;
    }

    return `
      <tr>
        <td><a href="batch-details.html?id=${r.batchId}" class="mono" style="font-weight: 700; color: var(--primary-700);">${r.batchId}</a></td>
        <td><div style="font-size: 0.82rem; font-weight: 600;">${r.centerName}</div></td>
        <td style="font-weight: 600;">${formatKg(r.receivedQuantityKg)}</td>
        <td style="font-weight: 600; color: var(--primary-700);">${formatKg(r.processedQuantityKg)}</td>
        <td>${discrepancyBadge}</td>
        <td><span style="font-size: 0.8rem; color: var(--slate-700);">${r.processingMethod}</span></td>
        <td><span style="font-size: 0.78rem; color: var(--slate-600);">${r.processingDate}</span></td>
        <td><span class="badge badge-completed"><span class="badge-dot"></span>${r.processingStatus}</span></td>
        <td><span style="font-size: 0.75rem; color: var(--slate-500);">${r.operatorConfirmation || 'Operator Verified'}</span></td>
      </tr>
    `;
  }).join('');
}

function setupProcessingRecordForm() {
  const form = document.getElementById('processing-record-form');
  if (!form) return;

  const dateInput = document.getElementById('pr-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const batchId = document.getElementById('pr-batch-select').value;
    const received = Number(document.getElementById('pr-received-qty').value);
    const processed = Number(document.getElementById('pr-processed-qty').value);
    const method = document.getElementById('pr-method').value;
    const date = document.getElementById('pr-date').value;
    const status = document.getElementById('pr-status').value;
    const notes = document.getElementById('pr-notes').value.trim();

    if (!batchId || !received || !processed) {
      showToast('Please select a batch and input valid quantities.', 'warning');
      return;
    }

    const batch = DataStore.getBatchById(batchId);
    const user = AuthService.getUser() || { name: 'Sunil Deshmukh' };

    const newRecord = {
      id: `PR-${Math.floor(100 + Math.random() * 900)}`,
      batchId,
      centerName: batch ? batch.assignedCenter : 'Assigned Processing Center',
      receivedQuantityKg: received,
      processedQuantityKg: processed,
      processingMethod: method,
      processingDate: date,
      processingStatus: status,
      operatorConfirmation: `${user.name} (${user.roleLabel || 'Operator'})`,
      discrepancyKg: batch ? (batch.collectedQuantityKg - received) : 0,
      discrepancyPercent: batch ? (((batch.collectedQuantityKg - received) / batch.collectedQuantityKg) * 100).toFixed(1) : 0,
      notes: notes || 'Operator signoff recorded.'
    };

    DataStore.saveProcessingRecord(newRecord);

    // Update batch object
    if (batch) {
      batch.receivedQuantityKg = received;
      batch.processedQuantityKg = processed;
      batch.processingMethod = method;
      batch.receivingConfirmed = true;
      batch.processingConfirmed = true;
      if (status === 'Completed') batch.status = 'Completed';
      DataStore.saveBatch(batch);
    }

    showToast(`Processing record saved for batch ${batchId}`, 'success');
    renderProcessingRecordsTable();
    form.reset();
    populateBatchPicker();
  });
}
