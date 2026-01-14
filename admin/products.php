<?php require_once 'components/header.php'; ?>

<div class="container mt-5 pt-5">
  <div class="p-4 rounded-5 border-0 shadow-sm">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="display-5 fw-bold text-primary" style="font-family: pix;">Product Management</h2>
      <button class="btn btn-primary rounded-pill px-4 shadow-sm" onclick="new bootstrap.Modal(document.getElementById('productModal')).show()">
        <i class="bi bi-plus-lg me-2"></i>Add Product
      </button>
    </div>

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

  </div>
</div>
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
            quality = 0.9
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
                    1
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
                    quality
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
                  0.9
                );
              } catch (resizeErr) {
                console.warn(
                  "Image resize failed, will attempt original upload",
                  resizeErr
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
              fd
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
                    document.getElementById("productModal")
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
                  document.getElementById("productModal")
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
        }
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
            }
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
        }
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
                      JSON.stringify(p)
                    )}"><i class="bi bi-pencil"></i></button>
                <button type="button" class="btn btn-sm btn-outline-danger btn-delete-product" data-id="${
                  p.id
                }" data-name="${p.name.replace(
          /"/g,
          "&quot;"
        )}" title="Archive" ${
          p.is_active == 0 ? "disabled" : ""
        }><i class="bi bi-archive"></i></button>
            </td>
        </tr>
    `
      )
      .join("");
  }
</script>

<?php require_once 'components/product_modal.php'; ?>
<?php require_once 'components/footer.php'; ?>