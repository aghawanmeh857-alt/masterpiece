-- Open this file in SSMS after installing the database.
USE [Masterpiece];
GO

-- 1. All tables and their columns.
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- 2. Published jobs, projects, courses, workshops, events and internships.
SELECT ListingId, ListingType, Title, PublisherName, CompanyName
FROM dbo.vPublishedListings
ORDER BY PublishedAt DESC;

-- Change this value to the user you want to inspect.
DECLARE @UserId bigint = 1;

-- 3. Profile activity: applications, courses, workshops and events.
SELECT a.ActivityType, l.Title, a.Status, a.ActivityAt
FROM dbo.vUserActivity a
JOIN dbo.Listings l ON l.ListingId = a.ListingId
WHERE a.UserId = @UserId
ORDER BY a.ActivityAt DESC;

-- 4. Shared favorites.
SELECT l.ListingType, l.Title, f.CreatedAt
FROM dbo.Favorites f
JOIN dbo.Listings l ON l.ListingId = f.ListingId
WHERE f.UserId = @UserId;

-- 5. Shared cart: jobs and projects cannot be added.
SELECT l.ListingType, l.Title, ci.AddedAt
FROM dbo.Carts c
JOIN dbo.CartItems ci ON ci.CartId = c.CartId
JOIN dbo.Listings l ON l.ListingId = ci.ListingId
WHERE c.UserId = @UserId;

-- 6. Course learning progress.
SELECT l.Title, p.TotalLessons, p.CompletedLessons, p.ProgressPercent
FROM dbo.vCourseProgress p
JOIN dbo.Listings l ON l.ListingId = p.CourseId
WHERE p.UserId = @UserId;

-- 7. Order totals use the price saved when the order was placed.
SELECT OrderId, CurrencyCode, ItemCount, TotalAmount, Status
FROM dbo.vOrderTotals
WHERE UserId = @UserId;

-- 8. Inspect all database relationships.
SELECT fk.name AS RelationshipName,
       OBJECT_NAME(fk.parent_object_id) AS ChildTable,
       OBJECT_NAME(fk.referenced_object_id) AS ParentTable
FROM sys.foreign_keys fk
ORDER BY ParentTable, ChildTable;
GO
