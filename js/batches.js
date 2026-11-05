/**
 * SMART WASTE TRACE - BATCH MANAGEMENT CONTROLLER
 * Full search, multi-filter, pagination, and batch management actions.
 */

let allBatches = [];
let filteredBatches = [];

document.addEventListener('DOMContentLoaded', () => {
  const user = AuthService.requireAuth();
  initAppShell('batches');
  initBatchManagement(user);
});

function initBatchManagement(user) {
  allBatches = DataStore.getBatches();
  filteredBatches = [...allBatches];

  // Role Customization
  const isOperator = user && user.role === 'operator';
  const opCreateBtn = document.getElementById('btn-operator-create-batch');
  const titleEl = document.getElementById('batches-page-title');
  const subEl = document.getElementById('batches-page-subtitle');
  const facilityFilter = document.getElementById('filter-facility');

  if (isOperator) {
    if (opCreateBtn) opCreateBtn.style.display = 'inline-flex';
    if (titleEl) titleEl.textContent = 'My Waste Batches';
    if (subEl) subEl.textContent = 'Monitor incoming consignments allocated to Pune Eco-Compost Facility, record intake passports, and verify custody.';
  } else {
    if (opCreateBtn) opCreateBtn.style.display = 'none';
    if (titleEl) titleEl.textContent = 'Waste Batch Oversight Registry';
    if (subEl) subEl.textContent = 'Supervise municipal waste consignments, inspect digital passports, and track custody progression.';
  }

  // Populate filter dropdowns if needed
  setupFilterListeners();
  renderBatchesTable();
}

function setupFilterListeners() {
  const searchInput = document.getElementById('batch-search-input');
  const facilityFilter = document.getElementById('filter-facility');
  const typeFilter = document.getElementById('filter-waste-type');
  const statusFilter = document.getElementById('filter-status');
  const riskFilter = document.getElementById('filter-risk');

  const applyFilters = () => {
    const query = (searchInput.value || '').trim().toLowerCase();
    const facility = facilityFilter ? facilityFilter.value : '';
    const type = typeFilter.value;
    const status = statusFilter.value;
    const risk = riskFilter.value;

    filteredBatches = allBatches.filter(b => {
      const matchesSearch = !query || 
        b.id.toLowerCase().includes(query) ||
        b.collectionLocation.toLowerCase().includes(query) ||
        b.vehicleNumber.toLowerCase().includes(query) ||
        b.assignedCenter.toLowerCase().includes(query);

      const matchesFacility = !facility || b.assignedCenter === facility;
      const matchesType = !type || b.wasteType === type;
      const matchesStatus = !status || b.status === status;
      const matchesRisk = !risk || b.riskLevel === risk;

      return matchesSearch && matchesFacility && matchesType && matchesStatus && matchesRisk;
    });

    renderBatchesTable();
  };

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (facilityFilter) facilityFilter.addEventListener('change', applyFilters);
  if (typeFilter) typeFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (riskFilter) riskFilter.addEventListener('change', applyFilters);
}

function resetFilters() {
  document.getElementById('batch-search-input').value = '';
  const facilityFilter = document.getElementById('filter-facility');
  if (facilityFilter) facilityFilter.value = '';
  document.getElementById('filter-waste-type').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-risk').value = '';
  filteredBatches = [...allBatches];
  renderBatchesTable();
  showToast('Filters reset', 'info');
}

function renderBatchesTable() {
  const tbody = document.getElementById('batches-tbody');
  const countBadge = document.getElementById('batch-count-display');
  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `Showing ${filteredBatches.length} of ${allBatches.length} batches`;
  }

  if (filteredBatches.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-box-open"></i></div>
            <div class="empty-state-title">No matching waste batches</div>
            <div class="empty-state-text">Try adjusting your search criteria or create a new batch.</div>
            <button class="btn btn-secondary btn-sm" onclick="resetFilters()">Reset All Filters</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredBatches.map(b => {
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
        <td style="font-weight: 700;">${formatKg(b.collectedQuantityKg)}</td>
        <td>
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--slate-800);">${b.collectionLocation}</div>
          <div style="font-size: 0.72rem; color: var(--slate-400);">${b.collectionDate}</div>
        </td>
        <td>
          <span class="mono" style="background: var(--slate-100); padding: 3px 6px; border-radius: 4px; font-size: 0.8rem;">
            ${b.vehicleNumber}
          </span>
        </td>
        <td>
          <div style="font-size: 0.82rem; font-weight: 500; color: var(--slate-700); max-width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${b.assignedCenter}">
            ${b.assignedCenter}
          </div>
        </td>
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
          <div style="display: flex; align-items: center; gap: 6px;">
            <a href="batch-details.html?id=${b.id}" class="btn btn-secondary btn-sm" title="View Digital Passport">
              <i class="fa-solid fa-passport"></i> View
            </a>
            <a href="chain-of-custody.html?id=${b.id}" class="btn btn-ghost btn-sm" title="Chain of Custody">
              <i class="fa-solid fa-timeline"></i>
            </a>
            <button class="btn btn-ghost btn-sm text-danger" title="Delete Batch" onclick="confirmDeleteBatch('${b.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function confirmDeleteBatch(batchId) {
  confirmModal(
    'Delete Waste Batch',
    `Are you sure you want to permanently delete batch <strong>${batchId}</strong> from the local simulation registry?`,
    () => {
      DataStore.deleteBatch(batchId);
      showToast(`Batch ${batchId} deleted successfully`, 'success');
      allBatches = DataStore.getBatches();
      filteredBatches = filteredBatches.filter(b => b.id !== batchId);
      renderBatchesTable();
    },
    'Delete Batch',
    true
  );
}

function exportBatchesToCSV() {
  if (filteredBatches.length === 0) {
    showToast('No batches to export', 'warning');
    return;
  }

  const headers = ['Batch ID', 'Waste Type', 'Collected Qty (kg)', 'Received Qty (kg)', 'Processed Qty (kg)', 'Location', 'Date', 'Vehicle', 'Assigned Center', 'Status', 'Risk Level'];
  const rows = filteredBatches.map(b => [
    b.id,
    b.wasteType,
    b.collectedQuantityKg,
    b.receivedQuantityKg || '',
    b.processedQuantityKg || '',
    `"${b.collectionLocation}"`,
    b.collectionDate,
    b.vehicleNumber,
    `"${b.assignedCenter}"`,
    b.status,
    b.riskLevel
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `waste_batches_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Batches exported to CSV successfully', 'success');
}
