# Logic Patch Report: Role-Based Redirects

**File**: `api/login_submit.php`
**Date**: 2025-12-13
**Type**: Critical Fix / UX Improvement

## 1. Rationale

The original login logic hardcoded the success redirect to `../home.php`. This created a defective workflow for Admin users:

1.  Admin logs in via `/admin/index.php` (future).
2.  System authenticates successfully.
3.  System redirects Admin to **Customer Homepage** instead of **Admin Dashboard**.
4.  Admin must manually navigate back to dashboard.

This patch eliminates that friction by inspecting the user's role immediately after authentication.

## 2. Changes Applied

### **Before**

```php
header('Location: ../home.php?login_result=success...');
```

### **After**

```php
// Inspect Role
$redirectUrl = ($user['role'] === 'admin') ? '../admin/dashboard.php' : '../home.php';

// Dynamic Redirect
header('Location: ' . $redirectUrl . '?login_result=success...');
```

## 3. Impact Analysis

- **Customer Login**: Unaffected. Logic defaults to `../home.php` for non-admin roles.
- **Admin Login**: Now correctly lands on Dashboard.
- **AJAX Login**: The JSON response now includes a `redirect` property (`user.redirect`), allowing the frontend to optionally perform the redirect client-side if needed in the future.
- **Security**: No changes to the authentication mechanism itself (password hashing/session creation remains intact).

## 4. Verification

- Checked logic: `$user['role']` is fetched from DB line 47.
- Checked syntax: Ternary operator correctly handles the two cases.
- Checked fallbacks: Default behavior preserves specific "Welcome back" messages.
