INSERT INTO `products` (`sku`, `name`, `description`, `price`, `quantity`, `image_path`) VALUES
('P001','Star Fruit','Fresh star fruit — crisp, slightly tart and perfect for snacks or garnishes.', 4.50, 100, 'images/f4.png')
ON DUPLICATE KEY UPDATE `sku` = `sku`;

INSERT INTO `products` (`sku`, `name`, `description`, `price`, `quantity`, `image_path`) VALUES
('P002','Strawberry','Sweet ripe strawberries sourced locally for bright flavor.', 3.25, 100, 'images/p1.png')
ON DUPLICATE KEY UPDATE `sku` = `sku`;

INSERT INTO `products` (`sku`, `name`, `description`, `price`, `quantity`, `image_path`) VALUES
('P003','Rose','Aromatic rose petals ideal for teas and infusions.', 6.00, 100, 'images/p2.png')
ON DUPLICATE KEY UPDATE `sku` = `sku`;

INSERT INTO `products` (`sku`, `name`, `description`, `price`, `quantity`, `image_path`) VALUES
('P004','Dried Tangerine Peel','Savory-sweet dried peel with citrus aromatics used in blends and cooking.', 2.75, 100, 'images/p3.png')
ON DUPLICATE KEY UPDATE `sku` = `sku`;

INSERT INTO `products` (`sku`, `name`, `description`, `price`, `quantity`, `image_path`) VALUES
('P005','Tomato','Juicy tomatoes for sauces, salads, and more.', 2.00, 100, 'images/p4.png')
ON DUPLICATE KEY UPDATE `sku` = `sku`;