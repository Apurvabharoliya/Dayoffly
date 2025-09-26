// Initialize charts
    document.addEventListener('DOMContentLoaded', function() {
      // Set default date range (current year)
      const currentYear = new Date().getFullYear();
      document.getElementById('date-from').value = currentYear + '-01-01';
      document.getElementById('date-to').value = currentYear + '-12-31';
      
      // Initialize charts
      initCharts();
      
      // Set up event listeners
      document.getElementById('apply-date-range').addEventListener('click', function() {
        // In a real application, this would filter the data based on the selected date range
        alert('Date range filter applied. In a real application, this would update the charts and data.');
      });
      
      document.getElementById('export-report').addEventListener('click', function() {
        alert('Report exported successfully!');
      });
    });
    
    function initCharts() {
      // Leave Type Distribution Chart
      const leaveTypeCtx = document.getElementById('leaveTypeChart').getContext('2d');
      new Chart(leaveTypeCtx, {
        type: 'doughnut',
        data: {
          labels: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Work From Home', 'Other'],
          datasets: [{
            data: [42, 28, 15, 10, 5],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
      
      // Monthly Trend Chart
      const monthlyTrendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
      new Chart(monthlyTrendCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Leave Requests',
            data: [8, 10, 12, 9, 11, 15, 22, 18, 14, 10, 9, 6],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // Department-wise Analysis Chart
      const departmentCtx = document.getElementById('departmentChart').getContext('2d');
      new Chart(departmentCtx, {
        type: 'bar',
        data: {
          labels: ['Engineering', 'Sales', 'HR', 'Finance', 'IT'],
          datasets: [{
            label: 'Total Requests',
            data: [42, 28, 19, 15, 20],
            backgroundColor: '#8b5cf6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // Status Distribution Chart
      const statusCtx = document.getElementById('statusChart').getContext('2d');
      new Chart(statusCtx, {
        type: 'pie',
        data: {
          labels: ['Approved', 'Pending', 'Rejected', 'Cancelled'],
          datasets: [{
            data: [78, 12, 7, 3],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
    }