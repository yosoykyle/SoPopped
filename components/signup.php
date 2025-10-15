<!-- Signup dialog fragment (jQuery UI) -->
<div id="signupDialog" title="Create an account" style="display:none; max-height: calc(100vh - 120px); overflow:auto;">
  <form method="POST" action="api/signup_submit.php" id="signupForm" novalidate>
    <div class="mt-4">
      <input id="signupName" name="name" type="text" class="form-control" required />
      <p class="form-label pt-1"><label for="signupName">Name</label></p>
    </div>
    <div class="mb-2">
      <input id="signupMiddle" name="middle" type="text" class="form-control" />
      <p class="form-label pt-1"><label for="signupMiddle">Middle Name (Optional)</label></p>
    </div>
    <div class="mb-2">
      <input id="signupLast" name="last" type="text" class="form-control" required />
      <p class="form-label pt-1"><label for="signupLast">Last Name</label></p>
    </div>
    <div class="mb-2">
      <input id="signupEmail" name="email" type="email" class="form-control" required />
      <p class="form-label pt-1"><label for="signupEmail">Email</label></p>
    </div>
    <div class="mb-2">
      <input id="signupPhone" name="phone" type="text" class="form-control" placeholder="0000-000-0000" required />
      <p class="form-label pt-1"><label for="signupPhone">Phone Number</label></p>
    </div>
    <div class="mb-2 position-relative">
      <div class="input-group">
        <input id="signupPassword" name="password" type="password" class="form-control" required />
        <button type="button" class="btn btn-warning" id="toggleSignupPassword" aria-label="Toggle password visibility">🙈</button>
      </div>
      <p class="form-label pt-1"><label for="signupPassword">Password</label></p>
    </div>
    <div class="mb-2 position-relative">
      <div class="input-group">
        <input id="signupPassword2" name="password2" type="password" class="form-control" required />
        <button type="button" class="btn btn-warning" id="toggleSignupPassword2" aria-label="Toggle password visibility">🙈</button>
      </div>
      <p class="form-label pt-1"><label for="signupPassword2">Retype Password</label></p>
    </div>
    <div id="validate-msg" class="mt-3 alert alert-danger d-none"></div>
    <div id="success-msg" class="mt-3 alert alert-success d-none"></div>
    <div class="text-end mt-3">
      <button id="signupSubmit" type="submit" class="btn btn-warning">Sign Up</button>
    </div>
  </form>
</div>

<script>
  $(document).ready(function() {
  // Check for URL parameters indicating signup result
  const urlParams = new URLSearchParams(window.location.search);
  const signupResult = urlParams.get('signup_result');
  const signupMessage = urlParams.get('signup_message');
  
  if (signupResult === 'success') {
    // Show success message
    $('#success-msg').removeClass('d-none').text(signupMessage || 'Account created successfully! You can now log in.');
    $('#signupDialog').dialog('open');
    
    // Clear form
    $('#signupForm')[0].reset();
    
    // Close dialog after 3 seconds
    setTimeout(function() {
      $('#signupDialog').dialog('close');
    }, 3000);
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (signupResult === 'error') {
    // Show error message
    $('#validate-msg').removeClass('d-none').text(signupMessage || 'An error occurred. Please try again.');
    $('#signupDialog').dialog('open');
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Reset button state when dialog opens
  $('#signupDialog').on('dialogopen', function() {
    $('#signupSubmit').prop('disabled', false).text('Sign Up');
  });
});
</script>