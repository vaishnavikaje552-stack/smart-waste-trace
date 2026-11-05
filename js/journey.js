/**
 * SMART WASTE TRACE - DIGITAL CHAIN OF CUSTODY TIMELINE CONTROLLER
 * Visual chronological timeline across the 6 custodial stages.
 */

let activeBatch = null;

document.addEventListener('DOMContentLoaded', () => {
  AuthService.requireAuth();
  initAppShell('chain-of-custody');

  populateBatchSelector();

  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get('id');

  const batches = DataStore.getBatches();
  if (requestedId && DataStore.getBatchById(requestedId)) {
    loadCustodyTimeline(requestedId);
  } else if (batches.length > 0) {
    loadCustodyTimeline(batches[0].id);
  }
});

function populateBatchSelector() {
  const select = document.getElementById('custody-batch-select');
  if (!select) return;

  const batches = DataStore.getBatches();
  select.innerHTML = batches.map(b => `
    <option value="${b.id}">${b.id} - ${b.wasteType} (${b.riskLevel} Risk) - ${b.status}</option>
  `).join('');

  select.addEventListener('change', (e) => {
    loadCustodyTimeline(e.target.value);
  });
}

function loadCustodyTimeline(batchId) {
  activeBatch = DataStore.getBatchById(batchId);
  if (!activeBatch) return;

  const select = document.getElementById('custody-batch-select');
  if (select) select.value = activeBatch.id;

  // Header info
  document.getElementById('coc-batch-id-heading').textContent = activeBatch.id;
  document.getElementById('coc-waste-type').textContent = activeBatch.wasteType;
  document.getElementById('coc-collected-qty').textContent = formatKg(activeBatch.collectedQuantityKg);
  document.getElementById('coc-vehicle').textContent = activeBatch.vehicleNumber;
  document.getElementById('coc-center').textContent = activeBatch.assignedCenter;

  const statusBadge = document.getElementById('coc-status-badge');
  const riskBadge = document.getElementById('coc-risk-badge');

  if (statusBadge) {
    const sClass = activeBatch.status === 'Completed' ? 'badge-completed' : activeBatch.status === 'In-Transit' ? 'badge-in-transit' : 'badge-discrepancy';
    statusBadge.className = `badge ${sClass}`;
    statusBadge.innerHTML = `<span class="badge-dot"></span>${activeBatch.status}`;
  }

  if (riskBadge) {
    const rClass = activeBatch.riskLevel === 'High' ? 'badge-high' : activeBatch.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low';
    riskBadge.className = `badge ${rClass}`;
    riskBadge.innerHTML = `<span class="badge-dot"></span>${activeBatch.riskLevel} Risk`;
  }

  // Render Timeline
  renderTimelineSteps(activeBatch);
}

function renderTimelineSteps(batch) {
  const container = document.getElementById('custody-timeline-container');
  if (!container) return;

  const standardStages = [
    { title: '1. Waste Collection', defaultLoc: batch.collectionLocation, defaultTime: `${batch.collectionDate} ${batch.collectionTime || '08:00 AM'}` },
    { title: '2. Transportation Started', defaultLoc: `${batch.collectionLocation} Hub`, defaultTime: `${batch.collectionDate} 09:00 AM` },
    { title: '3. Waste Received', defaultLoc: batch.assignedCenter, defaultTime: batch.receivingConfirmed ? `${batch.collectionDate} 11:30 AM` : 'Pending Gate Arrival' },
    { title: '4. Processing Started', defaultLoc: `${batch.assignedCenter} Facility`, defaultTime: batch.processingConfirmed ? `${batch.collectionDate} 01:00 PM` : 'Pending Inoculation/Sort' },
    { title: '5. Processing Completed', defaultLoc: `${batch.assignedCenter} Curing/Pellet Bay`, defaultTime: batch.status === 'Completed' ? '2026-11-04 04:00 PM' : 'In Processing' },
    { title: '6. Final Verification', defaultLoc: 'Municipal Oversight Portal', defaultTime: batch.status === 'Completed' ? '2026-11-04 06:00 PM' : 'Pending Audit Signoff' }
  ];

  // Merge batch's chainOfCustody or standard
  const custodyData = (batch.chainOfCustody && batch.chainOfCustody.length === 6)
    ? batch.chainOfCustody
    : standardStages.map((st, i) => ({
        stage: st.title.substring(3),
        timestamp: st.defaultTime,
        location: st.defaultLoc,
        status: i === 0 ? 'Completed' : (batch.status === 'Completed' ? 'Completed' : 'Pending'),
        notes: `Simulated recorded data for ${st.title}.`
      }));

  container.innerHTML = custodyData.map((item, index) => {
    let stepClass = 'completed';
    let iconClass = 'fa-check';
    let statusBadgeClass = 'badge-completed';

    if (item.status === 'Completed') {
      stepClass = 'completed';
      iconClass = 'fa-check';
      statusBadgeClass = 'badge-completed';
    } else if (item.status === 'Pending') {
      stepClass = 'pending';
      iconClass = 'fa-hourglass-half';
      statusBadgeClass = 'badge-pending';
    } else if (item.status === 'Flagged' || batch.riskLevel === 'High') {
      stepClass = 'flagged';
      iconClass = 'fa-triangle-exclamation';
      statusBadgeClass = 'badge-high';
    }

    // High risk visual cues
    if (batch.riskLevel === 'High' && (index >= 2 && item.status !== 'Completed')) {
      stepClass = 'flagged';
      iconClass = 'fa-triangle-exclamation';
      statusBadgeClass = 'badge-high';
    }

    const stageNumber = index + 1;

    return `
      <div class="timeline-step ${stepClass}">
        <div class="timeline-marker">
          <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="timeline-content-card">
          <div class="timeline-header">
            <div>
              <span class="timeline-title">${stageNumber}. ${item.stage}</span>
              <div class="timeline-meta">
                <span><i class="fa-regular fa-clock"></i> ${item.timestamp}</span>
                <span><i class="fa-solid fa-location-dot"></i> ${item.location}</span>
              </div>
            </div>
            <span class="badge ${statusBadgeClass}">${item.status}</span>
          </div>

          <div class="timeline-details">
            <div>
              <div style="font-size: 0.72rem; color: var(--slate-500); text-transform: uppercase;">Custodial Custody</div>
              <div style="font-weight: 600; color: var(--slate-800);">${index < 2 ? (batch.driverName || 'Fleet Operator') : batch.assignedCenter}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--slate-500); text-transform: uppercase;">Recorded Check</div>
              <div style="font-weight: 600; color: var(--slate-800);">${item.notes || 'Milestone integrity verified digitally.'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openAddMilestoneModal() {
  if (!activeBatch) return;

  confirmModal(
    'Add Custody Inspection Milestone',
    `Simulate adding a certified field inspection milestone to batch <strong>${activeBatch.id}</strong>?`,
    () => {
      showToast(`Audit stamp appended to ${activeBatch.id} chain of custody`, 'success');
      loadCustodyTimeline(activeBatch.id);
    },
    'Stamp Milestone'
  );
}
