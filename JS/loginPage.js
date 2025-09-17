document.addEventListener('DOMContentLoaded', function() {
      // Get DOM elements
      const roleSelect = document.getElementById('role');
      const employeeDetails = document.getElementById('employeeDetails');
      const hrDetails = document.getElementById('hrDetails');
      const togglePassword = document.getElementById('togglePassword');
      const passwordInput = document.getElementById('password');
      
      // Toggle password visibility
      togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
      });
      
      // Handle role selection change
      roleSelect.addEventListener('change', function() {
        const value = this.value;
        
        // Hide all role sections first
        employeeDetails.classList.add('hidden');
        hrDetails.classList.add('hidden');
        
        // Show the appropriate section based on selection
        if (value === 'employee') {
          employeeDetails.classList.remove('hidden');
        } else if (value === 'hr') {
          hrDetails.classList.remove('hidden');
        }
      });
      
      // Form validation
      document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const role = document.getElementById('role').value;
        let isValid = true;
        
        // Basic validation
        if (!document.getElementById('email').value) {
          alert('Please enter your email address');
          isValid = false;
        } else if (!document.getElementById('password').value) {
          alert('Please enter your password');
          isValid = false;
        } else if (!role) {
          alert('Please select your role');
          isValid = false;
        } else if (role === 'employee') {
          if (!document.getElementById('department').value) {
            alert('Please select your department');
            isValid = false;
          } else if (!document.getElementById('jobRole').value) {
            alert('Please enter your job role');
            isValid = false;
          }
        } else if (role === 'hr') {
          if (!document.getElementById('hrDepartment').value) {
            alert('Please select your department');
            isValid = false;
          }
        }
        
        if (isValid) {
          alert('Form submitted successfully!');
          // In a real application, you would submit the form to a server here
        }
      });
    });