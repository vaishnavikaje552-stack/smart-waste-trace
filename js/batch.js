/**
 * SMART WASTE TRACE - WASTE DIGITAL PASSPORT CONTROLLER
 * Renders the official Digital Passport, QR Code, and Integrity breakdown.
 */

let currentBatch = null;

document.addEventListener('DOMContentLoaded', () => {
  AuthService.requireAuth();
  initAppShell('batch-details');

  const urlParams = new URLSearchParams(window.location.search);
  const batchId = urlParams.get('id') || 'WB-0001';
  loadBatchDetails(batchId);
});

function loadBatchDetails(batchId) {
  currentBatch = DataStore.getBatchById(batchId);

  if (!currentBatch) {
    document.getElementById('passport-main-card').innerHTML = `
      <div class="empty-state py-5">
        <div class="empty-state-icon"><i class="fa-solid fa-file-circle-xmark"></i></div>
        <div class="empty-state-title">Batch Not Found</div>
        <div class="empty-state-text">No waste digital passport exists for ID: ${batchId}.</div>
        <a href="batches.html" class="btn btn-primary"><i class="fa-solid fa-arrow-left"></i> Back to Batch Registry</a>
      </div>
    `;
    return;
  }

  renderPassport(currentBatch);
}

function renderPassport(batch) {
  // Update header titles & breadcrumb
  document.getElementById('passport-batch-id-display').textContent = batch.id;
  document.getElementById('passport-batch-type-display').textContent = batch.wasteType;
  
  // Set values
  document.getElementById('p-id').textContent = batch.id;
  document.getElementById('p-type').textContent = batch.wasteType;
  document.getElementById('p-collected-qty').textContent = formatKg(batch.collectedQuantityKg);
  document.getElementById('p-received-qty').textContent = formatKg(batch.receivedQuantityKg);
  document.getElementById('p-processed-qty').textContent = formatKg(batch.processedQuantityKg);
  document.getElementById('p-location').textContent = batch.collectionLocation;
  document.getElementById('p-date').textContent = `${batch.collectionDate} (${batch.collectionTime || '08:00 AM'})`;
  document.getElementById('p-vehicle').textContent = batch.vehicleNumber;
  document.getElementById('p-driver').textContent = batch.driverName || 'Authorized Fleet Driver';
  document.getElementById('p-center').textContent = batch.assignedCenter;
  document.getElementById('p-method').textContent = batch.processingMethod || 'Standard Certified Processing';

  // Badges
  const riskEl = document.getElementById('p-risk-badge');
  const riskClass = batch.riskLevel === 'High' ? 'badge-high' : batch.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low';
  riskEl.className = `badge ${riskClass}`;
  riskEl.innerHTML = `<span class="badge-dot"></span>${batch.riskLevel} Risk`;

  const statusEl = document.getElementById('p-status-badge');
  const statusClass = batch.status === 'Completed' ? 'badge-completed' : batch.status === 'In-Transit' ? 'badge-in-transit' : 'badge-discrepancy';
  statusEl.className = `badge ${statusClass}`;
  statusEl.innerHTML = `<span class="badge-dot"></span>${batch.status}`;

  // Chain of Custody Link
  const cocLink = document.getElementById('p-coc-link');
  if (cocLink) cocLink.href = `chain-of-custody.html?id=${batch.id}`;

  // QR Code Rendering
  renderPassportQR(batch);

  // Integrity Score Calculation & Rendering
  renderIntegrityBreakdown(batch);
}

function renderPassportQR(batch) {
  const qrContainer = document.getElementById('passport-qrcode');
  if (!qrContainer) return;

  qrContainer.innerHTML = '';
  
  // Encoded payload: JSON representation of batch passport
  const payload = JSON.stringify({
    passport: 'SmartWasteTrace-v1',
    batchId: batch.id,
    type: batch.wasteType,
    qty: batch.collectedQuantityKg,
    loc: batch.collectionLocation,
    vehicle: batch.vehicleNumber,
    center: batch.assignedCenter,
    status: batch.status,
    risk: batch.riskLevel,
    verifiedUrl: window.location.href
  });

  if (typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
      text: payload,
      width: 140,
      height: 140,
      colorDark: '#062b1b',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrContainer.innerHTML = `<div style="width: 140px; height: 140px; background: #e2e8f0; display:flex; align-items:center; justify-content:center; font-size: 0.75rem;">[QR Engine Ready]</div>`;
  }
}

function renderIntegrityBreakdown(batch) {
  const integrity = DataStore.calculateIntegrityScore(batch);
  if (!integrity) return;

  document.getElementById('p-integrity-score').textContent = integrity.totalScore;
  const catBadge = document.getElementById('p-integrity-cat');
  catBadge.textContent = integrity.category;
  catBadge.className = `badge ${integrity.colorClass}`;

  // Fill factor progress bars
  const b = integrity.breakdown;
  setFactorProgress('prog-qty', b.quantityConsistency.score, b.quantityConsistency.max, 'qty-val');
  setFactorProgress('prog-dest', b.destinationVerification.score, b.destinationVerification.max, 'dest-val');
  setFactorProgress('prog-journey', b.journeyCompletion.score, b.journeyCompletion.max, 'journey-val');
  setFactorProgress('prog-proc', b.processingVerification.score, b.processingVerification.max, 'proc-val');

  // Explanation list
  const listEl = document.getElementById('p-integrity-explanations');
  if (listEl) {
    listEl.innerHTML = integrity.explanations.map(e => `
      <li style="font-size: 0.8rem; color: var(--slate-600); margin-bottom: 4px; display: flex; align-items: flex-start; gap: 6px;">
        <i class="fa-solid fa-check text-primary" style="font-size: 0.75rem; margin-top: 3px;"></i>
        <span>${e}</span>
      </li>
    `).join('');
  }
}

function setFactorProgress(barId, score, max, valId) {
  const bar = document.getElementById(barId);
  const val = document.getElementById(valId);
  const pct = Math.round((score / max) * 100);
  if (bar) bar.style.width = `${pct}%`;
  if (val) val.textContent = `${score} / ${max} pts`;
}

function printPassport() {
  window.print();
}
