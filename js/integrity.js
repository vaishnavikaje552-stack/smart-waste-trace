/**
 * SMART WASTE TRACE - WASTE JOURNEY INTEGRITY SCORE CONTROLLER
 * Evaluates the 4 core mathematical factors of municipal waste custody.
 */

let selectedBatchForScore = null;

document.addEventListener('DOMContentLoaded', () => {
  AuthService.requireAuth();
  initAppShell('integrity-score');

  initIntegrityScorePage();
});

function initIntegrityScorePage() {
  populateBatchPicker();

  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get('id');

  const batches = DataStore.getBatches();
  if (requestedId && DataStore.getBatchById(requestedId)) {
    loadIntegrityForBatch(requestedId);
  } else if (batches.length > 0) {
    loadIntegrityForBatch(batches[0].id);
  }
}

function populateBatchPicker() {
  const select = document.getElementById('integrity-batch-picker');
  if (!select) return;

  const batches = DataStore.getBatches();
  select.innerHTML = batches.map(b => `
    <option value="${b.id}">${b.id} - ${b.wasteType} (${b.riskLevel} Risk, ${b.status})</option>
  `).join('');

  select.addEventListener('change', (e) => {
    loadIntegrityForBatch(e.target.value);
  });
}

function loadIntegrityForBatch(batchId) {
  selectedBatchForScore = DataStore.getBatchById(batchId);
  if (!selectedBatchForScore) return;

  const select = document.getElementById('integrity-batch-picker');
  if (select) select.value = selectedBatchForScore.id;

  const scoreData = DataStore.calculateIntegrityScore(selectedBatchForScore);
  renderIntegrityView(selectedBatchForScore, scoreData);
}

function renderIntegrityView(batch, integrity) {
  if (!batch || !integrity) return;

  // Header meta
  document.getElementById('int-batch-id').textContent = batch.id;
  document.getElementById('int-waste-type').textContent = batch.wasteType;
  document.getElementById('int-qty').textContent = formatKg(batch.collectedQuantityKg);
  document.getElementById('int-center').textContent = batch.assignedCenter;

  // Main dial
  document.getElementById('main-integrity-num').textContent = integrity.totalScore;
  const catEl = document.getElementById('main-integrity-cat');
  catEl.textContent = integrity.category;
  catEl.className = `badge ${integrity.colorClass}`;

  // Circular SVG animation
  const circleProgress = document.getElementById('integrity-svg-circle');
  if (circleProgress) {
    const circumference = 440; // 2 * pi * 70
    const offset = circumference - (integrity.totalScore / 100) * circumference;
    circleProgress.style.strokeDashoffset = offset;
    circleProgress.style.stroke = integrity.totalScore >= 70 ? 'var(--primary-500)' : integrity.totalScore >= 50 ? 'var(--warning)' : 'var(--danger)';
  }

  // 4 Factors Breakdown
  const b = integrity.breakdown;
  updateFactorCard('f1-val', 'f1-bar', b.quantityConsistency.score, b.quantityConsistency.max);
  updateFactorCard('f2-val', 'f2-bar', b.destinationVerification.score, b.destinationVerification.max);
  updateFactorCard('f3-val', 'f3-bar', b.journeyCompletion.score, b.journeyCompletion.max);
  updateFactorCard('f4-val', 'f4-bar', b.processingVerification.score, b.processingVerification.max);

  // Detailed AI Explanations List
  const explanationContainer = document.getElementById('integrity-explanations-list');
  if (explanationContainer) {
    explanationContainer.innerHTML = integrity.explanations.map(exp => `
      <div style="background: var(--slate-50); border-left: 3px solid var(--primary-600); padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 8px; font-size: 0.85rem; color: var(--slate-700);">
        <i class="fa-solid fa-circle-check text-primary" style="margin-right: 6px;"></i>
        ${exp}
      </div>
    `).join('');
  }

  // Action links
  const passportBtn = document.getElementById('btn-view-passport-from-integrity');
  if (passportBtn) passportBtn.href = `batch-details.html?id=${batch.id}`;

  const cocBtn = document.getElementById('btn-view-coc-from-integrity');
  if (cocBtn) cocBtn.href = `chain-of-custody.html?id=${batch.id}`;
}

function updateFactorCard(valId, barId, score, max) {
  const valEl = document.getElementById(valId);
  const barEl = document.getElementById(barId);
  const pct = Math.round((score / max) * 100);

  if (valEl) valEl.textContent = `${score} / ${max} pts (${pct}%)`;
  if (barEl) {
    barEl.style.width = `${pct}%`;
    barEl.style.background = pct >= 80 ? 'var(--primary-500)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
  }
}
