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
    initializeApp();
});

// Main initialization function
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
            loadEmployeeStats() // Fixed: removed extra 's'
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
            per_page: perPage, // Fixed: changed per_page to perPage
            ...(currentFilter !== 'all' && { status: currentFilter }),
            ...(currentDepartment !== 'all' && { department: currentDepartment }),
            ...(currentSearch && { search: currentSearch })
        });

        const response = await fetch(`${API_BASE_URL}/employees?${params}`);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        employees = data.employees || [];
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

        return `
            <div class="employee-card" data-id="${employee.id}">
                <div class="employee-header">
                    <div class="employee-avatar">${initials}</div>
                    <div class="employee-info">
                        <h3>${employee.name || 'Unknown Employee'}</h3>
                        <p>${position}</p>
                        <div class="employee-department">${department}</div>
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
                
                <div class="employee-status status-${status}">${status}</div>
                
                <div class="employee-actions">
                    <button class="view-btn" onclick="viewEmployeeDetails(${employee.id})">
                        <i class="fas fa-eye"></i> View Details
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

// Filter employees
function filterEmployees(status) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    currentFilter = status;
    currentPage = 1;
    loadEmployees();
}

// View employee details
async function viewEmployeeDetails(employeeId) {
    try {
        showLoadingState();

        const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const employee = await response.json();

        if (employee.error) {
            throw new Error(employee.error);
        }

        displayEmployeeDetails(employee);

    } catch (error) {
        console.error('Error loading employee details:', error);
        showToast('Error loading employee details: ' + error.message, 'error');
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
    backBtn.style.display = 'flex';
    if (pagination) pagination.style.display = 'none';

    const initials = getInitials(employee.name);
    const status = employee.status || 'Active';
    const leavesTaken = employee.leaves_taken || 0;
    const remainingLeaves = employee.remaining_leaves || 0;
    const totalLeaves = employee.total_leaves || (leavesTaken + remainingLeaves);
    const department = employee.department || 'No Department';
    const position = employee.position || 'Employee';

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
                </div>
                <div class="status status-${(leave.leave_status || 'pending').toLowerCase()}">
                    ${leave.leave_status || 'Pending'}
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
                    <h2>${employee.name}</h2>
                    <p>${position} • ${department}</p>
                    <div class="employee-status status-${status}" style="margin-top: 10px;">
                        ${status}
                    </div>
                </div>
            </div>
            
            <div class="employee-contact">
                <span><i class="fas fa-envelope"></i> ${employee.email || 'No email'}</span>
                <span><i class="fas fa-phone"></i> ${employee.contact || 'No contact'}</span>
                <span><i class="fas fa-calendar-alt"></i> ${leavesTaken} Leaves Taken</span>
            </div>
            
            <div class="employee-stats">
                <div class="stat">
                    <span class="stat-value">${leavesTaken}</span>
                    <span class="stat-label">Leaves Taken</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${remainingLeaves}</span>
                    <span class="stat-label">Remaining Leaves</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${totalLeaves}</span>
                    <span class="stat-label">Total Leaves</span>
                </div>
            </div>
            
            <div class="leave-history">
                <h3><i class="fas fa-history"></i> Leave History</h3>
                ${leaveHistoryHTML}
            </div>
        </div>
    `;
}

// Show employee list
function showEmployeeList() {
    document.getElementById('employee-details').style.display = 'none';
    document.getElementById('employee-list').style.display = 'grid';
    document.getElementById('back-btn').style.display = 'none';

    const pagination = document.getElementById('pagination-container');
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
        status: formData.get('status')
    };

    try {
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

        closeModal();
        showToast(`Employee added successfully! ID: ${result.employee_id}`, 'success');

        // Reload data
        currentPage = 1;
        await loadEmployees();
        await loadEmployeeStats();

    } catch (error) {
        console.error('Error adding employee:', error);
        showToast('Failed to add employee: ' + error.message, 'error');
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

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[onclick="filterEmployees(\'all\')"]').classList.add('active');
    document.getElementById('department-filter').value = 'all';
    document.getElementById('employee-search').value = '';

    loadEmployees();
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

// Make functions globally available
window.filterEmployees = filterEmployees;
window.viewEmployeeDetails = viewEmployeeDetails;
window.showEmployeeList = showEmployeeList;
window.changePage = changePage;
window.showAddEmployeeForm = showAddEmployeeForm;
window.handleAddEmployee = handleAddEmployee;
window.clearFilters = clearFilters;
window.closeModal = closeModal;