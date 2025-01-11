<?php
// Prevent page from being embedded in iframes (clickjacking protection)
header('X-Frame-Options: DENY');

// Prevent MIME-type sniffing
header('X-Content-Type-Options: nosniff');

// Enable XSS protection
header('X-XSS-Protection: 1; mode=block');

// Set Content Security Policy
header("Content-Security-Policy: default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; script-src 'self' 'unsafe-inline';"); 