<?php
// Admin User Modal - Styled to match components/product_modal.php
?>
<div class="modal fade glass-modal" id="userModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down modal-lg-4col">
        <div class="modal-content rounded-5">
            <div class="modal-header border-0">
                <h2 class="modal-title text-white">User Details</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="userForm" novalidate>
                    <input type="hidden" id="userId" name="id">
                    <div class="container-fluid">
                        <div class="row g-3">
                            <!-- Left Column -->
                            <div class="col-12 col-md-6">
                                <label class="form-label text-white small fw-bold">First Name</label>
                                <input type="text" class="form-control rounded-pill border-0 px-3 opacity-75" id="firstName" name="first_name" required>
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label text-white small fw-bold">Middle Name</label>
                                <input type="text" class="form-control rounded-pill border-0 px-3 opacity-75" id="middleName" name="middle_name">
                            </div>

                            <!-- Right Column -->
                            <div class="col-12 col-md-6">
                                <label class="form-label text-white small fw-bold">Last Name</label>
                                <input type="text" class="form-control rounded-pill border-0 px-3 opacity-75" id="lastName" name="last_name" required>
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label text-white small fw-bold">Email</label>
                                <input type="email" class="form-control rounded-pill border-0 px-3 opacity-75" id="email" name="email" required>
                            </div>

                            <div class="col-12 col-md-6">
                                <label class="form-label text-white small fw-bold">Role</label>
                                <select class="form-select rounded-pill border-0 px-3 opacity-75" id="role" name="role">
                                    <option value="customer">Customer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label text-white small fw-bold">Status</label>
                                <select class="form-select rounded-pill border-0 px-3 opacity-75" id="userStatus" name="is_archived">
                                    <option value="0">Active</option>
                                    <option value="1">Archived</option>
                                </select>
                            </div>

                            <div class="col-12">
                                <label class="form-label text-white small fw-bold">Password</label>
                                <div class="input-group gap-1">
                                    <input type="password" class="form-control rounded-pill border-0 px-3 opacity-75" id="userPassword" name="password" minlength="8" maxlength="16">
                                    <button type="button" class="btn btn-warning rounded-pill" id="toggleUserPassword" data-input="#userPassword" aria-label="Toggle password visibility">🙈</button>
                                </div>
                            </div>

                            <div id="validate-msg" class="mt-3 alert alert-danger d-none"></div>
                            <div id="success-msg" class="mt-3 alert alert-success d-none"></div>

                            <div class="col-12 mt-4 d-flex gap-2">
                                <!-- <button type="button" class="btn btn-light rounded-pill w-100 fw-bold text-muted" data-bs-dismiss="modal">Cancel</button> -->
                                <button type="submit" class="btn btn-warning rounded-pill w-100 fw-bold">Save User</button>
                            </div>
                        </div>
                    </div>



                </form>
            </div>
            <div class="modal-footer border-0"></div>
        </div>
    </div>
</div>