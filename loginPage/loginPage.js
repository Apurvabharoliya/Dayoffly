document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const employeeIdInput = document.getElementById('employeeId');
  
  const employeeIdError = document.getElementById('employeeIdError');
  const passwordError = document.getElementById('passwordError');
  
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
    
    // Reset error messages
    employeeIdError.style.display = 'none';
    passwordError.style.display = 'none';
    
    // Validate Employee ID
    if (!employeeIdInput.value.trim()) {
      employeeIdError.textContent = 'Please enter your employee ID';
      employeeIdError.style.display = 'block';
      isValid = false;
    }
    
    // Validate Password
    if (!passwordInput.value) {
      passwordError.textContent = 'Please enter your password';
      passwordError.style.display = 'block';
      isValid = false;
    }
    
    if (isValid) {
      // Show loading state
      const submitBtn = document.querySelector('.btn-primary');
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
      submitBtn.disabled = true;
      
      // Authenticate user
      authenticateUser(employeeIdInput.value.trim(), passwordInput.value)
        .then(result => {
          if (result.success) {
            // Store user data in localStorage (in a real app, you might use more secure methods)
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // Redirect to dashboard
            window.location.href = result.redirectUrl;
          } else {
            // Show error message
            if (result.field === 'employeeId') {
              employeeIdError.textContent = result.message;
              employeeIdError.style.display = 'block';
            } else if (result.field === 'password') {
              passwordError.textContent = result.message;
              passwordError.style.display = 'block';
            } else {
              // General error
              alert(result.message);
            }
            
            // Restore button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        })
        .catch(error => {
          alert('Authentication failed. Please try again.');
          console.error('Authentication error:', error);
          
          // Restore button
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
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
  
  // Authentication function with simulated user database
  async function authenticateUser(employeeId, password) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated user database (in a real application, this would be on the server)
    const users = [
      {
        id: 'EMP001',
        password: 'password123', // In a real app, this would be a hashed password
        name: 'John Doe',
        role: 'employee',
        email: 'john.doe@company.com'
      },
      {
        id: 'HR002',
        password: 'hrpass123',
        name: 'Jane Smith',
        role: 'hr',
        email: 'jane.smith@company.com'
      },
      {
        id: 'ADM003',
        password: 'adminpass',
        name: 'Admin User',
        role: 'admin',
        email: 'admin@company.com'
      }
    ];
    
    // Find user by employee ID
    const user = users.find(u => u.id === employeeId);
    
    if (!user) {
      return {
        success: false,
        message: 'Employee ID not found',
        field: 'employeeId'
      };
    }
    
    // Check password (in a real app, compare hashed passwords)
    if (user.password !== password) {
      return {
        success: false,
        message: 'Incorrect password',
        field: 'password'
      };
    }
    
    // Determine redirect URL based on role
    let redirectUrl;
    switch(user.role) {
      case 'employee':
        redirectUrl = '../EmployeeDashboard/EmployeeDashboard.html';
        break;
      case 'hr':
        redirectUrl = '../HRDashboard/HRDashboard.html';
        break;
      case 'admin':
        redirectUrl = '../AdminDashboard/AdminDashboard.html';
        break;
      default:
        console.log('Unknown role, redirecting to default dashboard');
    }
    
    // Return success with user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      user: userWithoutPassword,
      redirectUrl: redirectUrl
    };
  }
  
  // Check if user is already logged in (optional)
  function checkExistingLogin() {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (confirm('You are already logged in. Would you like to go to your dashboard?')) {
        let redirectUrl;
        switch(user.role) {
          case 'employee':
            redirectUrl = '../EmployeeDashboard/EmployeeDashboard.html';
            break;
          case 'hr':
            redirectUrl = '../HRDashboard/HRDashboard.html';
            break;
          case 'admin':
            redirectUrl = '../AdminDashboard/AdminDashboard.html';
            break;
          default:
            console.log('Unknown role, redirecting to default dashboard');
        }
        window.location.href = redirectUrl;
      }
    }
  }
  
  // Uncomment the line below to enable auto-redirect if already logged in
  // checkExistingLogin();
});