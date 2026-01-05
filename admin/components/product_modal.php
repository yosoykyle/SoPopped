<?php
// Admin Product Modal - Cloned from components/product_modal.php
?>
<!-- Only change is the ID if needed, but keeping productModal to match CSS logic -->
<div class="modal fade glass-modal" id="productModal" tabindex="-1" aria-labelledby="productModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down modal-lg-7col">
        <div class="modal-content rounded-5">
            <div class="modal-header border-0">
                <h2 class="modal-title text-white" id="productModalLabel">Edit / Add Flavor</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="productForm" novalidate>
                    <input type="hidden" id="productId" name="id">
                    <div class="container-fluid">
                        <div class="row g-3 align-items-center">
                            <!-- Left Col: Image Upload -->
                            <div class="col-12 col-md-6 d-flex align-items-center justify-content-center py-2 h-100">
                                <div class="position-relative w-100 ratio ratio-1x1 rounded-4 border border-2 border-white border-opacity-50 d-flex justify-content-center align-items-center bg-dark bg-opacity-10 overflow-hidden"
                                    style="border-style: dashed !important;">

                                    <!-- 1. Placeholder State (Visible by default) -->
                                    <!-- 1. Placeholder State (Visible by default) -->
                                    <div id="dropZoneText" class="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center pointer-event-none">
                                        <i class="bi bi-upload text-white display-1 opacity-75"></i>
                                        <p class="text-white small fw-bold mb-0 opacity-75">Drop file here<br>or click to upload</p>
                                    </div>

                                    <!-- 2. Image Preview (Hidden by default, shown via JS) -->
                                    <img id="imagePreview" src="" alt="Preview" class="position-absolute top-0 start-0 w-100 h-100 object-fit-cover d-none">

                                    <!-- 3. File Input (Covers area, handles Drag & Drop natively) -->
                                    <input type="file"
                                        class="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                                        id="productImage"
                                        name="image"
                                        accept="image/*"
                                        onchange="const file = this.files[0]; if(file){ const prev = document.getElementById('imagePreview'); prev.src = window.URL.createObjectURL(file); prev.classList.remove('d-none'); document.getElementById('dropZoneText').classList.add('d-none'); }">
                                </div>
                            </div>

                            <!-- Right Col: Form Fields (Matches Consumer Details placement) -->
                            <div class="col-12 col-md-6 py-2">
                                <div class="mb-3">
                                    <label class="form-label text-white small fw-bold">Flavor Name</label>
                                    <input type="text" class="form-control rounded-pill border-0 px-3 opacity-75" id="productName" name="name" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label text-white small fw-bold">Description</label>
                                    <textarea class="form-control rounded-4 border-0 p-3 opacity-75" id="productDesc" name="description" rows="3" required></textarea>
                                </div>

                                <div class="row g-2 mb-3">
                                    <div class="col-6">
                                        <label class="form-label text-white small fw-bold">Price</label>
                                        <input type="number" step="0.01" min="0" class="form-control rounded-pill border-0 px-3 opacity-75" id="productPrice" name="price" required>
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label text-white small fw-bold">Stock</label>
                                        <input type="number" min="1" class="form-control rounded-pill border-0 px-3 opacity-75" id="productStock" name="quantity" required>
                                    </div>
                                    <div class="col-12 mt-3">
                                        <label class="form-label text-white small fw-bold">Status</label>
                                        <select class="form-select rounded-pill border-0 px-3 opacity-75" id="productStatus" name="is_active">
                                            <option value="1">Active</option>
                                            <option value="0">Archived</option>
                                        </select>
                                    </div>
                                </div>



                                <div id="validate-msg" class="mt-3 alert alert-danger d-none"></div>
                                <div id="success-msg" class="mt-3 alert alert-success d-none"></div>
                                <div class="d-flex gap-2 mt-4">
                                    <!-- <button type="button" class="btn btn-light rounded-pill w-100 fw-bold text-muted" data-bs-dismiss="modal">Cancel</button> -->
                                    <button type="submit" class="btn btn-warning rounded-pill w-100 fw-bold">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>



            </div>
            <div class="modal-footer border-0"></div>
        </div>
    </div>
</div>