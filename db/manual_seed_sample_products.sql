-- ==============================================================================
-- SEEDER: Sample Products
-- ==============================================================================
-- 
-- PURPOSE:
-- --------
-- Inserts 18 sample products into the `products` table for development and
-- testing purposes. These are fictional items with placeholder images.
-- 
-- WHEN TO RUN:
-- ------------
-- Run this AFTER creating the database schema (either via `USE THIS SCHEMA.sql`
-- or after running all migrations). This is optional — only needed if you want
-- sample data to work with during development.
-- 
-- PREREQUISITE:
-- -------------
-- The `products` table must exist.
-- 
-- HOW TO RUN:
-- -----------
-- Execute this file AS A WHOLE in MySQL Workbench, phpMyAdmin, or CLI.
-- Make sure you are connected to the `sopopped` database first.
-- 
-- SAFE TO RE-RUN:
-- ---------------
-- NO! Running this twice will insert duplicate products (same names, descriptions).
-- If you need to reset, delete all products first:
--   DELETE FROM products;
-- Then run this file again.
-- 
-- PRODUCT COUNT:
-- --------------
-- This file inserts 18 products.
-- 
-- ==============================================================================

USE sopopped;

INSERT INTO products (name, description, price, quantity, image_path, is_active) VALUES
('Star Fruit', 'Fresh star fruit — crisp, slightly tart and perfect for snacks or garnishes.', 4.50, 100, 'images/f4.png', 1),
('Strawberry', 'Sweet ripe strawberries sourced locally for bright flavor.', 3.25, 100, 'images/p1.png', 1),
('Rose', 'Aromatic rose petals ideal for teas and infusions.', 6.00, 0, 'images/p2.png', 1),
('Dried Tangerine Peel', 'Savory-sweet dried peel with citrus aromatics used in blends and cooking.', 2.75, 100, 'images/p3.png', 1),
('Tomato', 'Juicy tomatoes for sauces, salads, and more.', 2.00, 100, 'images/p4.png', 1),
('Papaya', 'Sweet tropical papaya, rich and soft when ripe.', 3.75, 100, 'images/p5.png', 1),
('Sampaguita', 'Fragrant sampaguita flowers used in perfumery and ceremonial blends.', 5.50, 100, 'images/f2.png', 1),
('Clove', 'Warm, earthy clove buds for baking and spice mixes.', 4.00, 100, 'images/f3.png', 1),
('Hawthorn', 'Hawthorn berries, tart and tangy — great for teas and preserves.', 4.25, 100, 'images/f1.png', 1),
('Peach', 'Juicy peaches with sweet summer flavor.', 3.50, 100, 'images/p6.png', 1),
('Elderflower', 'Delicate elderflower aroma for cordials and desserts.', 6.50, 100, 'images/p7.png', 1),
('Coconut', 'Creamy coconut for culinary and beverage uses.', 3.00, 100, 'images/p8.png', 1),
('Calamansi', 'Tart calamansi citrus — bright and zesty.', 2.50, 100, 'images/p9.png', 1),
('Passionfruit', 'Intensely aromatic passionfruit for juices and desserts.', 4.75, 100, 'images/p10.png', 1),
('Rambutan', 'Exotic rambutan — sweet, juicy flesh with floral notes.', 3.95, 100, 'images/p11.png', 1),
('Sumac', 'Tangy sumac powder for vibrant, lemony flavor.', 4.10, 100, 'images/p13.png', 1),
('Lavender', 'Culinary lavender for sweets, syrups, and fragrant blends.', 5.25, 100, 'images/p12.png', 1),
('Chamomile', 'Soothing chamomile flowers perfect for calming teas.', 4.60, 100, 'images/p14.png', 1);