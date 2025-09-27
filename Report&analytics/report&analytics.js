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
        alert('Date range filter applied. Displaying your leave data for the selected period.');
      });
      
      document.getElementById('export-report').addEventListener('click', function() {
        alert('Your personal leave report exported successfully!');
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
            data: [45, 25, 15, 10, 5],
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
            },
            title: {
              display: true,
              text: 'My Leave Types'
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
            label: 'My Leave Requests',
            data: [1, 0, 2, 1, 1, 0, 3, 2, 1, 2, 1, 5],
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
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Leaves'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'My Monthly Leave Pattern'
            }
          }
        }
      });
      
      // Status Distribution Chart
      const statusCtx = document.getElementById('statusChart').getContext('2d');
      new Chart(statusCtx, {
        type: 'pie',
        data: {
          labels: ['Approved', 'Pending', 'Rejected'],
          datasets: [{
            data: [83, 8, 9],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            },
            title: {
              display: true,
              text: 'My Leave Status'
            }
          }
        }
      });
      
      // Duration Pattern Chart
      const durationCtx = document.getElementById('durationChart').getContext('2d');
      new Chart(durationCtx, {
        type: 'bar',
        data: {
          labels: ['1 day', '2 days', '3 days', '4-5 days', '5+ days'],
          datasets: [{
            label: 'My Leave Durations',
            data: [6, 8, 5, 3, 2],
            backgroundColor: '#8b5cf6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Leaves'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'My Leave Duration Pattern'
            }
          }
        }
      });
    }