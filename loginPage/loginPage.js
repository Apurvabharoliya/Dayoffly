document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const userIdInput = document.getElementById('userId');
  
  const userIdError = document.getElementById('userIdError');
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
    userIdError.style.display = 'none';
    passwordError.style.display = 'none';
    
    // Validate User ID
    if (!userIdInput.value.trim()) {
      userIdError.textContent = 'Please enter your user ID';
      userIdError.style.display = 'block';
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
      
      // Authenticate user with mock data
      authenticateUser(userIdInput.value.trim(), passwordInput.value)
        .then(result => {
          if (result.success) {
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // Redirect to appropriate dashboard based on user role
            window.location.href = result.redirectUrl;
          } else {
            // Show error message
            if (result.field === 'userId') {
              userIdError.textContent = result.message;
              userIdError.style.display = 'block';
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
  userIdInput.addEventListener('input', function() {
    if (this.value.trim()) {
      userIdError.style.display = 'none';
    }
  });
  
  passwordInput.addEventListener('input', function() {
    if (this.value) {
      passwordError.style.display = 'none';
    }
  });
  
  // Mock authentication function (no backend needed)
  async function authenticateUser(userId, password) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user database
    const users = [
      {
        id: 'EMP001',
        password: 'password123',
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
        id: 'EMP002',
        password: 'test123',
        name: 'Mike Johnson',
        role: 'employee',
        email: 'mike.johnson@company.com'
      },
      {
        id: 'HR001',
        password: 'hr123',
        name: 'Sarah Wilson',
        role: 'hr',
        email: 'sarah.wilson@company.com'
      }
    ];
    
    // Find user by user ID
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User ID not found',
        field: 'userId'
      };
    }
    
    // Check password
    if (user.password !== password) {
      return {
        success: false,
        message: 'Incorrect password',
        field: 'password'
      };
    }
    
    // Determine redirect URL based on user role
    let redirectUrl;
    if (user.role === 'hr') {
      redirectUrl = '../HRDashboard/HRDashboard.html';
    } else {
      redirectUrl = '../EmployeeDashboard/EmployeeDashboard.html';
    }
    
    // Return success with user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      user: userWithoutPassword,
      redirectUrl: redirectUrl
    };
  }
  
  // Check if user is already logged in
  function checkExistingLogin() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (confirm('You are already logged in. Would you like to go to your dashboard?')) {
          let redirectUrl;
          if (user.role === 'hr') {
            redirectUrl = '../HRDashboard/HRDashboard.html';
          } else {
            redirectUrl = '../EmployeeDashboard/EmployeeDashboard.html';
          }
          window.location.href = redirectUrl;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
  }
  
  // Uncomment the line below to enable auto-redirect if already logged in
  // checkExistingLogin();
});