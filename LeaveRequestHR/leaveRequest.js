// leaveRequestHR.js - Fixed Version with Proper API Integration

let requests = [];
let filteredRequests = [];
let currentFilter = 'all';
let currentPage = 1;
const itemsPerPage = 10;
let pendingAction = null;
let currentViewRequestId = null;

// API Base URL - Updated to match backend routes
const API_BASE_URL = 'http://localhost:5000';

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Leave Requests Page...');
  initializePage();
});

async function initializePage() {
  await fetchLeaveRequests();
  await loadUserInfo();
  await loadDocumentReminders();
  await loadLeaveDistribution();
  setupEventListeners();

  // Refresh data every 1 minute for live updates
  setInterval(fetchLeaveRequests, 60000);
}

function setupEventListeners() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      applyFilter(filter);
    });
  });

  // Search functionality
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }

  // Refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleManualRefresh);
  }

  // Pagination
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  if (prevPageBtn) prevPageBtn.addEventListener('click', goToPreviousPage);
  if (nextPageBtn) nextPageBtn.addEventListener('click', goToNextPage);

  // Modal event listeners
  setupModalListeners();
}

function setupModalListeners() {
  const modal = document.getElementById('confirmationModal');
  const confirmBtn = document.getElementById('modalConfirmBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');
  const closeBtn = document.querySelector('.close-modal');

  if (confirmBtn) confirmBtn.addEventListener('click', executePendingAction);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // View modal listeners
  const viewModal = document.getElementById('viewModal');
  if (viewModal) {
    const closeViewModal = document.getElementById('closeViewModal');
    const closeViewBtn = viewModal.querySelector('.close-btn');
    const changeActionBtn = document.getElementById('change-action-btn');

    if (closeViewModal) closeViewModal.addEventListener('click', () => viewModal.style.display = 'none');
    if (closeViewBtn) closeViewBtn.addEventListener('click', () => viewModal.style.display = 'none');
    if (changeActionBtn) changeActionBtn.addEventListener('click', handleChangeAction);
  }

  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (modal && event.target === modal) {
      closeModal();
    }
    if (viewModal && event.target === viewModal) {
      viewModal.style.display = 'none';
    }
  });
}

// ===== DATA FETCHING FUNCTIONS =====

async function fetchLeaveRequests() {
  try {
    console.log('📡 Fetching leave requests from API...');
    showLoadingState();

    const response = await fetch(`${API_BASE_URL}/hr/leave-requests`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Received data:', data);

    if (data.success) {
      console.log(`✅ Leave requests fetched successfully: ${data.data.length} requests`);
      requests = data.data || [];
      applyFilter(currentFilter);
      showNotification(`Loaded ${requests.length} leave requests`, 'success');
    } else {
      throw new Error(data.message || 'Failed to load leave requests');
    }

  } catch (error) {
    console.error('❌ Error fetching leave requests:', error);
    handleDataError(error);
  }
}

function showLoadingState() {
  const tbody = document.getElementById('request-table');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 10px;">Loading leave requests...</p>
      </td>
    </tr>
  `;
}

function handleDataError(error) {
  requests = [];
  filteredRequests = [];
  populateTable();
  updateSummary();
  updatePaginationInfo();

  showNotification('Failed to load leave requests: ' + error.message, 'error');
}

// ===== FILTERING AND SEARCH =====

function applyFilter(filter) {
  currentFilter = filter;
  currentPage = 1;

  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  filterRequests();
}

function filterRequests() {
  let filtered = [...requests];

  // Apply status filter
  if (currentFilter !== 'all') {
    filtered = filtered.filter(req => {
      const status = (req.status || req.hr_approval_status || 'pending').toLowerCase();
      return status === currentFilter.toLowerCase();
    });
  }

  // Apply search filter
  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  if (searchTerm) {
    filtered = filtered.filter(req =>
      (req.employee_name && req.employee_name.toLowerCase().includes(searchTerm)) ||
      (req.department && req.department.toLowerCase().includes(searchTerm)) ||
      (req.leave_type && req.leave_type.toLowerCase().includes(searchTerm))
    );
  }

  filteredRequests = filtered;
  console.log(`🔍 Filtered results: ${filteredRequests.length} requests`);
  populateTable();
  updateSummary();
  updatePaginationInfo();
}

function handleSearch() {
  applyFilter(currentFilter);
}

async function handleManualRefresh() {
  const refreshBtn = document.getElementById('refresh-btn');
  if (!refreshBtn) return;

  refreshBtn.classList.add('refreshing');
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';

  try {
    await fetchLeaveRequests();
    await loadDocumentReminders();
    showNotification('Data refreshed successfully!', 'success');
  } catch (error) {
    showNotification('Failed to refresh data', 'error');
  } finally {
    refreshBtn.classList.remove('refreshing');
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== TABLE POPULATION =====

function populateTable() {
  const tbody = document.getElementById('request-table');
  if (!tbody) {
    console.error('Table body element not found');
    return;
  }

  if (filteredRequests.length === 0) {
    tbody.innerHTML = getEmptyStateHTML();
    return;
  }

  tbody.innerHTML = '';

  // Calculate pagination slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  console.log(`📊 Displaying ${paginatedRequests.length} requests on page ${currentPage}`);

  paginatedRequests.forEach(req => {
    const row = createRequestRow(req);
    tbody.appendChild(row);
  });
}

function createRequestRow(req) {
  const row = document.createElement('tr');

  const employeeName = req.employee_name || 'Unknown Employee';
  const department = req.department || 'N/A';
  const leaveType = req.leave_type || 'N/A';
  const startDate = req.start_date || 'N/A';
  const endDate = req.end_date || 'N/A';
  const status = (req.hr_approval_status || req.status || 'pending').toLowerCase();
  const totalDays = req.total_days || 'N/A';
  const employeeType = req.employee_type || 'N/A';

  row.innerHTML = `
    <td>
      <div class="employee-info">
        <div class="employee-avatar">
          ${employeeName.charAt(0).toUpperCase()}
        </div>
        <div class="employee-details">
          <div class="employee-name">${employeeName}</div>
          <div class="employee-department">${department}</div>
          ${employeeType === 'Intern' ? '<div class="intern-badge">🎓 Intern</div>' : ''}
        </div>
      </div>
    </td>
    <td>
      <span class="leave-type-badge">${leaveType}</span>
    </td>
    <td>${startDate} to ${endDate}</td>
    <td>${totalDays} days</td>
    <td>
      <span class="status status-${status}">
        ${status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </td>
    <td>
      <div class="action-buttons">
        ${status === 'pending' ? getActionButtons(req) : getViewAndChangeButtons(req)}
      </div>
    </td>
  `;

  return row;
}

function getActionButtons(req) {
  const employeeName = (req.employee_name || 'Employee').replace(/'/g, "\\'");
  return `
    <button class="approve-btn" onclick="showApproveConfirmation(${req.id}, '${employeeName}')">
      <i class="fas fa-check"></i> Approve
    </button>
    <button class="reject-btn" onclick="showRejectConfirmation(${req.id}, '${employeeName}')">
      <i class="fas fa-times"></i> Reject
    </button>
    <button class="view-btn" onclick="showRequestDetails(${req.id})">
      <i class="fas fa-eye"></i> View
    </button>
  `;
}

function getViewAndChangeButtons(req) {
  const employeeName = (req.employee_name || 'Employee').replace(/'/g, "\\'");
  const status = (req.hr_approval_status || req.status || 'pending');
  return `
    <button class="view-btn" onclick="showRequestDetails(${req.id})">
      <i class="fas fa-eye"></i> View
    </button>
    <button class="change-btn" onclick="showChangeActionOptions(${req.id}, '${employeeName}', '${status}')">
      <i class="fas fa-exchange-alt"></i> Change
    </button>
  `;
}

function getEmptyStateHTML() {
  return `
    <tr>
      <td colspan="6" class="empty-state">
        <i class="fas fa-inbox" style="font-size: 3em; color: #ccc; margin-bottom: 10px;"></i>
        <p>No leave requests found</p>
      </td>
    </tr>
  `;
}

// ===== PAGINATION =====

function updatePaginationInfo() {
  const totalItems = filteredRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const showingStart = document.getElementById('showing-start');
  const showingEnd = document.getElementById('showing-end');
  const totalItemsEl = document.getElementById('total-items');

  if (showingStart) showingStart.textContent = startItem;
  if (showingEnd) showingEnd.textContent = endItem;
  if (totalItemsEl) totalItemsEl.textContent = totalItems;

  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');

  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

  generatePageNumbers(totalPages);
}

function generatePageNumbers(totalPages) {
  const pageNumbersContainer = document.getElementById('page-numbers');
  if (!pageNumbersContainer) return;

  pageNumbersContainer.innerHTML = '';

  if (totalPages === 0) return;

  addPageNumber(1, totalPages);

  let startPage = Math.max(2, currentPage - 1);
  let endPage = Math.min(totalPages - 1, currentPage + 1);

  if (startPage > 2) {
    addEllipsis();
  }

  for (let i = startPage; i <= endPage; i++) {
    addPageNumber(i, totalPages);
  }

  if (endPage < totalPages - 1) {
    addEllipsis();
  }

  if (totalPages > 1) {
    addPageNumber(totalPages, totalPages);
  }
}

function addPageNumber(page, totalPages) {
  const pageNumbersContainer = document.getElementById('page-numbers');
  const pageNumber = document.createElement('div');
  pageNumber.className = `page-number ${page === currentPage ? 'active' : ''}`;
  pageNumber.textContent = page;
  pageNumber.addEventListener('click', () => goToPage(page));
  pageNumbersContainer.appendChild(pageNumber);
}

function addEllipsis() {
  const pageNumbersContainer = document.getElementById('page-numbers');
  const ellipsis = document.createElement('div');
  ellipsis.className = 'page-number';
  ellipsis.textContent = '...';
  ellipsis.style.cursor = 'default';
  ellipsis.style.background = 'transparent';
  ellipsis.style.border = 'none';
  pageNumbersContainer.appendChild(ellipsis);
}

function goToPage(page) {
  currentPage = page;
  populateTable();
  updatePaginationInfo();
}

function goToPreviousPage() {
  if (currentPage > 1) {
    currentPage--;
    populateTable();
    updatePaginationInfo();
  }
}

function goToNextPage() {
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    populateTable();
    updatePaginationInfo();
  }
}

// ===== SUMMARY AND STATS =====

function updateSummary() {
  const stats = {
    total: requests.length,
    pending: requests.filter(req => (req.hr_approval_status || req.status || '').toLowerCase() === 'pending').length,
    approved: requests.filter(req => (req.hr_approval_status || req.status || '').toLowerCase() === 'approved').length,
    rejected: requests.filter(req => (req.hr_approval_status || req.status || '').toLowerCase() === 'declined' || (req.hr_approval_status || req.status || '').toLowerCase() === 'rejected').length
  };

  console.log('📊 Summary stats:', stats);

  const totalCount = document.getElementById('total-count');
  const pendingCount = document.getElementById('pending-count');
  const approvedCount = document.getElementById('approved-count');
  const rejectedCount = document.getElementById('rejected-count');

  if (totalCount) totalCount.textContent = stats.total;
  if (pendingCount) pendingCount.textContent = stats.pending;
  if (approvedCount) approvedCount.textContent = stats.approved;
  if (rejectedCount) rejectedCount.textContent = stats.rejected;
}

// ===== REQUEST DETAILS MODAL =====

async function showRequestDetails(leaveId) {
  try {
    console.log(`📄 Fetching details for leave ID: ${leaveId}`);
    currentViewRequestId = leaveId;

    const response = await fetch(`${API_BASE_URL}/hr/leave-request/${leaveId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ Request details loaded:', data.leave_request);
      const request = data.leave_request;
      populateViewModal(request);
      document.getElementById('viewModal').style.display = 'block';
    } else {
      showNotification(data.message || 'Failed to load request details', 'error');
    }
  } catch (error) {
    console.error('❌ Error fetching request details:', error);
    showNotification('Failed to load request details', 'error');
  }
}

function populateViewModal(request) {
  document.getElementById('modal-employee').textContent = request.employee_name || 'N/A';
  document.getElementById('modal-department').textContent = request.department || 'N/A';
  document.getElementById('modal-designation').textContent = request.designation || 'N/A';
  document.getElementById('modal-email').textContent = request.email || 'N/A';
  document.getElementById('modal-employee-type').textContent = request.employee_type || 'N/A';

  document.getElementById('modal-type').textContent = request.leave_type || 'N/A';
  document.getElementById('modal-duration').textContent = `${request.total_days || 0} days`;
  document.getElementById('modal-start-date').textContent = request.start_date || 'N/A';
  document.getElementById('modal-end-date').textContent = request.end_date || 'N/A';

  document.getElementById('modal-reason').textContent = request.reason || 'No reason provided';
  document.getElementById('modal-contact').textContent = request.contact_number || 'N/A';
  document.getElementById('modal-applied-on').textContent = request.applied_date || 'N/A';
  document.getElementById('modal-approver').textContent = request.approved_by || 'N/A';

  const documentInfo = document.getElementById('document-info');
  if (request.document_path) {
    documentInfo.style.display = 'block';
  } else {
    documentInfo.style.display = 'none';
  }

  const status = (request.hr_approval_status || request.status || 'pending').toLowerCase();
  const statusBadge = document.getElementById('modal-status-badge');
  statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  statusBadge.className = `status-badge status-${status}`;

  const changeActionSection = document.getElementById('change-action-section');
  const currentStatusElement = document.getElementById('current-status');

  if (status === 'pending') {
    changeActionSection.style.display = 'none';
  } else {
    changeActionSection.style.display = 'block';
    currentStatusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function handleChangeAction() {
  if (!currentViewRequestId) return;

  const request = requests.find(req => req.id === currentViewRequestId);
  if (!request) return;

  const status = (request.hr_approval_status || request.status || 'pending').toLowerCase();
  const employeeName = request.employee_name || 'Employee';

  if (status === 'approved') {
    showRejectConfirmation(currentViewRequestId, employeeName, true);
  } else if (status === 'declined' || status === 'rejected') {
    showApproveConfirmation(currentViewRequestId, employeeName, true);
  }
}

// ===== ACTION CONFIRMATION MODALS =====

function showApproveConfirmation(leaveId, employeeName, isChangeAction = false) {
  const modal = document.getElementById('confirmationModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('modalConfirmBtn');

  modalTitle.textContent = 'Approve Leave Request';
  modalMessage.innerHTML = `
    <p>Are you sure you want to approve the leave request for <strong>${employeeName}</strong>?</p>
    <div class="form-group">
      <label for="hr-remarks-approve">HR Remarks (Optional)</label>
      <textarea id="hr-remarks-approve" rows="3" placeholder="You can add remarks if needed..."></textarea>
    </div>
    ${isChangeAction ? `<p class="text-warning"><i class="fas fa-exclamation-triangle"></i> This will change the current status to Approved.</p>` : ''}
  `;

  confirmBtn.textContent = 'Approve';
  confirmBtn.className = 'btn btn-success';
  confirmBtn.innerHTML = '<i class="fas fa-check"></i> Approve';

  pendingAction = {
    type: 'approve',
    leaveId: leaveId,
    employeeName: employeeName,
    isChangeAction: isChangeAction
  };

  modal.style.display = 'block';
}

function showRejectConfirmation(leaveId, employeeName, isChangeAction = false) {
  const modal = document.getElementById('confirmationModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('modalConfirmBtn');

  modalTitle.textContent = 'Reject Leave Request';
  modalMessage.innerHTML = `
    <p>Are you sure you want to reject the leave request for <strong>${employeeName}</strong>?</p>
    <div class="form-group">
      <label for="hr-remarks-reject">HR Remarks (Optional)</label>
      <textarea id="hr-remarks-reject" rows="3" placeholder="You can add remarks if needed..."></textarea>
    </div>
    ${isChangeAction ? '<p class="text-warning"><i class="fas fa-exclamation-triangle"></i> This will change the current status to Rejected.</p>' : ''}
  `;

  confirmBtn.textContent = 'Reject';
  confirmBtn.className = 'btn btn-danger';
  confirmBtn.innerHTML = '<i class="fas fa-times"></i> Reject';

  pendingAction = {
    type: 'reject',
    leaveId: leaveId,
    employeeName: employeeName,
    isChangeAction: isChangeAction
  };

  modal.style.display = 'block';
}

function showChangeActionOptions(leaveId, employeeName, currentStatus) {
  const status = currentStatus.toLowerCase();
  if (status === 'approved') {
    showRejectConfirmation(leaveId, employeeName, true);
  } else if (status === 'declined' || status === 'rejected') {
    showApproveConfirmation(leaveId, employeeName, true);
  }
}

// ===== ACTION EXECUTION =====

async function executePendingAction() {
  if (!pendingAction) return;

  const { type, leaveId, employeeName, isChangeAction } = pendingAction;

  const remarksTextareaId = type === 'approve' ? 'hr-remarks-approve' : 'hr-remarks-reject';
  const hrRemarks = document.getElementById(remarksTextareaId)?.value.trim() || '';

  try {
    console.log(`📝 Executing ${type} action for leave ID: ${leaveId}`);
    showNotification(`Processing ${type} action...`, 'info');

    const response = await fetch(`${API_BASE_URL}/hr/update-status`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: leaveId,
        status: type === 'approve' ? 'Approved' : 'Rejected',
        approval_reason: hrRemarks,
        approved_by: 'HR Manager'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ Status updated successfully');
      showNotification(
        data.message || `Leave request ${type === 'approve' ? 'approved' : 'rejected'} successfully!`,
        'success'
      );

      await fetchLeaveRequests();

      closeModal();
      const viewModal = document.getElementById('viewModal');
      if (viewModal) viewModal.style.display = 'none';

    } else {
      throw new Error(data.message || `Failed to ${type} leave request`);
    }

  } catch (error) {
    console.error(`❌ Error ${type}ing leave request:`, error);
    showNotification(
      `Failed to ${type} leave request: ${error.message}`,
      'error'
    );
  } finally {
    pendingAction = null;
  }
}

function closeModal() {
  const modal = document.getElementById('confirmationModal');
  if (modal) modal.style.display = 'none';
  pendingAction = null;
}

// ===== NOTIFICATION SYSTEM =====

function showNotification(message, type = 'info') {
  const existingNotifications = document.querySelectorAll('.custom-notification');
  existingNotifications.forEach(notification => {
    notification.remove();
  });

  const notification = document.createElement('div');
  notification.className = `custom-notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 100);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

function getNotificationIcon(type) {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  return icons[type] || 'fa-info-circle';
}

// ===== USER INFO =====

async function loadUserInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/hr/dashboard-data`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.user_info) {
      updateUserInfo(data.user_info);
    }
  } catch (error) {
    console.error('❌ Error fetching user info:', error);
  }
}

function updateUserInfo(userInfo) {
  const userNameElement = document.getElementById('user-name');
  const userAvatarElement = document.getElementById('user-avatar');
  const userDesignationElement = document.getElementById('user-designation');

  if (userNameElement && userInfo.user_name) {
    userNameElement.textContent = userInfo.user_name;
  }

  if (userAvatarElement && userInfo.user_name) {
    userAvatarElement.textContent = userInfo.user_name.charAt(0).toUpperCase();
  }

  if (userDesignationElement && userInfo.designation) {
    userDesignationElement.textContent = userInfo.designation;
  }
}

// ===== DOCUMENT REMINDERS =====

async function loadDocumentReminders() {
  try {
    const response = await fetch(`${API_BASE_URL}/hr/pending-documents`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.pending_documents && data.pending_documents.length > 0) {
        showDocumentReminders(data.pending_documents);
      }
    }
  } catch (error) {
    console.error('❌ Error loading document reminders:', error);
  }
}

function showDocumentReminders(pendingDocs) {
  const reminderSection = document.getElementById('documentReminder');
  const pendingList = document.getElementById('pendingDocumentsList');

  if (!reminderSection || !pendingList) return;

  let html = '';
  pendingDocs.forEach(doc => {
    html += `
      <div class="pending-doc-item">
        <div>
          <strong>${doc.employee}</strong> - ${doc.leave_type} Leave
          <div style="font-size: 0.8em; color: #666;">
            Applied: ${doc.applied_date} • ${doc.days_pending} days pending
          </div>
        </div>
        <button class="btn btn-sm btn-warning" onclick="remindEmployee(${doc.leave_id}, '${doc.employee}')">
          <i class="fas fa-bell"></i> Remind
        </button>
      </div>
    `;
  });

  pendingList.innerHTML = html;
  reminderSection.style.display = 'block';
}

async function remindEmployee(leaveId, employeeName) {
  showNotification(`Reminder sent to ${employeeName} about pending document`, 'info');
}

// ===== LEAVE DISTRIBUTION =====

async function loadLeaveDistribution() {
  try {
    const response = await fetch(`${API_BASE_URL}/hr/leave-policies`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        updateDistributionDisplay(data.policies);
      }
    }
  } catch (error) {
    console.error('❌ Error loading leave distribution:', error);
  }
}

function updateDistributionDisplay(policies) {
  console.log('📋 Leave policies loaded:', policies);
}

// Make functions globally accessible
window.showApproveConfirmation = showApproveConfirmation;
window.showRejectConfirmation = showRejectConfirmation;
window.showRequestDetails = showRequestDetails;
window.showChangeActionOptions = showChangeActionOptions;
window.remindEmployee = remindEmployee;

console.log('✅ Leave Request HR Dashboard initialized');