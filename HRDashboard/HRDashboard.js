// HRDashboard.js - Fixed Version with Proper API Integration
let requests = [];
let dashboardStats = {};

// API Base URL
const API_BASE_URL = 'http://localhost:5000';

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
        console.log('📡 Fetching HR dashboard data...');
        showLoadingState();

        const response = await fetch(`${API_BASE_URL}/hr/dashboard-data`, {
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
    console.log('🔄 Updating dashboard with data:', data);
    populateRecentRequests();
    updateSummary(data.dashboard_stats?.leave_requests || {});
    updateCharts(data.dashboard_stats || {});
    updateUserInfo(data.user_info || {});
}

function showLoadingState() {
    const tbody = document.getElementById('request-table');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--gray);">
                <div class="loading-spinner"></div>
                <p style="margin-top: 10px;">Loading dashboard data...</p>
            </td>
        </tr>
    `;
}

function handleDataError(error) {
    console.error('Handling data error:', error);
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
    if (!tbody) {
        console.error('Table body element not found');
        return;
    }

    if (!requests || requests.length === 0) {
        tbody.innerHTML = getEmptyStateHTML();
        return;
    }

    tbody.innerHTML = '';

    // Display recent 5 requests for overview
    const recentRequests = requests.slice(0, 5);
    console.log(`📊 Displaying ${recentRequests.length} recent requests`);

    recentRequests.forEach(req => {
        const row = createRequestRow(req);
        tbody.appendChild(row);
    });
}

function createRequestRow(req) {
    const row = document.createElement('tr');

    const employeeName = req.employee || req.employee_name || 'Unknown Employee';
    const department = req.department || 'N/A';
    const leaveType = req.type || req.leave_type || 'N/A';
    const dates = req.dates || `${req.start_date || 'N/A'} to ${req.end_date || 'N/A'}`;
    const duration = req.duration || `${req.total_days || 'N/A'} days`;
    const status = (req.status || req.hr_approval_status || 'pending').toLowerCase();

    row.innerHTML = `
        <td>
            <div class="employee-info">
                <div class="employee-avatar">
                    ${employeeName.charAt(0).toUpperCase()}
                </div>
                <div class="employee-details">
                    <div class="employee-name">${employeeName}</div>
                    ${department !== 'N/A' ? `<div class="employee-department">${department}</div>` : ''}
                </div>
            </div>
        </td>
        <td>
            <span class="leave-type-badge">${leaveType}</span>
        </td>
        <td>${dates}</td>
        <td>${duration}</td>
        <td>
            <span class="status status-${status}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
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
                    <i class="fas fa-clipboard-check" style="font-size: 3em; color: #ccc; margin-bottom: 10px;"></i>
                    <h4>No Active Leave Requests</h4>
                    <p>All requests have been processed or no pending requests available.</p>
                </div>
            </td>
        </tr>
    `;
}

// Summary statistics functions
function updateSummary(stats) {
    console.log('📊 Updating summary with stats:', stats);

    const totalCount = document.getElementById('total-count');
    const pendingCount = document.getElementById('pending-count');
    const approvedCount = document.getElementById('approved-count');
    const rejectedCount = document.getElementById('rejected-count');

    if (totalCount) totalCount.textContent = stats.total || 0;
    if (pendingCount) pendingCount.textContent = stats.pending || 0;
    if (approvedCount) approvedCount.textContent = stats.approved || 0;
    if (rejectedCount) rejectedCount.textContent = stats.rejected || 0;
}

// Chart functions
function updateCharts(dashboardStats) {
    console.log('📈 Updating charts with data:', dashboardStats);
    destroyCharts();
    createCharts(dashboardStats);
}

function destroyCharts() {
    if (window.leaveTypeChart && typeof window.leaveTypeChart.destroy === 'function') {
        window.leaveTypeChart.destroy();
        window.leaveTypeChart = null;
    }
    if (window.monthlyTrendChart && typeof window.monthlyTrendChart.destroy === 'function') {
        window.monthlyTrendChart.destroy();
        window.monthlyTrendChart = null;
    }
}

function createCharts(dashboardStats) {
    createLeaveTypeChart(dashboardStats);
    createMonthlyTrendChart(dashboardStats);
}

function createLeaveTypeChart(dashboardStats) {
    const leaveTypeLabels = dashboardStats.leave_types && dashboardStats.leave_types.length > 0
        ? dashboardStats.leave_types.map(item => item.leave_type)
        : ['No Data Available'];

    const leaveTypeCounts = dashboardStats.leave_types && dashboardStats.leave_types.length > 0
        ? dashboardStats.leave_types.map(item => item.count)
        : [1];

    console.log('📊 Creating leave type chart:', { labels: leaveTypeLabels, counts: leaveTypeCounts });

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

    const leaveTypeCtx = document.getElementById('leaveTypeChart');
    if (!leaveTypeCtx) {
        console.error('Leave type chart canvas not found');
        return;
    }

    window.leaveTypeChart = new Chart(leaveTypeCtx.getContext('2d'), {
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
                        label: function (context) {
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

    console.log('📈 Creating monthly trend chart:', monthlyTrends);

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

    const monthlyTrendCtx = document.getElementById('monthlyTrendChart');
    if (!monthlyTrendCtx) {
        console.error('Monthly trend chart canvas not found');
        return;
    }

    window.monthlyTrendChart = new Chart(monthlyTrendCtx.getContext('2d'), {
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
    const leaveTypeCtx = document.getElementById('leaveTypeChart');
    if (leaveTypeCtx) {
        window.leaveTypeChart = new Chart(leaveTypeCtx.getContext('2d'), {
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
    }

    const monthlyTrendCtx = document.getElementById('monthlyTrendChart');
    if (monthlyTrendCtx) {
        window.monthlyTrendChart = new Chart(monthlyTrendCtx.getContext('2d'), {
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
}

// Professional notification system
function showNotification(message, type) {
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    });

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

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

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

// User info update function
function updateUserInfo(userInfo) {
    console.log('👤 Updating user info:', userInfo);

    if (userInfo && userInfo.user_name) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userInfo.user_name;
        }

        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement) {
            userAvatarElement.textContent = userInfo.user_name.charAt(0).toUpperCase();
        }

        const designationElement = document.getElementById('user-designation');
        if (designationElement && userInfo.designation) {
            designationElement.textContent = userInfo.designation;
        }
    }
}

// Export functions for global access
window.HRDashboard = {
    refreshData: fetchHRData,
    showNotification: showNotification
};

console.log('✅ HR Dashboard initialized successfully');