async function generateCSRFToken() {
    try {
        const response = await fetch('../php/csrf_validate.php', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        if (data.csrf_token) {
            document.getElementById('csrf_token').value = data.csrf_token;
            return data.csrf_token;
        } else {
            throw new Error('No CSRF token received');
        }
    } catch (error) {
        console.error('Error generating CSRF token:', error);
    }
}

// Call this when page loads
document.addEventListener('DOMContentLoaded', function() {
    generateCSRFToken();
});

let attemptCount = 0;
let lastAttemptTime = 0;
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

document.getElementById("submitBtn").addEventListener("click", async function(event) {
    event.preventDefault();

    // Ensure we have a valid CSRF token
    const csrfToken = document.getElementById('csrf_token').value;
    if (!csrfToken) {
        await generateCSRFToken();
    }

    const currentTime = Date.now();
    if (attemptCount >= MAX_ATTEMPTS && (currentTime - lastAttemptTime) < LOCKOUT_TIME) {
        alert("Too many login attempts. Please try again later.");
        return;
    }

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please fill all fields.");
        return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
    }

    const formData = new FormData(document.getElementById("signupForm"));
    
    fetch('../php/login.php', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.getElementById('csrf_token').value
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            window.location.href = data.redirect;
        } else {
            attemptCount++;
            lastAttemptTime = Date.now();
            alert(data.message || 'Login failed');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred while signing in.');
    });
});

window.addEventListener('beforeunload', function() {
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}); 