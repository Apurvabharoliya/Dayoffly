// Sample data for leave requests for a single employee
    const employeeData = {
      empName: 'Milli Jethwani',
      empId: 'EMP2001',
      department: 'Sales',
      designation: 'Sales Executive',
      totalLeaveBalance: 6
    };

    const leaveRequests = [
      {
        requestId: 'RID1',
        empName: 'Milli Jethwani',
        empId: 'EMP2001',
        department: 'Sales',
        designation: 'Sales Executive',
        leaveType: 'Casual Leave',
        startDate: '2025-09-20',
        endDate: '2025-09-22',
        totalDays: 3,
        appliedDate: '2025-09-10',
        status: 'pending',
        balanceBefore: '6',
        balanceAfter: '3',
        approverName: 'Rohit Mehra',
        approverDesignation: 'Sales Manager',
        decisionDate: '--',
        remarks: 'Waiting for approval',
        documents: [],
        logs: [
          {time: '2025-09-10 09:12', entry: 'Applied by employee'}
        ]
      },
      {
        requestId: 'RID2',
        empName: 'Milli Jethwani',
        empId: 'EMP2001',
        department: 'Sales',
        designation: 'Sales Executive',
        leaveType: 'Sick Leave',
        startDate: '2025-09-05',
        endDate: '2025-09-07',
        totalDays: 3,
        appliedDate: '2025-09-04',
        status: 'approved',
        balanceBefore: '6',
        balanceAfter: '3',
        approverName: 'Rohit Mehra',
        approverDesignation: 'Sales Manager',
        decisionDate: '2025-09-04',
        remarks: 'Medical certificate accepted.',
        documents: ['Medical_Certificate_Milli_Jethwani.pdf'],
        logs: [
          {time: '2025-09-04 08:23', entry: 'Applied by employee'},
          {time: '2025-09-04 14:02', entry: 'Approved by Sales Manager'}
        ]
      },
      {
        requestId: 'RID3',
        empName: 'Milli Jethwani',
        empId: 'EMP2001',
        department: 'Sales',
        designation: 'Sales Executive',
        leaveType: 'Work From Home',
        startDate: '2025-09-15',
        endDate: '2025-09-15',
        totalDays: 1,
        appliedDate: '2025-09-14',
        status: 'declined',
        balanceBefore: '6',
        balanceAfter: '6',
        approverName: 'Rohit Mehra',
        approverDesignation: 'Sales Manager',
        decisionDate: '2025-09-14',
        remarks: 'Team needs on-site presence that day.',
        documents: [],
        logs: [
          {time: '2025-09-14 11:20', entry: 'Applied by employee'},
          {time: '2025-09-14 13:30', entry: 'Declined by Sales Manager'}
        ]
      },
      {
        requestId: 'RID4',
        empName: 'Milli Jethwani',
        empId: 'EMP2001',
        department: 'Sales',
        designation: 'Sales Executive',
        leaveType: 'Earned Leave',
        startDate: '2025-09-25',
        endDate: '2025-09-28',
        totalDays: 4,
        appliedDate: '2025-09-18',
        status: 'approved',
        balanceBefore: '6',
        balanceAfter: '2',
        approverName: 'Rohit Mehra',
        approverDesignation: 'Sales Manager',
        decisionDate: '2025-09-19',
        remarks: 'Approved as per policy.',
        documents: [],
        logs: [
          {time: '2025-09-18 09:00', entry: 'Applied by employee'},
          {time: '2025-09-19 10:30', entry: 'Approved by Sales Manager'}
        ]
      },
      {
        requestId: 'RID5',
        empName: 'Milli Jethwani',
        empId: 'EMP2001',
        department: 'Sales',
        designation: 'Sales Executive',
        leaveType: 'Casual Leave',
        startDate: '2025-09-30',
        endDate: '2025-10-02',
        totalDays: 3,
        appliedDate: '2025-09-20',
        status: 'pending',
        balanceBefore: '6',
        balanceAfter: '3',
        approverName: 'Rohit Mehra',
        approverDesignation: 'Sales Manager',
        decisionDate: '--',
        remarks: 'Under review',
        documents: [],
        logs: [
          {time: '2025-09-20 09:10', entry: 'Applied by employee'}
        ]
      }
    ];

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
      if (!arr || arr.length === 0) return '<div class="text-xs text-gray-500 italic">No documents submitted</div>';
      
      return arr.map(d => `
        <div class="flex items-center gap-2 text-sm mb-1">
          <i class="fas fa-file-pdf text-red-500"></i>
          <a href="${d}" target="_blank" class="text-blue-500 hover:underline truncate">${d}</a>
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
      document.getElementById('total-leave-balance').textContent = employeeData.totalLeaveBalance;
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
      switch(currentSort) {
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
      
      // Simulate loading (for demonstration purposes)
      setTimeout(() => {
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
        
        // Show empty state if no requests
        if (paginatedRequests.length === 0) {
          loadingIndicator.style.display = 'none';
          table.style.display = 'none';
          emptyState.style.display = 'block';
          renderPagination(0);
          return;
        }
        
        // Render table rows
        paginatedRequests.forEach(req => {
          const statusInfo = statusMap[req.status];
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
                          <div>Approver:</div><div class="font-semibold">${request.approverName}</div>
                          <div>Designation:</div><div class="font-semibold">${request.approverDesignation}</div>
                          <div>Decision Date:</div><div class="font-semibold">${formatDate(request.decisionDate)}</div>
                          <div>Status:</div><div><span class="status-badge ${statusMap[request.status].class}">${statusMap[request.status].text}</span></div>
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
      }, 500); // Simulated loading delay
    }

    // Initialize the page
    function init() {
      // Update last updated time
      // document.getElementById('last-updated-time').textContent = new Date().toLocaleString();
      
      // Update statistics
      updateStats();
      
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
      
      // Export button
      document.getElementById('export-btn').addEventListener('click', () => {
        alert('Export functionality would be implemented here');
      });
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);