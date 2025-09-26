// Employee data structure
    const employees = [
      {
        id: "EMP001",
        name: "Alice Johnson",
        position: "Software Engineer",
        department: "Engineering",
        email: "alice.johnson@company.com",
        joinDate: "2022-03-15",
        status: "Active",
        avatar: "AJ",
        leaves: [
          { type: "Sick Leave", dates: "Sep 20-22, 2023", duration: "3 days", status: "Approved" },
          { type: "Casual Leave", dates: "Oct 5, 2023", duration: "1 day", status: "Pending" },
          { type: "Annual Leave", dates: "Nov 10-15, 2023", duration: "6 days", status: "Approved" }
        ]
      },
      {
        id: "EMP002",
        name: "Bob Smith",
        position: "Product Manager",
        department: "Product",
        email: "bob.smith@company.com",
        joinDate: "2021-07-10",
        status: "Active",
        avatar: "BS",
        leaves: [
          { type: "Annual Leave", dates: "Aug 15-16, 2023", duration: "2 days", status: "Rejected" },
          { type: "Sick Leave", dates: "Sep 5, 2023", duration: "1 day", status: "Approved" }
        ]
      },
      {
        id: "EMP003",
        name: "Charlie Brown",
        position: "UX Designer",
        department: "Design",
        email: "charlie.brown@company.com",
        joinDate: "2023-01-20",
        status: "Active",
        avatar: "CB",
        leaves: [
          { type: "Work From Home", dates: "Sep 10, 2023", duration: "1 day", status: "Approved" },
          { type: "Casual Leave", dates: "Oct 20-21, 2023", duration: "2 days", status: "Pending" }
        ]
      },
      {
        id: "EMP004",
        name: "Diana Miller",
        position: "QA Engineer",
        department: "Engineering",
        email: "diana.miller@company.com",
        joinDate: "2022-11-05",
        status: "On Leave",
        avatar: "DM",
        leaves: [
          { type: "Maternity Leave", dates: "Sep 1, 2023 - Jan 1, 2024", duration: "123 days", status: "Approved" }
        ]
      },
      {
        id: "EMP005",
        name: "Ethan Wilson",
        position: "DevOps Engineer",
        department: "Engineering",
        email: "ethan.wilson@company.com",
        joinDate: "2021-09-12",
        status: "Active",
        avatar: "EW",
        leaves: [
          { type: "Casual Leave", dates: "Sep 25-26, 2023", duration: "2 days", status: "Approved" },
          { type: "Sick Leave", dates: "Oct 8, 2023", duration: "1 day", status: "Approved" }
        ]
      }
    ];

    // Get user info from localStorage (set during login)
    const userInfo = JSON.parse(localStorage.getItem('hrUser') || '{"name":"Sarah Johnson","role":"HR Manager","department":"All"}');
    
    // Update user info in the header
    document.getElementById('user-name').textContent = userInfo.name;
    document.getElementById('user-role').textContent = userInfo.role;
    document.getElementById('user-avatar').textContent = userInfo.name.split(' ').map(n => n[0]).join('');
    
    // Filter employees based on HR's department
    let filteredEmployees = employees;
    if (userInfo.department !== "All") {
      filteredEmployees = employees.filter(emp => emp.department === userInfo.department);
    }

    function populateEmployeeCards(employeesToShow = filteredEmployees) {
      const employeeList = document.getElementById('employee-list');
      employeeList.innerHTML = '';
      
      employeesToShow.forEach(employee => {
        const approvedLeaves = employee.leaves.filter(leave => leave.status === 'Approved').length;
        const pendingLeaves = employee.leaves.filter(leave => leave.status === 'Pending').length;
        const totalLeaves = employee.leaves.length;
        
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.innerHTML = `
          <div class="employee-header">
            <div class="employee-avatar">${employee.avatar}</div>
            <div class="employee-info">
              <h3>${employee.name}</h3>
              <p>${employee.position}</p>
              <p>${employee.department} • ${employee.id}</p>
            </div>
          </div>
          <div class="employee-stats">
            <div class="stat">
              <span class="stat-value">${totalLeaves}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat">
              <span class="stat-value">${approvedLeaves}</span>
              <span class="stat-label">Approved</span>
            </div>
            <div class="stat">
              <span class="stat-value">${pendingLeaves}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>
          <div class="employee-actions">
            <button class="view-btn" onclick="viewEmployeeDetails('${employee.id}')">
              <i class="fas fa-eye"></i> View Details
            </button>
          </div>
        `;
        employeeList.appendChild(card);
      });
    }

    function viewEmployeeDetails(employeeId) {
      const employee = filteredEmployees.find(emp => emp.id === employeeId);
      if (!employee) return;
      
      document.getElementById('employee-list').style.display = 'none';
      document.getElementById('back-btn').style.display = 'block';
      document.getElementById('employee-details').style.display = 'block';
      
      const approvedLeaves = employee.leaves.filter(leave => leave.status === 'Approved').length;
      const pendingLeaves = employee.leaves.filter(leave => leave.status === 'Pending').length;
      const rejectedLeaves = employee.leaves.filter(leave => leave.status === 'Rejected').length;
      const totalLeaves = employee.leaves.length;
      
      const detailsDiv = document.getElementById('employee-details');
      detailsDiv.innerHTML = `
        <div class="employee-header">
          <div class="employee-avatar" style="width: 80px; height: 80px; font-size: 2rem;">${employee.avatar}</div>
          <div class="employee-info">
            <h2>${employee.name}</h2>
            <p>${employee.position} • ${employee.department}</p>
            <p>Employee ID: ${employee.id} | Email: ${employee.email}</p>
            <p>Join Date: ${new Date(employee.joinDate).toLocaleDateString()} | Status: ${employee.status}</p>
          </div>
        </div>
        
        <div class="stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">
          <div class="card total">
            <h3>${totalLeaves}</h3>
            <p>Total Requests</p>
          </div>
          <div class="card approved">
            <h3>${approvedLeaves}</h3>
            <p>Approved</p>
          </div>
          <div class="card pending">
            <h3>${pendingLeaves}</h3>
            <p>Pending</p>
          </div>
          <div class="card rejected">
            <h3>${rejectedLeaves}</h3>
            <p>Rejected</p>
          </div>
        </div>
        
        <div class="leave-history">
          <h3>Leave History</h3>
          ${employee.leaves.length > 0 ? 
            employee.leaves.map(leave => `
              <div class="leave-record">
                <div class="leave-info">
                  <h4>${leave.type}</h4>
                  <div class="leave-dates">${leave.dates} (${leave.duration})</div>
                </div>
                <span class="status status-${leave.status.toLowerCase()}">${leave.status}</span>
              </div>
            `).join('') : 
            '<p>No leave records found.</p>'
          }
        </div>
      `;
    }

    function showEmployeeList() {
      document.getElementById('employee-list').style.display = 'grid';
      document.getElementById('back-btn').style.display = 'none';
      document.getElementById('employee-details').style.display = 'none';
    }

    function filterEmployees(filter) {
      // Update active filter button
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      let filtered = filteredEmployees;
      
      switch(filter) {
        case 'active':
          filtered = filteredEmployees.filter(emp => emp.status === 'Active');
          break;
        case 'onLeave':
          filtered = filteredEmployees.filter(emp => emp.status === 'On Leave');
          break;
        // 'all' is default
      }
      
      populateEmployeeCards(filtered);
    }

    // Initialize the page
    document.addEventListener('DOMContentLoaded', () => {
      populateEmployeeCards();
    });