// Generate and set CSRF token
function generateCSRFToken() {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    // Debug log
    console.log('Generated CSRF token:', token);
    
    // Store the token in session storage and return it
    sessionStorage.setItem('csrf_token', token);
    return token;
}

// Set CSRF token when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if token already exists in sessionStorage
    let csrfToken = sessionStorage.getItem('csrf_token');
    
    // If no token exists, generate a new one
    if (!csrfToken) {
        csrfToken = generateCSRFToken();
    }
    
    // Set the token in the hidden form field
    const tokenInput = document.getElementById('csrf_token');
    if (tokenInput) {
        tokenInput.value = csrfToken;
        // Debug log
        console.log('CSRF token set in form:', tokenInput.value);
    } else {
        console.error('CSRF token input field not found!');
    }
});

// Password strength checker
function checkPasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return false;
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) return false;
    return true;
}

document.getElementById("submitBtn").addEventListener("click", function(event) {
    event.preventDefault();
    
    // Verify CSRF token exists before submission
    const csrfToken = sessionStorage.getItem('csrf_token');
    const tokenInput = document.getElementById('csrf_token');
    
    // Debug logs
    console.log('CSRF token in session:', csrfToken);
    console.log('CSRF token in form:', tokenInput ? tokenInput.value : 'not found');
    
    if (!csrfToken) {
        alert('Security token missing. Please refresh the page.');
        return;
    }

    // Get form values and trim whitespace
    const name = document.getElementById("name").value.trim();
    const surname = document.getElementById("surname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;
    const contactNumber = document.getElementById("contact_number").value.trim();
    const address = document.getElementById("address").value.trim();

    // Basic validation
    if (!name || !surname || !email || !password || !confirmPassword || !contactNumber || !address) {
        alert("Please fill all fields.");
        return;
    }

    // Name and surname validation
    const nameRegex = /^[A-Za-z]{2,50}$/;
    if (!nameRegex.test(name) || !nameRegex.test(surname)) {
        alert("Name and surname should contain only letters and be between 2-50 characters.");
        return;
    }

    // Email validation
    if (!email || !email.includes('@')) {
        alert("Please enter a valid email address.");
        return;
    }

    // Password validation
    if (!checkPasswordStrength(password)) {
        alert("Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Phone number validation
    const phoneRegex = /^[0-9+\-\s]{10,15}$/;
    if (!phoneRegex.test(contactNumber)) {
        alert("Please enter a valid contact number.");
        return;
    }

    // Create FormData object
    const formData = new FormData(document.getElementById("signupForm"));
    
    // Debug logging
    console.log('Form Data:', Object.fromEntries(formData));
    console.log('CSRF Token being sent:', csrfToken);

    // Submit form using fetch
    fetch('../php/register.php', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        credentials: 'same-origin'
    })
    .then(async response => {
        const contentType = response.headers.get('content-type');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Check if the response is JSON
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        // If not JSON, get text and throw error
        const text = await response.text();
        console.error('Server response:', text); // Debug log
        throw new Error(`Expected JSON but got ${contentType}: ${text}`);
    })
    .then(data => {
        if (data.status === 'success') {
            alert('Registration successful! Please Register your pet.');
            window.location.href = '../html/pet-reg.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred during registration. Please try again later.');
    });
});

// Clear sensitive data when leaving page
window.addEventListener('beforeunload', function() {
    document.getElementById('password').value = '';
    document.getElementById('confirm_password').value = '';
}); 