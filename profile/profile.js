// profile.js - Complete Profile Management System
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeSettings();
    setupSettingsListeners();
    setupSaveButton();
    loadProfileData();
    setupEditFunctionality();
    
    console.log('Profile management system initialized');
});

// ==================== PROFILE DATA MANAGEMENT ====================

async function loadProfileData() {
    try {
        showLoading('Loading profile data...');
        
        const response = await fetch('/api/profile');
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            populateProfileData(result.data);
            showNotification('Profile data loaded successfully', 'success');
        } else {
            console.error('Failed to load profile data:', result.message);
            showNotification('Failed to load profile data', 'error');
            // Load mock data for demonstration
            loadMockData();
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        hideLoading();
        showNotification('Error loading profile data', 'error');
        loadMockData();
    }
}

function populateProfileData(data) {
    if (!data) return;
    
    // Populate profile header
    if (data.personal_info) {
        populatePersonalInfo(data.personal_info);
    }
    
    // Populate contact details
    if (data.personal_info && isContactDetailsPage()) {
        populateContactDetails(data.personal_info);
    }
    
    // Populate emergency contacts
    if (data.emergency_contacts && isContactDetailsPage()) {
        populateEmergencyContacts(data.emergency_contacts);
    }
}

function populatePersonalInfo(personalInfo) {
    // Update profile header
    const profileName = document.querySelector('.profile-name');
    if (profileName) {
        const pronouns = personalInfo.pronouns ? `(${personalInfo.pronouns})` : '(They/Them)';
        profileName.innerHTML = `${personalInfo.user_name || '--'} <span>${pronouns}</span>`;
    }
    
    const profileTitle = document.querySelector('.profile-title');
    if (profileTitle) {
        profileTitle.textContent = `${personalInfo.designation || '--'} • ${personalInfo.department || '--'}`;
    }
    
    // Update personal information card
    updateInfoField('user_name', personalInfo.user_name);
    updateInfoField('email', personalInfo.email);
    updateInfoField('preferred_name', personalInfo.preferred_name);
    updateInfoField('date_of_birth', personalInfo.date_of_birth ? formatDate(personalInfo.date_of_birth) : '--');
    updateInfoField('gender', personalInfo.gender);
    updateInfoField('nationality', personalInfo.nationality);
}

function populateContactDetails(contactInfo) {
    updateInfoField('personal_email', contactInfo.personal_email);
    updateInfoField('mobile_phone', contactInfo.mobile_phone);
    updateInfoField('work_phone', contactInfo.work_phone);
    updateInfoField('home_address', contactInfo.home_address);
}

function populateEmergencyContacts(contacts) {
    const container = document.querySelector('.card-body .contact-list') || 
                     document.querySelector('.emergency-contacts-container') ||
                     document.querySelector('.card-body');
    
    if (!container) return;
    
    // Find existing contact items or create container
    let contactsContainer = container.querySelector('.contact-list');
    if (!contactsContainer) {
        contactsContainer = document.createElement('div');
        contactsContainer.className = 'contact-list';
        container.appendChild(contactsContainer);
    }
    
    contactsContainer.innerHTML = '';
    
    if (contacts.length === 0) {
        contactsContainer.innerHTML = '<div class="no-contacts">No emergency contacts added</div>';
        return;
    }
    
    contacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.innerHTML = `
            <div class="contact-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="contact-info">
                <div class="contact-name">${contact.contact_name || '--'}</div>
                <div class="contact-relation">${contact.relationship || '--'}</div>
                <div class="contact-phone">${contact.phone_number || '--'}</div>
            </div>
        `;
        contactsContainer.appendChild(contactElement);
    });
}

// ==================== EDIT FUNCTIONALITY ====================

function setupEditFunctionality() {
    // Setup edit buttons for different sections
    setupEditButton('.card-header .edit-btn', 'card');
    setupEditButton('.personal-info-edit', 'personal');
    setupEditButton('.contact-details-edit', 'contact');
    setupEditButton('.emergency-contacts-edit', 'emergency');
}

function setupEditButton(selector, type) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleEditClick(type, button.closest('.card'));
        });
    });
}

function handleEditClick(type, cardElement) {
    switch(type) {
        case 'personal':
            openPersonalInfoEditor();
            break;
        case 'contact':
            openContactDetailsEditor();
            break;
        case 'emergency':
            openEmergencyContactsEditor();
            break;
        case 'card':
            // Determine which card based on content
            const cardTitle = cardElement.querySelector('.card-title')?.textContent;
            if (cardTitle?.includes('Personal')) {
                openPersonalInfoEditor();
            } else if (cardTitle?.includes('Contact Details')) {
                openContactDetailsEditor();
            } else if (cardTitle?.includes('Emergency')) {
                openEmergencyContactsEditor();
            }
            break;
    }
}

async function openPersonalInfoEditor() {
    try {
        const response = await fetch('/api/profile');
        const result = await response.json();
        
        if (result.success) {
            const data = result.data.personal_info;
            showPersonalInfoForm(data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading personal info:', error);
        // Show form with empty data as fallback
        showPersonalInfoForm({});
    }
}

function showPersonalInfoForm(data) {
    const formHtml = `
        <div class="modal-overlay active">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Personal Information</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="personalInfoForm" class="modal-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="user_name">Legal Name *</label>
                            <input type="text" id="user_name" name="user_name" 
                                   value="${escapeHtml(data.user_name || '')}" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="email">Work Email *</label>
                            <input type="email" id="email" name="email" 
                                   value="${escapeHtml(data.email || '')}" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="preferred_name">Preferred Name</label>
                            <input type="text" id="preferred_name" name="preferred_name" 
                                   value="${escapeHtml(data.preferred_name || '')}">
                        </div>
                        <div class="form-group">
                            <label for="date_of_birth">Date of Birth</label>
                            <input type="date" id="date_of_birth" name="date_of_birth" 
                                   value="${data.date_of_birth || ''}">
                        </div>
                        <div class="form-group">
                            <label for="gender">Gender</label>
                            <select id="gender" name="gender">
                                <option value="">Select Gender</option>
                                <option value="Female" ${data.gender === 'Female' ? 'selected' : ''}>Female</option>
                                <option value="Male" ${data.gender === 'Male' ? 'selected' : ''}>Male</option>
                                <option value="Non-binary" ${data.gender === 'Non-binary' ? 'selected' : ''}>Non-binary</option>
                                <option value="Other" ${data.gender === 'Other' ? 'selected' : ''}>Other</option>
                                <option value="Prefer not to say" ${data.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="nationality">Nationality</label>
                            <input type="text" id="nationality" name="nationality" 
                                   value="${escapeHtml(data.nationality || '')}">
                        </div>
                        <div class="form-group">
                            <label for="pronouns">Pronouns</label>
                            <input type="text" id="pronouns" name="pronouns" 
                                   value="${escapeHtml(data.pronouns || '')}" 
                                   placeholder="They/Them">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    showModal(formHtml);
    document.getElementById('personalInfoForm').addEventListener('submit', savePersonalInfo);
}

async function savePersonalInfo(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (!data.user_name || !data.email) {
        showNotification('Name and email are required fields', 'error');
        return;
    }
    
    if (data.email && !validateEmail(data.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        showLoading('Saving personal information...');
        
        const response = await fetch('/api/profile/personal-info', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showNotification('Personal information updated successfully', 'success');
            closeModal();
            await loadProfileData(); // Reload data
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving personal info:', error);
        hideLoading();
        showNotification('Error saving personal information', 'error');
    }
}

async function openContactDetailsEditor() {
    try {
        const response = await fetch('/api/profile');
        const result = await response.json();
        
        if (result.success) {
            const data = result.data.personal_info;
            showContactDetailsForm(data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading contact details:', error);
        showContactDetailsForm({});
    }
}

function showContactDetailsForm(data) {
    const formHtml = `
        <div class="modal-overlay active">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Contact Details</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="contactDetailsForm" class="modal-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="personal_email">Personal Email</label>
                            <input type="email" id="personal_email" name="personal_email" 
                                   value="${escapeHtml(data.personal_email || '')}">
                            <small>For personal communications</small>
                        </div>
                        <div class="form-group">
                            <label for="mobile_phone">Mobile Phone</label>
                            <input type="tel" id="mobile_phone" name="mobile_phone" 
                                   value="${escapeHtml(data.mobile_phone || '')}">
                            <small>Primary contact number</small>
                        </div>
                        <div class="form-group">
                            <label for="work_phone">Work Phone</label>
                            <input type="tel" id="work_phone" name="work_phone" 
                                   value="${escapeHtml(data.work_phone || '')}">
                            <small>Office extension if available</small>
                        </div>
                        <div class="form-group full-width">
                            <label for="home_address">Home Address</label>
                            <textarea id="home_address" name="home_address" 
                                      rows="3" placeholder="Enter your complete address">${escapeHtml(data.home_address || '')}</textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    showModal(formHtml);
    document.getElementById('contactDetailsForm').addEventListener('submit', saveContactDetails);
}

async function saveContactDetails(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Validation
    if (data.personal_email && !validateEmail(data.personal_email)) {
        showNotification('Please enter a valid personal email', 'error');
        return;
    }
    
    if (data.mobile_phone && !validatePhone(data.mobile_phone)) {
        showNotification('Please enter a valid mobile phone number', 'error');
        return;
    }
    
    if (data.work_phone && !validatePhone(data.work_phone)) {
        showNotification('Please enter a valid work phone number', 'error');
        return;
    }
    
    try {
        showLoading('Saving contact details...');
        
        const response = await fetch('/api/profile/contact-details', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showNotification('Contact details updated successfully', 'success');
            closeModal();
            await loadProfileData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving contact details:', error);
        hideLoading();
        showNotification('Error saving contact details', 'error');
    }
}

async function openEmergencyContactsEditor() {
    try {
        const response = await fetch('/api/profile/emergency-contacts');
        const result = await response.json();
        
        if (result.success) {
            showEmergencyContactsForm(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error loading emergency contacts:', error);
        showEmergencyContactsForm([]);
    }
}

function showEmergencyContactsForm(contacts) {
    const contactsHtml = contacts.map((contact, index) => `
        <div class="emergency-contact-form" data-index="${index}">
            <h4>Emergency Contact ${index + 1}</h4>
            <div class="form-grid">
                <div class="form-group">
                    <label>Contact Name *</label>
                    <input type="text" name="contacts[${index}][contact_name]" 
                           value="${escapeHtml(contact.contact_name || '')}" required>
                </div>
                <div class="form-group">
                    <label>Relationship *</label>
                    <input type="text" name="contacts[${index}][relationship]" 
                           value="${escapeHtml(contact.relationship || '')}" required>
                </div>
                <div class="form-group">
                    <label>Phone Number *</label>
                    <input type="tel" name="contacts[${index}][phone_number]" 
                           value="${escapeHtml(contact.phone_number || '')}" required>
                </div>
            </div>
            <button type="button" class="btn-remove-contact" onclick="removeEmergencyContact(${index})">
                Remove Contact
            </button>
        </div>
    `).join('');
    
    const formHtml = `
        <div class="modal-overlay active">
            <div class="modal-content wide">
                <div class="modal-header">
                    <h3>Edit Emergency Contacts</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="emergencyContactsForm" class="modal-form">
                    <div id="emergencyContactsContainer">
                        ${contactsHtml}
                        ${contacts.length === 0 ? '<div class="no-contacts-message">No emergency contacts added</div>' : ''}
                    </div>
                    
                    <button type="button" class="btn-add-contact" onclick="addEmergencyContactField()">
                        <i class="fas fa-plus"></i> Add Another Contact
                    </button>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Contacts</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    showModal(formHtml);
    document.getElementById('emergencyContactsForm').addEventListener('submit', saveEmergencyContacts);
}

function addEmergencyContactField() {
    const container = document.getElementById('emergencyContactsContainer');
    const contactCount = container.querySelectorAll('.emergency-contact-form').length;
    
    const newContactHtml = `
        <div class="emergency-contact-form" data-index="${contactCount}">
            <h4>Emergency Contact ${contactCount + 1}</h4>
            <div class="form-grid">
                <div class="form-group">
                    <label>Contact Name *</label>
                    <input type="text" name="contacts[${contactCount}][contact_name]" required>
                </div>
                <div class="form-group">
                    <label>Relationship *</label>
                    <input type="text" name="contacts[${contactCount}][relationship]" required>
                </div>
                <div class="form-group">
                    <label>Phone Number *</label>
                    <input type="tel" name="contacts[${contactCount}][phone_number]" required>
                </div>
            </div>
            <button type="button" class="btn-remove-contact" onclick="removeEmergencyContact(${contactCount})">
                Remove Contact
            </button>
        </div>
    `;
    
    // Remove no contacts message if it exists
    const noContactsMsg = container.querySelector('.no-contacts-message');
    if (noContactsMsg) {
        noContactsMsg.remove();
    }
    
    container.insertAdjacentHTML('beforeend', newContactHtml);
}

function removeEmergencyContact(index) {
    const contactForm = document.querySelector(`.emergency-contact-form[data-index="${index}"]`);
    if (contactForm) {
        contactForm.remove();
        
        // Reindex remaining contacts
        const remainingContacts = document.querySelectorAll('.emergency-contact-form');
        remainingContacts.forEach((contact, newIndex) => {
            contact.setAttribute('data-index', newIndex);
            contact.querySelector('h4').textContent = `Emergency Contact ${newIndex + 1}`;
            
            // Update input names
            const inputs = contact.querySelectorAll('input');
            inputs[0].name = `contacts[${newIndex}][contact_name]`;
            inputs[1].name = `contacts[${newIndex}][relationship]`;
            inputs[2].name = `contacts[${newIndex}][phone_number]`;
            
            // Update remove button onclick
            const removeBtn = contact.querySelector('.btn-remove-contact');
            removeBtn.setAttribute('onclick', `removeEmergencyContact(${newIndex})`);
        });
        
        // Show no contacts message if all removed
        if (remainingContacts.length === 0) {
            const container = document.getElementById('emergencyContactsContainer');
            container.innerHTML = '<div class="no-contacts-message">No emergency contacts added</div>';
        }
    }
}

async function saveEmergencyContacts(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const contacts = [];
    
    // Extract contact data from form
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('contacts[')) {
            const match = key.match(/contacts\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const index = parseInt(match[1]);
                const field = match[2];
                
                if (!contacts[index]) {
                    contacts[index] = {};
                }
                contacts[index][field] = value;
            }
        }
    }
    
    // Filter out empty contacts and validate
    const validContacts = contacts.filter(contact => 
        contact && contact.contact_name && contact.relationship && contact.phone_number
    );
    
    // Validation
    for (const contact of validContacts) {
        if (!validatePhone(contact.phone_number)) {
            showNotification(`Invalid phone number for ${contact.contact_name}`, 'error');
            return;
        }
    }
    
    if (validContacts.length === 0) {
        showNotification('Please add at least one emergency contact', 'error');
        return;
    }
    
    try {
        showLoading('Saving emergency contacts...');
        
        const response = await fetch('/api/profile/emergency-contacts', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contacts: validContacts })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showNotification('Emergency contacts updated successfully', 'success');
            closeModal();
            await loadProfileData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving emergency contacts:', error);
        hideLoading();
        showNotification('Error saving emergency contacts', 'error');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function updateInfoField(fieldName, value) {
    const elements = document.querySelectorAll(`[data-field="${fieldName}"]`);
    elements.forEach(element => {
        element.textContent = value || '--';
    });
}

function formatDate(dateString) {
    if (!dateString) return '--';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (error) {
        return dateString;
    }
}

function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

function validatePhone(phone) {
    const pattern = /^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
    return pattern.test(phone);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function isContactDetailsPage() {
    return window.location.pathname.includes('contact-details');
}

function showModal(html) {
    // Remove any existing modal
    closeModal();
    
    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';
    
    // Add click outside to close
    const overlay = document.querySelector('.modal-overlay');
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

function closeModal() {
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    document.body.style.overflow = '';
}

function showLoading(message = 'Loading...') {
    // Remove existing loading
    hideLoading();
    
    const loadingHtml = `
        <div class="loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
}

function hideLoading() {
    const existingLoading = document.querySelector('.loading-overlay');
    if (existingLoading) {
        existingLoading.remove();
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ==================== MOCK DATA FOR DEMONSTRATION ====================

function loadMockData() {
    console.log('Loading mock data for demonstration');
    
    const mockData = {
        personal_info: {
            user_name: 'Emily Chen',
            email: 'emily.chen@company.com',
            designation: 'Software Engineer II',
            department: 'Product & Engineering',
            preferred_name: 'Em',
            date_of_birth: '1990-01-15',
            gender: 'Female',
            nationality: 'Canadian',
            pronouns: 'She/Her',
            personal_email: 'emily.chen@personal.com',
            mobile_phone: '(555) 123-4567',
            work_phone: 'ext. 5678',
            home_address: '123 Main St, Toronto, ON, A1B 2C3'
        },
        emergency_contacts: [
            {
                contact_name: 'Michael Chen',
                relationship: 'Spouse',
                phone_number: '(555) 987-6543'
            },
            {
                contact_name: 'Sarah Johnson',
                relationship: 'Friend',
                phone_number: '(555) 456-7890'
            }
        ]
    };
    
    populateProfileData(mockData);
}

// ==================== SETTINGS FUNCTIONALITY (EXISTING) ====================

function initializeSettings() {
    // Dark Mode
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = darkMode;
        if (darkMode) document.body.classList.add('dark-mode');
    }
    
    // Compact View
    const compactView = localStorage.getItem('compactView') === 'true';
    const compactViewToggle = document.getElementById('compactViewToggle');
    if (compactViewToggle) {
        compactViewToggle.checked = compactView;
        if (compactView) document.body.classList.add('compact-view');
    }
    
    // Font Size
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) {
        fontSizeSelect.value = fontSize;
        document.body.classList.add(`font-${fontSize}`);
    }
    
    // Sidebar Position
    const sidebarPosition = localStorage.getItem('sidebarPosition') || 'left';
    const sidebarPositionSelect = document.getElementById('sidebarPositionSelect');
    if (sidebarPositionSelect) {
        sidebarPositionSelect.value = sidebarPosition;
        document.body.classList.add(`sidebar-${sidebarPosition}`);
    }
    
    // Save Preferences
    const savePreferencesToggle = document.getElementById('savePreferencesToggle');
    if (savePreferencesToggle) {
        savePreferencesToggle.checked = localStorage.getItem('savePreferences') !== 'false';
    }
}

function setupSettingsListeners() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode', this.checked);
            if (shouldSavePreferences()) {
                localStorage.setItem('darkMode', this.checked);
            }
        });
    }
    
    // Compact View Toggle
    const compactViewToggle = document.getElementById('compactViewToggle');
    if (compactViewToggle) {
        compactViewToggle.addEventListener('change', function() {
            document.body.classList.toggle('compact-view', this.checked);
            if (shouldSavePreferences()) {
                localStorage.setItem('compactView', this.checked);
            }
        });
    }
    
    // Font Size Select
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', function() {
            document.body.classList.remove('font-small', 'font-medium', 'font-large');
            document.body.classList.add(`font-${this.value}`);
            if (shouldSavePreferences()) {
                localStorage.setItem('fontSize', this.value);
            }
        });
    }
    
    // Sidebar Position Select
    const sidebarPositionSelect = document.getElementById('sidebarPositionSelect');
    if (sidebarPositionSelect) {
        sidebarPositionSelect.addEventListener('change', function() {
            document.body.classList.remove('sidebar-left', 'sidebar-right');
            document.body.classList.add(`sidebar-${this.value}`);
            if (shouldSavePreferences()) {
                localStorage.setItem('sidebarPosition', this.value);
            }
        });
    }
    
    // Clear Data Button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all saved data? This will reset all your preferences.')) {
                localStorage.clear();
                alert('All data cleared! Page will reload.');
                location.reload();
            }
        });
    }
}

function setupSaveButton() {
    const saveButton = document.querySelector('.edit-btn');
    if (saveButton && !saveButton.hasAttribute('data-listener-added')) {
        saveButton.setAttribute('data-listener-added', 'true');
        saveButton.addEventListener('click', function() {
            // Save all current settings
            if (shouldSavePreferences()) {
                const darkModeToggle = document.getElementById('darkModeToggle');
                const compactViewToggle = document.getElementById('compactViewToggle');
                const fontSizeSelect = document.getElementById('fontSizeSelect');
                const sidebarPositionSelect = document.getElementById('sidebarPositionSelect');
                
                if (darkModeToggle) localStorage.setItem('darkMode', darkModeToggle.checked);
                if (compactViewToggle) localStorage.setItem('compactView', compactViewToggle.checked);
                if (fontSizeSelect) localStorage.setItem('fontSize', fontSizeSelect.value);
                if (sidebarPositionSelect) localStorage.setItem('sidebarPosition', sidebarPositionSelect.value);
            }
            
            showNotification('Settings saved successfully!', 'success');
        });
    }
}

function shouldSavePreferences() {
    const savePreferencesToggle = document.getElementById('savePreferencesToggle');
    return savePreferencesToggle ? savePreferencesToggle.checked : true;
}

// Make functions globally available for HTML onclick handlers
window.closeModal = closeModal;
window.removeEmergencyContact = removeEmergencyContact;
window.addEmergencyContactField = addEmergencyContactField;