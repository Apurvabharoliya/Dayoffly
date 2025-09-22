document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const employeeIdInput = document.getElementById('employeeId');
  const roleSelect = document.getElementById('role');
  
  const employeeIdError = document.getElementById('employeeIdError');
  const passwordError = document.getElementById('passwordError');
  const roleError = document.getElementById('roleError');
  
  // Toggle password visibility
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
  });
  
  // Form validation
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    let isValid = true;
    const role = roleSelect.value;
    
    // Reset error messages
    employeeIdError.style.display = 'none';
    passwordError.style.display = 'none';
    roleError.style.display = 'none';
    
    // Validate Employee ID
    if (!employeeIdInput.value.trim()) {
      employeeIdError.style.display = 'block';
      isValid = false;
    }
    
    // Validate Password
    if (!passwordInput.value) {
      passwordError.style.display = 'block';
      isValid = false;
    }
    
    // Validate Role
    if (!role) {
      roleError.style.display = 'block';
      isValid = false;
    }
    
    if (isValid) {
      // Simulate authentication process
      authenticateUser(employeeIdInput.value, passwordInput.value, role);
    }
  });
  
  // Input validation on change
  employeeIdInput.addEventListener('input', function() {
    if (this.value.trim()) {
      employeeIdError.style.display = 'none';
    }
  });
  
  passwordInput.addEventListener('input', function() {
    if (this.value) {
      passwordError.style.display = 'none';
    }
  });
  
  roleSelect.addEventListener('change', function() {
    if (this.value) {
      roleError.style.display = 'none';
    }
  });
  
  // Authentication function
  function authenticateUser(employeeId, password, role) {
    // In a real application, this would be an API call to the server
    console.log('Authenticating user:', { employeeId, password, role });
    
    // Simulate API call with timeout
    setTimeout(() => {
      // For demo purposes, assume authentication is successful
      // In a real application, you would check credentials against the database
      
      // Redirect based on role
      switch(role) {
        case 'employee':
          window.location.href = 'EmployeeDashboard.html';
          break;
        case 'hr':
          window.location.href = 'HRDashboard.html';
          break;
        case 'admin':
          window.location.href = 'AdminDashboard.html';
          break;
        default:
          alert('Invalid role selected');
      }
    }, 1000);
  }
});