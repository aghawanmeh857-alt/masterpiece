USE [Masterpiece];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION;
INSERT dbo.Roles(Code,NameAr)
SELECT v.Code,v.NameAr FROM (VALUES('member',N'مستخدم'),('company',N'ممثل شركة'),('admin',N'أدمن الموقع')) v(Code,NameAr)
WHERE NOT EXISTS(SELECT 1 FROM dbo.Roles r WHERE r.Code=v.Code);
INSERT dbo.Categories(Code,NameAr)
SELECT v.Code,v.NameAr FROM (VALUES('development',N'برمجة وتطوير'),('design',N'تصميم'),('marketing',N'تسويق رقمي'),('career',N'مهارات مهنية')) v(Code,NameAr)
WHERE NOT EXISTS(SELECT 1 FROM dbo.Categories c WHERE c.Code=v.Code);
INSERT dbo.Currencies(CurrencyCode,NameAr,DecimalPlaces)
SELECT v.Code,v.NameAr,v.Places FROM (VALUES('USD',N'دولار أمريكي',2),('JOD',N'دينار أردني',3)) v(Code,NameAr,Places)
WHERE NOT EXISTS(SELECT 1 FROM dbo.Currencies c WHERE c.CurrencyCode=v.Code);
INSERT dbo.Skills(Name)
SELECT v.Name FROM (VALUES(N'HTML'),(N'CSS'),(N'JavaScript'),(N'React'),(N'Node.js'),(N'Figma'),(N'UI/UX'),(N'تصميم الهوية البصرية'),(N'التسويق الرقمي'),(N'التواصل'),(N'إدارة المشاريع')) v(Name)
WHERE NOT EXISTS(SELECT 1 FROM dbo.Skills s WHERE s.Name=v.Name);
COMMIT;
GO
