<?php
// Only show pagination if there are multiple pages
if (isset($totalPages) && $totalPages > 1): ?>
<nav aria-label="Page navigation">
  <div class="container-fluid">
    <ul class="pagination justify-content-center">
      <!-- Previous button -->
      <li class="page-item <?= $currentPage <= 1 ? 'disabled' : '' ?>">
        <a class="page-link" href="?page=<?= max(1, $currentPage - 1) ?>">Previous</a>
      </li>
      
      <!-- Page numbers -->
      <?php for ($i = 1; $i <= $totalPages; $i++): ?>
        <li class="page-item <?= $i == $currentPage ? 'active' : '' ?>">
          <a class="page-link" href="?page=<?= $i ?>"><?= $i ?></a>
        </li>
      <?php endfor; ?>
      
      <!-- Next button -->
      <li class="page-item <?= $currentPage >= $totalPages ? 'disabled' : '' ?>">
        <a class="page-link" href="?page=<?= min($totalPages, $currentPage + 1) ?>">Next</a>
      </li>
    </ul>
  </div>
</nav>
<?php endif; ?>