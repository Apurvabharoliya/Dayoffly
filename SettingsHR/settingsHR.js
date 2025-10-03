// Modal functionality
const userModal = document.getElementById('userModal');
const addUserBtn = document.getElementById('addUserBtn');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.getElementById('cancelBtn');
const userForm = document.getElementById('userForm');
const modalTitle = document.getElementById('modalTitle');
const userTableBody = document.getElementById('user-table-body');

let currentEditingUserId = null;
const API_BASE_URL = 'http://localhost:5000';

// Create confirmation modal
const confirmModal = document.createElement('div');
confirmModal.className = 'modal';
confirmModal.id = 'confirmModal';
confirmModal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
            <h2 class="modal-title">Confirm Delete</h2>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <p id="confirmMessage">Are you sure you want to delete this user?</p>
            <div class="footer-buttons">
                <button class="btn btn-outline" id="cancelDeleteBtn">Cancel</button>
                <button class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
        </div>
    </div>
`;
document.body.appendChild(confirmModal);

// Load users when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    document.getElementById('createdDate').value = new Date().toISOString().split('T')[0];
    setupModalCloseListeners();
});

// Load all users from backend
async function loadUsers() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        renderUsers(users);
        hideLoading();
    } catch (error) {
        console.error('Error loading users:', error);
        hideLoading();
        showNotification('Error loading users. Please ensure the Flask backend is running on localhost:5000', 'error');
    }
}

// Show loading state
function showLoading() {
    userTableBody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 40px;">
                <div style="display: inline-block; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--primary); margin-right: 10px;"></i>
                    <span>Loading users...</span>
                </div>
            </td>
        </tr>
    `;
}

function hideLoading() {
    // Loading state will be replaced when renderUsers is called
}

// Show notification
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                border-left: 4px solid var(--primary);
                z-index: 10000;
                max-width: 400px;
                animation: slideInRight 0.3s ease;
            }
            .notification-success {
                border-left-color: var(--success);
            }
            .notification-error {
                border-left-color: var(--danger);
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-content i {
                font-size: 1.2rem;
            }
            .notification-success .notification-content i {
                color: var(--success);
            }
            .notification-error .notification-content i {
                color: var(--danger);
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Render users in table
function renderUsers(users) {
    if (!users || users.length === 0) {
        userTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px; display: block; opacity: 0.5;"></i>
                    No users found
                </td>
            </tr>
        `;
        return;
    }

    userTableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.user_id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td style="font-family: monospace; background: #f8f9fa; padding: 8px; border-radius: 4px; border: 1px solid #dee2e6;">
                ${user.password || 'Not set'}
            </td>
            <td><span class="role-badge role-${user.role ? user.role.toLowerCase() : 'employee'}">${user.role || 'Employee'}</span></td>
            <td>${user.department}</td>
            <td>${user.created_date}</td>
            <td><span class="status status-${user.status ? user.status.toLowerCase() : 'active'}">${user.status || 'Active'}</span></td>
            <td class="action-buttons">
                <button class="action-btn btn-delete" data-userid="${user.user_id}" data-username="${user.username}" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        userTableBody.appendChild(row);
    });
    
    // Add role badge styles
    if (!document.querySelector('#role-badge-styles')) {
        const styles = document.createElement('style');
        styles.id = 'role-badge-styles';
        styles.textContent = `
            .role-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 500;
            }
            .role-badge.role-hr {
                background: rgba(23, 162, 184, 0.2);
                color: var(--secondary);
            }
            .role-badge.role-manager {
                background: rgba(255, 193, 7, 0.2);
                color: var(--warning);
            }
            .role-badge.role-admin {
                background: rgba(220, 53, 69, 0.2);
                color: var(--danger);
            }
            .role-badge.role-employee {
                background: rgba(40, 167, 69, 0.2);
                color: var(--success);
            }
            .role-badge.role-senior {
                background: rgba(111, 66, 193, 0.2);
                color: #6f42c1;
            }
            .role-badge.role-junior {
                background: rgba(253, 126, 20, 0.2);
                color: #fd7e14;
            }
            .role-badge.role-intern {
                background: rgba(32, 201, 151, 0.2);
                color: #20c997;
            }
        `;
        document.head.appendChild(styles);
    }
    
    attachEventListeners();
}

// Attach event listeners to action buttons
function attachEventListeners() {
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-userid');
            const username = button.getAttribute('data-username');
            showDeleteConfirmation(userId, username);
        });
    });
}

// Show themed delete confirmation modal
function showDeleteConfirmation(userId, username) {
    const confirmMessage = document.getElementById('confirmMessage');
    confirmMessage.textContent = `Are you sure you want to delete user "${username}"? This action cannot be undone.`;
    
    const confirmModal = document.getElementById('confirmModal');
    confirmModal.style.display = 'flex';
    
    // Set up confirmation button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    
    // Remove existing event listeners
    const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
    const newCancelBtn = cancelDeleteBtn.cloneNode(true);
    
    confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);
    cancelDeleteBtn.parentNode.replaceChild(newCancelBtn, cancelDeleteBtn);
    
    // Add new event listeners
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        deleteUser(userId);
        confirmModal.style.display = 'none';
    });
    
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
}

// Delete user function
async function deleteUser(userId) {
    try {
        showNotification('Deleting user...', 'info');
        
        const deleteResponse = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await deleteResponse.json();
        
        if (deleteResponse.ok) {
            showNotification('User deleted successfully!', 'success');
            loadUsers();
        } else {
            showNotification(`Error: ${result.error || 'Failed to delete user'}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user. Please try again.', 'error');
    }
}

// Modal event listeners
addUserBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add New User';
    userForm.reset();
    currentEditingUserId = null;
    document.getElementById('createdDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('isActive').checked = true;
    userModal.style.display = 'flex';
});

// Close modals
function setupModalCloseListeners() {
    const closeButtons = document.querySelectorAll('.close-btn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            userModal.style.display = 'none';
            confirmModal.style.display = 'none';
        });
    });
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === userModal) {
            userModal.style.display = 'none';
        }
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });
}

cancelBtn.addEventListener('click', () => {
    userModal.style.display = 'none';
});

// Form submission
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value,
        department: document.getElementById('department').value,
        designation: document.getElementById('role').value.charAt(0).toUpperCase() + document.getElementById('role').value.slice(1),
        is_active: document.getElementById('isActive').checked
    };
    
    try {
        let response;
        if (currentEditingUserId) {
            response = await fetch(`${API_BASE_URL}/api/users/${currentEditingUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
        } else {
            response = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
        }
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification(
                currentEditingUserId 
                    ? 'User updated successfully!' 
                    : `User added successfully! User ID: ${result.user_id}, Password: ${result.password}`,
                'success'
            );
            userModal.style.display = 'none';
            loadUsers();
        } else {
            showNotification(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Error saving user', 'error');
    }
});

// Filter functionality
const searchInput = document.getElementById('searchUser');
const departmentFilter = document.getElementById('departmentFilter');
const roleFilter = document.getElementById('roleFilter');
const statusFilter = document.getElementById('statusFilter');

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const department = departmentFilter.value;
    const role = roleFilter.value;
    const status = statusFilter.value;
    
    const rows = userTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const username = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const email = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const userRole = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
        const userDepartment = row.querySelector('td:nth-child(6)').textContent.toLowerCase().replace(' ', '-');
        const userStatus = row.querySelector('td:nth-child(8)').textContent.toLowerCase();
        
        const matchesSearch = searchTerm === '' || 
                             username.includes(searchTerm) || 
                             email.includes(searchTerm);
        
        const matchesDepartment = department === 'all' || userDepartment === department;
        const matchesRole = role === 'all' || userRole === role;
        const matchesStatus = status === 'all' || userStatus === status;
        
        row.style.display = (matchesSearch && matchesDepartment && matchesRole && matchesStatus) ? '' : 'none';
    });
}

searchInput.addEventListener('input', applyFilters);
departmentFilter.addEventListener('change', applyFilters);
roleFilter.addEventListener('change', applyFilters);
statusFilter.addEventListener('change', applyFilters);