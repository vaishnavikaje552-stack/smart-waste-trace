/**
 * SMART WASTE TRACE - AI RISK ALERTS & SUSPICIOUS JOURNEY DETECTION
 * Simulated AI pattern recognition for municipal waste journey anomalies.
 */

let allAlerts = [];
let currentFilterRisk = 'all';
let currentFilterStatus = 'all';

document.addEventListener('DOMContentLoaded', () => {
  AuthService.requireAuth();
  initAppShell('ai-alerts');

  initAlertsPage();
});

function initAlertsPage() {
  allAlerts = DataStore.getAlerts();
  updateAlertStats();
  setupFilterListeners();
  renderAlertsList();
}

function updateAlertStats() {
  const total = allAlerts.length;
  const high = allAlerts.filter(a => a.riskLevel === 'High').length;
  const unreviewed = allAlerts.filter(a => !a.isReviewed).length;
  const resolved = allAlerts.filter(a => a.isReviewed).length;

  document.getElementById('stat-alert-total').textContent = total;
  document.getElementById('stat-alert-high').textContent = high;
  document.getElementById('stat-alert-unreviewed').textContent = unreviewed;
  document.getElementById('stat-alert-resolved').textContent = resolved;
}

function setupFilterListeners() {
  const riskButtons = document.querySelectorAll('.filter-risk-btn');
  riskButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      riskButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterRisk = btn.dataset.risk;
      renderAlertsList();
    });
  });

  const statusSelect = document.getElementById('filter-review-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentFilterStatus = e.target.value;
      renderAlertsList();
    });
  }
}

function renderAlertsList() {
  const container = document.getElementById('alerts-cards-container');
  if (!container) return;

  const filtered = allAlerts.filter(a => {
    const matchesRisk = currentFilterRisk === 'all' || a.riskLevel.toLowerCase() === currentFilterRisk.toLowerCase();
    const matchesStatus = currentFilterStatus === 'all' || 
      (currentFilterStatus === 'unreviewed' && !a.isReviewed) ||
      (currentFilterStatus === 'reviewed' && a.isReviewed);
    return matchesRisk && matchesStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state py-5">
        <div class="empty-state-icon"><i class="fa-solid fa-shield-check"></i></div>
        <div class="empty-state-title">No alerts match your filter</div>
        <div class="empty-state-text">All monitored waste batches within this criteria are in compliance.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(a => {
    const isHigh = a.riskLevel === 'High';
    const isMed = a.riskLevel === 'Medium';
    const borderClass = isHigh ? 'border-danger' : isMed ? 'border-warning' : 'border-info';
    const riskBadge = isHigh ? 'badge-high' : isMed ? 'badge-medium' : 'badge-low';

    return `
      <div class="card" style="margin-bottom: 18px; border-left: 5px solid ${isHigh ? 'var(--danger)' : isMed ? 'var(--warning)' : 'var(--info)'}; opacity: ${a.isReviewed ? '0.75' : '1'};">
        <div class="card-header" style="background: ${a.isReviewed ? '#f8fafc' : '#ffffff'};">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span class="mono" style="font-weight: 800; font-size: 1.1rem; color: var(--slate-900);">${a.batchId}</span>
            <span style="font-size: 0.95rem; font-weight: 700; color: var(--slate-800);">${a.issueType}</span>
            <span class="badge ${riskBadge}">${a.riskLevel} Risk</span>
            <span class="simulated-pill"><i class="fa-solid fa-robot"></i> Simulated AI Model</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            ${a.isReviewed 
              ? `<span class="badge badge-completed"><i class="fa-solid fa-check"></i> Reviewed</span>` 
              : `<span class="badge badge-high"><i class="fa-solid fa-circle-exclamation"></i> Action Required</span>`
            }
          </div>
        </div>

        <div class="card-body">
          <div style="margin-bottom: 14px;">
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500); margin-bottom: 4px;">AI Pattern Explanation</div>
            <p style="font-size: 0.88rem; color: var(--slate-700); line-height: 1.5; background: var(--slate-50); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <i class="fa-solid fa-brain text-primary" style="margin-right: 6px;"></i>
              ${a.aiExplanation}
            </p>
          </div>

          <div style="margin-bottom: 16px;">
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--slate-500); margin-bottom: 4px;">Recommended Operational Action</div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--slate-900); display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-arrow-right text-danger"></i>
              ${a.recommendedAction}
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 12px; font-size: 0.78rem; color: var(--slate-500);">
            <div><i class="fa-regular fa-clock"></i> Timestamp: ${a.date}</div>
            
            <div style="display: flex; gap: 8px;">
              <a href="batch-details.html?id=${a.batchId}" class="btn btn-secondary btn-sm">
                <i class="fa-solid fa-passport"></i> View Batch Passport
              </a>
              <button class="btn ${a.isReviewed ? 'btn-ghost' : 'btn-success'} btn-sm" onclick="toggleReviewStatus('${a.id}', ${!a.isReviewed})">
                <i class="fa-solid ${a.isReviewed ? 'fa-rotate-left' : 'fa-check'}"></i> 
                ${a.isReviewed ? 'Reopen Alert' : 'Mark as Reviewed'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleReviewStatus(alertId, newStatus) {
  DataStore.updateAlertStatus(alertId, newStatus);
  allAlerts = DataStore.getAlerts();
  updateAlertStats();
  renderAlertsList();
  showToast(`Alert marked as ${newStatus ? 'Reviewed' : 'Active'}`, 'success');
}
