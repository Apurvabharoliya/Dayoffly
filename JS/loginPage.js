// Store the user role globally
    let userRole = '';
    
    document.addEventListener('DOMContentLoaded', function() {
      // Get DOM elements
      const roleSelect = document.getElementById('role');
      const togglePassword = document.getElementById('togglePassword');
      const passwordInput = document.getElementById('password');
      const loginForm = document.getElementById('loginForm');
      const loginSection = document.getElementById('loginSection');
      const brandingSection = document.getElementById('brandingSection');
      const detailsForm = document.getElementById('detailsForm');
      const loginLoader = document.getElementById('loginLoader');
      const employeeLoader = document.getElementById('employeeLoader');
      const hrLoader = document.getElementById('hrLoader');
      const cmoLoader = document.getElementById('cmoLoader');
      const employeeDetailsForm = document.getElementById('employeeDetailsForm');
      const hrDetailsForm = document.getElementById('hrDetailsForm');
      const cmoDetailsForm = document.getElementById('cmoDetailsForm');
      const detailsFormTitle = document.getElementById('detailsFormTitle');
      const detailsFormSubtitle = document.getElementById('detailsFormSubtitle');
      
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
        
        const role = document.getElementById('role').value;
        userRole = role; // Store the role globally
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
        }
        
        if (isValid) {
          // Show loading animation
          loginLoader.style.display = 'inline-block';
          
          // Simulate login process
          setTimeout(function() {
            loginLoader.style.display = 'none';
            
            // Hide login form and show details form
            loginSection.style.display = 'none';
            detailsForm.style.display = 'block';
            brandingSection.style.display = 'none';
            
            // Show the appropriate form based on role
            if (role === 'employee') {
              employeeDetailsForm.classList.remove('hidden');
              detailsFormTitle.textContent = 'Complete Your Employee Profile';
              detailsFormSubtitle.textContent = 'Please provide your employee details to continue';
            } else if (role === 'hr') {
              hrDetailsForm.classList.remove('hidden');
              detailsFormTitle.textContent = 'Complete Your HR Profile';
              detailsFormSubtitle.textContent = 'Please provide your HR details to continue';
            } else if (role === 'cmo') {
              cmoDetailsForm.classList.remove('hidden');
              detailsFormTitle.textContent = 'Complete Your CMO Profile';
              detailsFormSubtitle.textContent = 'Please provide your CMO details to continue';
            }
          }, 1500);
        }
      });
      
      // Employee details form submission
      employeeDetailsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading animation
        employeeLoader.style.display = 'inline-block';
        
        // Simulate form submission
        setTimeout(function() {
          employeeLoader.style.display = 'none';
          document.getElementById('step2').classList.remove('active');
          document.getElementById('step2').classList.add('completed');
          document.getElementById('step3').classList.add('active');
          
          detailsFormTitle.textContent = 'Registration Complete!';
          detailsFormSubtitle.textContent = 'Your employee account has been successfully created';
          
          // Hide form and show success message
          employeeDetailsForm.style.display = 'none';
          
          // Create success message
          const successMessage = document.createElement('div');
          successMessage.innerHTML = `
            <div style="text-align: center; padding: 30px 0;">
              <i class="fas fa-check-circle" style="font-size: 48px; color: #3a0ca3; margin-bottom: 20px;"></i>
              <h3 style="color: #3a0ca3; margin-bottom: 15px;">Welcome to Dayoffly!</h3>
              <p style="margin-bottom: 30px;">Your account has been successfully created. You can now access all features.</p>
              <button class="btn-primary" onclick="redirectToDashboard()">
                Go to Dashboard <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          `;
          detailsForm.appendChild(successMessage);
        }, 1500);
      });
      
      // HR details form submission
      hrDetailsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading animation
        hrLoader.style.display = 'inline-block';
        
        // Simulate form submission
        setTimeout(function() {
          hrLoader.style.display = 'none';
          document.getElementById('step2').classList.remove('active');
          document.getElementById('step2').classList.add('completed');
          document.getElementById('step3').classList.add('active');
          
          detailsFormTitle.textContent = 'Registration Complete!';
          detailsFormSubtitle.textContent = 'Your HR account has been successfully created';
          
          // Hide form and show success message
          hrDetailsForm.style.display = 'none';
          
          // Create success message
          const successMessage = document.createElement('div');
          successMessage.innerHTML = `
            <div style="text-align: center; padding: 30px 0;">
              <i class="fas fa-check-circle" style="font-size: 48px; color: #3a0ca3; margin-bottom: 20px;"></i>
              <h3 style="color: #3a0ca3; margin-bottom: 15px;">Welcome to Dayoffly!</h3>
              <p style="margin-bottom: 30px;">Your HR account has been successfully created. You can now access all features.</p>
              <button class="btn-primary" onclick="redirectToDashboard()">
                Go to Dashboard <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          `;
          detailsForm.appendChild(successMessage);
        }, 1500);
      });
      
      // CMO details form submission
      cmoDetailsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading animation
        cmoLoader.style.display = 'inline-block';
        
        // Simulate form submission
        setTimeout(function() {
          cmoLoader.style.display = 'none';
          document.getElementById('step2').classList.remove('active');
          document.getElementById('step2').classList.add('completed');
          document.getElementById('step3').classList.add('active');
          
          detailsFormTitle.textContent = 'Registration Complete!';
          detailsFormSubtitle.textContent = 'Your CMO account has been successfully created';
          
          // Hide form and show success message
          cmoDetailsForm.style.display = 'none';
          
          // Create success message
          const successMessage = document.createElement('div');
          successMessage.innerHTML = `
            <div style="text-align: center; padding: 30px 0;">
              <i class="fas fa-check-circle" style="font-size: 48px; color: #3a0ca3; margin-bottom: 20px;"></i>
              <h3 style="color: #3a0ca3; margin-bottom: 15px;">Welcome to Dayoffly!</h3>
              <p style="margin-bottom: 30px;">Your CMO account has been successfully created. You can now access all features.</p>
              <button class="btn-primary" onclick="redirectToDashboard()">
                Go to Dashboard <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          `;
          detailsForm.appendChild(successMessage);
        }, 1500);
      });
    });
    
    function goBackToLogin() {
      // Hide details form and show login form
      document.getElementById('detailsForm').style.display = 'none';
      document.getElementById('loginSection').style.display = 'block';
      document.getElementById('brandingSection').style.display = 'flex';
      
      // Hide all detail forms
      document.getElementById('employeeDetailsForm').classList.add('hidden');
      document.getElementById('hrDetailsForm').classList.add('hidden');
      document.getElementById('cmoDetailsForm').classList.add('hidden');
      
      // Reset progress steps
      document.getElementById('step2').classList.remove('active', 'completed');
      document.getElementById('step3').classList.remove('active', 'completed');
      document.getElementById('step2').classList.add('active');
      
      // Show the forms again
      document.getElementById('employeeDetailsForm').style.display = 'block';
      document.getElementById('hrDetailsForm').style.display = 'block';
      document.getElementById('cmoDetailsForm').style.display = 'block';
    }
    
    function redirectToDashboard() {
      // Redirect based on user role
      if (userRole === 'employee') {
        window.location.href = 'EmployeeDashboard.html';
      } else if (userRole === 'hr') {
        window.location.href = 'HRDashboard.html';
      } else if (userRole === 'cmo') {
        // For CMO, you can redirect to a specific dashboard or use a generic one
        window.location.href = 'CMODashboard.html';
      } else {
        // Fallback to employee dashboard if role is not set
        window.location.href = 'EmployeeDashboard.html';
      }
    }