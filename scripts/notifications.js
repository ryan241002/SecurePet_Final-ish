function checkNotifications() {
    fetch('../php/get_notifications.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.notifications.length > 0) {
                data.notifications.forEach(notification => {
                    showNotification(notification.Message, 'info');
                });
                markNotificationsAsRead(data.notifications.map(n => n.Notification_ID));
            }
        })
        .catch(error => console.error('Error checking notifications:', error));
}

function markNotificationsAsRead(notificationIds) {
    fetch('../php/mark_notifications_read.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_ids: notificationIds })
    });
}

// Check for notifications every 30 seconds
setInterval(checkNotifications, 30000);

// Also check when page loads
document.addEventListener('DOMContentLoaded', checkNotifications); 