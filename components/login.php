<!-- Login dialog fragment (jQuery UI) -->
<div id="loginDialog" title="Login to So Popped" style="display:none; max-height: calc(100vh - 160px); overflow:auto;">
  <form method="POST" action="api/login_submit.php" id="loginForm" novalidate>
    <div class="mt-4">
      <input id="loginEmail" name="email" type="email" class="form-control" required />
      <p class="form-label mt-1"><label for="loginEmail">Email</label></p>
    </div>
    <div class="mt-2 position-relative">
      <div class="input-group">
        <input id="loginPassword" name="password" type="password" class="form-control" required />
        <button type="button" class="btn btn-warning" id="toggleLoginPassword" aria-label="Toggle password visibility">🙈</button>
      </div>
      <p class="form-label mt-1"><label for="loginPassword">Password</label></p>
    </div>
    <div id="validate-msg" class="mt-3 alert alert-danger d-none"></div>
    <div id="success-msg" class="mt-3 alert alert-success d-none"></div>
    <div class="text-center mt-2">
      <button id="loginSubmit" type="submit" class="btn btn-warning">Login</button>
    </div>
    <div class="text-center mt-2">
      <a href="#" id="openSignup">Sign up</a>
    </div>
  </form>
</div>

<script>
// Handle login form response
$(document).ready(function() {
  // Check for URL parameters indicating login result
  const urlParams = new URLSearchParams(window.location.search);
  const loginResult = urlParams.get('login_result');
  const loginMessage = urlParams.get('login_message');
  
  if (loginResult === 'success') {
    // Show success message
    $('#success-msg').removeClass('d-none').text(loginMessage || 'Login successful!');
    $('#loginDialog').dialog('open');
    
    // Clear form
    $('#loginForm')[0].reset();
    
    // Close dialog after 2 seconds and reload page to show logged-in state
    setTimeout(function() {
      $('#loginDialog').dialog('close');
      window.location.reload();
    }, 2000);
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (loginResult === 'error') {
    // Show error message
    $('#validate-msg').removeClass('d-none').text(loginMessage || 'Login failed. Please try again.');
    $('#loginDialog').dialog('open');
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Reset button state when dialog opens
  $('#loginDialog').on('dialogopen', function() {
    $('#loginSubmit').prop('disabled', false).text('Login');
  });
});
</script>