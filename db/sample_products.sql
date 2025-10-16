INSERT INTO `products` (`sku`, `name`, `description`, `price`, `quantity`, `image_path`)
VALUES
    ('P001','Star Fruit','Fresh star fruit — crisp, slightly tart and perfect for snacks or garnishes.', 4.50, 100, 'images/f4.png'),
    ('P002','Strawberry','Sweet ripe strawberries sourced locally for bright flavor.', 3.25, 100, 'images/p1.png'),
    ('P003','Rose','Aromatic rose petals ideal for teas and infusions.', 6.00, 0, 'images/p2.png'),
    ('P004','Dried Tangerine Peel','Savory-sweet dried peel with citrus aromatics used in blends and cooking.', 2.75, 100, 'images/p3.png'),
    ('P005','Tomato','Juicy tomatoes for sauces, salads, and more.', 2.00, 100, 'images/p4.png'),
    ('P006','Papaya','Sweet tropical papaya, rich and soft when ripe.', 3.75, 100, 'images/p5.png'),
    ('P007','Sampaguita','Fragrant sampaguita flowers used in perfumery and ceremonial blends.', 5.50, 100, 'images/f2.png'),
    ('P008','Clove','Warm, earthy clove buds for baking and spice mixes.', 4.00, 100, 'images/f3.png'),
    ('P009','Hawthorn','Hawthorn berries, tart and tangy — great for teas and preserves.', 4.25, 100, 'images/f1.png'),
    ('P010','Peach','Juicy peaches with sweet summer flavor.', 3.50, 100, 'images/p6.png'),
    ('P011','Elderflower','Delicate elderflower aroma for cordials and desserts.', 6.50, 100, 'images/p7.png'),
    ('P012','Coconut','Creamy coconut for culinary and beverage uses.', 3.00, 100, 'images/p8.png'),
    ('P013','Calamansi','Tart calamansi citrus — bright and zesty.', 2.50, 100, 'images/p9.png'),
    ('P014','Passionfruit','Intensely aromatic passionfruit for juices and desserts.', 4.75, 100, 'images/p10.png'),
    ('P015','Rambutan','Exotic rambutan — sweet, juicy flesh with floral notes.', 3.95, 100, 'images/p11.png'),
    ('P016','Sumac','Tangy sumac powder for vibrant, lemony flavor.', 4.10, 100, 'images/p13.png'),
    ('P017','Lavender','Culinary lavender for sweets, syrups, and fragrant blends.', 5.25, 100, 'images/p12.png'),
    ('P018','Chamomile','Soothing chamomile flowers perfect for calming teas.', 4.60, 100, 'images/p14.png'),
    ('P019','test','Test product placeholder.', 1.00, 100, 'images/hero.png'),
    ('P020','images/image.png','Placeholder image product.', 2.00, 0, 'images/image.png')
    ON DUPLICATE KEY UPDATE
                         `name` = VALUES(`name`),
                         `description` = VALUES(`description`),
                         `price` = VALUES(`price`),
                         `quantity` = VALUES(`quantity`),
                         `image_path` = VALUES(`image_path`);