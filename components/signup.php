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

<!-- Inline signup script moved to js/authDialogs.js -->