// Global variables
let currentPage = 1;
const perPage = 8;
let currentFilter = 'all';
let currentDepartment = 'all';
let currentSearch = '';
let employees = [];
let departments = [];

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing Employee Management System...');
    updateUserInfoFromSession();
    initializeApp();
});

// Update user info from session
function updateUserInfoFromSession() {
    try {
        // Try to get user info from localStorage (set during login)
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

        if (userInfo && userInfo.user_name) {
            const userNameElement = document.getElementById('user-name');
            const userAvatarElement = document.getElementById('user-avatar');
            const userRoleElement = document.getElementById('user-role');

            if (userNameElement) {
                userNameElement.textContent = userInfo.user_name;
            }
            if (userAvatarElement) {
                userAvatarElement.textContent = userInfo.user_name.charAt(0).toUpperCase();
            }
            if (userRoleElement && userInfo.designation) {
                userRoleElement.textContent = userInfo.designation;
            }
        } else {
            // Fallback: Try to fetch user info from API
            loadUserInfo();
        }
    } catch (error) {
        console.error('Error updating user info:', error);
        // Fallback: Try to fetch user info from API
        loadUserInfo();
    }
}

// Load user info from API
async function loadUserInfo() {
    try {
        const response = await fetch(`http://127.0.0.1:5000/hr/dashboard-data`, {
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
        } else {
            console.warn('No user info available - user may not be logged in');
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

function updateUserInfo(userInfo) {
    const userNameElement = document.getElementById('user-name');
    const userAvatarElement = document.getElementById('user-avatar');
    const userRoleElement = document.getElementById('user-role');

    if (userNameElement && userInfo.user_name) {
        userNameElement.textContent = userInfo.user_name;
    }

    if (userAvatarElement && userInfo.user_name) {
        userAvatarElement.textContent = userInfo.user_name.charAt(0).toUpperCase();
    }

    if (userRoleElement && userInfo.designation) {
        userRoleElement.textContent = userInfo.designation;
    }
}

// Main initialization function
async function initializeApp() {
    try {
        showLoadingState();

        // Load departments first (they're needed for filters)
        await loadDepartments();
        initializeFilters();

        // Then load employees and stats
        await Promise.all([
            loadEmployees(),
            loadEmployeeStats()
        ]);

        setupEventListeners();
        hideLoadingState();

        console.log('Employee Management System initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showToast('Application initialized with limited functionality. Please start the backend server for full features.', 'warning');
        hideLoadingState();
    }
}

// Load employee statistics
async function loadEmployeeStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/employees/stats`);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        updateAnalyticsDisplay(data);

    } catch (error) {
        console.error('Error loading employee stats:', error);
        showToast('Cannot load analytics data. Please check server connection.', 'warning');
        // Set default values
        updateAnalyticsDisplay({
            total_employees: 0,
            active_employees: 0,
            on_leave: 0,
            avg_leaves: 0
        });
    }
}

// Load departments
async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE_URL}/departments`);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        // Handle different response formats
        if (Array.isArray(data)) {
            departments = data;
        } else if (data.departments) {
            departments = data.departments;
        } else if (data.error) {
            throw new Error(data.error);
        } else {
            throw new Error('Invalid departments data format');
        }

        console.log('Departments loaded:', departments);

    } catch (error) {
        console.error('Error loading departments:', error);
        // Use default departments as fallback
        departments = ['Engineering', 'HR', 'Marketing', 'Sales', 'Finance', 'IT', 'Operations', 'Customer Support'];
        showToast('Using default departments. Connect to server for actual data.', 'warning');
    }
}

// Load employees data from API
async function loadEmployees() {
    try {
        showLoadingState();

        const params = new URLSearchParams({
            page: currentPage,
            per_page: perPage,
            ...(currentFilter !== 'all' && { status: currentFilter }),
            ...(currentDepartment !== 'all' && { department: currentDepartment }),
            ...(currentSearch && { search: currentSearch })
        });

        console.log('Loading employees with params:', params.toString());

        const response = await fetch(`${API_BASE_URL}/employees?${params}`);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Employees data received:', data);

        if (data.error) {
            throw new Error(data.error);
        }

        employees = data.employees || [];
        console.log('Processed employees:', employees);
        renderEmployeeCards();
        updatePagination(data.pagination);

    } catch (error) {
        console.error('Error loading employees:', error);
        showToast('Cannot connect to server. Please make sure the backend is running on localhost:5000', 'error');
        employees = [];
        renderEmployeeCards();
    } finally {
        hideLoadingState();
    }
}

// Initialize filter dropdowns
function initializeFilters() {
    const departmentFilter = document.getElementById('department-filter');

    // Clear existing options
    departmentFilter.innerHTML = '<option value="all">All Departments</option>';

    // Add department options
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        departmentFilter.appendChild(option);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Department filter
    document.getElementById('department-filter').addEventListener('change', function (e) {
        currentDepartment = e.target.value;
        currentPage = 1;
        loadEmployees();
    });

    // Status filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const status = this.getAttribute('data-status') || 'all';
            filterEmployees(status);
        });
    });

    // Search input with debounce
    let searchTimeout;
    document.getElementById('employee-search').addEventListener('input', function (e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            loadEmployees();
        }, 500);
    });

    // Add employee button
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', showAddEmployeeForm);
    }

    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', showEmployeeList);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal');
            if (modal) {
                closeModal();
            } else if (document.getElementById('employee-details').style.display !== 'none') {
                showEmployeeList();
            }
        }
    });
}

// Filter employees by status
function filterEmployees(status) {
    // Update active state of filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-status') === status) {
            btn.classList.add('active');
        }
    });

    currentFilter = status;
    currentPage = 1;
    loadEmployees();
}

// Refresh data
function refreshData() {
    currentPage = 1;
    loadEmployees();
    loadEmployeeStats();
    showToast('Data refreshed successfully', 'success');
}

// Render employee cards
function renderEmployeeCards() {
    const employeeList = document.getElementById('employee-list');

    if (!employees || employees.length === 0) {
        employeeList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Employees Found</h3>
                <p>${currentSearch || currentFilter !== 'all' || currentDepartment !== 'all'
                ? 'No employees match your current filters.'
                : 'No employees available. Please check server connection.'}</p>
                ${currentSearch || currentFilter !== 'all' || currentDepartment !== 'all' ?
                `<button class="add-employee-btn" onclick="clearFilters()" style="margin-top: 15px;">
                        <i class="fas fa-times"></i> Clear Filters
                    </button>` : ''}
            </div>
        `;
        return;
    }

    employeeList.innerHTML = employees.map(employee => {
        const initials = getInitials(employee.name || 'Unknown');
        const status = employee.status || 'Active';
        const leavesTaken = employee.leaves_taken || 0;
        const remainingLeaves = employee.remaining_leaves || 0;
        const department = employee.department || 'No Department';
        const position = employee.position || 'Employee';
        const employeeType = employee.employee_type || 'Full-time';

        return `
            <div class="employee-card" data-id="${employee.id}">
                <div class="employee-header">
                    <div class="employee-avatar">${initials}</div>
                    <div class="employee-info">
                        <h3>${employee.name || 'Unknown Employee'}</h3>
                        <p>${position}</p>
                        <div class="employee-meta">
                            <span class="employee-department">${department}</span>
                            <span class="employee-type">${employeeType}</span>
                        </div>
                    </div>
                </div>
                
                <div class="employee-stats">
                    <div class="stat">
                        <span class="stat-value">${leavesTaken}</span>
                        <span class="stat-label">Leaves Taken</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${remainingLeaves}</span>
                        <span class="stat-label">Remaining</span>
                    </div>
                </div>
                
                <div class="employee-status status-${status.toLowerCase()}">
                    <span>${status}</span>
                    <button class="status-toggle-btn" onclick="toggleEmployeeStatus(${employee.id}, '${status}')" title="Toggle Status">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                
                <div class="employee-actions">
                    <button class="view-btn" onclick="viewEmployeeDetails(${employee.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="edit-btn" onclick="editEmployee(${employee.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Update pagination
function updatePagination(pagination) {
    const container = document.getElementById('pagination-container');

    if (!pagination || pagination.total_pages <= 1) {
        container.innerHTML = '';
        return;
    }

    const { current_page, total_pages, has_prev, has_next } = pagination;

    let paginationHTML = `
        <button class="pagination-btn" ${!has_prev ? 'disabled' : ''} onclick="changePage(${current_page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= total_pages; i++) {
        if (i === 1 || i === total_pages || (i >= current_page - 1 && i <= current_page + 1)) {
            paginationHTML += `
                <button class="pagination-btn ${i === current_page ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === current_page - 2 || i === current_page + 2) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
    }

    paginationHTML += `
        <button class="pagination-btn" ${!has_next ? 'disabled' : ''} onclick="changePage(${current_page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    loadEmployees();
}

// Toggle employee status
async function toggleEmployeeStatus(employeeId, currentStatus) {
    const newStatus = currentStatus.toLowerCase() === 'active' ? 'Inactive' : 'Active';

    if (!confirm(`Are you sure you want to set this employee to ${newStatus}?`)) {
        return;
    }

    try {
        showLoadingState();

        const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: newStatus.toLowerCase()
            })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        showToast(`Employee status updated to ${newStatus}`, 'success');

        // Reload employees to reflect the change
        await loadEmployees();
        await loadEmployeeStats();

    } catch (error) {
        console.error('Error updating employee status:', error);
        showToast('Failed to update employee status: ' + error.message, 'error');
    } finally {
        hideLoadingState();
    }
}

// View employee details
async function viewEmployeeDetails(employeeId) {
    try {
        console.log('Loading details for employee ID:', employeeId);
        showLoadingState();

        const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`);

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const employee = await response.json();
        console.log('Employee data received:', employee);

        if (employee.error) {
            throw new Error(employee.error);
        }

        displayEmployeeDetails(employee);

    } catch (error) {
        console.error('Error loading employee details:', error);
        showToast('Error loading employee details: ' + error.message, 'error');

        // Show error in details section
        const detailsSection = document.getElementById('employee-details');
        detailsSection.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Employee Details</h3>
                <p>${error.message}</p>
                <button class="view-btn" onclick="showEmployeeList()">
                    <i class="fas fa-arrow-left"></i> Back to Employee List
                </button>
            </div>
        `;

        // Show details section, hide list
        document.getElementById('employee-list').style.display = 'none';
        detailsSection.style.display = 'block';
        document.getElementById('back-btn').style.display = 'flex';

        const pagination = document.getElementById('pagination-container');
        if (pagination) pagination.style.display = 'none';

    } finally {
        hideLoadingState();
    }
}

// Display employee details
function displayEmployeeDetails(employee) {
    const detailsSection = document.getElementById('employee-details');
    const listSection = document.getElementById('employee-list');
    const backBtn = document.getElementById('back-btn');
    const pagination = document.getElementById('pagination-container');

    // Show details, hide list
    listSection.style.display = 'none';
    detailsSection.style.display = 'block';
    if (backBtn) backBtn.style.display = 'flex';
    if (pagination) pagination.style.display = 'none';

    const initials = getInitials(employee.name || 'Unknown');
    const status = employee.status || 'Active';
    const leavesTaken = employee.leaves_taken || 0;
    const remainingLeaves = employee.remaining_leaves || 0;
    const totalLeaves = employee.total_leaves || (leavesTaken + remainingLeaves);
    const department = employee.department || 'No Department';
    const position = employee.position || 'Employee';
    const email = employee.email || 'No email';
    const contact = employee.contact || 'No contact';
    const gender = employee.gender || 'Not specified';
    const dateOfBirth = employee.date_of_birth || 'Not specified';
    const employeeType = employee.employee_type || 'Full-time';

    // Format leave history
    const leaveHistory = employee.leave_history || [];
    const leaveHistoryHTML = leaveHistory.length > 0 ?
        leaveHistory.map(leave => `
            <div class="leave-record">
                <div class="leave-info">
                    <h4>${leave.leave_type || 'Leave'}</h4>
                    <div class="leave-dates">
                        ${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}
                    </div>
                    <div class="leave-reason">
                        ${leave.reason || 'No reason provided'}
                    </div>
                    <div class="leave-hr-remarks-container" data-leave-id="${leave.leave_id}">
                        ${leave.hr_remarks ?
                `<div class="leave-hr-remarks">${leave.hr_remarks}</div>` :
                `<div class="leave-hr-remarks empty">No HR remarks yet</div>`
            }
                        <button class="leave-hr-remarks-btn edit" onclick="editHRRemarks(${leave.leave_id}, '${(leave.hr_remarks || '').replace(/'/g, "\\'")}')">
                            <i class="fas fa-edit"></i> ${leave.hr_remarks ? 'Edit' : 'Add'} Remarks
                        </button>
                    </div>
                </div>
                <div class="status status-${(leave.status || 'pending').toLowerCase()}">
                    ${leave.status || 'Pending'}
                </div>
            </div>
        `).join('') :
        `<div class="empty-state" style="padding: 20px;">
            <i class="fas fa-calendar-times"></i>
            <p>No leave history found</p>
        </div>`;

    detailsSection.innerHTML = `
        <div class="employee-detail-card">
            <div class="employee-detail-header">
                <div class="employee-avatar large">${initials}</div>
                <div class="employee-detail-info">
                    <h2>${employee.name || 'Unknown Employee'}</h2>
                    <p>${position} • ${department}</p>
                    <div class="employee-meta">
                        <span class="employee-type">${employeeType}</span>
                        <span class="employee-status status-${status.toLowerCase()}">
                            ${status}
                            <button class="status-toggle-btn" onclick="toggleEmployeeStatus(${employee.id}, '${status}')" title="Toggle Status">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="employee-detail-content">
                <div class="detail-section">
                    <h3><i class="fas fa-info-circle"></i> Personal Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Employee ID:</label>
                            <span>${employee.id || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${email}</span>
                        </div>
                        <div class="detail-item">
                            <label>Contact:</label>
                            <span>${contact}</span>
                        </div>
                        <div class="detail-item">
                            <label>Gender:</label>
                            <span>${gender}</span>
                        </div>
                        <div class="detail-item">
                            <label>Date of Birth:</label>
                            <span>${dateOfBirth}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-chart-bar"></i> Leave Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${leavesTaken}</div>
                            <div class="stat-label">Leaves Taken</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${remainingLeaves}</div>
                            <div class="stat-label">Remaining Leaves</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${totalLeaves}</div>
                            <div class="stat-label">Total Leaves</div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-history"></i> Leave History</h3>
                    <div class="leave-history-section">
                        ${leaveHistoryHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show employee list
function showEmployeeList() {
    const detailsSection = document.getElementById('employee-details');
    const listSection = document.getElementById('employee-list');
    const backBtn = document.getElementById('back-btn');
    const pagination = document.getElementById('pagination-container');

    if (detailsSection) detailsSection.style.display = 'none';
    if (listSection) listSection.style.display = 'grid';
    if (backBtn) backBtn.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';
}

// Show add employee form
function showAddEmployeeForm() {
    const modalHTML = `
        <div class="modal" id="add-employee-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-user-plus"></i> Add New Employee</h2>
                    <button class="close-modal" onclick="closeModal()">&times;</button>
                </div>
                
                <form id="add-employee-form" onsubmit="handleAddEmployee(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="employee-name">Full Name *</label>
                            <input type="text" id="employee-name" name="user_name" required>
                        </div>
                        <div class="form-group">
                            <label for="employee-email">Email Address *</label>
                            <input type="email" id="employee-email" name="email" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="employee-contact">Contact Number *</label>
                            <input type="tel" id="employee-contact" name="contact_number" required>
                        </div>
                        <div class="form-group">
                            <label for="employee-department">Department *</label>
                            <select id="employee-department" name="department" required>
                                <option value="">Select Department</option>
                                ${departments.map(dept => `<option value="${dept}">${dept}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="employee-position">Position *</label>
                            <input type="text" id="employee-position" name="designation" required>
                        </div>
                        <div class="form-group">
                            <label for="employee-type">Employee Type *</label>
                            <select id="employee-type" name="employee_type" required>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Intern">Intern</option>
                                <option value="Trainee">Trainee</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="employee-role">User Role *</label>
                            <select id="employee-role" name="user_role" required>
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                                <option value="hr">HR</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="employee-status">Status *</label>
                            <select id="employee-status" name="status" required>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="submit-btn">
                            <i class="fas fa-plus"></i> Add Employee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Handle add employee
async function handleAddEmployee(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const employeeData = {
        user_name: formData.get('user_name'),
        email: formData.get('email'),
        contact_number: formData.get('contact_number'),
        department: formData.get('department'),
        designation: formData.get('designation'),
        employee_type: formData.get('employee_type'),
        user_role: formData.get('user_role'),
        status: formData.get('status')
    };

    try {
        console.log('Adding employee:', employeeData);
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add employee');
        }

        const result = await response.json();
        console.log('Add employee response:', result);

        closeModal();
        showToast(`Employee added successfully! ID: ${result.employee_id}`, 'success');

        // Reload data to show the new employee
        currentPage = 1;
        await loadEmployees();
        await loadEmployeeStats();

        // Show the generated password if available
        if (result.default_password) {
            setTimeout(() => {
                alert(`Employee added successfully!\nGenerated Password: ${result.default_password}\nPlease share this with the employee.`);
            }, 500);
        }

    } catch (error) {
        console.error('Error adding employee:', error);
        showToast('Failed to add employee: ' + error.message, 'error');
    }
}

// Edit employee
function editEmployee(employeeId) {
    // Find the employee in the current list
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
        showToast('Employee not found', 'error');
        return;
    }

    const modalHTML = `
        <div class="modal" id="edit-employee-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> Edit Employee</h2>
                    <button class="close-modal" onclick="closeModal()">&times;</button>
                </div>
                
                <form id="edit-employee-form" onsubmit="handleEditEmployee(event, ${employeeId})">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-employee-name">Full Name *</label>
                            <input type="text" id="edit-employee-name" name="user_name" value="${employee.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-employee-email">Email Address *</label>
                            <input type="email" id="edit-employee-email" name="email" value="${employee.email || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-employee-contact">Contact Number *</label>
                            <input type="tel" id="edit-employee-contact" name="contact_number" value="${employee.contact || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-employee-department">Department *</label>
                            <select id="edit-employee-department" name="department" required>
                                <option value="">Select Department</option>
                                ${departments.map(dept =>
        `<option value="${dept}" ${dept === employee.department ? 'selected' : ''}>${dept}</option>`
    ).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-employee-position">Position *</label>
                            <input type="text" id="edit-employee-position" name="designation" value="${employee.position || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-employee-status">Status *</label>
                            <select id="edit-employee-status" name="status" required>
                                <option value="Active" ${employee.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Inactive" ${employee.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="submit-btn">
                            <i class="fas fa-save"></i> Update Employee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Handle edit employee
async function handleEditEmployee(event, employeeId) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const employeeData = {
        user_name: formData.get('user_name'),
        email: formData.get('email'),
        contact_number: formData.get('contact_number'),
        department: formData.get('department'),
        designation: formData.get('designation'),
        status: formData.get('status')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update employee');
        }

        const result = await response.json();

        closeModal();
        showToast('Employee updated successfully!', 'success');

        // Reload data
        await loadEmployees();
        await loadEmployeeStats();

    } catch (error) {
        console.error('Error updating employee:', error);
        showToast('Failed to update employee: ' + error.message, 'error');
    }
}

// Update analytics display
function updateAnalyticsDisplay(stats) {
    document.getElementById('total-employees').textContent = stats.total_employees || 0;
    document.getElementById('active-employees').textContent = stats.active_employees || 0;
    document.getElementById('on-leave-count').textContent = stats.on_leave || 0;
    document.getElementById('avg-leaves').textContent = stats.avg_leaves || '0.0';
}

// Clear filters
function clearFilters() {
    currentFilter = 'all';
    currentDepartment = 'all';
    currentSearch = '';
    currentPage = 1;

    // Reset filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-status') === 'all') {
            btn.classList.add('active');
        }
    });

    document.getElementById('department-filter').value = 'all';
    document.getElementById('employee-search').value = '';

    loadEmployees();
}

// Edit HR Remarks functionality
function editHRRemarks(leaveId, currentRemarks) {
    const container = document.querySelector(`.leave-hr-remarks-container[data-leave-id="${leaveId}"]`);
    if (!container) return;

    // Replace current content with edit form
    container.innerHTML = `
        <div class="leave-hr-remarks-edit">
            <textarea class="leave-hr-remarks-textarea" placeholder="Enter HR remarks...">${currentRemarks}</textarea>
            <div class="leave-hr-remarks-actions">
                <button class="leave-hr-remarks-btn save" onclick="saveHRRemarks(${leaveId})">
                    <i class="fas fa-save"></i> Save
                </button>
                <button class="leave-hr-remarks-btn cancel" onclick="cancelEditHRRemarks(${leaveId}, '${currentRemarks.replace(/'/g, "\\'")}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>
    `;

    // Focus on textarea
    const textarea = container.querySelector('.leave-hr-remarks-textarea');
    if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
}

async function saveHRRemarks(leaveId) {
    const container = document.querySelector(`.leave-hr-remarks-container[data-leave-id="${leaveId}"]`);
    if (!container) return;

    const textarea = container.querySelector('.leave-hr-remarks-textarea');
    if (!textarea) return;

    const newRemarks = textarea.value.trim();

    try {
        showLoadingState();

        const response = await fetch(`${API_BASE_URL}/leaves/${leaveId}/remarks`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                hr_remarks: newRemarks
            })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        showToast('HR remarks updated successfully', 'success');

        // Update the display
        container.innerHTML = `
            ${newRemarks ?
                `<div class="leave-hr-remarks">${newRemarks}</div>` :
                `<div class="leave-hr-remarks empty">No HR remarks yet</div>`
            }
            <button class="leave-hr-remarks-btn edit" onclick="editHRRemarks(${leaveId}, '${newRemarks.replace(/'/g, "\\'")}')">
                <i class="fas fa-edit"></i> ${newRemarks ? 'Edit' : 'Add'} Remarks
            </button>
        `;

    } catch (error) {
        console.error('Error updating HR remarks:', error);
        showToast('Failed to update HR remarks: ' + error.message, 'error');

        // Restore the edit form with current value
        container.innerHTML = `
            <div class="leave-hr-remarks-edit">
                <textarea class="leave-hr-remarks-textarea" placeholder="Enter HR remarks...">${newRemarks}</textarea>
                <div class="leave-hr-remarks-actions">
                    <button class="leave-hr-remarks-btn save" onclick="saveHRRemarks(${leaveId})">
                        <i class="fas fa-save"></i> Save
                    </button>
                    <button class="leave-hr-remarks-btn cancel" onclick="cancelEditHRRemarks(${leaveId}, '${textarea.value.replace(/'/g, "\\'")}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
    } finally {
        hideLoadingState();
    }
}

function cancelEditHRRemarks(leaveId, originalRemarks) {
    const container = document.querySelector(`.leave-hr-remarks-container[data-leave-id="${leaveId}"]`);
    if (!container) return;

    // Restore original display
    container.innerHTML = `
        ${originalRemarks && originalRemarks !== 'null' ?
            `<div class="leave-hr-remarks">${originalRemarks}</div>` :
            `<div class="leave-hr-remarks empty">No HR remarks yet</div>`
        }
        <button class="leave-hr-remarks-btn edit" onclick="editHRRemarks(${leaveId}, '${(originalRemarks || '').replace(/'/g, "\\'")}')">
            <i class="fas fa-edit"></i> ${originalRemarks && originalRemarks !== 'null' ? 'Edit' : 'Add'} Remarks
        </button>
    `;
}

// Enhanced error handling for API calls
function handleApiError(error, context) {
    console.error(`Error in ${context}:`, error);

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showToast('Cannot connect to server. Please check if the backend is running on localhost:5000', 'error');
    } else if (error.message.includes('401')) {
        showToast('Session expired. Please log in again.', 'error');
        // Redirect to login page after a delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    } else if (error.message.includes('403')) {
        showToast('You do not have permission to perform this action.', 'error');
    } else if (error.message.includes('404')) {
        showToast('Requested resource not found.', 'error');
    } else if (error.message.includes('500')) {
        showToast('Server error. Please try again later.', 'error');
    } else {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Utility functions
function getInitials(name) {
    return name.split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return 'Invalid Date';
    }
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function showLoadingState() {
    document.body.classList.add('loading');
}

function hideLoadingState() {
    document.body.classList.remove('loading');
}

// Add window error handling for uncaught errors
window.addEventListener('error', function (event) {
    console.error('Uncaught error:', event.error);
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

// Add unhandled promise rejection handling
window.addEventListener('unhandledrejection', function (event) {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
    event.preventDefault();
});

// Export functions for global access (if needed in other modules)
window.EmployeeManager = {
    loadEmployees,
    loadEmployeeStats,
    viewEmployeeDetails,
    showAddEmployeeForm,
    editEmployee,
    toggleEmployeeStatus,
    filterEmployees,
    clearFilters,
    refreshData,
    showEmployeeList,
    closeModal,
    showToast
};

console.log('Employee Management System JavaScript loaded successfully');