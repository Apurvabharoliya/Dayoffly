// leaveStatus.js - Complete Fixed File
// Global variables to store data from API
let employeeData = {};
let leaveRequests = [];
// Configuration
const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let currentFilter = 'all';
let currentSort = 'appliedDate';
let currentSearch = '';

// Status mapping - Only 3 statuses now
const statusMap = {
  pending: { text: 'Pending', class: 'status-pending', icon: 'clock' },
  approved: { text: 'Approved', class: 'status-approved', icon: 'check-circle' },
  declined: { text: 'Declined', class: 'status-declined', icon: 'times-circle' }
};

// Format date to a more readable format
function formatDate(dateString) {
  if (!dateString || dateString === '--') return '--';

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format documents list
function formatDocs(arr) {
  if (!arr || arr.length === 0) return '<div class="no-documents">No documents submitted</div>';

  return arr.map(d => `
        <div class="document-item">
          <i class="fas fa-file-pdf"></i>
          <a href="${d}" target="_blank" title="${d}">${d.split('/').pop()}</a>
        </div>
      `).join('');
}

// Format logs
function formatLogs(logs) {
  if (!logs || logs.length === 0) return '<li class="text-xs text-gray-500 italic">No logs available</li>';

  return logs.map(l => `
        <li class="mb-2 border-l-2 border-blue-200 pl-2 py-1">
          <div class="text-xs text-gray-500">${l.time}</div>
          <div class="text-sm">${l.entry}</div>
        </li>
      `).join('');
}

// Update statistics
function updateStats() {
  const totalRequests = leaveRequests.length;
  const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = leaveRequests.filter(req => req.status === 'approved').length;
  const declinedRequests = leaveRequests.filter(req => req.status === 'declined').length;

  // Animate the numbers
  animateCount(document.getElementById('total-requests'), totalRequests);
  animateCount(document.getElementById('pending-requests'), pendingRequests);
  animateCount(document.getElementById('approved-requests'), approvedRequests);
  animateCount(document.getElementById('declined-requests'), declinedRequests);

  // Update leave balance
  document.getElementById('total-leave-balance').textContent = employeeData.totalLeaveBalance || 0;
}

// Animation function (same as in EmployeeDashboard.js)
function animateCount(el, to, duration = 900) {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(start + (to - start) * (1 - Math.pow(1 - progress, 3)));
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Filter and sort requests
function getFilteredAndSortedRequests() {
  let filtered = [...leaveRequests];

  // Apply status filter
  if (currentFilter !== 'all') {
    filtered = filtered.filter(req => req.status === currentFilter);
  }

  // Apply search filter
  if (currentSearch) {
    const searchTerm = currentSearch.toLowerCase();
    filtered = filtered.filter(req =>
      req.requestId.toLowerCase().includes(searchTerm) ||
      req.leaveType.toLowerCase().includes(searchTerm)
    );
  }

  // Apply sorting
  switch (currentSort) {
    case 'appliedDate':
      filtered.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
      break;
    case 'appliedDateOldest':
      filtered.sort((a, b) => new Date(a.appliedDate) - new Date(b.appliedDate));
      break;
    case 'startDate':
      filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      break;
    case 'status':
      filtered.sort((a, b) => a.status.localeCompare(b.status));
      break;
  }

  return filtered;
}

// Render pagination controls
function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginationButtons = document.getElementById('pagination-buttons');
  const paginationInfo = document.getElementById('pagination-info');

  if (totalPages <= 1) {
    paginationButtons.innerHTML = '';
    paginationInfo.textContent = totalItems > 0 ? `Showing all ${totalItems} requests` : '';
    return;
  }

  // Update pagination info
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} requests`;

  // Create pagination buttons
  let buttons = '';

  // Previous button
  buttons += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
          <i class="fas fa-chevron-left"></i>
        </button>
      `;

  // Page buttons
  for (let i = 1; i <= totalPages; i++) {
    buttons += `
          <button class="pagination-btn ${currentPage === i ? 'active' : ''}" 
                  data-page="${i}">${i}</button>
        `;
  }

  // Next button
  buttons += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
          <i class="fas fa-chevron-right"></i>
        </button>
      `;

  paginationButtons.innerHTML = buttons;

  // Add event listeners to pagination buttons
  document.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      currentPage = parseInt(btn.getAttribute('data-page'));
      renderTable();
    });
  });
}

// Render table
function renderTable() {
  const loadingIndicator = document.getElementById('loading-indicator');
  const table = document.getElementById('requests-table');
  const emptyState = document.getElementById('empty-state');
  const tbody = document.getElementById('requests-tbody');

  // Show loading indicator
  loadingIndicator.style.display = 'block';
  table.style.display = 'none';
  emptyState.style.display = 'none';

  // No simulated loading delay needed since data is already loaded
  tbody.innerHTML = '';

  const filteredRequests = getFilteredAndSortedRequests();
  const totalItems = filteredRequests.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Adjust current page if it's out of bounds
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }

  // Calculate pagination slice
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Show empty state if no requests after filtering
  if (paginatedRequests.length === 0) {
    loadingIndicator.style.display = 'none';
    table.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.innerHTML = `
          <i class="fas fa-search"></i>
          <p>No leave requests match your filters</p>
          <p>Try changing your search term or status filter</p>
        `;
    renderPagination(0);
    return;
  }

  // Render table rows
  paginatedRequests.forEach(req => {
    // FIXED: Add null check for status
    const status = req.status || 'pending';
    const statusInfo = statusMap[status] || statusMap.pending; // Fallback to pending

    const row = document.createElement('tr');
    row.innerHTML = `
          <td>
            <div class="font-semibold">${req.requestId}</div>
          </td>
          <td>${req.leaveType}</td>
          <td>
            <div>${formatDate(req.startDate)} — ${formatDate(req.endDate)}</div>
            <div class="employee-info">${req.totalDays} day${req.totalDays !== 1 ? 's' : ''}</div>
          </td>
          <td>${formatDate(req.appliedDate)}</td>
          <td>
            <span class="status-badge ${statusInfo.class}">
              <i class="fas fa-${statusInfo.icon}"></i>
              ${statusInfo.text}
            </span>
          </td>
          <td>
            <div class="flex items-center gap-1">
              <span class="employee-info">Before:</span>
              <span class="font-semibold">${req.balanceBefore}</span>
              <i class="fas fa-arrow-right text-gray-400 text-xs"></i>
              <span class="employee-info">After:</span>
              <span class="font-semibold">${req.balanceAfter}</span>
            </div>
          </td>
          <td>
            <button class="details-btn" data-request-id="${req.requestId}">
              <i class="fas fa-chevron-down"></i> Details
            </button>
          </td>
        `;
    tbody.appendChild(row);
  });

  // Hide loading indicator and show table
  loadingIndicator.style.display = 'none';
  table.style.display = 'table';
  emptyState.style.display = 'none';

  // Add event listeners to details buttons
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const requestId = e.target.closest('.details-btn').getAttribute('data-request-id');
      const request = leaveRequests.find(req => req.requestId === requestId);

      if (!request) return;

      // Find the row and check if details are already shown
      const row = e.target.closest('tr');
      const nextRow = row.nextElementSibling;

      if (nextRow && nextRow.classList.contains('details-row')) {
        // Remove details row
        nextRow.remove();
        btn.innerHTML = '<i class="fas fa-chevron-down"></i> Details';
      } else {
        // Remove any existing details row
        document.querySelectorAll('.details-row').forEach(r => r.remove());

        // Reset all buttons
        document.querySelectorAll('.details-btn').forEach(b => {
          b.innerHTML = '<i class="fas fa-chevron-down"></i> Details';
        });

        // Create details row
        const detailsRow = document.createElement('tr');
        detailsRow.classList.add('details-row');
        detailsRow.innerHTML = `
              <td colspan="7">
                <div class="details-panel">
                  <div class="details-grid">
                    <div class="detail-section">
                      <h4><i class="fas fa-info-circle"></i> Request Details</h4>
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>Request ID:</div><div class="font-semibold">${request.requestId}</div>
                        <div>Leave Type:</div><div class="font-semibold">${request.leaveType}</div>
                        <div>Duration:</div><div class="font-semibold">${request.totalDays} day${request.totalDays !== 1 ? 's' : ''}</div>
                        <div>Applied Date:</div><div class="font-semibold">${formatDate(request.appliedDate)}</div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <h4><i class="fas fa-user-check"></i> Approval Details</h4>
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>Approver:</div><div class="font-semibold">${request.status === 'pending' ? '--' : (request.approverName || 'N/A')}</div>
                        <div>Designation:</div><div class="font-semibold">${request.status === 'pending' ? '--' : (request.approverDesignation || 'N/A')}</div>
                        <div>Decision Date:</div><div class="font-semibold">${request.status === 'pending' ? '--' : formatDate(request.decisionDate)}</div>
                        <div>Status:</div><div><span class="status-badge ${statusMap[request.status]?.class || 'status-pending'}">${statusMap[request.status]?.text || 'Pending'}</span></div>
                      </div>
                    </div>

                    <div class="detail-section">
                      <h4><i class="fas fa-sticky-note"></i> Remarks</h4>
                      <p class="text-sm">${request.remarks}</p>
                    </div>

                    <div class="detail-section">
                      <h4><i class="fas fa-paperclip"></i> Documents</h4>
                      ${formatDocs(request.documents)}
                    </div>

                    <div class="detail-section">
                      <h4><i class="fas fa-history"></i> Activity Log</h4>
                      <ul class="text-sm max-h-40 overflow-y-auto">
                        ${formatLogs(request.logs)}
                      </ul>
                    </div>
                  </div>
                </div>
              </td>
            `;

        // Insert after the current row
        row.parentNode.insertBefore(detailsRow, row.nextSibling);
        btn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide';
      }
    });
  });

  // Render pagination
  renderPagination(totalItems);
}

// Function to get JWT token from localStorage (same as other pages)
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Function to load leave status data from API
async function loadLeaveStatusData() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token found');
      // Return mock data as fallback
      return getMockLeaveData();
    }

    // Use the Flask server URL for API calls
    const apiBaseUrl = 'http://localhost:5000';
    const response = await fetch(`${apiBaseUrl}/api/leave-status-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Leave status data loaded:', data);

    // Check if the response contains an error
    if (data.error) {
      console.error('API returned error:', data.error);
      // Return mock data as fallback
      return getMockLeaveData();
    }

    // Update global variables with API data
    employeeData = data.employeeData || {};
    leaveRequests = data.leaveRequests || [];

    // FIXED: Ensure employeeData has proper values
    if (!employeeData.empName) {
      console.warn('Employee name not found in response, using fallback');
      employeeData.empName = 'Employee User';
    }

    return { success: true };
  } catch (error) {
    console.error('Error loading leave status data:', error);
    // Return mock data as fallback
    return getMockLeaveData();
  }
}

// Function to get mock leave data for fallback
function getMockLeaveData() {
  employeeData = {
    empName: 'Demo Employee',
    empId: 'EMP00001',
    department: 'IT Department',
    designation: 'Software Developer',
    totalLeaveBalance: 15
  };

  leaveRequests = [
    {
      requestId: 'RID001',
      leaveType: 'Annual Leave',
      startDate: '2024-12-01',
      endDate: '2024-12-03',
      totalDays: 3,
      appliedDate: '2024-11-20',
      status: 'approved',
      balanceBefore: 15,
      balanceAfter: 12,
      approverName: 'John Manager',
      approverDesignation: 'Team Lead',
      decisionDate: '2024-11-21',
      remarks: 'Approved for vacation',
      documents: [],
      logs: [
        { time: '2024-11-20 10:00:00', entry: 'Leave request submitted' },
        { time: '2024-11-21 14:30:00', entry: 'Approved by manager' }
      ]
    },
    {
      requestId: 'RID002',
      leaveType: 'Sick Leave',
      startDate: '2024-11-15',
      endDate: '2024-11-15',
      totalDays: 1,
      appliedDate: '2024-11-14',
      status: 'pending',
      balanceBefore: 12,
      balanceAfter: 11,
      approverName: null,
      approverDesignation: null,
      decisionDate: null,
      remarks: 'Medical certificate attached',
      documents: ['medical_cert.pdf'],
      logs: [
        { time: '2024-11-14 09:15:00', entry: 'Leave request submitted' }
      ]
    }
  ];

  return { success: true };
}

// Initialize the page
async function init() {
  // Show loading state
  const loadingIndicator = document.getElementById('loading-indicator');
  const table = document.getElementById('requests-table');
  const emptyState = document.getElementById('empty-state');

  loadingIndicator.style.display = 'block';
  table.style.display = 'none';
  emptyState.style.display = 'none';

  // Load data from API
  const result = await loadLeaveStatusData();

  // Always proceed since we have fallback data

  // Update employee info in HTML (always show employee data)
  updateEmployeeInfo();

  // Update statistics
  updateStats();

  // Check if we have actual data
  if (!leaveRequests || leaveRequests.length === 0) {
    // Show empty state for no leave requests
    loadingIndicator.style.display = 'none';
    table.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.innerHTML = `
          <i class="fas fa-inbox"></i>
          <p>No leave requests found</p>
          <p>You haven't applied for any leaves yet</p>
        `;
    renderPagination(0);
    return;
  }

  // Render table
  renderTable();

  // Add event listeners to filters
  document.getElementById('filter-status').addEventListener('change', (e) => {
    currentFilter = e.target.value;
    currentPage = 1;
    renderTable();
  });

  document.getElementById('sort-by').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTable();
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    currentPage = 1;
    renderTable();
  });

  // Export button removed
}

// Function to update employee info in HTML
function updateEmployeeInfo() {
  // Update employee name and details
  const employeeNameEl = document.querySelector('.employee-details h2');
  const employeeInfoEl = document.querySelector('.employee-details p');

  if (employeeNameEl && employeeData.empName) {
    employeeNameEl.textContent = employeeData.empName;
  } else if (employeeNameEl) {
    employeeNameEl.textContent = 'Employee User'; // Fallback name
  }

  if (employeeInfoEl && employeeData.empId && employeeData.department) {
    employeeInfoEl.innerHTML = `${employeeData.empId} • ${employeeData.department} Department`;
  } else if (employeeInfoEl) {
    employeeInfoEl.innerHTML = 'EMP00001 • General Department'; // Fallback info
  }

  // Update designation
  const designationEl = document.querySelector('.employee-details p:last-child');
  if (designationEl && employeeData.designation) {
    designationEl.textContent = employeeData.designation;
  } else if (designationEl) {
    designationEl.textContent = 'Employee'; // Fallback designation
  }

  // Update avatar
  const avatarEl = document.querySelector('.employee-avatar');
  if (avatarEl && employeeData.empName) {
    avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.empName)}&background=0D8ABC&color=fff&size=80`;
  } else if (avatarEl) {
    avatarEl.src = `https://ui-avatars.com/api/?name=Employee&background=0D8ABC&color=fff&size=80`;
  }

  // Update header avatar
  const headerAvatarEl = document.getElementById('user-avatar-img');
  if (headerAvatarEl && employeeData.empName) {
    headerAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.empName)}&background=667eea&color=fff&size=36`;
    headerAvatarEl.alt = `${employeeData.empName}'s Avatar`;
  } else if (headerAvatarEl) {
    headerAvatarEl.src = `https://ui-avatars.com/api/?name=Employee&background=667eea&color=fff&size=36`;
    headerAvatarEl.alt = `Employee's Avatar`;
  }

  // Update leave balance display
  const leaveBalanceEl = document.getElementById('total-leave-balance');
  if (leaveBalanceEl && employeeData.totalLeaveBalance !== undefined) {
    leaveBalanceEl.textContent = employeeData.totalLeaveBalance;
  } else if (leaveBalanceEl) {
    leaveBalanceEl.textContent = '20'; // Fallback balance
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Auto-refresh removed as per user request