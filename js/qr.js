/**
 * SMART WASTE TRACE - QR CODE TRACKING & SCANNER CONTROLLER
 * Real camera QR scanning with fallback simulation and passport preview.
 */

let html5QrScanner = null;
let currentSelectedBatch = null;

document.addEventListener('DOMContentLoaded', () => {
  AuthService.requireAuth();
  initAppShell('qr-tracking');

  populateBatchDropdown();
  setupEventListeners();

  // Load initial batch
  const batches = DataStore.getBatches();
  if (batches.length > 0) {
    selectBatchForQR(batches[0].id);
  }
});

function populateBatchDropdown() {
  const select = document.getElementById('qr-batch-select');
  if (!select) return;

  const batches = DataStore.getBatches();
  select.innerHTML = batches.map(b => `
    <option value="${b.id}">${b.id} - ${b.wasteType} (${formatKg(b.collectedQuantityKg)}) - ${b.status}</option>
  `).join('');

  select.addEventListener('change', (e) => {
    selectBatchForQR(e.target.value);
  });
}

function setupEventListeners() {
  const manualInput = document.getElementById('qr-manual-batch-input');
  const searchBtn = document.getElementById('qr-manual-search-btn');

  if (searchBtn && manualInput) {
    searchBtn.addEventListener('click', () => {
      const val = manualInput.value.trim().toUpperCase();
      if (val) selectBatchForQR(val);
    });

    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = manualInput.value.trim().toUpperCase();
        if (val) selectBatchForQR(val);
      }
    });
  }

  // Camera Scanner toggles
  const startCameraBtn = document.getElementById('btn-start-camera');
  const stopCameraBtn = document.getElementById('btn-stop-camera');
  const simulateScanBtn = document.getElementById('btn-simulate-scan');

  if (startCameraBtn) startCameraBtn.addEventListener('click', startCameraScanner);
  if (stopCameraBtn) stopCameraBtn.addEventListener('click', stopCameraScanner);
  if (simulateScanBtn) simulateScanBtn.addEventListener('click', simulateRandomScan);
}

function selectBatchForQR(batchId) {
  const batch = DataStore.getBatchById(batchId);
  if (!batch) {
    showToast(`No batch found with ID: ${batchId}`, 'warning');
    return;
  }

  currentSelectedBatch = batch;

  // Sync inputs
  const select = document.getElementById('qr-batch-select');
  const manualInput = document.getElementById('qr-manual-batch-input');
  if (select) select.value = batch.id;
  if (manualInput) manualInput.value = batch.id;

  // Render QR Code
  const qrContainer = document.getElementById('qr-display-canvas');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    const payload = JSON.stringify({
      passport: 'SmartWasteTrace-v1',
      batchId: batch.id,
      wasteType: batch.wasteType,
      collectedQuantityKg: batch.collectedQuantityKg,
      assignedCenter: batch.assignedCenter,
      status: batch.status,
      riskLevel: batch.riskLevel
    });

    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: payload,
        width: 180,
        height: 180,
        colorDark: '#062b1b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  document.getElementById('qr-active-batch-label').textContent = `${batch.id} • ${batch.wasteType}`;

  // Render Passport Preview Card
  renderScannedPassportCard(batch);
}

function renderScannedPassportCard(batch) {
  const container = document.getElementById('scanned-passport-preview');
  if (!container) return;

  const integrity = DataStore.calculateIntegrityScore(batch);
  const riskClass = batch.riskLevel === 'High' ? 'badge-high' : batch.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low';
  const statusClass = batch.status === 'Completed' ? 'badge-completed' : batch.status === 'In-Transit' ? 'badge-in-transit' : 'badge-discrepancy';

  container.innerHTML = `
    <div class="card" style="border: 2px solid var(--primary-700);">
      <div class="card-header" style="background: var(--primary-50);">
        <div>
          <span class="mono" style="font-weight: 800; font-size: 1.15rem; color: var(--primary-900);">${batch.id}</span>
          <span style="font-size: 0.85rem; color: var(--slate-600); margin-left: 8px;">• ${batch.wasteType} Waste</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge ${statusClass}">${batch.status}</span>
          <span class="badge ${riskClass}">${batch.riskLevel} Risk</span>
        </div>
      </div>
      <div class="card-body">
        <div class="form-row" style="margin-bottom: 16px;">
          <div>
            <div style="font-size: 0.72rem; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Collected Quantity</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--slate-900);">${formatKg(batch.collectedQuantityKg)}</div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Received Quantity</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--slate-900);">${formatKg(batch.receivedQuantityKg)}</div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: var(--slate-500); text-transform: uppercase; font-weight: 700;">Integrity Score</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--primary-700);">${integrity.totalScore} / 100</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 0.82rem; margin-bottom: 20px;">
          <div><strong>Location:</strong> ${batch.collectionLocation}</div>
          <div><strong>Collection Date:</strong> ${batch.collectionDate}</div>
          <div><strong>Vehicle:</strong> <span class="mono">${batch.vehicleNumber}</span></div>
          <div><strong>Center:</strong> ${batch.assignedCenter}</div>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <a href="batch-details.html?id=${batch.id}" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-passport"></i> View Full Digital Passport
          </a>
          <a href="chain-of-custody.html?id=${batch.id}" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-timeline"></i> View Chain of Custody
          </a>
        </div>
      </div>
    </div>
  `;
}

// Camera Scanner Implementation
function startCameraScanner() {
  const qrReaderDiv = document.getElementById('qr-reader');
  if (!qrReaderDiv) return;

  if (typeof Html5QrcodeScanner === 'undefined') {
    showToast('Camera scanner library loading or blocked. Use simulated scan or manual input.', 'info');
    return;
  }

  document.getElementById('btn-start-camera').style.display = 'none';
  document.getElementById('btn-stop-camera').style.display = 'inline-flex';

  try {
    html5QrScanner = new Html5QrcodeScanner("qr-reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 250 } 
    });

    html5QrScanner.render(onScanSuccess, onScanError);
    showToast('Camera scanner activated. Point at a batch QR code.', 'info');
  } catch (err) {
    showToast('Camera permission denied or camera not found. Try simulated scan.', 'warning');
    stopCameraScanner();
  }
}

function stopCameraScanner() {
  if (html5QrScanner) {
    try {
      html5QrScanner.clear();
    } catch (e) {}
    html5QrScanner = null;
  }
  document.getElementById('btn-start-camera').style.display = 'inline-flex';
  document.getElementById('btn-stop-camera').style.display = 'none';
}

function onScanSuccess(decodedText, decodedResult) {
  stopCameraScanner();
  showToast('QR Code Scanned Successfully!', 'success');

  try {
    const data = JSON.parse(decodedText);
    if (data.batchId) {
      selectBatchForQR(data.batchId);
      return;
    }
  } catch (e) {
    // Check if raw text matches a batch ID
    const match = decodedText.match(/WB-\d+/);
    if (match) {
      selectBatchForQR(match[0]);
      return;
    }
  }

  showToast(`Scanned payload: ${decodedText.substring(0, 30)}...`, 'info');
}

function onScanError(errorMessage) {
  // Silent frame error
}

function simulateRandomScan() {
  const batches = DataStore.getBatches();
  const randomBatch = batches[Math.floor(Math.random() * batches.length)];
  showToast(`Simulated Scan Event: Detected ${randomBatch.id}`, 'success');
  selectBatchForQR(randomBatch.id);
}
