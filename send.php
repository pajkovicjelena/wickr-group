<?php
// Wickr Group — contact form handler
// Sends form submissions to office@wickr-group.com

$RECIPIENT = 'office@wickr-group.com';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: contact.html');
    exit;
}

// Honeypot: bots fill hidden "website" field. If filled, pretend success.
if (!empty($_POST['website'])) {
    header('Location: contact.html?sent=1#form');
    exit;
}

// Collect + clean input
$name    = trim($_POST['name']    ?? '');
$email   = trim($_POST['email']   ?? '');
$phone   = trim($_POST['phone']   ?? '');
$message = trim($_POST['message'] ?? '');
$gdpr    = isset($_POST['gdpr']);

// Basic validation
$errors = false;
if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$gdpr) {
    $errors = true;
}

if ($errors) {
    header('Location: contact.html?error=1#form');
    exit;
}

// Strip header-injection attempts from single-line fields
$name  = str_replace(array("\r", "\n"), ' ', $name);
$email = str_replace(array("\r", "\n"), ' ', $email);
$phone = str_replace(array("\r", "\n"), ' ', $phone);

// Build the email
$subject = 'New message from wickr-group.com contact form';

$body  = "New contact form submission\n";
$body .= "----------------------------------------\n\n";
$body .= "Name:    $name\n";
$body .= "Email:   $email\n";
$body .= "Phone:   " . ($phone !== '' ? $phone : '(not provided)') . "\n\n";
$body .= "Message:\n$message\n\n";
$body .= "----------------------------------------\n";
$body .= "Sent " . date('Y-m-d H:i:s') . " from the website contact form.\n";

// Headers — From is domain-aligned so it passes SPF (once _spf.websupport.sk is added);
// Reply-To is the visitor so you can reply directly.
$headers  = "From: Wickr Group web <noreply@wickr-group.com>\r\n";
$headers .= "Reply-To: " . $name . " <" . $email . ">\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// Envelope sender (helps deliverability / bounce handling)
$params = '-f noreply@wickr-group.com';

$sent = @mail($RECIPIENT, $subject, $body, $headers, $params);

if ($sent) {
    header('Location: contact.html?sent=1#form');
} else {
    header('Location: contact.html?error=1#form');
}
exit;
