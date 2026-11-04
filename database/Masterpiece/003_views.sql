-- Simple read-only views. They do not change any data.
USE [Masterpiece];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER VIEW dbo.vPublishedListings AS
SELECT l.ListingId,l.PublicId,l.LegacyKey,l.ListingType,l.Title,l.Description,l.CategoryId,cat.NameAr AS CategoryName,
 l.PublisherUserId,u.FullName AS PublisherName,l.CompanyId,co.Name AS CompanyName,l.LocationMode,l.City,l.CountryCode,l.PublishedAt,
 COALESCE(c.Price,w.Price,e.Price) AS Price,COALESCE(c.CurrencyCode,w.CurrencyCode,e.CurrencyCode,p.CurrencyCode,j.CurrencyCode,n.CurrencyCode) AS CurrencyCode,
 cover.FileId AS CoverFileId,pdf.FileId AS DetailsPdfFileId
FROM dbo.Listings l JOIN dbo.Users u ON u.UserId=l.PublisherUserId JOIN dbo.Categories cat ON cat.CategoryId=l.CategoryId
LEFT JOIN dbo.Companies co ON co.CompanyId=l.CompanyId
LEFT JOIN dbo.Projects p ON p.ListingId=l.ListingId LEFT JOIN dbo.Jobs j ON j.ListingId=l.ListingId
LEFT JOIN dbo.Internships n ON n.ListingId=l.ListingId LEFT JOIN dbo.Courses c ON c.ListingId=l.ListingId
LEFT JOIN dbo.Workshops w ON w.ListingId=l.ListingId LEFT JOIN dbo.Events e ON e.ListingId=l.ListingId
LEFT JOIN dbo.ListingAttachments cover ON cover.ListingId=l.ListingId AND cover.Purpose='cover'
LEFT JOIN dbo.ListingAttachments pdf ON pdf.ListingId=l.ListingId AND pdf.Purpose='details-pdf'
WHERE l.Status='published' AND l.DeletedAt IS NULL AND u.IsActive=1 AND u.DeletedAt IS NULL;
GO
CREATE OR ALTER VIEW dbo.vOrderTotals AS
SELECT o.OrderId,o.OrderNumber,o.UserId,o.Status,o.CurrencyCode,o.CreatedAt,
 COUNT(oi.OrderItemId) AS ItemCount,COALESCE(SUM(oi.UnitPrice),CONVERT(decimal(38,3),0)) AS TotalAmount
FROM dbo.Orders o LEFT JOIN dbo.OrderItems oi ON oi.OrderId=o.OrderId
GROUP BY o.OrderId,o.OrderNumber,o.UserId,o.Status,o.CurrencyCode,o.CreatedAt;
GO
CREATE OR ALTER VIEW dbo.vCourseProgress AS
SELECT en.EnrollmentId,en.UserId,en.CourseId,en.Status,en.EnrolledAt,
 COUNT(le.LessonId) AS TotalLessons,SUM(CASE WHEN lp.IsCompleted=1 THEN 1 ELSE 0 END) AS CompletedLessons,
 CONVERT(decimal(5,2),CASE WHEN COUNT(le.LessonId)=0 THEN 0 ELSE 100.0*SUM(CASE WHEN lp.IsCompleted=1 THEN 1 ELSE 0 END)/COUNT(le.LessonId) END) AS ProgressPercent
FROM dbo.CourseEnrollments en LEFT JOIN dbo.Lessons le ON le.CourseId=en.CourseId
LEFT JOIN dbo.LessonProgress lp ON lp.EnrollmentId=en.EnrollmentId AND lp.LessonId=le.LessonId
GROUP BY en.EnrollmentId,en.UserId,en.CourseId,en.Status,en.EnrolledAt;
GO
CREATE OR ALTER VIEW dbo.vUserActivity AS
SELECT a.ApplicantUserId AS UserId,a.ListingId,a.ListingType AS ActivityType,a.Status,a.SubmittedAt AS ActivityAt FROM dbo.Applications a
UNION ALL
SELECT en.UserId,en.CourseId,'course',en.Status,en.EnrolledAt FROM dbo.CourseEnrollments en
UNION ALL
SELECT r.UserId,r.ListingId,r.ListingType,r.Status,r.RegisteredAt FROM dbo.Registrations r;
GO
