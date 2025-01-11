// Define checkAuth globally
window.checkAuth = function() {
    return fetch('../php/check_session.php', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Auth check response:', data);
        if (!data || data.status !== 'success' || !data.firstName) {
            console.log('Not authenticated, redirecting...');
            window.location.href = '../html/signin.html';
            throw new Error('Not authenticated');
        }
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Hi, ${data.firstName}!`;
        }
        return true;
    })
    .catch(error => {
        console.error('Auth check failed:', error);
        window.location.href = '../html/signin.html';
        throw error;
    });
};

// Force check auth when page loads
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    const publicPages = ['frontpage.html', 'signin.html', 'auth_required.html'];
    
    if (!publicPages.some(page => currentPage.includes(page))) {
        window.checkAuth().catch(() => {
            window.location.href = 'signin.html';
        });
    }
}); 