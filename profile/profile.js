// Settings functionality for static website
document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings from localStorage
    initializeSettings();
    
    // Set up event listeners
    setupSettingsListeners();
    
    // Save button functionality
    setupSaveButton();
});

function initializeSettings() {
    // Dark Mode
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.getElementById('darkModeToggle').checked = darkMode;
    if (darkMode) document.body.classList.add('dark-mode');
    
    // Compact View
    const compactView = localStorage.getItem('compactView') === 'true';
    document.getElementById('compactViewToggle').checked = compactView;
    if (compactView) document.body.classList.add('compact-view');
    
    // Font Size
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    document.getElementById('fontSizeSelect').value = fontSize;
    document.body.classList.add(`font-${fontSize}`);
    
    // Sidebar Position
    const sidebarPosition = localStorage.getItem('sidebarPosition') || 'left';
    document.getElementById('sidebarPositionSelect').value = sidebarPosition;
    document.body.classList.add(`sidebar-${sidebarPosition}`);
    
    // Save Preferences
    document.getElementById('savePreferencesToggle').checked = 
        localStorage.getItem('savePreferences') !== 'false';
}

function setupSettingsListeners() {
    // Dark Mode Toggle
    document.getElementById('darkModeToggle').addEventListener('change', function() {
        document.body.classList.toggle('dark-mode', this.checked);
        if (shouldSavePreferences()) {
            localStorage.setItem('darkMode', this.checked);
        }
    });
    
    // Compact View Toggle
    document.getElementById('compactViewToggle').addEventListener('change', function() {
        document.body.classList.toggle('compact-view', this.checked);
        if (shouldSavePreferences()) {
            localStorage.setItem('compactView', this.checked);
        }
    });
    
    // Font Size Select
    document.getElementById('fontSizeSelect').addEventListener('change', function() {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${this.value}`);
        if (shouldSavePreferences()) {
            localStorage.setItem('fontSize', this.value);
        }
    });
    
    // Sidebar Position Select
    document.getElementById('sidebarPositionSelect').addEventListener('change', function() {
        document.body.classList.remove('sidebar-left', 'sidebar-right');
        document.body.classList.add(`sidebar-${this.value}`);
        if (shouldSavePreferences()) {
            localStorage.setItem('sidebarPosition', this.value);
        }
    });
    
    // Clear Data Button
    document.getElementById('clearDataBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all saved data? This will reset all your preferences.')) {
            localStorage.clear();
            alert('All data cleared! Page will reload.');
            location.reload();
        }
    });
}

function setupSaveButton() {
    const saveButton = document.querySelector('.edit-btn');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            // Save all current settings
            if (shouldSavePreferences()) {
                const darkMode = document.getElementById('darkModeToggle').checked;
                const compactView = document.getElementById('compactViewToggle').checked;
                const fontSize = document.getElementById('fontSizeSelect').value;
                const sidebarPosition = document.getElementById('sidebarPositionSelect').value;
                
                localStorage.setItem('darkMode', darkMode);
                localStorage.setItem('compactView', compactView);
                localStorage.setItem('fontSize', fontSize);
                localStorage.setItem('sidebarPosition', sidebarPosition);
            }
            
            alert('Settings saved successfully!');
        });
    }
}

function shouldSavePreferences() {
    return document.getElementById('savePreferencesToggle').checked;
}