// analytics.js - HR Analytics Dashboard JavaScript

class HRAnalytics {
    constructor() {
        this.analyticsData = null;
        this.charts = {};
        this.currentFilters = {
            department: 'all',
            employee: 'all',
            period: '6months',
            view: 'leaves'
        };
        this.init();
    }

    init() {
        this.loadAnalyticsData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Filter change listeners
        document.getElementById('periodFilter')?.addEventListener('change', (e) => {
            this.currentFilters.period = e.target.value;
            this.refreshData();
        });
        
        document.getElementById('departmentFilter')?.addEventListener('change', (e) => {
            this.currentFilters.department = e.target.value;
            // Reset employee filter when department changes
            this.currentFilters.employee = 'all';
            this.refreshData();
        });
        
        document.getElementById('employeeFilter')?.addEventListener('change', (e) => {
            this.currentFilters.employee = e.target.value;
            this.refreshData();
        });
        
        document.getElementById('viewFilter')?.addEventListener('change', (e) => {
            this.currentFilters.view = e.target.value;
            this.refreshData();
        });
    }

    async loadAnalyticsData() {
        try {
            this.showLoadingState(true);

            // Build URL with query parameters
            const params = new URLSearchParams({
                department: this.currentFilters.department,
                employee: this.currentFilters.employee,
                period: this.currentFilters.period,
                view: this.currentFilters.view
            });

            const response = await fetch(`http://127.0.0.1:5000/hr/analytics-data?${params}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.analyticsData = data;
            this.updateDashboard();
            this.updateFilterDropdowns();
            this.renderCharts();
            this.populateEmployeeTable();

        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Failed to load analytics data: ' + error.message);
        } finally {
            this.showLoadingState(false);
        }
    }

    updateFilterDropdowns() {
        if (!this.analyticsData?.filters) return;

        // Update department dropdown
        const departmentSelect = document.getElementById('departmentFilter');
        if (departmentSelect) {
            // Keep current selection
            const currentDept = departmentSelect.value;
            
            // Clear existing options except "All Departments"
            while (departmentSelect.options.length > 1) {
                departmentSelect.remove(1);
            }
            
            // Add departments from database
            this.analyticsData.filters.departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                departmentSelect.appendChild(option);
            });
            
            // Restore selection if it still exists
            if (currentDept !== 'all') {
                const optionExists = Array.from(departmentSelect.options).some(opt => opt.value === currentDept);
                if (optionExists) {
                    departmentSelect.value = currentDept;
                } else {
                    departmentSelect.value = 'all';
                    this.currentFilters.department = 'all';
                }
            }
        }

        // Update employee dropdown
        const employeeSelect = document.getElementById('employeeFilter');
        if (employeeSelect) {
            // Keep current selection
            const currentEmployee = employeeSelect.value;
            
            // Clear existing options except "All Employees"
            while (employeeSelect.options.length > 1) {
                employeeSelect.remove(1);
            }
            
            // Add employees from database
            this.analyticsData.filters.allEmployees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.user_id;
                option.textContent = `${emp.user_name} (${emp.department_name})`;
                employeeSelect.appendChild(option);
            });
            
            // Restore selection if it still exists
            if (currentEmployee !== 'all') {
                const optionExists = Array.from(employeeSelect.options).some(opt => opt.value === currentEmployee);
                if (optionExists) {
                    employeeSelect.value = currentEmployee;
                } else {
                    employeeSelect.value = 'all';
                    this.currentFilters.employee = 'all';
                }
            }
        }
    }

    showLoadingState(show) {
        const loadingElements = document.querySelectorAll('.loading-state');
        loadingElements.forEach(el => {
            el.style.display = show ? 'block' : 'none';
        });

        if (show) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
    }

    showError(message) {
        // Remove existing error messages
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(el => el.remove());

        // Create new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

        // Insert at the top of main content
        const mainContent = document.querySelector('.main-content');
        const firstChild = mainContent.firstChild;
        mainContent.insertBefore(errorDiv, firstChild);
    }

    updateDashboard() {
        if (!this.analyticsData) return;

        const { summary } = this.analyticsData;

        // Update summary cards
        this.updateElement('total-leaves', summary.totalLeaves);
        this.updateElement('avg-duration', summary.avgDuration);
        this.updateElement('approval-rate', `${summary.approvalRate}%`);
        this.updateElement('on-leave', summary.onLeaveNow);

        // Update dashboard title based on filters
        this.updateDashboardTitle();
    }

    updateDashboardTitle() {
        const titleElement = document.querySelector('.section-header h2');
        if (!titleElement) return;

        let title = 'Leave Analytics Dashboard';
        
        if (this.currentFilters.employee !== 'all') {
            const employeeSelect = document.getElementById('employeeFilter');
            const selectedOption = employeeSelect?.selectedOptions[0];
            const employeeName = selectedOption ? selectedOption.textContent.split(' (')[0] : 'Employee';
            title = `${employeeName}'s Leave Analytics`;
        } else if (this.currentFilters.department !== 'all') {
            title = `${this.currentFilters.department} Department Leave Analytics`;
        }

        titleElement.textContent = title;
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    renderCharts() {
        if (!this.analyticsData) return;

        const { charts } = this.analyticsData;

        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        // 1. Leave Types Distribution Chart
        this.renderLeaveTypesChart(charts.leaveTypes);

        // 2. Monthly Trends Chart
        this.renderMonthlyTrendsChart(charts.monthlyTrends);

        // 3. Department Distribution Chart
        this.renderDepartmentChart(charts.departmentDistribution);

        // 4. Approval Trends Chart
        this.renderApprovalChart(charts.approvalTrends);
    }

    renderLeaveTypesChart(leaveTypesData) {
        const ctx = document.getElementById('leaveTypeChart')?.getContext('2d');
        if (!ctx) return;

        const labels = Object.keys(leaveTypesData);
        const data = Object.values(leaveTypesData);

        // Show message if no data
        if (labels.length === 0) {
            this.showNoDataMessage('leaveTypeChart', 'No leave type data available');
            return;
        }

        this.charts.leaveTypeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    title: {
                        display: true,
                        text: this.currentFilters.employee !== 'all' ? 'Leave Types (Selected Employee)' : 'Leave Types Distribution'
                    }
                }
            }
        });
    }

    renderMonthlyTrendsChart(monthlyData) {
        const ctx = document.getElementById('monthlyTrendChart')?.getContext('2d');
        if (!ctx) return;

        // Show message if no data
        if (monthlyData.leaves.every(val => val === 0)) {
            this.showNoDataMessage('monthlyTrendChart', 'No monthly trend data available');
            return;
        }

        this.charts.monthlyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.months,
                datasets: [{
                    label: 'Leaves Taken',
                    data: monthlyData.leaves,
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: this.currentFilters.employee !== 'all' ? 'Monthly Trends (Selected Employee)' : 'Monthly Leave Trends'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderDepartmentChart(departmentData) {
        const ctx = document.getElementById('departmentChart')?.getContext('2d');
        if (!ctx) return;

        const labels = Object.keys(departmentData);
        const data = Object.values(departmentData);

        // Show message if no data or when viewing single employee
        if (labels.length === 0 || this.currentFilters.employee !== 'all') {
            this.showNoDataMessage('departmentChart', 
                this.currentFilters.employee !== 'all' 
                    ? 'Department chart not available for individual employees' 
                    : 'No department data available');
            return;
        }

        this.charts.departmentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Leaves by Department',
                    data: data,
                    backgroundColor: '#4BC0C0',
                    borderColor: '#4BC0C0',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Department-wise Leave Distribution'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderApprovalChart(approvalData) {
        const ctx = document.getElementById('approvalChart')?.getContext('2d');
        if (!ctx) return;

        // Show message if no data
        if (approvalData.rates.length === 0 || approvalData.rates.every(rate => rate === 0)) {
            this.showNoDataMessage('approvalChart', 'No approval trend data available');
            return;
        }

        this.charts.approvalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: approvalData.months,
                datasets: [{
                    label: 'Approval Rate (%)',
                    data: approvalData.rates,
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: this.currentFilters.employee !== 'all' ? 'Approval Trends (Selected Employee)' : 'Approval Rate Over Time'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    showNoDataMessage(canvasId, message) {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const container = canvas.parentElement;
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <div>${message}</div>
                </div>
            `;
        }
    }

    populateEmployeeTable() {
        if (!this.analyticsData) return;

        const tableBody = document.querySelector('#employee-leave-table tbody');
        if (!tableBody) return;

        const employees = this.analyticsData.employees;

        if (employees.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-info-circle"></i>
                        <div>No employee data available for selected filters</div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = employees.map(emp => `
            <tr>
                <td>${this.escapeHtml(emp.employee)}</td>
                <td>${this.escapeHtml(emp.department)}</td>
                <td>${emp.leavesTaken}</td>
                <td>${emp.remainingBalance}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(emp.utilizationRate, 100)}%"></div>
                        </div>
                        <span>${emp.utilizationRate}%</span>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    refreshData() {
        this.loadAnalyticsData();
    }
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    new HRAnalytics();
});