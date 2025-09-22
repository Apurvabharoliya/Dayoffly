document.addEventListener('DOMContentLoaded', function() {
      // Get DOM elements
      const loginForm = document.getElementById('loginForm');
      const togglePassword = document.getElementById('togglePassword');
      const passwordInput = document.getElementById('password');
      const employeeIdInput = document.getElementById('employeeId');
      const roleSelect = document.getElementById('role');
      const employeeFields = document.getElementById('employeeFields');
      const hrFields = document.getElementById('hrFields');
      const adminFields = document.getElementById('adminFields');
      
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
      
      // Handle role selection change
      roleSelect.addEventListener('change', function() {
        const role = this.value;
        
        // Hide all role-specific fields first
        employeeFields.style.display = 'none';
        hrFields.style.display = 'none';
        adminFields.style.display = 'none';
        
        // Show fields based on selected role
        if (role === 'employee') {
          employeeFields.style.display = 'block';
        } else if (role === 'hr') {
          hrFields.style.display = 'block';
        } else if (role === 'admin') {
          adminFields.style.display = 'block';
        }
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
        
        // Role-specific validation
        if (role === 'employee') {
          const department = document.getElementById('department');
          const designation = document.getElementById('designation');
          
          if (!department.value) {
            document.getElementById('departmentError').style.display = 'block';
            isValid = false;
          }
          
          if (!designation.value) {
            document.getElementById('designationError').style.display = 'block';
            isValid = false;
          }
        } else if (role === 'hr') {
          const hrRegion = document.getElementById('hrRegion');
          const hrLevel = document.getElementById('hrLevel');
          
          if (!hrRegion.value) {
            document.getElementById('hrRegionError').style.display = 'block';
            isValid = false;
          }
          
          if (!hrLevel.value) {
            document.getElementById('hrLevelError').style.display = 'block';
            isValid = false;
          }
        } else if (role === 'admin') {
          const adminAccess = document.getElementById('adminAccess');
          const adminDepartment = document.getElementById('adminDepartment');
          
          if (!adminAccess.value) {
            document.getElementById('adminAccessError').style.display = 'block';
            isValid = false;
          }
          
          if (!adminDepartment.value) {
            document.getElementById('adminDepartmentError').style.display = 'block';
            isValid = false;
          }
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
      
      // Role-specific field validation
      const setupRoleFieldValidation = (fieldId, errorId) => {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);
        
        if (field && error) {
          field.addEventListener('change', function() {
            if (this.value) {
              error.style.display = 'none';
            }
          });
        }
      };
      
      // Set up validation for all role-specific fields
      setupRoleFieldValidation('department', 'departmentError');
      setupRoleFieldValidation('designation', 'designationError');
      setupRoleFieldValidation('hrRegion', 'hrRegionError');
      setupRoleFieldValidation('hrLevel', 'hrLevelError');
      setupRoleFieldValidation('adminAccess', 'adminAccessError');
      setupRoleFieldValidation('adminDepartment', 'adminDepartmentError');
      
      // Authentication function
      function authenticateUser(employeeId, password, role) {
        // In a real application, this would be an API call to the server
        console.log('Authenticating user:', { employeeId, password, role });
        
        // Get role-specific data
        let roleData = {};
        if (role === 'employee') {
          roleData = {
            department: document.getElementById('department').value,
            designation: document.getElementById('designation').value
          };
        } else if (role === 'hr') {
          roleData = {
            region: document.getElementById('hrRegion').value,
            level: document.getElementById('hrLevel').value
          };
        } else if (role === 'admin') {
          roleData = {
            access: document.getElementById('adminAccess').value,
            adminDepartment: document.getElementById('adminDepartment').value
          };
        }
        
        console.log('Role-specific data:', roleData);
        
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