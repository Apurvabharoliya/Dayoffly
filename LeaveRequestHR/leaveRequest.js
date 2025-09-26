 // Modal functionality
    const viewModal = document.getElementById('viewModal');
    const closeButtons = document.querySelectorAll('.close-btn, #closeViewModal');
    const viewButtons = document.querySelectorAll('.view-btn');
    
    // Open modal when view button is clicked
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        viewModal.style.display = 'flex';
      });
    });
    
    // Close modal when close button is clicked
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        viewModal.style.display = 'none';
      });
    });
    
    // Close modal when clicking outside the content
    window.addEventListener('click', (event) => {
      if (event.target === viewModal) {
        viewModal.style.display = 'none';
      }
    });
    
    // Filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tableRows = document.querySelectorAll('#request-table tr');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        const filter = button.textContent.toLowerCase();
        
        tableRows.forEach(row => {
          if (filter === 'all') {
            row.style.display = '';
          } else {
            const status = row.querySelector('.status').textContent.toLowerCase();
            row.style.display = status === filter ? '' : 'none';
          }
        });
        
        // Update counts
        updateCounts();
      });
    });
    
    // Approve/Reject functionality
    const approveButtons = document.querySelectorAll('.approve-btn');
    const rejectButtons = document.querySelectorAll('.reject-btn');
    
    approveButtons.forEach(button => {
      button.addEventListener('click', () => {
        const row = button.closest('tr');
        const statusCell = row.querySelector('.status');
        statusCell.textContent = 'Approved';
        statusCell.className = 'status status-approved';
        
        // Remove action buttons except view
        const actionCell = row.querySelector('td:last-child');
        actionCell.innerHTML = '<button class="view-btn"><i class="fas fa-eye"></i> View</button>';
        
        // Re-attach event listener to the new view button
        actionCell.querySelector('.view-btn').addEventListener('click', () => {
          viewModal.style.display = 'flex';
        });
        
        updateCounts();
      });
    });
    
    rejectButtons.forEach(button => {
      button.addEventListener('click', () => {
        const row = button.closest('tr');
        const statusCell = row.querySelector('.status');
        statusCell.textContent = 'Rejected';
        statusCell.className = 'status status-rejected';
        
        // Remove action buttons except view
        const actionCell = row.querySelector('td:last-child');
        actionCell.innerHTML = '<button class="view-btn"><i class="fas fa-eye"></i> View</button>';
        
        // Re-attach event listener to the new view button
        actionCell.querySelector('.view-btn').addEventListener('click', () => {
          viewModal.style.display = 'flex';
        });
        
        updateCounts();
      });
    });
    
    // Function to update the counts in the summary cards
    function updateCounts() {
      const pendingCount = document.querySelectorAll('.status-pending').length;
      const approvedCount = document.querySelectorAll('.status-approved').length;
      const rejectedCount = document.querySelectorAll('.status-rejected').length;
      const totalCount = pendingCount + approvedCount + rejectedCount;
      
      document.getElementById('total-count').textContent = totalCount;
      document.getElementById('pending-count').textContent = pendingCount;
      document.getElementById('approved-count').textContent = approvedCount;
      document.getElementById('rejected-count').textContent = rejectedCount;
    }
    
    // Initialize the page
    document.addEventListener('DOMContentLoaded', () => {
      updateCounts();
    });