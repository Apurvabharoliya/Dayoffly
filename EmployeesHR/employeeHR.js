// Analytics functionality
    let leaveTypeChart, departmentChart;
    
    function createAnalyticsCharts() {
      // Get data from employee list
      const employees = JSON.parse(localStorage.getItem('hrEmployees') || '[]');
      
      // Calculate analytics data
      const leaveTypes = {};
      const departments = {};
      
      employees.forEach(employee => {
        // Count leave types
        employee.leaves.forEach(leave => {
          leaveTypes[leave.type] = (leaveTypes[leave.type] || 0) + 1;
        });
        
        // Count departments
        departments[employee.department] = (departments[employee.department] || 0) + 1;
      });
      
      // Update summary stats
      document.getElementById('total-employees').textContent = employees.length;
      document.getElementById('active-employees').textContent = employees.filter(emp => emp.status === 'Active').length;
      document.getElementById('on-leave-count').textContent = employees.filter(emp => emp.status === 'On Leave').length;
      
      const totalLeaves = employees.reduce((sum, emp) => sum + emp.leaves.length, 0);
      document.getElementById('avg-leaves').textContent = employees.length > 0 ? (totalLeaves / employees.length).toFixed(1) : '0';
      
      // Create leave type chart
      const leaveTypeCtx = document.getElementById('leaveTypeChart').getContext('2d');
      leaveTypeChart = new Chart(leaveTypeCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(leaveTypes),
          datasets: [{
            data: Object.values(leaveTypes),
            backgroundColor: [
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 99, 132, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
      
      // Create department chart
      const departmentCtx = document.getElementById('departmentChart').getContext('2d');
      departmentChart = new Chart(departmentCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(departments),
          datasets: [{
            label: 'Employees',
            data: Object.values(departments),
            backgroundColor: 'rgba(23, 162, 184, 0.7)',
            borderColor: 'rgba(23, 162, 184, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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
    
    // Update analytics when employee data changes
    function updateAnalytics() {
      if (leaveTypeChart) leaveTypeChart.destroy();
      if (departmentChart) departmentChart.destroy();
      createAnalyticsCharts();
    }
    
    // Initialize analytics when page loads
    document.addEventListener('DOMContentLoaded', () => {
      // Store employee data in localStorage for analytics
      localStorage.setItem('hrEmployees', JSON.stringify(employees));
      
      // Create analytics charts
      createAnalyticsCharts();
    });