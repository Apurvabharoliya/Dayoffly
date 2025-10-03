// HRDashboard.js - Professional Overview Dashboard (Read-Only)
let requests = [];
let dashboardStats = {};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing HR Dashboard...');
    initializeDashboard();
});

async function initializeDashboard() {
    await fetchHRData();
    
    // Refresh data every 30 seconds for live updates
    setInterval(fetchHRData, 30000);
}

// Data fetching functions
async function fetchHRData() {
    try {
        showLoadingState();
        
        const response = await fetch('http://localhost:5000/hr/dashboard-data', {
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
            console.log('✅ HR data fetched successfully');
            requests = data.leave_requests || [];
            dashboardStats = data.dashboard_stats || {};
            updateDashboard(data);
        } else {
            throw new Error(data.message || 'Failed to load data');
        }
        
    } catch (error) {
        console.error('❌ Error fetching HR data:', error);
        handleDataError(error);
    }
}

function updateDashboard(data) {
    populateRecentRequests();
    updateSummary(data.dashboard_stats?.leave_requests || {});
    updateCharts(data.dashboard_stats || {});
}

function showLoadingState() {
    const tbody = document.getElementById('request-table');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--gray);">
                <div class="loading-spinner"></div>
                Loading dashboard data...
            </td>
        </tr>
    `;
}

function handleDataError(error) {
    requests = [];
    populateRecentRequests();
    updateSummary({ total: 0, pending: 0, approved: 0, rejected: 0 });
    updateEmptyCharts();
    
    if (error.message.includes('Authentication')) {
        showNotification('Authentication required to access HR dashboard', 'error');
    } else {
        showNotification('Unable to load dashboard data at this time', 'error');
    }
}

// Request management functions - Read-only overview
function populateRecentRequests() {
    const tbody = document.getElementById('request-table');
    
    if (!requests || requests.length === 0) {
        tbody.innerHTML = getEmptyStateHTML();
        return;
    }
    
    tbody.innerHTML = '';
    
    // Display recent 5 requests for overview
    const recentRequests = requests.slice(0, 5);
    
    recentRequests.forEach(req => {
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
            <a href="../LeaveRequestHR/leaveRequestHR.html" class="view-details-btn" title="Review Full Details">
                <i class="fas fa-external-link-alt"></i> Review
            </a>
        </td>
    `;
    
    return row;
}

function getEmptyStateHTML() {
    return `
        <tr>
            <td colspan="6" class="empty-state">
                <div class="empty-state-content">
                    <i class="fas fa-clipboard-check"></i>
                    <h4>No Active Leave Requests</h4>
                    <p>All requests have been processed or no pending requests available.</p>
                </div>
            </td>
        </tr>
    `;
}

// Summary statistics functions
function updateSummary(stats) {
    document.getElementById('total-count').textContent = stats.total || 0;
    document.getElementById('pending-count').textContent = stats.pending || 0;
    document.getElementById('approved-count').textContent = stats.approved || 0;
    document.getElementById('rejected-count').textContent = stats.rejected || 0;
}

// Chart functions
function updateCharts(dashboardStats) {
    // Safely destroy existing charts
    destroyCharts();
    
    // Create charts with actual data
    createCharts(dashboardStats);
}

function destroyCharts() {
    if (window.leaveTypeChart && typeof window.leaveTypeChart.destroy === 'function') {
        window.leaveTypeChart.destroy();
    }
    if (window.monthlyTrendChart && typeof window.monthlyTrendChart.destroy === 'function') {
        window.monthlyTrendChart.destroy();
    }
}

function createCharts(dashboardStats) {
    createLeaveTypeChart(dashboardStats);
    createMonthlyTrendChart(dashboardStats);
}

function createLeaveTypeChart(dashboardStats) {
    const leaveTypeLabels = dashboardStats.leave_types ? 
        dashboardStats.leave_types.map(item => item.leave_type) : 
        ['No Data Available'];
    
    const leaveTypeCounts = dashboardStats.leave_types ? 
        dashboardStats.leave_types.map(item => item.count) : 
        [1];
    
    const leaveTypeData = {
        labels: leaveTypeLabels,
        datasets: [{
            data: leaveTypeCounts,
            backgroundColor: [
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 99, 132, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)'
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 2,
            hoverOffset: 15
        }]
    };
    
    const leaveTypeCtx = document.getElementById('leaveTypeChart').getContext('2d');
    window.leaveTypeChart = new Chart(leaveTypeCtx, {
        type: 'doughnut',
        data: leaveTypeData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createMonthlyTrendChart(dashboardStats) {
    const months = dashboardStats.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = dashboardStats.monthly_trends || {
        approved: new Array(12).fill(0),
        pending: new Array(12).fill(0),
        rejected: new Array(12).fill(0)
    };
    
    const monthlyTrendData = {
        labels: months,
        datasets: [
            {
                label: 'Approved',
                data: monthlyTrends.approved,
                borderColor: 'rgba(40, 167, 69, 1)',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            },
            {
                label: 'Pending',
                data: monthlyTrends.pending,
                borderColor: 'rgba(255, 193, 7, 1)',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            },
            {
                label: 'Rejected',
                data: monthlyTrends.rejected,
                borderColor: 'rgba(220, 53, 69, 1)',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            }
        ]
    };
    
    const monthlyTrendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    window.monthlyTrendChart = new Chart(monthlyTrendCtx, {
        type: 'line',
        data: monthlyTrendData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

function updateEmptyCharts() {
    destroyCharts();
    createEmptyCharts();
}

function createEmptyCharts() {
    const leaveTypeCtx = document.getElementById('leaveTypeChart').getContext('2d');
    window.leaveTypeChart = new Chart(leaveTypeCtx, {
        type: 'doughnut',
        data: {
            labels: ['No Data Available'],
            datasets: [{
                data: [1],
                backgroundColor: ['rgba(200, 200, 200, 0.7)'],
                borderColor: ['rgba(150, 150, 150, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
    
    const monthlyTrendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    window.monthlyTrendChart = new Chart(monthlyTrendCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'No Data Available',
                data: new Array(12).fill(0),
                borderColor: 'rgba(200, 200, 200, 1)',
                backgroundColor: 'rgba(200, 200, 200, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Professional notification system
function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(type)}"></i>
            </div>
            <div class="notification-message">
                <strong>${getNotificationTitle(type)}</strong>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle',
        'warning': 'fa-exclamation-triangle'
    };
    return icons[type] || 'fa-info-circle';
}

function getNotificationTitle(type) {
    const titles = {
        'success': 'Success: ',
        'error': 'Error: ',
        'info': 'Info: ',
        'warning': 'Warning: '
    };
    return titles[type] || '';
}

// Utility function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Export functions for global access if needed
window.HRDashboard = {
    refreshData: fetchHRData,
    showNotification: showNotification
};