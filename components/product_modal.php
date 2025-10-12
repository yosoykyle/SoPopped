<?php
// Bootstrap product modal component
?>
<div class="modal fade" id="productModal" tabindex="-1" aria-labelledby="productModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down modal-lg-7col">
    <div class="modal-content rounded-4">
      <div class="modal-header border-0">
        <h5 class="modal-title" id="productModalLabel">Product</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="container-fluid">
          <div class="row g-3 align-items-center">
            <div class="col-12 col-md-6 d-flex align-items-center justify-content-center py-2">
              <img id="pm-image" src="" alt="Product image" class="img-fluid rounded-3" style="max-height:420px; object-fit:contain;" />
            </div>
            <div class="col-12 col-md-6 py-2">
              <h4 id="pm-name" class="fw-bold"></h4>
              <p id="pm-desc" class="text-muted small"></p>
              <div class="mb-3">
                <span class="h4 text-warning fw-bold" id="pm-price">$0.00</span>
              </div>

              <div class="d-flex align-items-center mb-3">
                <label class="me-3 mb-0">Quantity</label>
                <div class="input-group" style="width:140px;">
                  <button class="btn btn-outline-secondary" type="button" id="pm-qty-decrease">-</button>
                  <input type="number" id="pm-qty" class="form-control text-center" value="1" min="1" />
                  <button class="btn btn-outline-secondary" type="button" id="pm-qty-increase">+</button>
                </div>
              </div>

              <div class="d-flex gap-2 flex-column flex-sm-row">
                <button id="pm-add-cart" class="btn btn-outline-primary w-100 w-sm-auto">Add to cart</button>
                <button id="pm-buy-now" class="btn btn-warning w-100 w-sm-auto">Buy now</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer border-0"></div>
    </div>
  </div>
</div>
