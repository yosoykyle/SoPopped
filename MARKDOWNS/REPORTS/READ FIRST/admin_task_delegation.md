# IMPORTANT — Read This First

Before implementing any admin features, please read the [READ FIRST CHANGELOG.md](MARKDOWNS/READ%20FIRST/READ%20FIRST%20CHANGELOG.md) file and follow the section titled "HOW TO UPDATE OR CREATE DATABASE". This section contains critical setup and migration steps that must be completed before using the code snippets in this document.

**Your Role & Task:** The admin pages and API endpoints are currently empty scaffolds (placeholders). Your task is to populate them using the verified, ready-to-use code snippets provided in this document. Simply copy the snippet for your assigned file and paste it into the actual file in the codebase.

**Why this approach?** You might wonder: _"What will I learn if I just paste code?"_ The answer: analyzing a working system teaches you more than getting stuck on syntax errors. This approach allows you to immediately trace the connections between frontend and backend, helping you understand _how_ the architecture works rather than spending hours debugging.

As Project Lead, I chose this "scaffold-then-fill" strategy specifically because of our heavy academic workload. We simply don't have the luxury of time for a "break-then-fix" learning cycle. This decision is purely about efficiency and meeting our deadlines—it is **not** a reflection of anyone's technical skills. It's about working smarter, not harder.

# Admin Implementation Guide (Detailed & Verified)

This document is the **Developer's Manual** for finishing the Admin Panel. It includes **copy-paste snippets** that have been **audited and verified** against the database schema and file structure.

> **Status**: Core Infrastructure is DONE. Feature Logic is EMPTY.
> **Verification**: Snippets tested against `USE THIS SCHEMA.sql`.

---

## 1. 📂 File Status Overview

| File (Frontend)       | Status   | Action Required                       |
| :-------------------- | :------- | :------------------------------------ |
| `admin/dashboard.php` | 🟡 Shell | Insert Stats Script (Package D).      |
| `admin/users.php`     | 🟡 Shell | Insert Table Snippet + Fetch Script.  |
| `admin/products.php`  | 🟡 Shell | Insert Table Snippet + Fetch Script.  |
| `admin/orders.php`    | 🟡 Shell | Insert Table Snippet + Status Script. |

| File (Backend API)                  | Status   | Action Required                       |
| :---------------------------------- | :------- | :------------------------------------ |
| `api/admin/get_users.php`           | 🔴 Empty | Paste Snippet (Select Query).         |
| `api/admin/save_user.php`           | 🔴 Empty | Paste Snippet (Insert/Update + Hash). |
| `api/admin/delete_user.php`         | 🔴 Empty | Paste Snippet (Soft Delete).          |
| `api/admin/get_products.php`        | 🔴 Empty | Paste Snippet (Select Query).         |
| `api/admin/save_product.php`        | 🔴 Empty | Paste Snippet (Image Upload + DB).    |
| `api/admin/delete_product.php`      | 🔴 Empty | Paste Snippet (Soft Delete).          |
| `api/admin/get_orders.php`          | 🔴 Empty | Paste Snippet (Select Join Query).    |
| `api/admin/update_order_status.php` | 🔴 Empty | Paste Snippet (Update Status).        |
| `api/admin/get_dashboard_stats.php` | 🔴 Empty | Paste Snippet (Fetch Stats).          |

---

## 🧾 Assignments

- **Package A — User Management:** Assigned to **PALEC, JHONABELLE H.** — see the Package A section below: [Package A: User Management](#package-a-user-management)
- **Package B — Product Management:** Assigned to **RANCHEZ, JAMES BOND M.** — see the Package B section below: [Package B: Product Management](#package-b-product-management)
- **Package C — Order Management:** Assigned to **SAMUDIO, JOSHUA B.** — see the Package C section below: [Package C: Order Management](#package-c-order-management)
- **Package D — Dashboard Intelligence:** Assigned to **CONSORTE JR., FRANCISCO L.** — see the Package D section below: [Package D: Dashboard Intelligence](#package-d-dashboard-intelligence)

## 2. 📋 Implementation Snippets

<a id="package-a-user-management"></a>

### **📦 Package A: User Management**

`Assigned To: PALEC, JHONABELLE H.`

#### **1. Frontend: `admin/users.php`**

**Step 1:** Replace the "Placeholder" `<div>` with this Table:

```html
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
```

**Step 2:** Add this Script at the bottom (before footer include):

```html
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
              data,
            );
            if (res.success) {
              if (sucMsg) {
                sucMsg.textContent = res.message || "User saved successfully!";
                sucMsg.classList.remove("d-none");
                setTimeout(() => {
                  bootstrap.Modal.getInstance(
                    document.getElementById("userModal"),
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
                  document.getElementById("userModal"),
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
        },
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
            },
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
              u.updated_at,
            ).toLocaleDateString()} <small class="text-muted">${new Date(
              u.updated_at,
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
                  JSON.stringify(u),
                )}"><i class="bi bi-pencil"></i></button>
                <button type="button" class="btn btn-sm btn-outline-danger btn-delete-user" data-id="${
                  u.id
                }" data-name="${(u.first_name + " " + u.last_name).replace(
                  /"/g,
                  "&quot;",
                )}" title="Archive" ${
                  u.is_archived == 1 ? "disabled" : ""
                }><i class="bi bi-archive"></i></button>
            </td>
        </tr>
    `,
      )
      .join("");
  }
</script>
```

#### **2. Backend: `api/admin/get_users.php`**

```php
$limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    try {
        $stmt = $pdo->prepare("SELECT id, first_name, middle_name, last_name, email, role, is_archived, created_at, updated_at FROM users ORDER BY created_at ASC LIMIT ? OFFSET ?");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sp_json_response(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to fetch users'], 500);
    }
```

#### **3. Backend: `api/admin/save_user.php`**

```php
$first  = trim($input['first_name'] ?? '');
    $middle = trim($input['middle_name'] ?? '');
    $last   = trim($input['last_name'] ?? '');
    $email  = trim(strtolower($input['email'] ?? ''));
    $role   = trim($input['role'] ?? 'customer');
    $isArchived = isset($input['is_archived']) ? (int)$input['is_archived'] : 0;
    $id     = isset($input['id']) && $input['id'] !== '' ? (int)$input['id'] : null;
    $password = $input['password'] ?? '';

    // === Basic field validation ===
    if (empty($first) || strlen($first) < 2 || strlen($first) > 100) {
        sp_json_response(['success' => false, 'error' => 'First name must be 2-100 characters'], 400);
    }
    if (empty($last) || strlen($last) < 2 || strlen($last) > 100) {
        sp_json_response(['success' => false, 'error' => 'Last name must be 2-100 characters'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sp_json_response(['success' => false, 'error' => 'Invalid email address'], 400);
    }
    if (!in_array($role, ['customer', 'admin'])) {
        sp_json_response(['success' => false, 'error' => 'Invalid role selected'], 400);
    }

    // === Password validation (required on create, optional on update) ===
    if (!$id && empty($password)) {
        sp_json_response(['success' => false, 'error' => 'Password is required for new users'], 400);
    }

    if (!empty($password)) {
        // Server-side password strength (mirroring frontend rules)
        if (strlen($password) < 8 || strlen($password) > 16) {
            sp_json_response(['success' => false, 'error' => 'Password must be 8-16 characters'], 400);
        }
        if (
            !preg_match('/[A-Z]/', $password) ||
            !preg_match('/[a-z]/', $password) ||
            !preg_match('/[0-9]/', $password) ||
            !preg_match('/[^A-Za-z0-9]/', $password)
        ) {
            sp_json_response(['success' => false, 'error' => 'Password must include uppercase, lowercase, number, and special character'], 400);
        }
    }

    // === Self-protection: Admins can't demote or archive themselves ===
    $currentUserId = $_SESSION['user_id'] ?? null;
    if ($currentUserId && $id == $currentUserId) {
        if ($role !== 'admin') {
            sp_json_response(['success' => false, 'error' => 'You cannot remove your own admin privileges'], 403);
        }
        if ($isArchived == 1) {
            sp_json_response(['success' => false, 'error' => 'You cannot archive your own account'], 403);
        }
    }

    // === Email uniqueness check ===
    $checkSql = "SELECT id FROM users WHERE LOWER(email) = ? AND id != ? LIMIT 1";
    $checkParams = [$email, $id ?? 0];
    if (!$id) {
        $checkSql = "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1";
        $checkParams = [$email];
    }

    $check = $pdo->prepare($checkSql);
    $check->execute($checkParams);
    if ($check->fetch()) {
        sp_json_response(['success' => false, 'error' => 'This email is already in use'], 400);
    }

    // === Perform update or insert ===
    if ($id) {
        // Update existing user
        if (!empty($password)) {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $sql = "UPDATE users
                    SET first_name=?, middle_name=?, last_name=?, email=?, role=?, is_archived=?, password_hash=?
                    WHERE id=?";
            $params = [$first, $middle, $last, $email, $role, $isArchived, $hash, $id];
        } else {
            $sql = "UPDATE users
                    SET first_name=?, middle_name=?, last_name=?, email=?, role=?, is_archived=?
                    WHERE id=?";
            $params = [$first, $middle, $last, $email, $role, $isArchived, $id];
        }
    } else {
        // Create new user
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO users
                (first_name, middle_name, last_name, email, role, password_hash, is_archived, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        $params = [$first, $middle, $last, $email, $role, $hash, $isArchived];
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sp_json_response(['success' => true, 'message' => 'User saved successfully']);
```

#### **4. Backend: `api/admin/delete_user.php`**

```php
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $id = isset($input['id']) ? (int)$input['id'] : 0;

    if (!$id) sp_json_response(['success' => false, 'error' => 'Invalid id'], 400);
    if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $id) {
        sp_json_response(['success' => false, 'error' => 'Cannot archive your own account'], 403);
    }

    try {
        $stmt = $pdo->prepare("UPDATE users SET is_archived = 1 WHERE id = ?");
        $stmt->execute([$id]);

        // Best-effort: invalidate PHP session files that belong to this user so
        // their active sessions are logged out on the next request.
        try {
            $savePath = session_save_path();
            if (empty($savePath)) $savePath = sys_get_temp_dir();
            // session_save_path can contain directives separated by ';', take last path part
            if (strpos($savePath, ';') !== false) {
                $parts = explode(';', $savePath);
                $savePath = trim($parts[count($parts) - 1]);
            }

            if (is_dir($savePath)) {
                $pattern = rtrim($savePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'sess_*';
                foreach (glob($pattern) as $sessFile) {
                    // Attempt to read file and look for serialized user_id
                    $contents = @file_get_contents($sessFile);
                    if ($contents === false) continue;

                    // Serialized integer: user_id|i:123;
                    $intPattern = 'user_id|i:' . $id . ';';
                    if (strpos($contents, $intPattern) !== false) {
                        @unlink($sessFile);
                        continue;
                    }

                    // Serialized string: user_id|s:3:"123";
                    if (preg_match('/user_id\\|s:\\d+:"' . preg_quote((string)$id, '/') . '";/', $contents)) {
                        @unlink($sessFile);
                        continue;
                    }
                }
            }
        } catch (Exception $e) {
            // ignore session cleanup errors (best-effort)
        }

        sp_json_response(['success' => true]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to archive user'], 500);
    }
```

---

<a id="package-b-product-management"></a>

### **📦 Package B: Product Management**

`Assigned To: RANCHEZ, JAMES BOND M.`

#### **1. Frontend: `admin/products.php`**

**Step 1:** Replace Placeholder with Table:

```html
<div class="table-responsive">
  <table
    class="table table-hover table-striped-columns table-bordered border-warning align-middle"
  >
    <thead>
      <tr>
        <th>Product #</th>
        <th>Image</th>
        <th>Name</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="productsTableBody"></tbody>
  </table>
</div>
```

**Step 2:** Script:

```html
<script>
  document.addEventListener("DOMContentLoaded", () => {
    loadProducts();

    // Initialize shared modal behavior
    if (typeof sopoppedAdminUI !== "undefined") {
      sopoppedAdminUI.setupModalReset("productModal", "productForm");

      // Wire up Modal Submit with Confirmation
      sopoppedAdminUI.setupFormSubmission(
        "productForm",
        "Are you sure you want to save this product?",
        async (e) => {
          // Prevent Double Submit
          const btn = e.target.querySelector('button[type="submit"]');
          if (btn) {
            btn.disabled = true;
            btn.innerHTML =
              '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
          }

          // If an image is selected, resize it to reduce upload size (max 800x800)
          async function resizeImageFile(
            file,
            maxWidth = 800,
            maxHeight = 800,
            quality = 0.9,
          ) {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(new Error("Failed to read file"));
              reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error("Invalid image"));
                img.onload = () => {
                  const ratio = Math.min(
                    maxWidth / img.width,
                    maxHeight / img.height,
                    1,
                  );
                  const w = Math.round(img.width * ratio);
                  const h = Math.round(img.height * ratio);
                  const canvas = document.createElement("canvas");
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(img, 0, 0, w, h);
                  let outType = file.type;
                  if (!outType || outType === "image/svg+xml")
                    outType = "image/jpeg";
                  canvas.toBlob(
                    (blob) => {
                      if (blob) resolve(blob);
                      else reject(new Error("Canvas toBlob returned null"));
                    },
                    outType,
                    quality,
                  );
                };
                img.src = reader.result;
              };
              reader.readAsDataURL(file);
            });
          }

          try {
            const fileInput = document.getElementById("productImage");
            let resizedBlob = null;
            if (fileInput && fileInput.files && fileInput.files[0]) {
              try {
                resizedBlob = await resizeImageFile(
                  fileInput.files[0],
                  800,
                  800,
                  0.9,
                );
              } catch (resizeErr) {
                console.warn(
                  "Image resize failed, will attempt original upload",
                  resizeErr,
                );
              }
            }

            const fd = new FormData(e.target);
            if (resizedBlob) {
              try {
                fd.delete("image");
              } catch (__) {}
              const originalName = fileInput.files[0].name || "image.jpg";
              const newFile = new File([resizedBlob], originalName, {
                type: resizedBlob.type || "image/jpeg",
              });
              fd.append("image", newFile);
            }

            const res = await sopoppedFetch.postFormData(
              "../api/admin/save_product.php",
              fd,
            );
            const valMsg = e.target.querySelector("#validate-msg");
            const sucMsg = e.target.querySelector("#success-msg");

            if (res.success) {
              if (sucMsg) {
                sucMsg.textContent =
                  res.message || "Product saved successfully!";
                sucMsg.classList.remove("d-none");
                setTimeout(() => {
                  bootstrap.Modal.getInstance(
                    document.getElementById("productModal"),
                  ).hide();
                  loadProducts();
                  sucMsg.classList.add("d-none");
                  if (btn) {
                    btn.disabled = false;
                    btn.innerText = "Save Changes";
                  }
                }, 1500);
              } else {
                bootstrap.Modal.getInstance(
                  document.getElementById("productModal"),
                ).hide();
                loadProducts();
                if (btn) {
                  btn.disabled = false;
                  btn.innerText = "Save Changes";
                }
              }
            } else {
              if (valMsg) {
                valMsg.textContent = res.error || "Failed to save product";
                valMsg.classList.remove("d-none");
                valMsg.classList.add("alert-danger");
              } else {
                alert(res.error || "Failed to save product");
              }
              if (btn) {
                btn.disabled = false;
                btn.innerText = "Save Changes";
              }
            }
          } catch (err) {
            const valMsg = e.target.querySelector("#validate-msg");
            if (valMsg) {
              valMsg.textContent = "Network error occurred";
              valMsg.classList.remove("d-none");
              valMsg.classList.add("alert-danger");
            } else {
              alert("Network error occurred");
            }
          } finally {
            // Cleanup if needed
          }
        },
      );
    }

    // Delegated handler for Edit and Delete buttons
    const tbody = document.getElementById("productsTableBody");
    if (tbody) {
      tbody.addEventListener("click", (ev) => {
        const deleteBtn = ev.target.closest(".btn-delete-product");
        if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          const name = deleteBtn.dataset.name;
          if (confirm(`Are you sure you want to archive "${name}"?`)) {
            deleteProduct(id);
          }
          return;
        }

        const btn = ev.target.closest(".btn-edit-product");
        if (!btn) return;

        if (typeof sopoppedAdminUI !== "undefined") {
          sopoppedAdminUI.populateModalFromButton(
            btn,
            {
              id: "productId",
              name: "productName",
              description: "productDesc",
              price: "productPrice",
              quantity: "productStock",
            },
            (item) => {
              // Custom Logic for complexities
              const statusEl = document.getElementById("productStatus");
              if (statusEl) statusEl.value = item.is_active;

              const prev = document.getElementById("imagePreview");
              const dropZoneText = document.getElementById("dropZoneText");
              if (prev) {
                const displayPath = item.image_path || "images/default.png";
                prev.src = "../" + displayPath;
                prev.classList.remove("d-none");
                if (dropZoneText) dropZoneText.classList.add("d-none");
                prev.onerror = function () {
                  this.src = "../images/default.png";
                };
              }

              // Format price if needed
              const priceEl = document.getElementById("productPrice");
              if (priceEl && item.price !== undefined) {
                priceEl.value = parseFloat(item.price).toFixed(2);
              }
            },
          );
          new bootstrap.Modal(document.getElementById("productModal")).show();
        }
      });
    }
  });

  async function deleteProduct(id) {
    try {
      const res = await sopoppedFetch.postJSON(
        "../api/admin/delete_product.php",
        {
          id,
        },
      );
      if (res.success) {
        loadProducts();
      } else {
        alert(res.error || "Failed to archive product");
      }
    } catch (err) {
      alert("Network error occurred");
    }
  }

  async function loadProducts() {
    const res = await sopoppedFetch.json("../api/admin/get_products.php");
    document.getElementById("productsTableBody").innerHTML = res.data
      .map(
        (p) => `
        <tr>
            <td><strong>#${p.id}</strong></td>
            <td><img src="../${
              p.image_path || "images/default.png"
            }" class="rounded-3" width="50" height="50" style="object-fit:cover" onerror="this.src='../images/default.png'"></td>
            <td>${p.name}</td>
            <td>$${parseFloat(p.price).toFixed(2)}</td>
            <td>${p.quantity}</td>
            <td>
                <span class="badge ${
                  p.is_active == 1 ? "text-bg-success" : "text-bg-danger"
                }">
                    ${p.is_active == 1 ? "Active" : "Archived"}
                </span>
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-primary btn-edit-product" title="Edit"
                    data-item="${encodeURIComponent(
                      JSON.stringify(p),
                    )}"><i class="bi bi-pencil"></i></button>
                <button type="button" class="btn btn-sm btn-outline-danger btn-delete-product" data-id="${
                  p.id
                }" data-name="${p.name.replace(
                  /"/g,
                  "&quot;",
                )}" title="Archive" ${
                  p.is_active == 0 ? "disabled" : ""
                }><i class="bi bi-archive"></i></button>
            </td>
        </tr>
    `,
      )
      .join("");
  }
</script>
```

#### **2. Backend: `api/admin/get_products.php`**

```php
$limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    try {
        $stmt = $pdo->prepare("SELECT id, name, description, price, quantity, is_active, image_path, created_at FROM products ORDER BY id DESC LIMIT ? OFFSET ?");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sp_json_response(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to fetch products'], 500);
    }
```

#### **3. Backend: `api/admin/save_product.php`**

```php
$maxFileSize = 2 * 1024 * 1024;
    $allowedMimes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

    $id = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $price = isset($_POST['price']) ? (float)$_POST['price'] : 0.0;
    $quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 0;
    $isActive = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;

    if ($name === '') sp_json_response(['success' => false, 'error' => 'Name required'], 400);
    if ($price < 0) sp_json_response(['success' => false, 'error' => 'Invalid price'], 400);

    // Get old image path if updating
    $oldImagePath = null;
    if ($id) {
        $stmt = $pdo->prepare("SELECT image_path FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if ($product) {
            $oldImagePath = $product['image_path'];
        }
    }

    $imagePath = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['image'];
        if ($file['error'] !== UPLOAD_ERR_OK) sp_json_response(['success' => false, 'error' => 'Upload error'], 400);
        if ($file['size'] > $maxFileSize) sp_json_response(['success' => false, 'error' => 'File too large'], 400);

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!isset($allowedMimes[$mime])) sp_json_response(['success' => false, 'error' => 'Invalid file type'], 400);

        $ext = $allowedMimes[$mime];
        $filename = 'prod_' . bin2hex(random_bytes(8)) . '.' . $ext;

        $targetDir = __DIR__ . '/../../images';
        $targetDir = realpath($targetDir);

        if (!$targetDir) {
            $targetDir = __DIR__ . '/../../images';
            if (!mkdir($targetDir, 0775, true)) {
                sp_json_response(['success' => false, 'error' => 'Failed to create image directory'], 500);
            }
            $targetDir = realpath($targetDir);
        }

        $targetFile = $targetDir . DIRECTORY_SEPARATOR . $filename;
        if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
            sp_json_response(['success' => false, 'error' => 'Failed to save uploaded file'], 500);
        }

        $imagePath = 'images/' . $filename;

        // Delete old image after successful upload
        if ($oldImagePath && $oldImagePath !== 'images/default.png') {
            $normalizedPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $oldImagePath);
            $oldImageFile = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . $normalizedPath;

            if (file_exists($oldImageFile)) {
                @unlink($oldImageFile);
            }
        }
    }

    // Database operations
    if ($id) {
        // UPDATE logic (Only update image if new one uploaded)
        $sql = "UPDATE products SET name=?, description=?, price=?, quantity=?, is_active=?" . ($imagePath ? ", image_path=?" : "") . " WHERE id=?";
        $params = [$name, $description, $price, $quantity, $isActive];
        if ($imagePath) $params[] = $imagePath;
        $params[] = $id;
        $pdo->prepare($sql)->execute($params);
    } else {
        // INSERT logic with Duplicate Check
        $check = $pdo->prepare("SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1");
        $check->execute([$name]);
        if ($check->fetch()) {
            sp_json_response(['success' => false, 'error' => 'Product name already exists'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO products (name, description, price, quantity, is_active, image_path) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $description, $price, $quantity, $isActive, $imagePath ?? 'images/default.png']);
    }

    sp_json_response(['success' => true]);
```

#### **4. Backend: `api/admin/delete_product.php`**

```php
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    if (!$id) sp_json_response(['success' => false, 'error' => 'Invalid id'], 400);

    // Get product image path before archiving
    $stmt = $pdo->prepare("SELECT image_path FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) {
        sp_json_response(['success' => false, 'error' => 'Product not found'], 404);
    }

    // Archive the product and reset image_path to default so UI won't reference deleted file
    $stmt = $pdo->prepare("UPDATE products SET is_active = 0, image_path = ? WHERE id = ?");
    $stmt->execute(['images/default.png', $id]);

    // Delete associated image (except default.png)
    if ($product['image_path'] && $product['image_path'] !== 'images/default.png') {
        $normalizedPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $product['image_path']);
        $imageFile = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . $normalizedPath;

        if (file_exists($imageFile)) {
            @unlink($imageFile);
        }
    }

    sp_json_response(['success' => true]);
```

---

<a id="package-c-order-management"></a>

### **📦 Package C: Order Management**

`Assigned To: SAMUDIO, JOSHUA B.`

#### **1. Frontend: `admin/orders.php`**

**Step 1:** Table:

```html
<div class="table-responsive">
  <table
    class="table table-hover table-striped-columns table-bordered border-warning align-middle"
  >
    <thead>
      <tr>
        <th>Date Placed</th>
        <th>Order #</th>
        <th>Customer</th>
        <th>Total</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody id="ordersBody"></tbody>
  </table>
</div>
```

**Step 2:** Script:

```html
<script>
  document.addEventListener("DOMContentLoaded", () => {
    loadOrders();
  });

  async function loadOrders() {
    const status = document.getElementById("statusFilter").value;
    const url = status
      ? `../api/admin/get_orders.php?status=${status}`
      : "../api/admin/get_orders.php";

    const res = await sopoppedFetch.json(url);
    document.getElementById("ordersBody").innerHTML = res.data
      .map(
        (o) => `
        <tr>
            <td>${new Date(
              o.created_at,
            ).toLocaleDateString()} <small class="text-muted">${new Date(
              o.created_at,
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}</small></td>
            <td>
                <strong>#${o.id}</strong><br>
                <div class="text-primary text-break" style="font-size: 0.85rem;">Items: ${
                  o.product_ids || "N/A"
                }</div>
            </td>
            <td>${o.first_name} ${o.last_name}</td>
            <td>$${o.total_amount}</td>
            <td>
                <select class="form-select form-select-sm" onchange="updateStatus(${
                  o.id
                }, this.value)">
                    <option value="pending" ${
                      o.status == "pending" ? "selected" : ""
                    }>Pending</option>
                    <option value="paid" ${
                      o.status == "paid" ? "selected" : ""
                    }>Paid</option>
                    <option value="shipped" ${
                      o.status == "shipped" ? "selected" : ""
                    }>Shipped</option>
                    <option value="cancelled" ${
                      o.status == "cancelled" ? "selected" : ""
                    }>Cancelled</option>
                </select>
            </td>
        </tr>
    `,
      )
      .join("");
  }

  window.updateStatus = async (id, status) => {
    if (
      !confirm(`Are you sure you want to update the status to "${status}"?`)
    ) {
      loadOrders(); // Revert selection
      return;
    }
    try {
      const res = await sopoppedFetch.postJSON(
        "../api/admin/update_order_status.php",
        {
          order_id: id,
          status,
        },
      );
      if (!res.success) {
        alert(res.error || "Failed to update status");
        loadOrders();
      }
    } catch (e) {
      alert("Network error");
      loadOrders();
    }
  };
</script>
```

#### **2. Backend: `api/admin/get_orders.php`**

```php
 $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    $status = isset($_GET['status']) ? $_GET['status'] : '';

    try {
        $whereClause = "";
        $params = [];

        if (!empty($status) && in_array($status, ['pending', 'paid', 'shipped', 'cancelled'])) {
            $whereClause = "WHERE o.status = ?";
            $params[] = $status;
        }

        $sql = "SELECT o.id, o.user_id, o.total_amount, o.status, o.created_at, u.first_name, u.last_name,
                       GROUP_CONCAT(CONCAT('#', oi.product_id, ' <span class=\'text-dark fw-bold\'>x', oi.quantity, '</span>') SEPARATOR ', ') as product_ids
                FROM orders o
                JOIN users u ON o.user_id = u.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                $whereClause
                GROUP BY o.id
                ORDER BY o.created_at ASC
                LIMIT ? OFFSET ?";

        $stmt = $pdo->prepare($sql);

        $paramIndex = 1;
        foreach ($params as $param) {
            $stmt->bindValue($paramIndex++, $param);
        }

        $stmt->bindValue($paramIndex++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($paramIndex++, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sp_json_response(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to fetch orders'], 500);
    }
```

#### **3. Backend: `api/admin/update_order_status.php`**

```php
 $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $orderId = isset($input['order_id']) ? (int)$input['order_id'] : 0;
    $status = trim($input['status'] ?? '');

    $allowed = ['pending', 'paid', 'shipped', 'cancelled'];
    if (!$orderId || !in_array($status, $allowed, true)) {
        sp_json_response(['success' => false, 'error' => 'Invalid input'], 400);
    }

    try {
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $orderId]);
        sp_json_response(['success' => true]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to update order'], 500);
    }
```

---

<a id="package-d-dashboard-intelligence"></a>

## Package D: Dashboard Intelligence

**Assignee:** CONSORTE JR., FRANCISCO L.
**Goal:** Make the admin dashboard stats dynamic (live counts).

#### **1. Frontend: `admin/dashboard.php`**

**Location:** Bottom of file, before footer include.
**Action:** Paste this script block.

```html
<script>
  document.addEventListener("DOMContentLoaded", async () => {
    // Select all the actual card divs (the ones with .p-4.border)
    const cards = document.querySelectorAll(".dashboard-card > div > div");
    if (cards.length < 3) {
      console.warn("Dashboard cards not found");
      return;
    }

    try {
      const res = await sopoppedFetch.json(
        "../api/admin/get_dashboard_stats.php",
      );
      if (res.success) {
        const stats = res.data;

        // Update Users Card (first card)
        const usersCard = cards[0];
        const usersH3 = usersCard.querySelector("h3");
        usersH3.innerHTML = `${stats.total_users} Active Customers`;
        usersCard.querySelector("small.stat-info")?.remove();
        usersH3.insertAdjacentHTML(
          "afterend",
          `<small class='stat-info text-muted d-block mb-3'>${stats.new_users_today} new today</small>`,
        );

        // Update Products Card (second card)
        const productsCard = cards[1];
        const productsH3 = productsCard.querySelector("h3");
        productsH3.innerHTML = `${stats.total_products} Products`;
        productsCard.querySelector("small.stat-info")?.remove();
        if (stats.low_stock > 0) {
          productsH3.insertAdjacentHTML(
            "afterend",
            `<small class='stat-info text-danger d-block mb-3'>${stats.low_stock} low stock</small>`,
          );
        } else {
          productsH3.insertAdjacentHTML(
            "afterend",
            `<small class='stat-info text-muted d-block mb-3'>Stock Healthy</small>`,
          );
        }

        // Update Orders Card (third card)
        const ordersCard = cards[2];
        const ordersH3 = ordersCard.querySelector("h3");
        ordersH3.innerHTML = `${stats.total_orders} Orders`;
        ordersCard.querySelector("small.stat-info")?.remove();
        ordersH3.insertAdjacentHTML(
          "afterend",
          `<small class='stat-info text-muted d-block mb-3'>Pending: ${stats.pending_orders}</small>`,
        );
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  });
</script>
```

#### **2. Backend: `api/admin/get_dashboard_stats.php`**`

```php
    try {
        // Fetch summary statistics
        // 1. Total Users & New Users Today
        $userStats = $pdo->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today
            FROM users
            WHERE role != 'admin' AND is_archived = 0
        ")->fetch(PDO::FETCH_ASSOC);

        // 2. Total Products & Low Stock
        $prodStats = $pdo->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN quantity < 10 AND is_active = 1 THEN 1 ELSE 0 END) as low_stock
            FROM products
            WHERE is_active = 1
        ")->fetch(PDO::FETCH_ASSOC);

        // 3. Order Stats
        $orderStats = $pdo->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
            FROM orders
        ")->fetch(PDO::FETCH_ASSOC);

        $data = [
            'total_users' => $userStats['total'],
            'new_users_today' => $userStats['new_today'] ?? 0,
            'total_products' => $prodStats['total'],
            'low_stock' => $prodStats['low_stock'] ?? 0,
            'total_orders' => $orderStats['total'],
            'pending_orders' => $orderStats['pending'] ?? 0
        ];

        sp_json_response(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
    }
```
