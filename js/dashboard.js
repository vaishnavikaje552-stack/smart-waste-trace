/**
 * SMART WASTE TRACE - DASHBOARD CONTROLLER
 * Renders statistical cards, Chart.js analytics, recent tables, and quick actions.
 */

let collectionChartInstance = null;
let distributionChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  AuthService.requireAuth();
  initAppShell('dashboard');
  loadDashboardData();
});

function loadDashboardData() {
  const stats = DataStore.getStatsSummary();
  const batches = DataStore.getBatches();
  const alerts = DataStore.getAlerts();

  // Populate Statistics Cards
  document.getElementById('stat-total-batches').textContent = stats.totalBatches;
  document.getElementById('stat-completed-batches').textContent = stats.completedBatches;
  document.getElementById('stat-intransit-batches').textContent = stats.inTransitBatches;
  document.getElementById('stat-highrisk-batches').textContent = stats.highRiskBatches;
  document.getElementById('stat-unverified-batches').textContent = stats.unverifiedBatches;
  document.getElementById('stat-total-waste-kg').textContent = formatKg(stats.totalWasteCollectedKg);

  // Render Charts
  renderCollectionChart(batches);
  renderDistributionChart(batches);

  // Render Recent Batches Table
  renderRecentBatches(batches.slice(0, 5));

  // Render Recent AI Risk Alerts
  renderRecentAlerts(alerts.slice(0, 4));

  // Render Integrity Score Overview Widget
  renderIntegrityWidget(batches[0]); // default to first batch (WB-0001)
}

function renderCollectionChart(batches) {
  const ctx = document.getElementById('collectionOverviewChart');
  if (!ctx) return;

  if (collectionChartInstance) {
    collectionChartInstance.destroy();
  }

  // Simulated chronological daily aggregation (last 7 days)
  const labels = ['29 Oct', '30 Oct', '31 Oct', '01 Nov', '02 Nov', '03 Nov', '04 Nov'];
  const collectedData = [2400, 3100, 2800, 3600, 4200, 3850, 4600];
  const processedData = [2250, 2980, 2710, 3450, 4010, 3620, 4310];

  collectionChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Collected Waste (kg)',
          data: collectedData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#10b981',
          pointRadius: 4
        },
        {
          label: 'Processed & Verified (kg)',
          data: processedData,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.05)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#0284c7',
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()} kg`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: {
            font: { family: 'Plus Jakarta Sans', size: 11 },
            callback: value => value + ' kg'
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      }
    }
  });
}

function renderDistributionChart(batches) {
  const ctx = document.getElementById('wasteDistributionChart');
  if (!ctx) return;

  if (distributionChartInstance) {
    distributionChartInstance.destroy();
  }

  // Aggregate by waste type
  const typeCounts = {
    Organic: 0,
    Plastic: 0,
    E_Waste: 0,
    Paper: 0,
    Metal: 0,
    Mixed_Waste: 0
  };

  batches.forEach(b => {
    const qty = Number(b.collectedQuantityKg) || 0;
    if (b.wasteType === 'Organic') typeCounts.Organic += qty;
    else if (b.wasteType === 'Plastic') typeCounts.Plastic += qty;
    else if (b.wasteType === 'E-Waste') typeCounts.E_Waste += qty;
    else if (b.wasteType === 'Paper') typeCounts.Paper += qty;
    else if (b.wasteType === 'Metal') typeCounts.Metal += qty;
    else typeCounts.Mixed_Waste += qty;
  });

  distributionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Organic', 'Plastic', 'E-Waste', 'Paper', 'Metal', 'Mixed Waste'],
      datasets: [
        {
          data: [
            typeCounts.Organic,
            typeCounts.Plastic,
            typeCounts.E_Waste,
            typeCounts.Paper,
            typeCounts.Metal,
            typeCounts.Mixed_Waste
          ],
          backgroundColor: [
            '#10b981', // Organic
            '#3b82f6', // Plastic
            '#8b5cf6', // E-Waste
            '#eab308', // Paper
            '#64748b', // Metal
            '#f43f5e'  // Mixed
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            font: { family: 'Plus Jakarta Sans', size: 11, weight: 500 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const val = context.parsed;
              const pct = ((val / total) * 100).toFixed(1);
              return ` ${context.label}: ${val.toLocaleString()} kg (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function renderRecentBatches(batches) {
  const tbody = document.getElementById('recent-batches-tbody');
  if (!tbody) return;

  if (batches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">No recent batches found</td></tr>`;
    return;
  }

  tbody.innerHTML = batches.map(b => {
    const riskBadgeClass = b.riskLevel === 'High' ? 'badge-high' : b.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low';
    const statusBadgeClass = b.status === 'Completed' ? 'badge-completed' : b.status === 'In-Transit' ? 'badge-in-transit' : 'badge-discrepancy';
    const wasteClass = `waste-${b.wasteType.toLowerCase().replace(/[^a-z]/g, '')}`;

    return `
      <tr>
        <td>
          <a href="batch-details.html?id=${b.id}" class="mono" style="font-weight: 700; color: var(--primary-700);">
            ${b.id}
          </a>
        </td>
        <td>
          <span class="waste-badge ${wasteClass}">
            <i class="fa-solid fa-cube"></i> ${b.wasteType}
          </span>
        </td>
        <td style="font-weight: 600;">${formatKg(b.collectedQuantityKg)}</td>
        <td><i class="fa-solid fa-location-dot text-slate-400"></i> ${b.collectionLocation}</td>
        <td><span class="mono">${b.vehicleNumber}</span></td>
        <td>
          <span class="badge ${statusBadgeClass}">
            <span class="badge-dot"></span>${b.status}
          </span>
        </td>
        <td>
          <span class="badge ${riskBadgeClass}">
            <span class="badge-dot"></span>${b.riskLevel}
          </span>
        </td>
        <td>
          <a href="batch-details.html?id=${b.id}" class="btn btn-secondary btn-sm" title="View Digital Passport">
            <i class="fa-solid fa-passport"></i> View
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function renderRecentAlerts(alerts) {
  const container = document.getElementById('recent-alerts-list');
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `<div class="empty-state py-4"><p class="text-slate-400">No AI risk alerts at this time.</p></div>`;
    return;
  }

  container.innerHTML = alerts.map(a => {
    const iconClass = a.riskLevel === 'High' ? 'fa-triangle-exclamation text-danger' : 'fa-circle-exclamation text-warning';
    const borderClass = a.riskLevel === 'High' ? 'border-danger' : 'border-warning';

    return `
      <div style="background: var(--slate-50); border-left: 4px solid ${a.riskLevel === 'High' ? 'var(--danger)' : 'var(--warning)'}; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid ${iconClass}"></i>
            <span style="font-weight: 700; font-size: 0.85rem; color: var(--slate-900);">${a.batchId} - ${a.issueType}</span>
          </div>
          <span class="badge ${a.riskLevel === 'High' ? 'badge-high' : 'badge-medium'}">${a.riskLevel} Risk</span>
        </div>
        <p style="font-size: 0.78rem; color: var(--slate-600); margin-bottom: 6px;">${a.aiExplanation}</p>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.72rem; color: var(--slate-400);"><i class="fa-regular fa-clock"></i> ${a.date}</span>
          <a href="ai-alerts.html" style="font-size: 0.75rem; font-weight: 600; color: var(--primary-600);">Investigate <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>
    `;
  }).join('');
}

function renderIntegrityWidget(batch) {
  if (!batch) return;
  const integrity = DataStore.calculateIntegrityScore(batch);
  if (!integrity) return;

  const scoreEl = document.getElementById('integrity-widget-score');
  const catEl = document.getElementById('integrity-widget-category');
  const batchIdEl = document.getElementById('integrity-widget-batch-id');
  const circleEl = document.getElementById('integrity-widget-circle');

  if (scoreEl) scoreEl.textContent = integrity.totalScore;
  if (catEl) {
    catEl.textContent = integrity.category;
    catEl.className = `badge ${integrity.colorClass}`;
  }
  if (batchIdEl) batchIdEl.textContent = batch.id;

  if (circleEl) {
    // Circle circumference = 2 * PI * r = 2 * 3.14159 * 70 = ~440
    const circumference = 440;
    const offset = circumference - (integrity.totalScore / 100) * circumference;
    circleEl.style.strokeDashoffset = offset;
    circleEl.style.stroke = integrity.totalScore >= 70 ? 'var(--primary-500)' : integrity.totalScore >= 50 ? 'var(--warning)' : 'var(--danger)';
  }
}
