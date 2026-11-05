/**
 * SMART WASTE TRACE - DASHBOARD CONTROLLER
 * Supports separate role-specific dashboards:
 * 1. Municipal Admin: Executive oversight, city-wide telemetry, AI alerts, compliance charts.
 * 2. Processing Center Operator: Plant operations, batch intake creation, weighbridge receipts, facility throughput.
 */

let collectionChartInstance = null;
let distributionChartInstance = null;
let operatorChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = AuthService.requireAuth();
  if (!user) return;

  initAppShell('dashboard');
  loadDashboardData(user);
});

function loadDashboardData(user) {
  const batches = DataStore.getBatches();
  const alerts = DataStore.getAlerts();

  if (user.role === 'operator') {
    // -------------------------------------------------------------
    // PROCESSING CENTER OPERATOR DASHBOARD
    // -------------------------------------------------------------
    const adminView = document.getElementById('admin-dashboard-container');
    const operatorView = document.getElementById('operator-dashboard-container');
    if (adminView) adminView.style.display = 'none';
    if (operatorView) operatorView.style.display = 'block';

    renderOperatorDashboard(batches);
  } else {
    // -------------------------------------------------------------
    // MUNICIPAL ADMIN DASHBOARD
    // -------------------------------------------------------------
    const adminView = document.getElementById('admin-dashboard-container');
    const operatorView = document.getElementById('operator-dashboard-container');
    if (adminView) adminView.style.display = 'block';
    if (operatorView) operatorView.style.display = 'none';

    renderAdminDashboard(batches, alerts);
  }
}

// ============================================================================
// 1. MUNICIPAL ADMIN DASHBOARD RENDERING
// ============================================================================
function renderAdminDashboard(batches, alerts) {
  const stats = DataStore.getStatsSummary();

  // Populate 6 Municipal Statistics Cards
  setElText('stat-total-batches', stats.totalBatches);
  setElText('stat-completed-batches', stats.completedBatches);
  setElText('stat-intransit-batches', stats.inTransitBatches);
  setElText('stat-highrisk-batches', stats.highRiskBatches);
  setElText('stat-unverified-batches', stats.unverifiedBatches);
  setElText('stat-total-waste-kg', formatKg(stats.totalWasteCollectedKg));

  // Render Charts
  renderCollectionChart(batches);
  renderDistributionChart(batches);

  // Render Recent Batches Table (5 items)
  renderAdminRecentBatches(batches.slice(0, 5));

  // Render Recent AI Risk Alerts
  renderRecentAlerts(alerts.slice(0, 4));

  // Render Integrity Score Overview Widget (WB-0001)
  if (batches.length > 0) {
    renderIntegrityWidget(batches[0]);
  }
}

function renderCollectionChart(batches) {
  const ctx = document.getElementById('collectionOverviewChart');
  if (!ctx) return;

  if (collectionChartInstance) {
    collectionChartInstance.destroy();
  }

  // Simulated chronological daily intake vs processed recovery (last 7 days)
  const labels = ['29 Oct', '30 Oct', '31 Oct', '01 Nov', '02 Nov', '03 Nov', '04 Nov'];
  const collectedData = [2400, 3100, 2800, 3600, 4200, 3850, 4600];
  const processedData = [2250, 2980, 2710, 3450, 4010, 3620, 4310];

  collectionChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Municipal Intake (kg)',
          data: collectedData,
          borderColor: '#278C78',
          backgroundColor: 'rgba(39, 140, 120, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#278C78',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4
        },
        {
          label: 'Certified Processed (kg)',
          data: processedData,
          borderColor: '#43BFA3',
          backgroundColor: 'rgba(67, 191, 163, 0.05)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#43BFA3',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
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
            font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
            color: '#263238'
          }
        },
        tooltip: {
          backgroundColor: '#203A43',
          titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 700 },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          padding: 10,
          cornerRadius: 8,
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
          grid: { color: 'rgba(226, 232, 240, 0.8)' },
          ticks: {
            font: { family: 'Plus Jakarta Sans', size: 11 },
            color: '#718096',
            callback: value => value + ' kg'
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#718096' }
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
            '#278C78', // Organic (Emerald Teal)
            '#0284C7', // Plastic (Blue)
            '#7C3AED', // E-Waste (Purple)
            '#D97706', // Paper (Amber)
            '#475569', // Metal (Slate)
            '#DC2626'  // Mixed (Red)
          ],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
            color: '#263238'
          }
        }
      }
    }
  });
}

function renderAdminRecentBatches(batches) {
  const tbody = document.getElementById('recent-batches-tbody');
  if (!tbody) return;

  tbody.innerHTML = batches.map(b => {
    const riskBadgeClass = b.riskLevel === 'High' ? 'badge-high' : b.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low';
    const statusBadgeClass = b.status === 'Completed' ? 'badge-completed' : b.status === 'In-Transit' ? 'badge-in-transit' : 'badge-discrepancy';
    const wasteClass = `waste-${b.wasteType.toLowerCase().replace(/[^a-z]/g, '')}`;

    return `
      <tr>
        <td>
          <a href="batch-details.html?id=${b.id}" class="mono font-bold" style="color: var(--secondary);">
            ${b.id}
          </a>
        </td>
        <td>
          <span class="waste-badge ${wasteClass}">
            <i class="fa-solid fa-cube"></i> ${b.wasteType}
          </span>
        </td>
        <td style="font-weight: 700;">${formatKg(b.collectedQuantityKg)}</td>
        <td>
          <div style="font-size: 0.85rem; font-weight: 600;">${b.collectionLocation}</div>
          <div style="font-size: 0.72rem; color: var(--text-secondary);">${b.collectionDate}</div>
        </td>
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
    container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 0.85rem;"><i class="fa-solid fa-shield-check text-success" style="font-size: 1.5rem; display: block; margin-bottom: 6px;"></i> No active AI anomalies</div>`;
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div style="padding: 11px 0; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; gap: 10px;">
      <div style="width: 30px; height: 30px; min-width: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; background: ${a.riskLevel === 'High' ? 'var(--status-red-bg)' : 'var(--status-amber-bg)'}; color: ${a.riskLevel === 'High' ? 'var(--status-red)' : 'var(--status-amber)'};">
        <i class="fa-solid ${a.riskLevel === 'High' ? 'fa-triangle-exclamation' : 'fa-bell'}"></i>
      </div>
      <div style="flex: 1; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <a href="batch-details.html?id=${a.batchId}" class="mono font-bold" style="font-size: 0.82rem; color: var(--secondary);">${a.batchId}</a>
          <span class="badge ${a.riskLevel === 'High' ? 'badge-high' : 'badge-medium'}" style="font-size: 0.65rem; padding: 2px 6px;">${a.riskLevel}</span>
        </div>
        <div style="font-size: 0.76rem; font-weight: 600; color: var(--text-primary); margin-top: 1px;">${a.issueType}</div>
        <div style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.35; margin-top: 2px;">${a.aiExplanation.substring(0, 80)}...</div>
      </div>
    </div>
  `).join('');
}

function renderIntegrityWidget(batch) {
  const integrity = DataStore.calculateIntegrityScore(batch);
  if (!integrity) return;

  setElText('integrity-widget-batch-id', batch.id);
  setElText('integrity-widget-score', integrity.totalScore);
  
  const catEl = document.getElementById('integrity-widget-category');
  if (catEl) {
    catEl.textContent = integrity.category;
    catEl.className = `badge ${integrity.colorClass}`;
  }

  const circle = document.getElementById('integrity-widget-circle');
  if (circle) {
    const circumference = 440;
    const offset = circumference - (integrity.totalScore / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    circle.style.stroke = integrity.totalScore >= 70 ? 'var(--secondary)' : integrity.totalScore >= 50 ? 'var(--status-amber)' : 'var(--status-red)';
  }
}

// ============================================================================
// 2. PROCESSING CENTER OPERATOR DASHBOARD RENDERING
// ============================================================================
function renderOperatorDashboard(batches) {
  const opStats = DataStore.getOperatorStatsSummary('Pune Eco-Compost Facility');

  // Populate 6 Operator-Specific Metric Cards
  setElText('op-stat-total-registered', opStats.totalBatchesRegistered);
  setElText('op-stat-my-batches', opStats.myAssignedBatches);
  setElText('op-stat-in-transit', opStats.batchesInTransit);
  setElText('op-stat-received', opStats.batchesReceived);
  setElText('op-stat-pending-proc', opStats.pendingProcessing);
  setElText('op-stat-completed-proc', opStats.completedProcessing);

  // Render Facility Intake vs Processed Yield Chart
  renderOperatorThroughputChart();

  // Render Recent Facility Batches Table
  renderOperatorRecentBatches(opStats.myBatches.length > 0 ? opStats.myBatches : batches.slice(0, 6));
}

function renderOperatorThroughputChart() {
  const ctx = document.getElementById('operatorThroughputChart');
  if (!ctx) return;

  if (operatorChartInstance) {
    operatorChartInstance.destroy();
  }

  // Daily intake and compost yield for Pune Eco-Compost Facility
  const labels = ['29 Oct', '30 Oct', '31 Oct', '01 Nov', '02 Nov', '03 Nov', '04 Nov'];
  const intakeData = [850, 1100, 950, 1250, 1400, 1150, 1300];
  const yieldData  = [810, 1060, 915, 1195, 1340, 1100, 1260];

  operatorChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Organic Intake at Gate (kg)',
          data: intakeData,
          backgroundColor: '#278C78',
          borderRadius: 6
        },
        {
          label: 'Certified Compost Yield (kg)',
          data: yieldData,
          backgroundColor: '#43BFA3',
          borderRadius: 6
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
            font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
            color: '#263238'
          }
        },
        tooltip: {
          backgroundColor: '#203A43',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()} kg`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(226, 232, 240, 0.8)' },
          ticks: {
            font: { family: 'Plus Jakarta Sans', size: 11 },
            color: '#718096',
            callback: value => value + ' kg'
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#718096' }
        }
      }
    }
  });
}

function renderOperatorRecentBatches(facilityBatches) {
  const tbody = document.getElementById('op-recent-batches-tbody');
  if (!tbody) return;

  if (facilityBatches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">No consignments routed to this facility yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = facilityBatches.map(b => {
    const riskBadgeClass = b.riskLevel === 'High' ? 'badge-high' : b.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low';
    const statusBadgeClass = b.status === 'Completed' ? 'badge-completed' : b.status === 'In-Transit' ? 'badge-in-transit' : 'badge-discrepancy';
    const wasteClass = `waste-${b.wasteType.toLowerCase().replace(/[^a-z]/g, '')}`;
    const receivedDisplay = b.receivedQuantityKg ? formatKg(b.receivedQuantityKg) : '<span style="color: var(--status-amber); font-weight: 600;">Pending Gate</span>';

    return `
      <tr>
        <td>
          <a href="batch-details.html?id=${b.id}" class="mono font-bold" style="color: var(--secondary);">
            ${b.id}
          </a>
        </td>
        <td>
          <span class="waste-badge ${wasteClass}">
            <i class="fa-solid fa-cube"></i> ${b.wasteType}
          </span>
        </td>
        <td style="font-weight: 700;">${formatKg(b.collectedQuantityKg)}</td>
        <td>${receivedDisplay}</td>
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
          <div style="display: flex; gap: 6px;">
            <a href="processing-records.html" class="btn btn-primary btn-sm" title="Log Weighbridge & Processing">
              <i class="fa-solid fa-clipboard-check"></i> Process
            </a>
            <a href="batch-details.html?id=${b.id}" class="btn btn-secondary btn-sm" title="View Digital Passport">
              <i class="fa-solid fa-passport"></i>
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Helper to safely set element text
function setElText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
