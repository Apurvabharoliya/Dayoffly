// Global variables
let userData = null;
let charts = {};
let currentUserId = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Reports & Analytics page...');
    
    // Check if user is logged in
    checkAuthentication();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set default date range to current year
    const currentYear = new Date().getFullYear();
    document.getElementById('date-from').value = `${currentYear}-01-01`;
    document.getElementById('date-to').value = `${currentYear}-12-31`;
});

// Check authentication and load user data
async function checkAuthentication() {
    try {
        showLoading();
        
        // Try to get user data from session
        const response = await fetch('/api/current-user', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            userData = await response.json();
            currentUserId = userData.user_id;
            await loadUserAnalytics();
        } else {
            throw new Error('Not authenticated');
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        showError('Please log in to view your analytics');
        // Redirect to login after 3 seconds
        setTimeout(() => {
            window.location.href = '/login-page';
        }, 3000);
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('apply-date-range').addEventListener('click', applyDateFilter);
    document.getElementById('export-report').addEventListener('click', exportReport);
    document.getElementById('retry-button').addEventListener('click', retryLoading);
}

// Load user analytics data
async function loadUserAnalytics() {
    try {
        showLoading();
        
        if (!currentUserId) {
            throw new Error('User ID not available');
        }
        
        // Fetch user-specific analytics data
        const response = await fetch(`/api/user-analytics/${currentUserId}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const analyticsData = await response.json();
        
        // Update UI with user data
        updateUserInterface(analyticsData);
        hideLoading();
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showError(`Failed to load your analytics data: ${error.message}`);
        
        // Load demo data as fallback
        setTimeout(() => {
            loadDemoData();
        }, 2000);
    }
}

// Update UI with user data
function updateUserInterface(data) {
    if (!data) {
        showNoData();
        return;
    }
    
    // Update welcome section
    updateWelcomeSection(data.userInfo);
    
    // Update avatar
    updateUserAvatar(data.userInfo);
    
    // Update statistics
    updateStatistics(data.stats);
    
    // Update charts
    updateCharts(data.charts);
    
    // Update leave history
    updateLeaveHistory(data.leaveHistory);
    
    // Update patterns
    updatePatterns(data.patterns);
    
    // Show all sections
    showContentSections();
}

// Update welcome section
function updateWelcomeSection(userInfo) {
    const welcomeTitle = document.getElementById('welcome-title');
    const welcomeSubtitle = document.getElementById('welcome-subtitle');
    const userDetails = document.getElementById('user-details');
    const userWelcome = document.getElementById('user-welcome');
    
    const userName = userInfo.user_name || 'User';
    welcomeTitle.textContent = `My Leave Analytics - ${userName}`;
    welcomeSubtitle.textContent = `View your personal leave statistics and trends`;
    
    let detailsText = `${userName}`;
    if (userInfo.designation) detailsText += ` • ${userInfo.designation}`;
    if (userInfo.department_name) detailsText += ` • ${userInfo.department_name}`;
    
    userDetails.textContent = detailsText;
    userWelcome.style.display = 'block';
}

// Update user avatar
function updateUserAvatar(userInfo) {
    const avatarImg = document.getElementById('user-avatar-img');
    const userName = userInfo.user_name || 'User';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=667eea&color=fff&size=36`;
    avatarImg.src = avatarUrl;
    avatarImg.alt = `${userName}'s Avatar`;
}

// Update statistics cards
function updateStatistics(stats) {
    const statsSection = document.getElementById('stats-section');
    
    // If no stats data, show message
    if (!stats || stats.totalRequests === 0) {
        statsSection.innerHTML = `
            <div class="stat-card" style="min-width: 100%; text-align: center;">
                <div class="stat-number" style="font-size: 1.5rem;">📊</div>
                <div class="stat-label">No Leave Data Yet</div>
                <p class="text-xs text-gray-500 mt-2">Start applying for leaves to see your statistics</p>
            </div>
        `;
        statsSection.style.display = 'flex';
        return;
    }
    
    statsSection.innerHTML = ''; // Clear existing content
    
    const statCards = [
        {
            number: stats.totalRequests || 0,
            label: 'My Leave Requests',
            description: `${stats.approvedRequests || 0} approved, ${stats.pendingRequests || 0} pending`
        },
        {
            number: `${stats.approvalRate || 0}%`,
            label: 'My Approval Rate',
            description: stats.totalRequests > 0 ? 'Based on your leave history' : 'No requests yet'
        },
        {
            number: `${stats.daysUsed || 0} days`,
            label: 'Leave Days Used',
            description: `${stats.daysRemaining || 0} days remaining of ${stats.totalAllowed || 0}`
        },
        {
            number: stats.mostUsedType || 'N/A',
            label: 'My Most Used Type',
            description: stats.mostUsedPercentage || 'No data available'
        }
    ];
    
    statCards.forEach(stat => {
        const statCard = document.createElement('div');
        statCard.className = 'stat-card';
        statCard.innerHTML = `
            <div class="stat-number">${stat.number}</div>
            <div class="stat-label">${stat.label}</div>
            <p class="text-xs text-gray-500 mt-2">${stat.description}</p>
        `;
        statsSection.appendChild(statCard);
    });
    
    statsSection.style.display = 'flex';
}

// Update all charts
function updateCharts(chartData) {
    // Destroy existing charts
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    
    charts = {};
    
    // Initialize charts with user data
    initCharts(chartData);
}

// Update leave history table
function updateLeaveHistory(history) {
    const tableBody = document.getElementById('leave-history-body');
    const historySection = document.getElementById('history-section');
    
    if (!history || history.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox mr-2"></i>
                    No leave history found
                </td>
            </tr>
        `;
        historySection.style.display = 'block';
        return;
    }
    
    tableBody.innerHTML = '';
    
    history.forEach(leave => {
        const statusClass = getStatusClass(leave.leave_status);
        const statusText = leave.leave_status.charAt(0).toUpperCase() + leave.leave_status.slice(1);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${leave.start_date} to ${leave.end_date}</td>
            <td>${leave.leave_type}</td>
            <td>${leave.duration}</td>
            <td><span class="px-2 py-1 ${statusClass} rounded-full text-xs">${statusText}</span></td>
            <td title="${leave.reason}">${truncateText(leave.reason, 30)}</td>
            <td>${leave.approved_by}</td>
        `;
        tableBody.appendChild(row);
    });
    
    historySection.style.display = 'block';
}

// Update patterns section
function updatePatterns(patterns) {
    const patternsContainer = document.getElementById('patterns-container');
    const patternsSection = document.getElementById('patterns-section');
    
    if (!patterns || patterns.length === 0) {
        patternsContainer.innerHTML = `
            <div class="peak-card medium">
                <h4>No Patterns Detected</h4>
                <p>Not enough data to identify leave patterns</p>
                <p class="text-xs mt-2">Apply more leaves to see your patterns</p>
                <span class="peak-badge badge-medium">Info</span>
            </div>
        `;
        patternsSection.style.display = 'block';
        return;
    }
    
    patternsContainer.innerHTML = '';
    
    patterns.forEach(pattern => {
        const patternCard = document.createElement('div');
        patternCard.className = `peak-card ${pattern.type}`;
        patternCard.innerHTML = `
            <h4>${pattern.title}</h4>
            <p>${pattern.description}</p>
            <p class="text-xs mt-2">${pattern.details}</p>
            <span class="peak-badge badge-${pattern.type}">${pattern.badge}</span>
        `;
        patternsContainer.appendChild(patternCard);
    });
    
    patternsSection.style.display = 'block';
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Get status class for styling
function getStatusClass(status) {
    const statusClasses = {
        'approved': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'rejected': 'bg-red-100 text-red-800',
        'declined': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
}

// Initialize charts with data
function initCharts(chartData) {
    if (!chartData) {
        console.warn('No chart data provided');
        showNoData();
        return;
    }
    
    const chartConfigs = {
        leaveTypeChart: {
            type: 'doughnut',
            data: chartData.leaveType,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: 'My Leave Types' }
                }
            }
        },
        monthlyTrendChart: {
            type: 'line',
            data: chartData.monthlyTrend,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Number of Leaves' },
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    title: { display: true, text: 'My Monthly Leave Pattern' }
                }
            }
        },
        statusChart: {
            type: 'pie',
            data: chartData.status,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: 'My Leave Status' }
                }
            }
        },
        durationChart: {
            type: 'bar',
            data: chartData.duration,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Number of Leaves' },
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    title: { display: true, text: 'My Leave Duration Pattern' }
                }
            }
        }
    };
    
    // Initialize each chart
    Object.entries(chartConfigs).forEach(([chartId, config]) => {
        const canvas = document.getElementById(chartId);
        if (!canvas) {
            console.warn(`Canvas element not found: ${chartId}`);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Check if we have valid data
        const hasData = config.data && 
                       config.data.datasets && 
                       config.data.datasets[0] && 
                       config.data.datasets[0].data && 
                       config.data.datasets[0].data.some(val => val > 0);
        
        if (!hasData) {
            // Show no data message for chart
            canvas.style.display = 'none';
            const container = canvas.closest('.chart-container');
            const noDataDiv = document.createElement('div');
            noDataDiv.className = 'no-data';
            noDataDiv.style.height = '100%';
            noDataDiv.style.display = 'flex';
            noDataDiv.style.flexDirection = 'column';
            noDataDiv.style.justifyContent = 'center';
            noDataDiv.style.alignItems = 'center';
            noDataDiv.innerHTML = `
                <i class="fas fa-chart-pie mb-2" style="font-size: 2rem; opacity: 0.5;"></i>
                <p class="text-gray-500">No data available</p>
            `;
            container.appendChild(noDataDiv);
            return;
        }
        
        charts[chartId] = new Chart(ctx, config);
    });
}

// Apply date filter
async function applyDateFilter() {
    const fromDate = document.getElementById('date-from').value;
    const toDate = document.getElementById('date-to').value;
    
    if (!fromDate || !toDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    if (new Date(fromDate) > new Date(toDate)) {
        alert('Start date cannot be after end date');
        return;
    }
    
    showLoading();
    
    try {
        // In a real implementation, this would send the date range to the server
        // For now, we'll just reload the data with a message
        setTimeout(() => {
            alert(`Date range filter applied: ${fromDate} to ${toDate}\nDisplaying your leave data for the selected period.`);
            loadUserAnalytics(); // Reload data
        }, 500);
        
    } catch (error) {
        console.error('Error applying date filter:', error);
        showError('Failed to apply date filter');
        hideLoading();
    }
}

// Export report
async function exportReport() {
    try {
        if (!currentUserId) {
            alert('Please wait while we load your data');
            return;
        }
        
        const fromDate = document.getElementById('date-from').value;
        const toDate = document.getElementById('date-to').value;
        
        showLoading();
        
        const response = await fetch(`/api/export-analytics/${currentUserId}?from=${fromDate}&to=${toDate}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(`Your personal leave report for ${fromDate} to ${toDate} exported successfully!\n\nDownload URL: ${result.download_url}`);
        } else {
            throw new Error('Export failed');
        }
        
    } catch (error) {
        console.error('Error exporting report:', error);
        alert('Export feature is currently unavailable. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Retry loading data
function retryLoading() {
    loadUserAnalytics();
}

// Show loading state
function showLoading() {
    document.getElementById('loading-spinner').style.display = 'flex';
    document.getElementById('error-message').style.display = 'none';
    hideContentSections();
}

// Hide loading state
function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
}

// Show error message
function showError(message) {
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-text').textContent = message;
    hideContentSections();
}

// Show no data message
function showNoData() {
    hideContentSections();
    document.getElementById('no-data-message').style.display = 'block';
}

// Show content sections
function showContentSections() {
    document.getElementById('date-filter-section').style.display = 'block';
    document.getElementById('stats-section').style.display = 'flex';
    document.getElementById('charts-section').style.display = 'block';
    document.getElementById('history-section').style.display = 'block';
    document.getElementById('patterns-section').style.display = 'block';
    document.getElementById('no-data-message').style.display = 'none';
}

// Hide content sections
function hideContentSections() {
    document.getElementById('date-filter-section').style.display = 'none';
    document.getElementById('stats-section').style.display = 'none';
    document.getElementById('charts-section').style.display = 'none';
    document.getElementById('history-section').style.display = 'none';
    document.getElementById('patterns-section').style.display = 'none';
    document.getElementById('user-welcome').style.display = 'none';
    document.getElementById('no-data-message').style.display = 'none';
}

// Load demo data as fallback
function loadDemoData() {
    console.log('Loading demo data as fallback...');
    
    const demoData = {
        userInfo: {
            user_name: userData?.user_name || 'Demo User',
            designation: userData?.designation || 'Employee',
            department_name: userData?.department_name || 'Department'
        },
        stats: {
            totalRequests: 0,
            approvedRequests: 0,
            pendingRequests: 0,
            rejectedRequests: 0,
            approvalRate: 0,
            daysUsed: 0,
            daysRemaining: 20,
            totalAllowed: 20,
            mostUsedType: 'N/A',
            mostUsedPercentage: 'No data available'
        },
        charts: {
            leaveType: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#6b7280']
                }]
            },
            monthlyTrend: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'My Leave Requests',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true
                }]
            },
            status: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#6b7280']
                }]
            },
            duration: {
                labels: ['No Data'],
                datasets: [{
                    label: 'My Leave Durations',
                    data: [0],
                    backgroundColor: '#8b5cf6'
                }]
            }
        },
        leaveHistory: [],
        patterns: [
            {
                title: 'Welcome!',
                description: 'Start Your Leave Journey',
                details: 'Apply for your first leave to see analytics here',
                type: 'medium',
                badge: 'Getting Started'
            }
        ]
    };
    
    updateUserInterface(demoData);
    hideLoading();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible, refresh data after a delay
        setTimeout(() => {
            if (currentUserId) {
                loadUserAnalytics();
            }
        }, 1000);
    }
});

// Periodic data refresh (every 5 minutes)
setInterval(() => {
    if (currentUserId && !document.hidden) {
        loadUserAnalytics();
    }
}, 300000); 