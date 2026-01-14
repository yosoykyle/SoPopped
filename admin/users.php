<?php require_once 'components/header.php'; ?>

<div class="container mt-5 pt-5">
  <div class="p-4 rounded-5 border-0 shadow-sm">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="display-5 fw-bold text-primary" style="font-family: pix;">User Management</h2>
      <!-- Button Ready for Implementation -->
      <button class="btn btn-primary rounded-pill px-4 shadow-sm" onclick="new bootstrap.Modal(document.getElementById('userModal')).show()">
        <i class="bi bi-person-plus-fill me-2"></i>Add User
      </button>
    </div>

  <div class="table-responsive">
  <table
    class="table table-hover table-striped-columns table-bordered border-warning align-middle"
  >
    <thead>
      <tr>
        <th>Updated At</th>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="usersTableBody"></tbody>
  </table>
</div>
    
  </div>
</div>

 <script>
  document.addEventListener("DOMContentLoaded", () => {
    loadUsers();

    // Initialize shared modal behavior
    if (typeof sopoppedAdminUI !== "undefined") {
      sopoppedAdminUI.setupModalReset("userModal", "userForm");

      // Wire up Modal Submit with Confirmation
      sopoppedAdminUI.setupFormSubmission(
        "userForm",
        "Are you sure you want to save this user?",
        async (e) => {
          const form = e.target;
          // Prevent Double Submit
          const btn = form.querySelector('button[type="submit"]');
          const originalText = btn ? btn.innerText : "Save User";
          if (btn) {
            btn.disabled = true;
            btn.innerHTML =
              '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
          }

          const data = Object.fromEntries(new FormData(form));

          // Clear previous messages
          const valMsg = form.querySelector("#validate-msg");
          const sucMsg = form.querySelector("#success-msg");
          if (valMsg) valMsg.classList.add("d-none");
          if (sucMsg) sucMsg.classList.add("d-none");

          try {
            const res = await sopoppedFetch.postJSON(
              "../api/admin/save_user.php",
              data
            );
            if (res.success) {
              if (sucMsg) {
                sucMsg.textContent = res.message || "User saved successfully!";
                sucMsg.classList.remove("d-none");
                setTimeout(() => {
                  bootstrap.Modal.getInstance(
                    document.getElementById("userModal")
                  ).hide();
                  loadUsers();
                  sucMsg.classList.add("d-none");
                  if (btn) {
                    btn.disabled = false;
                    btn.innerText = originalText;
                  }
                }, 1500);
              } else {
                bootstrap.Modal.getInstance(
                  document.getElementById("userModal")
                ).hide();
                loadUsers();
                if (btn) {
                  btn.disabled = false;
                  btn.innerText = originalText;
                }
              }
            } else {
              if (valMsg) {
                valMsg.textContent = res.error || "Failed to save";
                valMsg.classList.remove("d-none");
                valMsg.classList.add("alert-danger");
              } else {
                alert(res.error || "Failed to save");
              }
              if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
              }
            }
          } catch (err) {
            console.error(err);
            if (valMsg) {
              valMsg.textContent = "An error occurred. Please try again.";
              valMsg.classList.remove("d-none");
              valMsg.classList.add("alert-danger");
            } else {
              alert("An error occurred");
            }
            if (btn) {
              btn.disabled = false;
              btn.innerText = originalText;
            }
          }
        }
      );
    }

    // Delegated handler for Edit and Delete buttons
    const usersTbody = document.getElementById("usersTableBody");
    if (usersTbody) {
      usersTbody.addEventListener("click", (ev) => {
        const deleteBtn = ev.target.closest(".btn-delete-user");
        if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          const name = deleteBtn.dataset.name;
          if (confirm(`Are you sure you want to archive "${name}"?`)) {
            deleteUser(id);
          }
          return;
        }

        const btn = ev.target.closest(".btn-edit-user");
        if (!btn) return;

        if (typeof sopoppedAdminUI !== "undefined") {
          sopoppedAdminUI.populateModalFromButton(
            btn,
            {
              id: "userId",
              first_name: "firstName",
              middle_name: "middleName",
              last_name: "lastName",
              email: "email",
              role: "role",
            },
            (item) => {
              // Handle specific defaults
              document.getElementById("userStatus").value =
                item.is_archived || 0;
            }
          );
          new bootstrap.Modal(document.getElementById("userModal")).show();
        }
      });
    }
  });

  async function deleteUser(id) {
    try {
      const res = await sopoppedFetch.postJSON("../api/admin/delete_user.php", {
        id,
      });
      if (res.success) {
        loadUsers();
      } else {
        alert(res.error || "Failed to archive user");
      }
    } catch (err) {
      alert("Network error occurred");
    }
  }

  async function loadUsers() {
    const res = await sopoppedFetch.json("../api/admin/get_users.php");
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = res.data
      .map(
        (u) => `
        <tr>
            <td>${new Date(
              u.updated_at
            ).toLocaleDateString()} <small class="text-muted">${new Date(
          u.updated_at
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}</small></td>
            <td>${u.first_name}${u.middle_name ? " " + u.middle_name : ""} ${
          u.last_name
        }</td>
            <td>${u.email}</td>
            <td><span class="badge ${
              u.role === "admin" ? "text-bg-warning" : "text-bg-secondary"
            }">${u.role}</span></td>
            <td><span class="badge ${
              u.is_archived == 1 ? "text-bg-danger" : "text-bg-success"
            }">${u.is_archived == 1 ? "Archived" : "Active"}</span></td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-primary btn-edit-user" title="Edit" data-item="${encodeURIComponent(
                  JSON.stringify(u)
                )}"><i class="bi bi-pencil"></i></button>
                <button type="button" class="btn btn-sm btn-outline-danger btn-delete-user" data-id="${
                  u.id
                }" data-name="${(u.first_name + " " + u.last_name).replace(
          /"/g,
          "&quot;"
        )}" title="Archive" ${
          u.is_archived == 1 ? "disabled" : ""
        }><i class="bi bi-archive"></i></button>
            </td>
        </tr>
    `
      )
      .join("");
  }
</script>

<?php require_once 'components/user_modal.php'; ?>
<?php require_once 'components/footer.php'; ?>