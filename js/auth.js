/**
 * SMART WASTE TRACE - AUTHENTICATION & ROLE MANAGEMENT ENGINE
 * Supports: Municipal Admin (Oversight & Verification) & Processing Center Operator
 */

const DEMO_USERS = {
  admin: {
    id: 'USR-001',
    name: 'Dr. Rajesh Kulkarni',
    email: 'admin@smartwastetrace.gov.in',
    role: 'admin',
    roleLabel: 'Municipal Admin',
    department: 'PMC Solid Waste Monitoring & Verification Command',
    avatarInitials: 'RK'
  },
  operator: {
    id: 'USR-002',
    name: 'Sunil Deshmukh',
    email: 'operator@ecocompost.in',
    role: 'operator',
    roleLabel: 'Processing Center Operator',
    department: 'Pune Eco-Compost Facility (Hadapsar)',
    avatarInitials: 'SD'
  }
};

const AuthService = {
  getUser() {
    try {
      const data = localStorage.getItem('swt_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('swt_user', JSON.stringify(user));
  },

  login(email, password, role = 'admin') {
    const trimmedEmail = (email || '').trim().toLowerCase();
    
    // Check role or email pattern
    if (role === 'admin' || trimmedEmail.includes('admin')) {
      this.setUser(DEMO_USERS.admin);
      return { success: true, user: DEMO_USERS.admin };
    } else {
      this.setUser(DEMO_USERS.operator);
      return { success: true, user: DEMO_USERS.operator };
    }
  },

  logout() {
    localStorage.removeItem('swt_user');
    window.location.href = 'login.html';
  },

  switchRole(targetRole) {
    if (DEMO_USERS[targetRole]) {
      this.setUser(DEMO_USERS[targetRole]);
      showToast(`Switched active role to: ${DEMO_USERS[targetRole].roleLabel}`, 'info');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  },

  requireAuth() {
    const user = this.getUser();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // If not logged in and not on login or index page, redirect to login
    if (!user && currentPage !== 'login.html' && currentPage !== 'index.html') {
      window.location.href = 'login.html';
      return null;
    }
    
    // If logged in and on login or index page, redirect to dashboard
    if (user && (currentPage === 'login.html' || currentPage === 'index.html')) {
      window.location.href = 'dashboard.html';
      return user;
    }

    // Role-based Access Control Enforcement
    if (user) {
      // Check for deferred access notification
      const pendingWarning = sessionStorage.getItem('swt_access_warning');
      if (pendingWarning) {
        sessionStorage.removeItem('swt_access_warning');
        setTimeout(() => showToast(pendingWarning, 'warning', 4500), 300);
      }

      if (user.role === 'admin') {
        // Municipal Admin cannot create batches (monitoring only)
        if (currentPage === 'create-batch.html') {
          sessionStorage.setItem('swt_access_warning', 'Access Restricted: Municipal Admin role is restricted to supervision and monitoring. Admins cannot create batch records.');
          window.location.href = 'batches.html';
          return null;
        }
      } else if (user.role === 'operator') {
        // Processing Center Operator cannot access Admin-only management pages
        const adminOnlyPages = ['processing-centers.html', 'ai-alerts.html', 'reports.html'];
        if (adminOnlyPages.includes(currentPage)) {
          sessionStorage.setItem('swt_access_warning', 'Access Restricted: That management module is reserved exclusively for Municipal Admin oversight.');
          window.location.href = 'dashboard.html';
          return null;
        }
      }
    }

    return user;
  }
};

// Global Toast System
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'fa-solid fa-circle-check',
    warning: 'fa-solid fa-triangle-exclamation',
    danger:  'fa-solid fa-circle-exclamation',
    info:    'fa-solid fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="${icons[type] || icons.info} toast-icon"></i>
    <div class="toast-content">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()" title="Close"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Global Confirmation Modal System
function confirmModal(title, message, onConfirm, confirmBtnText = 'Confirm', isDanger = false) {
  const existing = document.getElementById('confirm-modal-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'confirm-modal-backdrop';
  backdrop.className = 'modal-backdrop active';
  backdrop.innerHTML = `
    <div class="modal-dialog" style="max-width: 440px;">
      <div class="modal-header">
        <h3 class="card-title"><i class="fa-solid ${isDanger ? 'fa-triangle-exclamation text-danger' : 'fa-circle-question text-primary'}"></i> ${title}</h3>
        <button class="btn btn-ghost btn-sm" onclick="closeConfirmModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <p style="color: var(--slate-700); font-size: 0.95rem; line-height: 1.5;">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeConfirmModal()">Cancel</button>
        <button class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" id="confirm-modal-action-btn">${confirmBtnText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  document.getElementById('confirm-modal-action-btn').addEventListener('click', () => {
    closeConfirmModal();
    if (typeof onConfirm === 'function') onConfirm();
  });
}

function closeConfirmModal() {
  const modal = document.getElementById('confirm-modal-backdrop');
  if (modal) modal.remove();
}

/**
 * Universal Navigation and Layout Renderer
 * Builds role-specific navigation, topbar controls, and settings modals.
 */
function initAppShell(activePageId = 'dashboard') {
  const user = AuthService.getUser() || DEMO_USERS.admin;
  const isOperator = user.role === 'operator';
  const stats = DataStore.getStatsSummary();
  const alerts = DataStore.getAlerts().filter(a => !a.isReviewed);

  // 1. Sidebar HTML: Separate Navigation based on Role
  const sidebarContainer = document.getElementById('app-sidebar-container');
  if (sidebarContainer) {
    const adminNavHTML = `
      <div class="nav-section-title">Oversight &amp; Monitoring</div>
      
      <a href="dashboard.html" class="nav-item ${activePageId === 'dashboard' ? 'active' : ''}">
        <i class="fa-solid fa-chart-pie"></i>
        <span>Dashboard</span>
      </a>

      <a href="batches.html" class="nav-item ${activePageId === 'batches' ? 'active' : ''}">
        <i class="fa-solid fa-boxes-stacked"></i>
        <span>Waste Batches</span>
      </a>

      <a href="qr-tracking.html" class="nav-item ${activePageId === 'qr-tracking' ? 'active' : ''}">
        <i class="fa-solid fa-qrcode"></i>
        <span>QR Tracking</span>
      </a>

      <a href="transportation.html" class="nav-item ${activePageId === 'transportation' ? 'active' : ''}">
        <i class="fa-solid fa-truck-fast"></i>
        <span>Transportation</span>
      </a>

      <a href="chain-of-custody.html" class="nav-item ${activePageId === 'chain-of-custody' ? 'active' : ''}">
        <i class="fa-solid fa-timeline"></i>
        <span>Chain of Custody</span>
      </a>

      <div class="nav-section-title">Processing &amp; Verification</div>

      <a href="processing-centers.html" class="nav-item ${activePageId === 'processing-centers' ? 'active' : ''}">
        <i class="fa-solid fa-industry"></i>
        <span>Processing Centers</span>
      </a>

      <a href="processing-records.html" class="nav-item ${activePageId === 'processing-records' ? 'active' : ''}">
        <i class="fa-solid fa-clipboard-check"></i>
        <span>Processing Records</span>
      </a>

      <a href="ai-alerts.html" class="nav-item ${activePageId === 'ai-alerts' ? 'active' : ''}">
        <i class="fa-solid fa-shield-virus"></i>
        <span>AI Risk Alerts</span>
        ${stats.unreviewedAlerts > 0 ? `<span class="nav-badge">${stats.unreviewedAlerts}</span>` : ''}
      </a>

      <a href="integrity-score.html" class="nav-item ${activePageId === 'integrity-score' ? 'active' : ''}">
        <i class="fa-solid fa-gauge-high"></i>
        <span>Integrity Score</span>
      </a>

      <div class="nav-section-title">Audits &amp; System</div>

      <a href="reports.html" class="nav-item ${activePageId === 'reports' ? 'active' : ''}">
        <i class="fa-solid fa-file-invoice"></i>
        <span>Reports</span>
      </a>

      <a href="javascript:void(0)" onclick="openSettingsModal()" class="nav-item ${activePageId === 'settings' ? 'active' : ''}">
        <i class="fa-solid fa-sliders"></i>
        <span>Settings</span>
      </a>

      <a href="javascript:void(0)" onclick="AuthService.logout()" class="nav-item" style="margin-top: auto; color: #F87171;">
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
        <span>Logout</span>
      </a>
    `;

    const operatorNavHTML = `
      <div class="nav-section-title">Plant Operations</div>

      <a href="dashboard.html" class="nav-item ${activePageId === 'dashboard' ? 'active' : ''}">
        <i class="fa-solid fa-chart-pie"></i>
        <span>Dashboard</span>
      </a>

      <a href="create-batch.html" class="nav-item ${activePageId === 'create-batch' ? 'active' : ''}" style="color: #FFFFFF; background: rgba(39, 140, 120, 0.22); border: 1px dashed var(--accent);">
        <i class="fa-solid fa-plus-circle" style="color: var(--accent);"></i>
        <span>Create Batch</span>
        <span class="badge badge-low" style="margin-left: auto; font-size: 0.65rem; padding: 1px 6px;">Intake</span>
      </a>

      <a href="batches.html" class="nav-item ${activePageId === 'batches' ? 'active' : ''}">
        <i class="fa-solid fa-boxes-stacked"></i>
        <span>My Waste Batches</span>
      </a>

      <a href="qr-tracking.html" class="nav-item ${activePageId === 'qr-tracking' ? 'active' : ''}">
        <i class="fa-solid fa-qrcode"></i>
        <span>QR Tracking</span>
      </a>

      <a href="transportation.html" class="nav-item ${activePageId === 'transportation' ? 'active' : ''}">
        <i class="fa-solid fa-truck-fast"></i>
        <span>Transportation Updates</span>
      </a>

      <a href="chain-of-custody.html" class="nav-item ${activePageId === 'chain-of-custody' ? 'active' : ''}">
        <i class="fa-solid fa-timeline"></i>
        <span>Chain of Custody</span>
      </a>

      <div class="nav-section-title">Intake &amp; Processing</div>

      <a href="processing-records.html" class="nav-item ${activePageId === 'processing-records' ? 'active' : ''}">
        <i class="fa-solid fa-clipboard-check"></i>
        <span>Processing Records</span>
      </a>

      <a href="integrity-score.html" class="nav-item ${activePageId === 'integrity-score' ? 'active' : ''}">
        <i class="fa-solid fa-gauge-high"></i>
        <span>Integrity Verification</span>
      </a>

      <div class="nav-section-title">Account</div>

      <a href="javascript:void(0)" onclick="AuthService.logout()" class="nav-item" style="margin-top: auto; color: #F87171;">
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
        <span>Logout</span>
      </a>
    `;

    sidebarContainer.innerHTML = `
      <aside class="app-sidebar">
        <div class="sidebar-header">
          <a href="dashboard.html" class="brand-wrapper">
            <div class="brand-logo-icon">
              <i class="fa-solid fa-recycle"></i>
            </div>
            <div class="brand-text">
              <span class="brand-name">Smart Waste <span>Trace</span></span>
              <span class="brand-tagline">Track • Verify • Transform</span>
            </div>
          </a>
          <button class="sidebar-toggle-btn" id="sidebar-collapse-btn" title="Toggle Sidebar">
            <i class="fa-solid fa-bars-staggered"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          ${isOperator ? operatorNavHTML : adminNavHTML}
        </nav>

        <div class="sidebar-footer">
          <div class="user-snippet">
            <div class="user-avatar">${user.avatarInitials}</div>
            <div class="user-info">
              <div class="user-name">${user.name}</div>
              <div class="user-role-badge">${user.roleLabel}</div>
            </div>
            <a href="javascript:void(0)" onclick="AuthService.logout()" class="logout-link" title="Sign Out">
              <i class="fa-solid fa-power-off"></i>
            </a>
          </div>
        </div>
      </aside>
      <div class="sidebar-overlay" id="sidebar-mobile-overlay"></div>
    `;
  }

  // 2. Topbar HTML: Role-Specific Action Controls
  const topbarContainer = document.getElementById('app-topbar-container');
  if (topbarContainer) {
    const adminTopbarRight = `
      <!-- Role Switcher Indicator -->
      <div class="role-switcher-pill" title="Click to switch role (Admin / Operator)" onclick="toggleRoleSwitchModal()">
        <div class="status-dot"></div>
        <span>Municipal Admin</span>
        <i class="fa-solid fa-repeat" style="font-size: 0.75rem; color: var(--secondary); margin-left: 4px;"></i>
      </div>

      <!-- Notification Dropdown -->
      <div style="position: relative;">
        <button class="notification-btn" id="noti-dropdown-btn" title="AI Alerts &amp; Notifications">
          <i class="fa-solid fa-bell"></i>
          ${stats.unreviewedAlerts > 0 ? `<span class="notification-count">${stats.unreviewedAlerts}</span>` : ''}
        </button>
        <div class="dropdown-menu" id="noti-dropdown-menu">
          <div class="dropdown-header">
            <span>AI Risk Alerts (${stats.unreviewedAlerts})</span>
            <a href="ai-alerts.html" style="font-size: 0.78rem; color: var(--secondary); font-weight: 700;">View All</a>
          </div>
          <div class="dropdown-list">
            ${alerts.length > 0 ? alerts.map(a => `
              <div class="dropdown-item-notification" onclick="window.location.href='ai-alerts.html'">
                <div class="noti-icon noti-${a.riskLevel.toLowerCase()}">
                  <i class="fa-solid ${a.riskLevel === 'High' ? 'fa-triangle-exclamation' : 'fa-bell'}"></i>
                </div>
                <div>
                  <div class="noti-text-title">${a.batchId} - ${a.issueType}</div>
                  <div class="noti-text-desc">${a.aiExplanation.substring(0, 75)}...</div>
                </div>
              </div>
            `).join('') : '<div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 0.85rem;"><i class="fa-solid fa-shield-check text-success" style="font-size: 1.5rem; display: block; margin-bottom: 6px;"></i> All batches in compliance</div>'}
          </div>
        </div>
      </div>

      <!-- Settings Shortcut -->
      <button class="btn btn-secondary btn-sm" onclick="openSettingsModal()" title="System Settings">
        <i class="fa-solid fa-gear"></i>
        <span class="d-none d-sm-inline">Settings</span>
      </button>
    `;

    const operatorTopbarRight = `
      <!-- Role Switcher Indicator -->
      <div class="role-switcher-pill" title="Click to switch role (Admin / Operator)" onclick="toggleRoleSwitchModal()">
        <div class="status-dot"></div>
        <span>Processing Operator</span>
        <i class="fa-solid fa-repeat" style="font-size: 0.75rem; color: var(--secondary); margin-left: 4px;"></i>
      </div>

      <!-- Quick Create Batch Shortcut -->
      <a href="create-batch.html" class="btn btn-primary btn-sm" title="Register New Batch Intake">
        <i class="fa-solid fa-plus-circle"></i>
        <span class="d-none d-sm-inline">Create Batch</span>
      </a>

      <!-- Quick QR Scan Shortcut -->
      <a href="qr-tracking.html" class="btn btn-secondary btn-sm" title="Scan Gate QR Passport">
        <i class="fa-solid fa-qrcode"></i>
        <span class="d-none d-sm-inline">Scan QR</span>
      </a>
    `;

    topbarContainer.innerHTML = `
      <header class="app-topbar">
        <div class="topbar-left">
          <button class="sidebar-toggle-btn d-lg-none" id="mobile-drawer-toggle" style="color: var(--text-primary);">
            <i class="fa-solid fa-bars"></i>
          </button>
          
          <div class="page-headline">
            <h1 id="page-current-title">${getPageTitle(activePageId, user.role)}</h1>
            <div class="breadcrumb">
              <a href="dashboard.html"><i class="fa-solid fa-house"></i> Home</a>
              <i class="fa-solid fa-chevron-right" style="font-size: 0.65rem;"></i>
              <span id="page-breadcrumb-sub">${getPageTitle(activePageId, user.role)}</span>
            </div>
          </div>
        </div>

        <div class="topbar-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="global-search-input" placeholder="Search Batch ID (e.g. WB-0001)..." onkeydown="handleGlobalSearch(event)">
        </div>

        <div class="topbar-right">
          ${isOperator ? operatorTopbarRight : adminTopbarRight}
        </div>
      </header>
    `;
  }

  // Setup Sidebar Collapse & Mobile Drawer interactions
  setupNavigationEvents();
}

function getPageTitle(pageId, role = 'admin') {
  if (role === 'operator') {
    const operatorMap = {
      'dashboard': 'Processing Center Command',
      'create-batch': 'Field Waste Collection Intake',
      'batches': 'My Waste Batches (Facility Registry)',
      'batch-details': 'Waste Digital Passport',
      'qr-tracking': 'QR Code Tracking & Gate Verification',
      'transportation': 'Transportation & Checkpoint Updates',
      'chain-of-custody': 'Digital Chain of Custody Timeline',
      'processing-records': 'Facility Processing Records & Yield',
      'integrity-score': 'Integrity Verification & Mass-Balance'
    };
    return operatorMap[pageId] || 'Smart Waste Trace';
  }

  const adminMap = {
    'dashboard': 'Municipal Monitoring Command',
    'batches': 'Waste Batch Oversight Registry',
    'create-batch': 'Field Collection Intake',
    'batch-details': 'Waste Digital Passport',
    'qr-tracking': 'QR Code Tracking & Verification',
    'transportation': 'Transportation & Route Telemetry',
    'chain-of-custody': 'Digital Chain of Custody Timeline',
    'processing-centers': 'Certified Processing Facilities',
    'processing-records': 'Facility Processing Records & Discrepancies',
    'ai-alerts': 'AI Risk Alerts & Suspicious Journey Detection',
    'integrity-score': 'Waste Journey Integrity Score',
    'reports': 'Municipal Reports & Regulatory Audits',
    'settings': 'System Settings & Simulation Controls'
  };
  return adminMap[pageId] || 'Smart Waste Trace';
}

function setupNavigationEvents() {
  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
    });
  }

  const mobileToggle = document.getElementById('mobile-drawer-toggle');
  const overlay = document.getElementById('sidebar-mobile-overlay');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      document.body.classList.toggle('mobile-sidebar-open');
      if (overlay) overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      document.body.classList.remove('mobile-sidebar-open');
      overlay.classList.remove('active');
    });
  }

  // Notification dropdown toggle
  const notiBtn = document.getElementById('noti-dropdown-btn');
  const notiMenu = document.getElementById('noti-dropdown-menu');
  if (notiBtn && notiMenu) {
    notiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notiMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!notiMenu.contains(e.target) && e.target !== notiBtn) {
        notiMenu.classList.remove('show');
      }
    });
  }
}

// Global Search input handler
function handleGlobalSearch(event) {
  if (event.key === 'Enter') {
    const val = event.target.value.trim().toUpperCase();
    if (val) {
      const batch = DataStore.getBatchById(val);
      if (batch) {
        window.location.href = `batch-details.html?id=${encodeURIComponent(batch.id)}`;
      } else {
        showToast(`No batch found with ID: ${val}`, 'warning');
      }
    }
  }
}

// Role switch dialog
function toggleRoleSwitchModal() {
  const currentUser = AuthService.getUser() || DEMO_USERS.admin;
  const targetRole = currentUser.role === 'admin' ? 'operator' : 'admin';
  const targetObj = DEMO_USERS[targetRole];

  confirmModal(
    'Switch Operational Role',
    `You are currently logged in as <strong>${currentUser.roleLabel}</strong> (${currentUser.name}). Switch to <strong>${targetObj.roleLabel}</strong> (${targetObj.name}) to test facility-specific workflows?`,
    () => {
      AuthService.switchRole(targetRole);
    },
    `Switch to ${targetObj.roleLabel}`
  );
}

// Settings Modal
function openSettingsModal() {
  const existing = document.getElementById('settings-modal-backdrop');
  if (existing) existing.remove();

  const user = AuthService.getUser() || DEMO_USERS.admin;

  const backdrop = document.createElement('div');
  backdrop.id = 'settings-modal-backdrop';
  backdrop.className = 'modal-backdrop active';
  backdrop.innerHTML = `
    <div class="modal-dialog" style="max-width: 540px;">
      <div class="modal-header">
        <h3 class="card-title"><i class="fa-solid fa-sliders text-primary"></i> System Settings &amp; Simulation Controls</h3>
        <button class="btn btn-ghost btn-sm" onclick="closeSettingsModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--dark-charcoal); margin-bottom: 6px;">
            <i class="fa-solid fa-building-columns text-primary"></i> Municipal Authority Details
          </h4>
          <div style="background: var(--slate-50); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 16px; font-size: 0.85rem;">
            <div><strong>Jurisdiction:</strong> Pune Municipal Corporation (PMC)</div>
            <div style="margin-top: 4px;"><strong>Department:</strong> Solid Waste Management &amp; Traceability Command</div>
            <div style="margin-top: 4px;"><strong>Active Operator:</strong> ${user.name} (${user.roleLabel})</div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
            <i class="fa-solid fa-palette text-primary"></i> Navy &amp; Teal Theme Palette
          </h4>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem;">
              <span style="width: 18px; height: 18px; border-radius: 4px; background: #203A43; display: inline-block;"></span>
              <span>Navy (#203A43)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem;">
              <span style="width: 18px; height: 18px; border-radius: 4px; background: #278C78; display: inline-block;"></span>
              <span>Teal (#278C78)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem;">
              <span style="width: 18px; height: 18px; border-radius: 4px; background: #43BFA3; display: inline-block;"></span>
              <span>Accent (#43BFA3)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem;">
              <span style="width: 18px; height: 18px; border-radius: 4px; background: #EAF4F1; border: 1px solid #B6E5D8; display: inline-block;"></span>
              <span>Soft Mint (#EAF4F1)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem;">
              <span style="width: 18px; height: 18px; border-radius: 4px; background: #F5F7FA; border: 1px solid #CBD5E1; display: inline-block;"></span>
              <span>Canvas (#F5F7FA)</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--dark-charcoal); margin-bottom: 6px;">
            <i class="fa-solid fa-bell text-warning"></i> AI Alert Sensitivity
          </h4>
          <div style="font-size: 0.83rem; color: var(--slate-600); margin-bottom: 8px;">
            Mass discrepancy tolerance is set to <strong>5.0%</strong>. Shrinkage beyond 5% triggers critical high-risk alerts.
          </div>
          <div class="form-check">
            <input type="checkbox" id="setting-auto-refresh" class="form-check-input" checked>
            <label for="setting-auto-refresh" style="font-size: 0.82rem; color: var(--slate-700);">
              Simulate live telemetry updates every 30 seconds
            </label>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
          <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--status-red); margin-bottom: 6px;">
            <i class="fa-solid fa-database"></i> Demonstration Reset
          </h4>
          <p style="font-size: 0.8rem; color: var(--slate-500); margin-bottom: 12px;">
            Reset all simulated waste batches, processing records, and AI alerts back to default sample state.
          </p>
          <button class="btn btn-secondary btn-sm" onclick="handleResetSimulationData()" style="color: var(--status-red); border-color: var(--status-red-border);">
            <i class="fa-solid fa-arrow-rotate-left"></i> Reset Demo Data to Initial State
          </button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-sm" onclick="closeSettingsModal()">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal-backdrop');
  if (modal) modal.remove();
}

function handleResetSimulationData() {
  confirmModal(
    'Reset Simulation Data',
    'Are you sure you want to restore all batches, processing centers, transport logs, and AI alerts to initial demo seed values? Any created records will be replaced with clean defaults.',
    () => {
      DataStore.resetDemoData();
      showToast('Simulation dataset reset to default initial state!', 'success');
      closeSettingsModal();
      setTimeout(() => {
        window.location.reload();
      }, 600);
    },
    'Reset to Defaults',
    true
  );
}
