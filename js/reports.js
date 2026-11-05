/**
 * SMART WASTE TRACE - REPORTS & ANALYTICS CONTROLLER
 * Aggregated municipal reports, date filtering, discrepancy analysis, CSV export, and print.
 */

let reportChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  AuthService.requireAuth();
  initAppShell('reports');

  initReportsPage();
});

function initReportsPage() {
  setupFilterControls();
  generateReport();
}

function setupFilterControls() {
  // Set default dates
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const fromDateInput = document.getElementById('report-from-date');
  const toDateInput = document.getElementById('report-to-date');

  if (fromDateInput && !fromDateInput.value) fromDateInput.value = thirtyDaysAgo;
  if (toDateInput && !toDateInput.value) toDateInput.value = today;

  document.getElementById('btn-apply-report-filters').addEventListener('click', generateReport);
  document.getElementById('report-type-select').addEventListener('change', generateReport);
}

function generateReport() {
  const reportType = document.getElementById('report-type-select').value;
  const wasteType = document.getElementById('report-waste-type').value;
  const batches = DataStore.getBatches();

  // Filter batches
  let filtered = batches.filter(b => {
    return !wasteType || b.wasteType === wasteType;
  });

  if (reportType === 'discrepancy') {
    filtered = filtered.filter(b => b.status === 'Discrepancy Flagged' || (b.receivedQuantityKg && (b.collectedQuantityKg - b.receivedQuantityKg) > 20));
  } else if (reportType === 'suspicious') {
    filtered = filtered.filter(b => b.riskLevel === 'High' || b.riskLevel === 'Medium');
  } else if (reportType === 'completed') {
    filtered = filtered.filter(b => b.status === 'Completed');
  }

  // Update Summary Metric Cards
  const totalKg = filtered.reduce((sum, b) => sum + (Number(b.collectedQuantityKg) || 0), 0);
  const totalProc = filtered.reduce((sum, b) => sum + (Number(b.processedQuantityKg) || 0), 0);
  const avgIntegrity = Math.round(filtered.reduce((sum, b) => sum + DataStore.calculateIntegrityScore(b).totalScore, 0) / (filtered.length || 1));

  document.getElementById('rep-count').textContent = filtered.length;
  document.getElementById('rep-total-collected').textContent = formatKg(totalKg);
  document.getElementById('rep-total-processed').textContent = formatKg(totalProc);
  document.getElementById('rep-avg-integrity').textContent = `${avgIntegrity} / 100`;

  renderReportChart(filtered);
  renderReportTable(filtered);
}

function renderReportChart(batches) {
  const ctx = document.getElementById('reportVisualChart');
  if (!ctx) return;

  if (reportChartInstance) {
    reportChartInstance.destroy();
  }

  // Group by Assigned Processing Center
  const centerData = {};
  batches.forEach(b => {
    const center = b.assignedCenter || 'Unassigned';
    if (!centerData[center]) {
      centerData[center] = { collected: 0, processed: 0 };
    }
    centerData[center].collected += Number(b.collectedQuantityKg) || 0;
    centerData[center].processed += Number(b.processedQuantityKg) || 0;
  });

  const labels = Object.keys(centerData);
  const collectedValues = labels.map(l => centerData[l].collected);
  const processedValues = labels.map(l => centerData[l].processed);

  reportChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(l => l.replace(' Facility', '').replace(' Center', '')),
      datasets: [
        {
          label: 'Collected Intake (kg)',
          data: collectedValues,
          backgroundColor: '#278C78',
          borderRadius: 6
        },
        {
          label: 'Processed Yield (kg)',
          data: processedValues,
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
          labels: { font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 } }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { callback: v => v + ' kg' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderReportTable(batches) {
  const tbody = document.getElementById('report-table-tbody');
  if (!tbody) return;

  if (batches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">No report records found for this criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = batches.map(b => {
    const integrity = DataStore.calculateIntegrityScore(b);
    const diff = (b.receivedQuantityKg !== null && b.receivedQuantityKg !== undefined) ? (b.collectedQuantityKg - b.receivedQuantityKg) : 0;
    const riskBadge = b.riskLevel === 'High' ? 'badge-high' : b.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low';

    return `
      <tr>
        <td><a href="batch-details.html?id=${b.id}" class="mono" style="font-weight: 700; color: var(--primary-700);">${b.id}</a></td>
        <td><span style="font-weight: 600;">${b.wasteType}</span></td>
        <td style="font-weight: 700;">${formatKg(b.collectedQuantityKg)}</td>
        <td>${formatKg(b.receivedQuantityKg)}</td>
        <td>${formatKg(b.processedQuantityKg)}</td>
        <td>
          ${diff > 20 ? `<span class="badge badge-high">-${diff} kg</span>` : diff > 0 ? `<span class="badge badge-medium">-${diff} kg</span>` : `<span class="badge badge-completed">0 kg</span>`}
        </td>
        <td><span class="badge ${riskBadge}">${b.riskLevel}</span></td>
        <td><span style="font-weight: 700; color: var(--primary-700);">${integrity.totalScore}</span> / 100</td>
        <td><span style="font-size: 0.8rem; color: var(--slate-600);">${b.collectionDate}</span></td>
      </tr>
    `;
  }).join('');
}

function downloadReportCSV() {
  const reportType = document.getElementById('report-type-select').value;
  const wasteType = document.getElementById('report-waste-type').value;
  const batches = DataStore.getBatches();

  let filtered = batches.filter(b => !wasteType || b.wasteType === wasteType);
  if (reportType === 'discrepancy') {
    filtered = filtered.filter(b => b.status === 'Discrepancy Flagged' || (b.receivedQuantityKg && (b.collectedQuantityKg - b.receivedQuantityKg) > 20));
  } else if (reportType === 'suspicious') {
    filtered = filtered.filter(b => b.riskLevel === 'High' || b.riskLevel === 'Medium');
  }

  const headers = ['Batch ID', 'Waste Type', 'Collected Qty (kg)', 'Received Qty (kg)', 'Processed Qty (kg)', 'Variance (kg)', 'Risk Level', 'Integrity Score', 'Collection Date', 'Vehicle', 'Assigned Center'];
  const rows = filtered.map(b => {
    const integrity = DataStore.calculateIntegrityScore(b);
    const variance = (b.receivedQuantityKg !== null && b.receivedQuantityKg !== undefined) ? (b.collectedQuantityKg - b.receivedQuantityKg) : 0;
    return [
      b.id,
      b.wasteType,
      b.collectedQuantityKg,
      b.receivedQuantityKg || '',
      b.processedQuantityKg || '',
      variance,
      b.riskLevel,
      integrity.totalScore,
      b.collectionDate,
      b.vehicleNumber,
      `"${b.assignedCenter}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `SmartWasteTrace_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Municipal report exported to CSV', 'success');
}

function printReport() {
  window.print();
}
