document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const userIdInput = document.getElementById('userId');

  const userIdError = document.getElementById('userIdError');
  const passwordError = document.getElementById('passwordError');

  // Toggle password visibility
  togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
  });

  // Form validation
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let isValid = true;

    userIdError.style.display = 'none';
    passwordError.style.display = 'none';

    if (!userIdInput.value.trim()) {
      userIdError.textContent = 'Please enter your user ID';
      userIdError.style.display = 'block';
      isValid = false;
    }

    if (!passwordInput.value) {
      passwordError.textContent = 'Please enter your password';
      passwordError.style.display = 'block';
      isValid = false;
    }

    if (isValid) {
      const submitBtn = document.querySelector('.btn-primary');
      const originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
      submitBtn.disabled = true;

      authenticateUser(userIdInput.value.trim(), passwordInput.value)
        .then(result => {
          if (result.success) {
            localStorage.setItem('user', JSON.stringify(result.user));
            window.location.href = result.redirectUrl;
          } else {
            if (result.field === 'userId') {
              userIdError.textContent = result.message;
              userIdError.style.display = 'block';
            } else if (result.field === 'password') {
              passwordError.textContent = result.message;
              passwordError.style.display = 'block';
            } else {
              alert(result.message);
            }
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        })
        .catch(error => {
          alert('Authentication failed. Please try again.');
          console.error('Authentication error:', error);
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    }
  });

  userIdInput.addEventListener('input', function () {
    if (this.value.trim()) {
      userIdError.style.display = 'none';
    }
  });

  passwordInput.addEventListener('input', function () {
    if (this.value) {
      passwordError.style.display = 'none';
    }
  });

// Updated the authenticateUser function in loginPage.js
async function authenticateUser(userId, password) {
  try {
    const response = await fetch('http://127.0.0.1:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });

    const data = await response.json();
    
    if (data.success && data.token) {
      // Store token and user data in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('userRole', data.user.role_name);
    }
    
    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      field: 'system'
    };
  }
}

});
