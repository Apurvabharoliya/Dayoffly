// leaveRequest.js - Enhanced Version with Professional Modal Dialogs

let requests = [];
let filteredRequests = [];
let currentFilter = 'all';
let currentPage = 1;
const itemsPerPage = 10;
let pendingAction = null;
let currentViewRequestId = null;

// API Base URL - Point to your Flask backend
const API_BASE_URL = 'http://localhost:5000';

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Leave Requests Page...');
  initializePage();
});

async function initializePage() {
  await fetchLeaveRequests();
  setupEventListeners();

  // Refresh data every 30 seconds for live updates
  setInterval(fetchLeaveRequests, 30000);
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
  searchInput.addEventListener('input', debounce(handleSearch, 300));

  // Pagination
  document.getElementById('prev-page').addEventListener('click', goToPreviousPage);
  document.getElementById('next-page').addEventListener('click', goToNextPage);

  // Modal event listeners
  const modal = document.getElementById('confirmationModal');
  const confirmBtn = document.getElementById('modalConfirmBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');
  const closeBtn = document.querySelector('.close-modal');

  confirmBtn.addEventListener('click', executePendingAction);
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  // View modal listeners
  const viewModal = document.getElementById('viewModal');
  const closeViewModal = document.getElementById('closeViewModal');
  const closeViewBtn = viewModal.querySelector('.close-btn');
  const changeActionBtn = document.getElementById('change-action-btn');

  closeViewModal.addEventListener('click', () => viewModal.style.display = 'none');
  closeViewBtn.addEventListener('click', () => viewModal.style.display = 'none');
  changeActionBtn.addEventListener('click', handleChangeAction);

  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
    if (event.target === viewModal) {
      viewModal.style.display = 'none';
    }
  });
}

// Data fetching functions
async function fetchLeaveRequests() {
  try {
    showLoadingState();

    const response = await fetch(`${API_BASE_URL}/hr/leave-requests`, {
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
      console.log('✅ Leave requests fetched successfully');
      requests = data.leave_requests || [];
      applyFilter(currentFilter);
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
  tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--gray);">
                <div class="loading-spinner"></div>
                Loading leave requests...
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

  if (error.message.includes('Authentication')) {
    showNotification('Please login to access leave requests', 'error');
  } else {
    showNotification('Failed to load leave requests', 'error');
  }
}

// Filtering and search functions
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
    filtered = filtered.filter(req =>
      req.status.toLowerCase() === currentFilter.toLowerCase()
    );
  }

  // Apply search filter
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(req =>
      req.employee?.toLowerCase().includes(searchTerm) ||
      req.department?.toLowerCase().includes(searchTerm) ||
      req.type?.toLowerCase().includes(searchTerm)
    );
  }

  filteredRequests = filtered;
  populateTable();
  updateSummary();
  updatePaginationInfo();
}

function handleSearch() {
  applyFilter(currentFilter);
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

// Table population functions
function populateTable() {
  const tbody = document.getElementById('request-table');

  if (filteredRequests.length === 0) {
    tbody.innerHTML = getEmptyStateHTML();
    return;
  }

  tbody.innerHTML = '';

  // Calculate pagination slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  paginatedRequests.forEach(req => {
    const row = createRequestRow(req);
    tbody.appendChild(row);
  });
}

function createRequestRow(req) {
  const row = document.createElement('tr');
  row.innerHTML = `
        <td>
            <div class="employee-info">
                <div class="employee-avatar">
                    ${req.employee ? req.employee.charAt(0).toUpperCase() : 'U'}
                </div>
                <div class="employee-details">
                    <div class="employee-name">${req.employee || 'Unknown Employee'}</div>
                    ${req.department ? `<div class="employee-department">${req.department}</div>` : ''}
                </div>
            </div>
        </td>
        <td>
            <span class="leave-type-badge">${req.type || 'N/A'}</span>
        </td>
        <td>${req.dates || 'N/A'}</td>
        <td>${req.duration || 'N/A'}</td>
        <td>
            <span class="status status-${req.status ? req.status.toLowerCase() : 'pending'}">
                ${req.status || 'Pending'}
            </span>
        </td>
        <td>
            <div class="action-buttons">
                ${req.status === 'Pending' ? getActionButtons(req) : getViewAndChangeButtons(req)}
            </div>
        </td>
    `;

  return row;
}

function getActionButtons(req) {
  return `
        <button class="approve-btn" onclick="showApproveConfirmation(${req.leave_id}, '${req.employee}')">
            <i class="fas fa-check"></i> Approve
        </button>
        <button class="reject-btn" onclick="showRejectConfirmation(${req.leave_id}, '${req.employee}')">
            <i class="fas fa-times"></i> Reject
        </button>
        <button class="view-btn" onclick="showRequestDetails(${req.leave_id})">
            <i class="fas fa-eye"></i> View
        </button>
    `;
}

function getViewAndChangeButtons(req) {
  //  <button class="view-btn" onclick="showRequestDetails(${req.leave_id})">
  //           <i class="fas fa-eye"></i> View
  //       </button>
  return `
        <button class="change-btn" onclick="showChangeActionOptions(${req.leave_id}, '${req.employee}', '${req.status}')">
            <i class="fas fa-exchange-alt"></i> Change
        </button>
    `;
}

function getEmptyStateHTML() {
  return `
        <tr>
            <td colspan="6" class="empty-state">
                <i class="fas fa-inbox"></i>
                No leave requests found
            </td>
        </tr>
    `;
}

// Pagination functions
function updatePaginationInfo() {
  const totalItems = filteredRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Update showing info
  document.getElementById('showing-start').textContent = startItem;
  document.getElementById('showing-end').textContent = endItem;
  document.getElementById('total-items').textContent = totalItems;

  // Update pagination buttons
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;

  // Generate page numbers
  generatePageNumbers(totalPages);
}

function generatePageNumbers(totalPages) {
  const pageNumbersContainer = document.getElementById('page-numbers');
  pageNumbersContainer.innerHTML = '';

  if (totalPages === 0) return;

  // Always show first page
  addPageNumber(1, totalPages);

  // Calculate range to show
  let startPage = Math.max(2, currentPage - 1);
  let endPage = Math.min(totalPages - 1, currentPage + 1);

  // Add ellipsis if needed
  if (startPage > 2) {
    addEllipsis();
  }

  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    addPageNumber(i, totalPages);
  }

  // Add ellipsis if needed
  if (endPage < totalPages - 1) {
    addEllipsis();
  }

  // Always show last page if there is more than one page
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

// Summary update function
function updateSummary() {
  const stats = {
    total: requests.length,
    pending: requests.filter(req => req.status === 'Pending').length,
    approved: requests.filter(req => req.status === 'Approved').length,
    rejected: requests.filter(req => req.status === 'Rejected').length
  };

  document.getElementById('total-count').textContent = stats.total;
  document.getElementById('pending-count').textContent = stats.pending;
  document.getElementById('approved-count').textContent = stats.approved;
  document.getElementById('rejected-count').textContent = stats.rejected;
}

// Request details modal
async function showRequestDetails(leaveId) {
  try {
    currentViewRequestId = leaveId;

    const response = await fetch(`${API_BASE_URL}/hr/leave-request/${leaveId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 404) {
        showNotification('Leave request not found. It may have been deleted.', 'error');
        await fetchLeaveRequests(); // Refresh the list
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      const request = data.leave_request;
      populateViewModal(request);
      document.getElementById('viewModal').style.display = 'block';
    } else {
      showNotification(data.message || 'Failed to load request details', 'error');
    }
  } catch (error) {
    console.error('Error fetching request details:', error);
    showNotification('Failed to load request details', 'error');
  }
}

function populateViewModal(request) {
  // Populate employee information
  document.getElementById('modal-employee').textContent = request.employee || 'N/A';
  document.getElementById('modal-department').textContent = request.department || 'N/A';
  document.getElementById('modal-designation').textContent = request.designation || 'N/A';
  document.getElementById('modal-email').textContent = request.email || 'N/A';

  // Populate leave information
  document.getElementById('modal-type').textContent = request.type || 'N/A';
  document.getElementById('modal-duration').textContent = request.duration || 'N/A';
  document.getElementById('modal-start-date').textContent = request.start_date || 'N/A';
  document.getElementById('modal-end-date').textContent = request.end_date || 'N/A';

  // Populate additional details
  document.getElementById('modal-reason').textContent = request.reason || 'No reason provided';
  document.getElementById('modal-contact').textContent = request.contact_info || 'N/A';
  document.getElementById('modal-applied-on').textContent = request.applied_on || 'N/A';
  document.getElementById('modal-approver').textContent = request.approver || 'N/A';

  // Populate status
  const statusBadge = document.getElementById('modal-status-badge');
  statusBadge.textContent = request.status || 'Pending';
  statusBadge.className = 'status-badge';
  
  if (request.status === 'Pending') {
    statusBadge.classList.add('status-pending-badge');
  } else if (request.status === 'Approved') {
    statusBadge.classList.add('status-approved-badge');
  } else if (request.status === 'Rejected') {
    statusBadge.classList.add('status-rejected-badge');
  }

  // Show/hide change action section based on current status
  const changeActionSection = document.getElementById('change-action-section');
  const currentStatusElement = document.getElementById('current-status');
  
  if (request.status === 'Pending') {
    changeActionSection.style.display = 'none';
  } else {
    changeActionSection.style.display = 'block';
    currentStatusElement.textContent = request.status;
  }
}

function handleChangeAction() {
  if (!currentViewRequestId) return;

  const request = requests.find(req => req.leave_id === currentViewRequestId);
  if (!request) return;

  if (request.status === 'Approved') {
    showRejectConfirmation(currentViewRequestId, request.employee, true);
  } else if (request.status === 'Rejected') {
    showApproveConfirmation(currentViewRequestId, request.employee, true);
  }
}

// Confirmation modal functions
function showApproveConfirmation(leaveId, employeeName, isChangeAction = false) {
  const modal = document.getElementById('confirmationModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('modalConfirmBtn');

  modalTitle.textContent = 'Approve Leave Request';
  modalMessage.innerHTML = `
        <p>Are you sure you want to approve the leave request for <strong>${employeeName}</strong>?</p>
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
  if (currentStatus === 'Approved') {
    showRejectConfirmation(leaveId, employeeName, true);
  } else if (currentStatus === 'Rejected') {
    showApproveConfirmation(leaveId, employeeName, true);
  }
}

// Action execution functions
async function executePendingAction() {
  if (!pendingAction) return;

  const { type, leaveId, employeeName, isChangeAction } = pendingAction;

  try {
    showNotification(`Processing ${type} action...`, 'info');

    const response = await fetch(`${API_BASE_URL}/hr/update-leave-status`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leave_id: leaveId,
        status: type === 'approve' ? 'Approved' : 'Rejected',
        employee_name: employeeName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      showNotification(
        data.message || `Leave request ${type === 'approve' ? 'approved' : 'rejected'} successfully!`,
        'success'
      );

      // Refresh data
      await fetchLeaveRequests();

      // Close modals
      closeModal();
      document.getElementById('viewModal').style.display = 'none';

    } else {
      throw new Error(data.message || `Failed to ${type} leave request`);
    }

  } catch (error) {
    console.error(`Error ${type}ing leave request:`, error);
    showNotification(
      `Failed to ${type} leave request: ${error.message}`,
      'error'
    );
  } finally {
    pendingAction = null;
  }
}

function closeModal() {
  document.getElementById('confirmationModal').style.display = 'none';
  pendingAction = null;
}

// Notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
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

  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 100);

  // Auto remove after 5 seconds
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