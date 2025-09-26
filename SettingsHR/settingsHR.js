// Modal functionality
    const userModal = document.getElementById('userModal');
    const addUserBtn = document.getElementById('addUserBtn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelBtn');
    const userForm = document.getElementById('userForm');
    const modalTitle = document.getElementById('modalTitle');
    
    // Open modal when add user button is clicked
    addUserBtn.addEventListener('click', () => {
      modalTitle.textContent = 'Add New User';
      userForm.reset();
      // Set current date for created date
      document.getElementById('createdDate').value = new Date().toISOString().split('T')[0];
      userModal.style.display = 'flex';
    });
    
    // Close modal when close button is clicked
    closeBtn.addEventListener('click', () => {
      userModal.style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', () => {
      userModal.style.display = 'none';
    });
    
    // Close modal when clicking outside the content
    window.addEventListener('click', (event) => {
      if (event.target === userModal) {
        userModal.style.display = 'none';
      }
    });
    
    // Form submission
    userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('User saved successfully!');
      userModal.style.display = 'none';
    });
    
    // Edit user functionality
    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const row = button.closest('tr');
        const cells = row.querySelectorAll('td');
        
        modalTitle.textContent = 'Edit User';
        document.getElementById('userID').value = cells[0].textContent;
        document.getElementById('username').value = cells[1].textContent;
        document.getElementById('email').value = cells[2].textContent;
        document.getElementById('role').value = cells[3].textContent.toLowerCase();
        document.getElementById('department').value = cells[4].textContent.toLowerCase().replace(' ', '-');
        document.getElementById('createdDate').value = cells[5].textContent;
        document.getElementById('isActive').checked = cells[6].querySelector('.status').textContent === 'Active';
        
        userModal.style.display = 'flex';
      });
    });
    
    // Delete user functionality
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const row = button.closest('tr');
        const username = row.querySelector('td:nth-child(2)').textContent;
        
        if (confirm(`Are you sure you want to delete user "${username}"?`)) {
          row.remove();
          updateUserCount();
        }
      });
    });
    
    // View user functionality
    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const row = button.closest('tr');
        const cells = row.querySelectorAll('td');
        
        alert(`User Details:\n\nUser ID: ${cells[0].textContent}\nUsername: ${cells[1].textContent}\nEmail: ${cells[2].textContent}\nRole: ${cells[3].textContent}\nDepartment: ${cells[4].textContent}\nCreated Date: ${cells[5].textContent}\nStatus: ${cells[6].textContent}`);
      });
    });
    
    // Filter functionality
    const searchInput = document.getElementById('searchUser');
    const departmentFilter = document.getElementById('departmentFilter');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const tableRows = document.querySelectorAll('#user-table-body tr');
    
    function applyFilters() {
      const searchTerm = searchInput.value.toLowerCase();
      const department = departmentFilter.value;
      const role = roleFilter.value;
      const status = statusFilter.value;
      
      tableRows.forEach(row => {
        const username = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const email = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const userRole = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        const userDepartment = row.querySelector('td:nth-child(5)').textContent.toLowerCase().replace(' ', '-');
        const userStatus = row.querySelector('td:nth-child(7)').textContent.toLowerCase();
        
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
    
    // Initialize the page
    document.addEventListener('DOMContentLoaded', () => {
      // Set current date for created date in form
      document.getElementById('createdDate').value = new Date().toISOString().split('T')[0];
    });