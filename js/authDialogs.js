// authDialogs.js - initialize jQuery UI dialogs, validation and UI behaviors
(function ($) {
  $(function () {
    // ===== INITIALIZATION =====
    function setupDialogs() {
      // Only initialize if jQuery UI is available
      if (!$.ui || !$.ui.dialog) return;

      // ===== VALIDATION SETUP =====
      // 1.1 - Setup validation methods and form validation rules
      if ($.validator) {
        // 1.2 - Add custom validation method for allowed email characters
        $.validator.addMethod(
          "emailChars",
          function (value, element) {
            return this.optional(element) || /^[A-Za-z0-9_.@]+$/.test(value);
          },
          "Email can only contain letters, numbers, underscores, periods, and @ symbol"
        );

        // 1.3 - Add enhanced email validation for TLD, multiple @, and missing @
        $.validator.addMethod(
          "emailFormat",
          function (value, element) {
            if (this.optional(element)) return true;

            // Check if email has @ symbol
            if (!value.includes("@")) {
              return false;
            }

            // Check for multiple @ symbols
            if ((value.match(/@/g) || []).length > 1) {
              return false;
            }

            // Check for valid TLD (at least one dot after @ with 2+ characters after)
            const parts = value.split("@");
            if (parts.length !== 2) return false;

            const domain = parts[1];
            if (!domain.includes(".") || domain.split(".").pop().length < 2) {
              return false;
            }

            return true;
          },
          function (value, element) {
            if (!value.includes("@")) {
              return "Email must contain an @ symbol";
            }
            if ((value.match(/@/g) || []).length > 1) {
              return "Email cannot contain multiple @ symbols";
            }
            const parts = value.split("@");
            if (parts.length === 2) {
              const domain = parts[1];
              if (!domain.includes(".") || domain.split(".").pop().length < 2) {
                return "Email must have a valid domain with a top-level domain (e.g., .com, .org)";
              }
            }
            return "Please enter a valid email address";
          }
        );

        // 1.4 - Add custom validation method for phone format
        $.validator.addMethod(
          "phoneFormat",
          function (value, element) {
            return this.optional(element) || /^\d{4}-\d{3}-\d{4}$/.test(value);
          },
          "Please enter phone in format: 0000-000-0000"
        );

        // 1.5 - Add password strength validation with requirements
        $.validator.addMethod(
          "passwordStrength",
          function (value, element) {
            if (this.optional(element)) return true;

            // Check length (8-16 characters)
            if (value.length < 8 || value.length > 16) {
              return false;
            }

            // Check for at least one uppercase letter
            if (!/[A-Z]/.test(value)) {
              return false;
            }

            // Check for at least one lowercase letter
            if (!/[a-z]/.test(value)) {
              return false;
            }

            // Check for at least one digit
            if (!/\d/.test(value)) {
              return false;
            }

            // Check for at least one special character (including ;'\[]/)
            if (!/[!@#$%^&*(),.?":{}|<>\[\];'\/\\]/.test(value)) {
              return false;
            }

            return true;
          },
          "Password must contain at least 8-16 characters with at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*;'[]/ etc.)"
        );

        // 1.6 - Set default validation settings for Bootstrap compatibility
        $.validator.setDefaults({
          errorClass: "is-invalid",
          validClass: "is-valid",
          errorElement: "div",
          // Custom error placement to use the validate-msg div
          errorPlacement: function (error, element) {
            // Add the error class to the input
            element.addClass("is-invalid").removeClass("is-valid");

            // Find the validate-msg div (specifically target the one with id="validate-msg")
            let $validateMsg = element.closest("form").find("#validate-msg");

            // If validate-msg div exists, use it
            if ($validateMsg && $validateMsg.length) {
              $validateMsg.text(error.text()).removeClass("d-none").show();
            } else {
              // Fallback to original placement if no validate-msg div found
              error.addClass("invalid-feedback");
              if (element.parent(".input-group").length) {
                error.insertAfter(element.parent());
              } else {
                error.insertAfter(element);
              }
            }
          },
          highlight: function (element, errorClass, validClass) {
            $(element).addClass(errorClass).removeClass(validClass);

            // Show the validate-msg div if it exists
            let $validateMsg = $(element).closest("form").find("#validate-msg");
            if ($validateMsg && $validateMsg.length) {
              $validateMsg.removeClass("d-none").show();
            }
          },
          unhighlight: function (element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);

            // Check if there are other errors in the form
            let $form = $(element).closest("form");
            let validator = $form.data("validator") || $form.validate();

            if (validator && validator.numberOfInvalids() === 0) {
              // Hide the validate-msg div if no more errors
              let $validateMsg = $form.find("#validate-msg");
              if ($validateMsg && $validateMsg.length) {
                $validateMsg.addClass("d-none").hide();
              }
            }
          },
        });

        // 1.7 - Setup login form validation rules and messages
        $("#loginForm").validate({
          rules: {
            email: {
              required: true,
              email: true,
              emailChars: true,
              emailFormat: true,
            },
            password: {
              required: true,
            },
          },
          messages: {
            email: {
              required: "Please enter your email address",
              email: "Please enter a valid email address",
              emailChars:
                "Email can only contain letters, numbers, underscores, periods, and @ symbol",
              emailFormat: "Email must have a valid format with @ and domain",
            },
            password: {
              required: "Please enter your password",
            },
          },
          submitHandler: function (form) {
            // Show loading state
            const submitBtn = $("#loginSubmit");
            const originalText = submitBtn.text();
            submitBtn.prop('disabled', true).text('Logging in...');
            
            // Hide any previous error messages
            $("#validate-msg").addClass('d-none').text('');
            
            // Submit the form
            form.submit();
          },
        });

        // 1.8 - Setup signup form validation rules and messages
        $("#signupForm").validate({
          rules: {
            name: {
              required: true,
              minlength: 2,
            },
            last: {
              required: true,
              minlength: 2,
            },
            email: {
              required: true,
              email: true,
              emailChars: true,
              emailFormat: true,
            },
            phone: {
              required: true,
              phoneFormat: true,
            },
            password: {
              required: true,
              passwordStrength: true,
            },
            password2: {
              required: true,
              equalTo: "#signupPassword",
              passwordStrength: true,
            },
          },
          messages: {
            name: {
              required: "Please enter your first name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            last: {
              required: "Please enter your last name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            email: {
              required: "Please enter your email address",
              email: "Please enter a valid email address",
              emailChars:
                "Email can only contain letters, numbers, underscores, periods, and @ symbol",
              emailFormat: "Email must have a valid format with @ and domain",
            },
            phone: {
              required: "Please enter your phone number",
              phoneFormat: "Please enter phone in format: 0000-000-0000",
            },
            password: {
              required: "Please enter a password",
              passwordStrength:
                "Password must contain at least 8-16 characters with at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*;'[]/ etc.)",
            },
            password2: {
              required: "Please confirm your password",
              equalTo: "Passwords do not match",
              passwordStrength:
                "Password must contain at least 8-16 characters with at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*;'[]/ etc.)",
            },
          },
          submitHandler: function (form) {
            // Show loading state
            const submitBtn = $("#signupSubmit");
            const originalText = submitBtn.text();
            submitBtn.prop('disabled', true).text('Creating Account...');
            
            // Hide any previous error messages
            $("#validate-msg").addClass('d-none').text('');
            
            // Submit the form
            form.submit();
          },
        });

        // 1.9 - Setup contact form validation rules and messages
        $("#contactForm").validate({
          rules: {
            name: {
              required: true,
              minlength: 2,
            },
            email: {
              required: true,
              email: true,
              emailChars: true,
              emailFormat: true,
            },
            message: {
              required: true,
              minlength: 10,
              maxlength: 100,
            },
          },
          messages: {
            name: {
              required: "Please enter your name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            email: {
              required: "Please enter your email",
              email: "Please enter a valid email address",
              emailChars:
                "Email can only contain letters, numbers, underscores, periods, and @ symbol",
              emailFormat: "Email must have a valid format with @ and domain",
            },
            message: {
              required: "Please enter your message",
              minlength: jQuery.validator.format(
                "Message must be at least {0} characters long"
              ),
              maxlength: jQuery.validator.format(
                "Message must be no more than {0} characters long"
              ),
            },
          },
          submitHandler: function (form) {
              // Send contact message via AJAX to server endpoint
              var $form = $(form);
              var $validateMsg = $form.find('#validate-msg');
              $.ajax({
                url: './api/contact_submit.php',
                method: 'POST',
                data: $form.serialize(),
                dataType: 'json'
              }).done(function(resp){
                if (resp && resp.success) {
                  $validateMsg.removeClass('d-none alert-danger').addClass('alert alert-success').text('Message sent — thank you!').show();
                  form.reset();
                  // hide after a short delay
                  setTimeout(function(){ $validateMsg.addClass('d-none').hide().removeClass('alert-success').text(''); }, 3500);
                } else if (resp && resp.errors) {
                  // Show first error message
                  var first = Object.keys(resp.errors)[0];
                  $validateMsg.removeClass('d-none alert-success').addClass('alert alert-danger').text(resp.errors[first]).show();
                } else {
                  $validateMsg.removeClass('d-none alert-success').addClass('alert alert-danger').text('Unable to send message. Please try again later.').show();
                }
              }).fail(function(){
                $validateMsg.removeClass('d-none alert-success').addClass('alert alert-danger').text('Network or server error. Please try again later.').show();
              });
            },
        });

        // 1.12 - Setup checkout form (cart) validation rules and messages
        $("#checkoutForm").validate({
          rules: {
            firstName: { required: true, minlength: 2 },
            lastName: { required: true, minlength: 2 },
            email: {
              required: true,
              email: true,
              emailChars: true,
              emailFormat: true,
            },
            address: { required: true, minlength: 5 },
            province: { required: true },
            city: { required: true },
            barangay: { required: true },
            paymentMethod: { required: true },
          },
          messages: {
            firstName: {
              required: "Please enter your first name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            lastName: {
              required: "Please enter your last name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            email: {
              required: "Please enter your email address",
              email: "Please enter a valid email address",
              emailChars:
                "Email can only contain letters, numbers, underscores, periods, and @ symbol",
              emailFormat: "Email must have a valid format with @ and domain",
            },
            address: {
              required: "Please enter your address",
              minlength: jQuery.validator.format(
                "Address must be at least {0} characters long"
              ),
            },
            province: { required: "Please select a province" },
            city: { required: "Please select a city or municipality" },
            barangay: { required: "Please select a barangay" },
            paymentMethod: { required: "Please select a payment method" },
          },
          errorClass: "is-invalid",
          validClass: "is-valid",
          errorElement: "div",
          errorPlacement: function (error, element) {
            // Add the error class to the input
            element.addClass("is-invalid").removeClass("is-valid");

            // Find the validate-msg div (specifically target the one with id="validate-msg")
            let $validateMsg = element.closest("form").find("#validate-msg");

            // If validate-msg div exists, use it
            if ($validateMsg && $validateMsg.length) {
              $validateMsg.text(error.text()).removeClass("d-none").show();
            } else {
              // Fallback to original placement if no validate-msg div found
              error.addClass("invalid-feedback");
              if (element.parent(".input-group").length) {
                error.insertAfter(element.parent());
              } else {
                error.insertAfter(element);
              }
            }
          },
          highlight: function (element, errorClass, validClass) {
            $(element).addClass(errorClass).removeClass(validClass);

            // Show the validate-msg div if it exists
            let $validateMsg = $(element).closest("form").find("#validate-msg");
            if ($validateMsg && $validateMsg.length) {
              $validateMsg.removeClass("d-none").show();
            }
          },
          unhighlight: function (element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);

            // Check if there are other errors in the form
            let $form = $(element).closest("form");
            let validator = $form.data("validator") || $form.validate();

            if (validator && validator.numberOfInvalids() === 0) {
              // Hide the validate-msg div if no more errors
              let $validateMsg = $form.find("#validate-msg");
              if ($validateMsg && $validateMsg.length) {
                $validateMsg.addClass("d-none").hide();
              }
            }
          },
          submitHandler: function (form) {
            // For now, allow form submission to proceed normally.
            // You can replace this with AJAX checkout logic later.
            alert("Checkout form is valid! Proceeding with submission...");
            // form.submit(); // Uncomment to actually submit
          },
        });

        // 1.10 - Handle form submission to hide validate-msg div and remove success colors
        $(document).on("submit", "form", function (e) {
          let $validateMsg = $(this).find("#validate-msg");
          if ($validateMsg.length) {
            $validateMsg.addClass("d-none").hide();
          }

          // Remove success colors from all inputs in the form
          $(this).find("input, textarea, select").removeClass("is-valid");
        });

        // 1.11 - Handle input changes to remove success color when field is empty
        $(document).on(
          "input blur",
          "form input, form textarea, form select",
          function () {
            const $input = $(this);
            const $form = $input.closest("form");
            const validator = $form.data("validator");

            // If input is empty, remove the success color
            if ($input.val() === "") {
              $input.removeClass("is-valid");
            } else if (validator && validator.element($input) === true) {
              // If input has value and passes validation, add success color
              $input.addClass("is-valid").removeClass("is-invalid");
            }
          }
        );
      }

      // ===== DIALOG SETUP =====
      // 2.1 - Calculate navbar height for dialog positioning
      function dialogMaxHeightOffset() {
        const nav = document.querySelector(".navbar");
        const navHeight = nav ? nav.getBoundingClientRect().height : 0;
        // leave some breathing room (20px)
        return Math.max(120, navHeight + 40);
      }

      // 2.2 - Create responsive dialog options object with positioning
      function dialogOptions(width) {
        const maxH = window.innerHeight - dialogMaxHeightOffset();
        return {
          autoOpen: false,
          modal: true,
          width: Math.min(width, window.innerWidth - 40),
          height: "auto",
          maxHeight: maxH,
          draggable: true,
          resizable: true,
          classes: {
            "ui-dialog": "rounded-3", // Add custom class if needed
            "ui-widget-overlay": "custom-overlay", // Add custom class to overlay
          },
          open: function () {
            // position below navbar center horizontally
            const nav = document.querySelector(".navbar");
            const topOffset = nav
              ? nav.getBoundingClientRect().height + 10
              : 10;
            $(this)
              .parent()
              .css({ top: topOffset + "px" });
          },
        };
      }

      // 2.3 - Initialize login and signup dialogs with specific widths
      $("#loginDialog").dialog(dialogOptions(400));
      $("#signupDialog").dialog(dialogOptions(520));

      // ===== UI BEHAVIORS =====
      // 3.1 - Open login dialog when navbar button is clicked (delegated)
      $(document).on(
        "click",
        '[data-bs-target="#loginModal"], #loginBtn',
        function (e) {
          e.preventDefault();
          $("#loginDialog").dialog("open");
        }
      );

      // 3.2 - Link from login dialog to signup dialog
      $(document).on("click", "#openSignup", function (e) {
        e.preventDefault();
        $("#loginDialog").dialog("close");
        $("#signupDialog").dialog("open");
      });

      // 3.3 - Toggle password visibility for login form (simplified)
      // Moved out of setupDialogs to ensure handlers are bound even if jQuery UI
      // isn't present at script execution time. See top-level bindings below.

      // 3.6 - Format phone input for signup form (user experience, not validation)
      $(document).on("input", "#signupPhone", function () {
        let v = $(this).val().replace(/\D/g, ""); // remove non-digits
        if (v.length >= 8) {
          v =
            v.substring(0, 4) +
            "-" +
            v.substring(4, 7) +
            "-" +
            v.substring(7, 11);
        } else if (v.length >= 5) {
          v = v.substring(0, 4) + "-" + v.substring(4, 7);
        }
        $(this).val(v);
      });

      // 3.7 - Restrict email input to only allow letters, numbers, @, ., and _ on keydown
      function emailKeyFilter(e) {
        const allowed = /[A-Za-z0-9@._]/;
        const key = e.key;
        // Allow control keys (backspace, delete, arrows, etc.)
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (key.length === 1 && !allowed.test(key)) {
          e.preventDefault();
        }
      }
      // 3.8 - Apply email key filter to all email fields across forms
      // Apply to all email fields: login, signup, contact forms, and checkout form
      $(document).on(
        "keydown",
        '#loginEmail, #signupEmail, #contactForm input[type="email"], #checkoutForm input[type="email"]',
        emailKeyFilter
      );
    }

    // ===== INITIALIZATION =====
    // 4.1 - Initialize dialogs if jQuery UI is available
    // If jQuery UI already loaded, init now
    if ($.ui && $.ui.dialog) setupDialogs();

    // 4.2 - Watch for jQuery UI load and initialize when ready
    // Otherwise watch for script load and init
    $(document).on("jquery-ui-loaded", function () {
      setupDialogs();
    });

    // ===== WINDOW EVENTS =====
    // 5.1 - Recompute dialog sizes/positions on window resize
    // Recompute dialog sizes/positions on window resize
    $(window).on("resize", function () {
      if ($.ui && $.ui.dialog) {
        $(".ui-dialog-content").each(function () {
          const $d = $(this);
          const api = $d.dialog("instance");
          if (api) {
            const opts = dialogOptions(api.options.width || 400);
            $d.dialog("option", "maxHeight", opts.maxHeight);
            $d.dialog(
              "option",
              "width",
              Math.min(opts.width, window.innerWidth - 40)
            );
            // reposition below navbar
            const nav = document.querySelector(".navbar");
            const topOffset = nav
              ? nav.getBoundingClientRect().height + 10
              : 10;
            $d.parent().css({ top: topOffset + "px" });
          }
        });
      }
    });
  });
})(jQuery);

// Global handlers for toggling password visibility.
// These are outside the jQuery UI init so they always work even if dialogs
// are injected later or jQuery UI is loaded after this script.
(function ($) {
  // Reusable toggle function
  function togglePassword(buttonSelector, inputSelector) {
    $(document).on("click", buttonSelector, function (e) {
      e.preventDefault();
      const $btn = $(this);
      const $inp = $(inputSelector);
      if (!$inp || !$inp.length) return;

      const isPassword = $inp.attr("type") === "password";
      $inp.attr("type", isPassword ? "text" : "password");
      // Swap emoji: show closed-eyes when visible, monkey when hidden
      $btn.text(isPassword ? "🙉" : "🙈");
    });
  }

  // Bind handlers for known toggles
  togglePassword("#toggleLoginPassword", "#loginPassword");
  togglePassword("#toggleSignupPassword", "#signupPassword");
  togglePassword("#toggleSignupPassword2", "#signupPassword2");
})(jQuery);
