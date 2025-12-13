-- Admin Account
-- Admin User: admin@admin.com / admin123
INSERT INTO `users` (`email`, `password_hash`, `first_name`, `last_name`, `role`, `is_archived`)
    VALUES ('admin@admin.com', '$2y$10$yaUtuRH.TB7lZzLq1.yOme7r37yGj44cCrR/0ChHQMdf2ilE9hiB1q', 'System', 'Admin', 'admin', 0);
