/**
 * SMART WASTE TRACE - AUTHENTICATION & ROLE MANAGEMENT ENGINE
 * Supports: Municipal Admin & Processing Center Operator
 */

const DEMO_USERS = {
  admin: {
    id: 'USR-001',
    name: 'Dr. Rajesh Kulkarni',
    email: 'admin@smartwastetrace.gov.in',
    role: 'admin',
    roleLabel: 'Municipal Admin',
    department: 'Pune Municipal SWM Division',
    avatarInitials: 'RK'
  },
  operator: {
    id: 'USR-002',
    name: 'Sunil Deshmukh',
    email: 'operator@ecocompost.in',
    role: 'operator',
    roleLabel: 'Processing Center Operator',
    department: 'Pune Eco-Compost Facility',
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
    
    // Check if matching demo user
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
    danger: 'fa-solid fa-circle-exclamation',
    info: 'fa-solid fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="${icons[type] || icons.info} toast-icon"></i>
    <div class="toast-content">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
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
        <p style="color: var(--slate-600); font-size: 0.95rem;">${message}</p>
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
 * Automatically builds the Sidebar, Topbar, and Mobile Drawer for every page.
 */
function initAppShell(activePageId = 'dashboard') {
  const user = AuthService.getUser() || DEMO_USERS.admin;
  const stats = DataStore.getStatsSummary();
  const alerts = DataStore.getAlerts().filter(a => !a.isReviewed);

  // 1. Sidebar HTML
  const sidebarContainer = document.getElementById('app-sidebar-container');
  if (sidebarContainer) {
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
          <div class="nav-section-title">Core Operations</div>
          
          <a href="dashboard.html" class="nav-item ${activePageId === 'dashboard' ? 'active' : ''}">
            <i class="fa-solid fa-chart-pie"></i>
            <span>Dashboard</span>
          </a>

          <a href="batches.html" class="nav-item ${activePageId === 'batches' ? 'active' : ''}">
            <i class="fa-solid fa-boxes-stacked"></i>
            <span>Waste Batches</span>
          </a>

          <a href="create-batch.html" class="nav-item ${activePageId === 'create-batch' ? 'active' : ''}">
            <i class="fa-solid fa-plus-circle"></i>
            <span>Create Batch</span>
          </a>

          <a href="qr-tracking.html" class="nav-item ${activePageId === 'qr-tracking' ? 'active' : ''}">
            <i class="fa-solid fa-qrcode"></i>
            <span>QR Code Tracking</span>
          </a>

          <a href="transportation.html" class="nav-item ${activePageId === 'transportation' ? 'active' : ''}">
            <i class="fa-solid fa-truck-fast"></i>
            <span>Transportation</span>
          </a>

          <a href="chain-of-custody.html" class="nav-item ${activePageId === 'chain-of-custody' ? 'active' : ''}">
            <i class="fa-solid fa-timeline"></i>
            <span>Chain of Custody</span>
          </a>

          <div class="nav-section-title">Processing & Verification</div>

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

          <div class="nav-section-title">Analytics & Audits</div>

          <a href="reports.html" class="nav-item ${activePageId === 'reports' ? 'active' : ''}">
            <i class="fa-solid fa-file-invoice"></i>
            <span>Reports & Exports</span>
          </a>

          <a href="javascript:void(0)" onclick="AuthService.logout()" class="nav-item" style="margin-top: auto; color: #f87171;">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Logout</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-snippet">
            <div class="user-avatar">${user.avatarInitials}</div>
            <div class="user-info">
              <div class="user-name">${user.name}</div>
              <div class="user-role-badge">${user.roleLabel}</div>
            </div>
            <a href="javascript:void(0)" onclick="AuthService.logout()" class="logout-link" title="Logout">
              <i class="fa-solid fa-power-off"></i>
            </a>
          </div>
        </div>
      </aside>
      <div class="sidebar-overlay" id="sidebar-mobile-overlay"></div>
    `;
  }

  // 2. Topbar HTML
  const topbarContainer = document.getElementById('app-topbar-container');
  if (topbarContainer) {
    topbarContainer.innerHTML = `
      <header class="app-topbar">
        <div class="topbar-left">
          <button class="sidebar-toggle-btn d-lg-none" id="mobile-drawer-toggle" style="color: var(--slate-700);">
            <i class="fa-solid fa-bars"></i>
          </button>
          
          <div class="page-headline">
            <h1 id="page-current-title">${getPageTitle(activePageId)}</h1>
            <div class="breadcrumb">
              <a href="dashboard.html"><i class="fa-solid fa-house"></i> Home</a>
              <i class="fa-solid fa-chevron-right" style="font-size: 0.65rem;"></i>
              <span id="page-breadcrumb-sub">${getPageTitle(activePageId)}</span>
            </div>
          </div>
        </div>

        <div class="topbar-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="global-search-input" placeholder="Search Batch ID (e.g. WB-0001)..." onkeydown="handleGlobalSearch(event)">
        </div>

        <div class="topbar-right">
          <!-- Role Switcher Indicator -->
          <div class="role-switcher-pill" title="Click to switch between Municipal Admin and Processing Operator" onclick="toggleRoleSwitchModal()">
            <div class="status-dot"></div>
            <span>${user.roleLabel}</span>
            <i class="fa-solid fa-repeat" style="font-size: 0.75rem; color: var(--primary-600); margin-left: 4px;"></i>
          </div>

          <!-- Notification Dropdown -->
          <div style="position: relative;">
            <button class="notification-btn" id="noti-dropdown-btn" title="AI Alerts & Notifications">
              <i class="fa-solid fa-bell"></i>
              ${stats.unreviewedAlerts > 0 ? `<span class="notification-count">${stats.unreviewedAlerts}</span>` : ''}
            </button>
            <div class="dropdown-menu" id="noti-dropdown-menu">
              <div class="dropdown-header">
                <span>AI Risk Alerts (${stats.unreviewedAlerts})</span>
                <a href="ai-alerts.html" style="font-size: 0.78rem;">View All</a>
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
                `).join('') : '<div style="padding: 20px; text-align: center; color: var(--slate-400); font-size: 0.85rem;">No active alerts</div>'}
              </div>
            </div>
          </div>

          <!-- User Menu -->
          <button class="btn btn-secondary btn-sm" onclick="AuthService.logout()" title="Logout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span class="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </header>
    `;
  }

  // Setup Sidebar Collapse & Mobile Drawer interactions
  setupNavigationEvents();
}

function getPageTitle(pageId) {
  const map = {
    'dashboard': 'Municipal Admin Dashboard',
    'batches': 'Waste Batch Management',
    'create-batch': 'Create Waste Batch',
    'batch-details': 'Waste Digital Passport',
    'qr-tracking': 'QR Code Tracking & Verification',
    'transportation': 'Transportation & Journey Updates',
    'chain-of-custody': 'Digital Chain of Custody Timeline',
    'processing-centers': 'Processing Center Management',
    'processing-records': 'Processing Records & Discrepancies',
    'ai-alerts': 'AI Risk Alerts & Suspicious Journey Detection',
    'integrity-score': 'Waste Journey Integrity Score',
    'reports': 'Reports & Analytics'
  };
  return map[pageId] || 'Smart Waste Trace';
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
    'Switch Demo User Role',
    `You are currently logged in as <strong>${currentUser.roleLabel}</strong> (${currentUser.name}). Switch to <strong>${targetObj.roleLabel}</strong> (${targetObj.name}) to test role-specific workflows?`,
    () => {
      AuthService.switchRole(targetRole);
    },
    `Switch to ${targetObj.roleLabel}`
  );
}
