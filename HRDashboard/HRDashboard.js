const requests = [
      { 
        employee: 'Amit Shah', 
        type: 'Casual', 
        dates: 'Sep 20–22, 2023', 
        duration: '3 days',
        status: 'Pending' 
      },
      { 
        employee: 'Priya Mehta', 
        type: 'Sick', 
        dates: 'Sep 15–16, 2023', 
        duration: '2 days',
        status: 'Approved' 
      },
      { 
        employee: 'Ravi Patel', 
        type: 'Earned', 
        dates: 'Sep 10–12, 2023', 
        duration: '3 days',
        status: 'Pending' 
      },
      { 
        employee: 'Sneha Desai', 
        type: 'Maternity', 
        dates: 'Oct 1–Dec 31, 2023', 
        duration: '92 days',
        status: 'Approved' 
      },
      { 
        employee: 'Vikram Singh', 
        type: 'Casual', 
        dates: 'Sep 25–26, 2023', 
        duration: '2 days',
        status: 'Rejected' 
      }
    ];

    function populateRequests() {
      const tbody = document.getElementById('request-table');
      tbody.innerHTML = '';
      
      requests.forEach(req => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: #e9ecef; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                ${req.employee.charAt(0)}
              </div>
              ${req.employee}
            </div>
          </td>
          <td>${req.type}</td>
          <td>${req.dates}</td>
          <td>${req.duration}</td>
          <td><span class="status status-${req.status.toLowerCase()}">${req.status}</span></td>
          <td>
            <button class="approve-btn" onclick="approve('${req.employee}')"><i class="fas fa-check"></i> Approve</button>
            <button class="reject-btn" onclick="reject('${req.employee}')"><i class="fas fa-times"></i> Reject</button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      updateSummary();
    }

    function approve(name) {
      const request = requests.find(req => req.employee === name);
      if (request && request.status === 'Pending') {
        request.status = 'Approved';
        populateRequests();
        
        // Show notification
        showNotification(`Leave approved for ${name}`, 'success');
        
        // Update charts
        updateCharts();
      }
    }

    function reject(name) {
      const request = requests.find(req => req.employee === name);
      if (request && request.status === 'Pending') {
        request.status = 'Rejected';
        populateRequests();
        
        // Show notification
        showNotification(`Leave rejected for ${name}`, 'error');
        
        // Update charts
        updateCharts();
      }
    }
    
    function updateSummary() {
      const totalCount = requests.length;
      const pendingCount = requests.filter(req => req.status === 'Pending').length;
      const approvedCount = requests.filter(req => req.status === 'Approved').length;
      const rejectedCount = requests.filter(req => req.status === 'Rejected').length;
      
      document.getElementById('total-count').textContent = totalCount;
      document.getElementById('pending-count').textContent = pendingCount;
      document.getElementById('approved-count').textContent = approvedCount;
      document.getElementById('rejected-count').textContent = rejectedCount;
    }
    
    function showNotification(message, type) {
      // Create notification element
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.padding = '15px 20px';
      notification.style.borderRadius = '4px';
      notification.style.color = 'white';
      notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      notification.style.zIndex = '1000';
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      
      if (type === 'success') {
        notification.style.background = 'var(--success)';
      } else {
        notification.style.background = 'var(--danger)';
      }
      
      notification.textContent = message;
      document.body.appendChild(notification);
      
      // Fade in
      setTimeout(() => {
        notification.style.opacity = '1';
      }, 10);
      
      // Remove after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }
    
    // Initialize filter buttons
    function initFilters() {
      const filterBtns = document.querySelectorAll('.filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          // Remove active class from all buttons
          filterBtns.forEach(b => b.classList.remove('active'));
          // Add active class to clicked button
          btn.classList.add('active');
          
          // In a real app, you would filter the table here
        });
      });
    }
    
    // Create charts with dummy data
    let leaveTypeChart, monthlyTrendChart;
    
    function createCharts() {
      // Dummy data for leave types
      const leaveTypeData = {
        labels: ['Casual', 'Sick', 'Earned', 'Maternity', 'Paternity'],
        datasets: [{
          data: [35, 25, 20, 15, 5],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      };
      
      // Dummy data for monthly trends
      const monthlyTrendData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        datasets: [
          {
            label: 'Approved',
            data: [12, 19, 7, 15, 12, 13, 10, 15, 8],
            borderColor: 'rgba(40, 167, 69, 1)',
            backgroundColor: 'rgba(40, 167, 69, 0.2)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Pending',
            data: [5, 7, 3, 8, 4, 7, 5, 6, 4],
            borderColor: 'rgba(255, 193, 7, 1)',
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Rejected',
            data: [2, 3, 1, 4, 2, 3, 1, 2, 2],
            borderColor: 'rgba(220, 53, 69, 1)',
            backgroundColor: 'rgba(220, 53, 69, 0.2)',
            tension: 0.3,
            fill: true
          }
        ]
      };
      
      // Create leave type chart (pie chart)
      const leaveTypeCtx = document.getElementById('leaveTypeChart').getContext('2d');
      leaveTypeChart = new Chart(leaveTypeCtx, {
        type: 'pie',
        data: leaveTypeData,
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
      
      // Create monthly trend chart (line chart)
      const monthlyTrendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
      monthlyTrendChart = new Chart(monthlyTrendCtx, {
        type: 'line',
        data: monthlyTrendData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
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
    
    function updateCharts() {
      // Update charts with new data if needed
      // For this example, we'll just regenerate the charts
      leaveTypeChart.destroy();
      monthlyTrendChart.destroy();
      createCharts();
    }

    // Initialize the dashboard
    document.addEventListener('DOMContentLoaded', () => {
      populateRequests();
      initFilters();
      createCharts();
    });