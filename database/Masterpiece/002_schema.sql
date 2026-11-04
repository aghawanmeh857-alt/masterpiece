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
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF OBJECT_ID(N'dbo.SchemaVersions', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.SchemaVersions WHERE VersionNumber = 1)
    BEGIN
        PRINT N'Masterpiece schema version 1 is already installed.';
        RETURN;
    END;
END;
BEGIN TRY
BEGIN TRANSACTION;

CREATE TABLE dbo.SchemaVersions (
    VersionNumber int NOT NULL CONSTRAINT PK_SchemaVersions PRIMARY KEY,
    AppliedAt datetime2(3) NOT NULL CONSTRAINT DF_SchemaVersions_Date DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.Users (
    UserId bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
    PublicId uniqueidentifier NOT NULL CONSTRAINT DF_Users_PublicId DEFAULT NEWSEQUENTIALID(),
    FullName nvarchar(150) NOT NULL,
    Email nvarchar(254) NOT NULL,
    NormalizedEmail AS LOWER(LTRIM(RTRIM(Email))) PERSISTED,
    PasswordHash varchar(512) NULL,
    Phone nvarchar(30) NULL,
    IsActive bit NOT NULL CONSTRAINT DF_Users_Active DEFAULT 1,
    EmailVerifiedAt datetime2(3) NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Users_Created DEFAULT SYSUTCDATETIME(),
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_Users_Updated DEFAULT SYSUTCDATETIME(),
    DeletedAt datetime2(3) NULL,
    Version rowversion NOT NULL,
    CONSTRAINT UQ_Users_PublicId UNIQUE(PublicId),
    CONSTRAINT UQ_Users_Email UNIQUE(NormalizedEmail),
    CONSTRAINT CK_Users_Name CHECK(LEN(LTRIM(RTRIM(FullName))) >= 2),
    CONSTRAINT CK_Users_Email CHECK(Email LIKE N'%_@_%._%')
);
CREATE TABLE dbo.Roles (
    RoleId smallint IDENTITY NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
    Code varchar(30) NOT NULL CONSTRAINT UQ_Roles_Code UNIQUE,
    NameAr nvarchar(60) NOT NULL
);
CREATE TABLE dbo.UserRoles (
    UserId bigint NOT NULL,
    RoleId smallint NOT NULL,
    AssignedAt datetime2(3) NOT NULL CONSTRAINT DF_UserRoles_Date DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_UserRoles PRIMARY KEY(UserId,RoleId),
    CONSTRAINT FK_UserRoles_Users FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_UserRoles_Roles FOREIGN KEY(RoleId) REFERENCES dbo.Roles(RoleId)
);
CREATE TABLE dbo.Files (
    FileId bigint IDENTITY NOT NULL CONSTRAINT PK_Files PRIMARY KEY,
    UploadedByUserId bigint NOT NULL,
    OriginalName nvarchar(255) NOT NULL,
    StorageKey nvarchar(450) NOT NULL CONSTRAINT UQ_Files_StorageKey UNIQUE,
    FileKind varchar(12) NOT NULL,
    MimeType varchar(100) NOT NULL,
    SizeBytes bigint NOT NULL,
    Sha256 binary(32) NULL,
    ScanStatus varchar(12) NOT NULL CONSTRAINT DF_Files_Scan DEFAULT 'pending',
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Files_Created DEFAULT SYSUTCDATETIME(),
    DeletedAt datetime2(3) NULL,
    CONSTRAINT UQ_Files_IdKind UNIQUE(FileId,FileKind),
    CONSTRAINT FK_Files_UploadedBy FOREIGN KEY(UploadedByUserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT CK_Files_Size CHECK(SizeBytes BETWEEN 1 AND 10485760),
    CONSTRAINT CK_Files_Scan CHECK(ScanStatus IN ('pending','clean','rejected')),
    CONSTRAINT CK_Files_Mime CHECK(
       (FileKind='image' AND MimeType IN ('image/png','image/jpeg','image/webp')) OR
       (FileKind='pdf' AND MimeType='application/pdf') OR
       (FileKind='document' AND MimeType IN ('application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document')))
);
CREATE TABLE dbo.Profiles (
    UserId bigint NOT NULL CONSTRAINT PK_Profiles PRIMARY KEY,
    ProfessionalTitle nvarchar(150) NULL,
    Bio nvarchar(3000) NULL,
    City nvarchar(100) NULL,
    CountryCode char(2) NULL,
    Availability varchar(20) NOT NULL CONSTRAINT DF_Profiles_Availability DEFAULT 'available',
    AvatarFileId bigint NULL,
    AvatarFileKind varchar(12) NOT NULL CONSTRAINT DF_Profiles_AvatarKind DEFAULT 'image',
    PortfolioUrl nvarchar(1000) NULL,
    LinkedInUrl nvarchar(1000) NULL,
    ExperienceSummary nvarchar(4000) NULL,
    IsPublic bit NOT NULL CONSTRAINT DF_Profiles_Public DEFAULT 1,
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_Profiles_Updated DEFAULT SYSUTCDATETIME(),
    Version rowversion NOT NULL,
    CONSTRAINT FK_Profiles_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT CK_Profiles_AvatarKind CHECK(AvatarFileKind='image'),
    CONSTRAINT FK_Profiles_Avatar FOREIGN KEY(AvatarFileId,AvatarFileKind) REFERENCES dbo.Files(FileId,FileKind),
    CONSTRAINT CK_Profiles_Availability CHECK(Availability IN ('available','busy','unavailable'))
);
CREATE TABLE dbo.ProfileAttachments (
    ProfileAttachmentId bigint IDENTITY NOT NULL CONSTRAINT PK_ProfileAttachments PRIMARY KEY,
    UserId bigint NOT NULL,
    FileId bigint NOT NULL,
    FileKind varchar(12) NOT NULL,
    Purpose varchar(20) NOT NULL,
    Caption nvarchar(200) NULL,
    IsPrimary bit NOT NULL CONSTRAINT DF_ProfileAttachments_Primary DEFAULT 0,
    CONSTRAINT FK_ProfileAttachments_Profile FOREIGN KEY(UserId) REFERENCES dbo.Profiles(UserId),
    CONSTRAINT FK_ProfileAttachments_File FOREIGN KEY(FileId,FileKind) REFERENCES dbo.Files(FileId,FileKind),
    CONSTRAINT UQ_ProfileAttachments_File UNIQUE(UserId,FileId,Purpose),
    CONSTRAINT CK_ProfileAttachments_Purpose CHECK((Purpose='resume' AND FileKind IN ('pdf','document')) OR (Purpose='education' AND FileKind IN ('pdf','image'))),
    CONSTRAINT CK_ProfileAttachments_Primary CHECK(IsPrimary=0 OR Purpose='resume')
);
CREATE UNIQUE INDEX UX_ProfileAttachments_PrimaryResume ON dbo.ProfileAttachments(UserId) WHERE IsPrimary=1;
CREATE TABLE dbo.Skills (
    SkillId int IDENTITY NOT NULL CONSTRAINT PK_Skills PRIMARY KEY,
    Name nvarchar(100) NOT NULL CONSTRAINT UQ_Skills_Name UNIQUE
);
CREATE TABLE dbo.UserSkills (
    UserId bigint NOT NULL,
    SkillId int NOT NULL,
    CONSTRAINT PK_UserSkills PRIMARY KEY(UserId,SkillId),
    CONSTRAINT FK_UserSkills_Profile FOREIGN KEY(UserId) REFERENCES dbo.Profiles(UserId),
    CONSTRAINT FK_UserSkills_Skill FOREIGN KEY(SkillId) REFERENCES dbo.Skills(SkillId)
);
CREATE TABLE dbo.Companies (
    CompanyId bigint IDENTITY NOT NULL CONSTRAINT PK_Companies PRIMARY KEY,
    Name nvarchar(200) NOT NULL,
    Slug varchar(180) NOT NULL CONSTRAINT UQ_Companies_Slug UNIQUE,
    Description nvarchar(4000) NULL,
    WebsiteUrl nvarchar(1000) NULL,
    ContactEmail nvarchar(254) NULL,
    City nvarchar(100) NULL,
    CountryCode char(2) NULL,
    LogoFileId bigint NULL,
    LogoFileKind varchar(12) NOT NULL CONSTRAINT DF_Companies_LogoKind DEFAULT 'image',
    Status varchar(16) NOT NULL CONSTRAINT DF_Companies_Status DEFAULT 'pending',
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Companies_Created DEFAULT SYSUTCDATETIME(),
    DeletedAt datetime2(3) NULL,
    Version rowversion NOT NULL,
    CONSTRAINT CK_Companies_LogoKind CHECK(LogoFileKind='image'),
    CONSTRAINT FK_Companies_Logo FOREIGN KEY(LogoFileId,LogoFileKind) REFERENCES dbo.Files(FileId,FileKind),
    CONSTRAINT CK_Companies_Status CHECK(Status IN ('pending','active','suspended'))
);
CREATE TABLE dbo.CompanyMembers (
    CompanyId bigint NOT NULL,
    UserId bigint NOT NULL,
    MemberRole varchar(16) NOT NULL,
    IsActive bit NOT NULL CONSTRAINT DF_CompanyMembers_Active DEFAULT 1,
    JoinedAt datetime2(3) NOT NULL CONSTRAINT DF_CompanyMembers_Date DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CompanyMembers PRIMARY KEY(CompanyId,UserId),
    CONSTRAINT FK_CompanyMembers_Company FOREIGN KEY(CompanyId) REFERENCES dbo.Companies(CompanyId),
    CONSTRAINT FK_CompanyMembers_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT CK_CompanyMembers_Role CHECK(MemberRole IN ('owner','recruiter'))
);
CREATE TABLE dbo.Categories (
    CategoryId int IDENTITY NOT NULL CONSTRAINT PK_Categories PRIMARY KEY,
    Code varchar(50) NOT NULL CONSTRAINT UQ_Categories_Code UNIQUE,
    NameAr nvarchar(100) NOT NULL
);
CREATE TABLE dbo.Currencies (
    CurrencyCode char(3) NOT NULL CONSTRAINT PK_Currencies PRIMARY KEY,
    NameAr nvarchar(60) NOT NULL,
    DecimalPlaces tinyint NOT NULL CONSTRAINT CK_Currencies_Decimals CHECK(DecimalPlaces BETWEEN 0 AND 3)
);
CREATE TABLE dbo.Listings (
    ListingId bigint IDENTITY NOT NULL CONSTRAINT PK_Listings PRIMARY KEY,
    PublicId uniqueidentifier NOT NULL CONSTRAINT DF_Listings_PublicId DEFAULT NEWSEQUENTIALID(),
    LegacyKey nvarchar(100) NULL,
    ListingType varchar(16) NOT NULL,
    PublisherUserId bigint NOT NULL,
    CompanyId bigint NULL,
    CategoryId int NOT NULL,
    Title nvarchar(250) NOT NULL,
    Description nvarchar(max) NOT NULL,
    Status varchar(16) NOT NULL CONSTRAINT DF_Listings_Status DEFAULT 'draft',
    LocationMode varchar(12) NOT NULL CONSTRAINT DF_Listings_Location DEFAULT 'remote',
    City nvarchar(100) NULL,
    CountryCode char(2) NULL,
    PublishedAt datetime2(3) NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Listings_Created DEFAULT SYSUTCDATETIME(),
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_Listings_Updated DEFAULT SYSUTCDATETIME(),
    DeletedAt datetime2(3) NULL,
    Version rowversion NOT NULL,
    CONSTRAINT UQ_Listings_PublicId UNIQUE(PublicId),
    CONSTRAINT UQ_Listings_IdType UNIQUE(ListingId,ListingType),
    CONSTRAINT FK_Listings_Publisher FOREIGN KEY(PublisherUserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Listings_Company FOREIGN KEY(CompanyId) REFERENCES dbo.Companies(CompanyId),
    CONSTRAINT FK_Listings_Category FOREIGN KEY(CategoryId) REFERENCES dbo.Categories(CategoryId),
    CONSTRAINT CK_Listings_Type CHECK(ListingType IN ('project','job','internship','course','workshop','event')),
    CONSTRAINT CK_Listings_Company CHECK((ListingType IN ('job','internship') AND CompanyId IS NOT NULL) OR (ListingType NOT IN ('job','internship') AND CompanyId IS NULL)),
    CONSTRAINT CK_Listings_Status CHECK(Status IN ('draft','pending','published','paused','closed','rejected','archived')),
    CONSTRAINT CK_Listings_Published CHECK(Status<>'published' OR PublishedAt IS NOT NULL),
    CONSTRAINT CK_Listings_Location CHECK(LocationMode IN ('remote','onsite','hybrid')),
    CONSTRAINT CK_Listings_Title CHECK(LEN(LTRIM(RTRIM(Title)))>0)
);
CREATE UNIQUE INDEX UX_Listings_LegacyKey ON dbo.Listings(ListingType,LegacyKey) WHERE LegacyKey IS NOT NULL;
CREATE INDEX IX_Listings_Discovery ON dbo.Listings(ListingType,Status,CategoryId,PublishedAt DESC) INCLUDE(Title,PublisherUserId,CompanyId) WHERE DeletedAt IS NULL;
CREATE INDEX IX_Listings_Publisher ON dbo.Listings(PublisherUserId,CreatedAt DESC);
CREATE INDEX IX_Listings_Company ON dbo.Listings(CompanyId,Status) WHERE CompanyId IS NOT NULL;
CREATE TABLE dbo.ListingDetails (
    ListingDetailId bigint IDENTITY NOT NULL CONSTRAINT PK_ListingDetails PRIMARY KEY,
    ListingId bigint NOT NULL,
    SectionCode varchar(20) NOT NULL,
    Body nvarchar(2000) NOT NULL,
    SortOrder int NOT NULL CONSTRAINT DF_ListingDetails_Order DEFAULT 0,
    CONSTRAINT FK_ListingDetails_Listing FOREIGN KEY(ListingId) REFERENCES dbo.Listings(ListingId),
    CONSTRAINT CK_ListingDetails_Section CHECK(SectionCode IN ('detail','requirement','output','step')),
    CONSTRAINT CK_ListingDetails_Order CHECK(SortOrder>=0),
    CONSTRAINT UQ_ListingDetails_Order UNIQUE(ListingId,SectionCode,SortOrder)
);
CREATE TABLE dbo.ListingSkills (
    ListingId bigint NOT NULL,
    SkillId int NOT NULL,
    CONSTRAINT PK_ListingSkills PRIMARY KEY(ListingId,SkillId),
    CONSTRAINT FK_ListingSkills_Listing FOREIGN KEY(ListingId) REFERENCES dbo.Listings(ListingId),
    CONSTRAINT FK_ListingSkills_Skill FOREIGN KEY(SkillId) REFERENCES dbo.Skills(SkillId)
);
CREATE TABLE dbo.ListingAttachments (
    ListingAttachmentId bigint IDENTITY NOT NULL CONSTRAINT PK_ListingAttachments PRIMARY KEY,
    ListingId bigint NOT NULL,
    FileId bigint NOT NULL,
    FileKind varchar(12) NOT NULL,
    Purpose varchar(12) NOT NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_ListingAttachments_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ListingAttachments_Listing FOREIGN KEY(ListingId) REFERENCES dbo.Listings(ListingId),
    CONSTRAINT FK_ListingAttachments_File FOREIGN KEY(FileId,FileKind) REFERENCES dbo.Files(FileId,FileKind),
    CONSTRAINT CK_ListingAttachments_Purpose CHECK((Purpose='cover' AND FileKind='image') OR (Purpose='details-pdf' AND FileKind='pdf')),
    CONSTRAINT UQ_ListingAttachments_Purpose UNIQUE(ListingId,Purpose)
);
CREATE TABLE dbo.Projects (
    ListingId bigint NOT NULL CONSTRAINT PK_Projects PRIMARY KEY,
    ListingType varchar(16) NOT NULL CONSTRAINT DF_Projects_Type DEFAULT 'project',
    BudgetMin decimal(19,3) NOT NULL,
    BudgetMax decimal(19,3) NOT NULL,
    CurrencyCode char(3) NOT NULL,
    DurationDays int NOT NULL,
    ProjectType varchar(12) NOT NULL,
    ApplicationDeadline datetime2(3) NULL,
    CONSTRAINT CK_Projects_Type CHECK(ListingType='project'),
    CONSTRAINT FK_Projects_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT FK_Projects_Currency FOREIGN KEY(CurrencyCode) REFERENCES dbo.Currencies(CurrencyCode),
    CONSTRAINT CK_Projects_Budget CHECK(BudgetMin>=0 AND BudgetMax>=BudgetMin),
    CONSTRAINT CK_Projects_Duration CHECK(DurationDays>0),
    CONSTRAINT CK_Projects_ProjectType CHECK(ProjectType IN ('fixed','ongoing'))
);
CREATE TABLE dbo.Jobs (
    ListingId bigint NOT NULL CONSTRAINT PK_Jobs PRIMARY KEY,
    ListingType varchar(16) NOT NULL CONSTRAINT DF_Jobs_Type DEFAULT 'job',
    EmploymentType varchar(16) NOT NULL,
    ExperienceLevel varchar(12) NOT NULL,
    SalaryMin decimal(19,3) NULL,
    SalaryMax decimal(19,3) NULL,
    CurrencyCode char(3) NOT NULL,
    SalaryPeriod varchar(12) NOT NULL CONSTRAINT DF_Jobs_Period DEFAULT 'month',
    ApplicationDeadline datetime2(3) NULL,
    CONSTRAINT CK_Jobs_Type CHECK(ListingType='job'),
    CONSTRAINT FK_Jobs_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT FK_Jobs_Currency FOREIGN KEY(CurrencyCode) REFERENCES dbo.Currencies(CurrencyCode),
    CONSTRAINT CK_Jobs_Employment CHECK(EmploymentType IN ('full-time','part-time','contract')),
    CONSTRAINT CK_Jobs_Experience CHECK(ExperienceLevel IN ('junior','mid','senior')),
    CONSTRAINT CK_Jobs_Salary CHECK((SalaryMin IS NULL AND SalaryMax IS NULL) OR (SalaryMin IS NOT NULL AND SalaryMax IS NOT NULL AND SalaryMin>=0 AND SalaryMax>=SalaryMin)),
    CONSTRAINT CK_Jobs_Period CHECK(SalaryPeriod IN ('hour','month','year'))
);
CREATE TABLE dbo.Internships (
    ListingId bigint NOT NULL CONSTRAINT PK_Internships PRIMARY KEY,
    ListingType varchar(16) NOT NULL CONSTRAINT DF_Internships_Type DEFAULT 'internship',
    DurationMonths tinyint NOT NULL,
    MonthlyStipend decimal(19,3) NOT NULL CONSTRAINT DF_Internships_Stipend DEFAULT 0,
    CurrencyCode char(3) NOT NULL,
    Capacity int NULL,
    ApplicationDeadline datetime2(3) NULL,
    CONSTRAINT CK_Internships_Type CHECK(ListingType='internship'),
    CONSTRAINT FK_Internships_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT FK_Internships_Currency FOREIGN KEY(CurrencyCode) REFERENCES dbo.Currencies(CurrencyCode),
    CONSTRAINT CK_Internships_Duration CHECK(DurationMonths BETWEEN 1 AND 36),
    CONSTRAINT CK_Internships_Stipend CHECK(MonthlyStipend>=0),
    CONSTRAINT CK_Internships_Capacity CHECK(Capacity>0)
);
CREATE TABLE dbo.Courses (
    ListingId bigint NOT NULL CONSTRAINT PK_Courses PRIMARY KEY,
    ListingType varchar(16) NOT NULL CONSTRAINT DF_Courses_Type DEFAULT 'course',
    InstructorUserId bigint NULL,
    InstructorName nvarchar(150) NOT NULL,
    LevelCode varchar(16) NOT NULL,
    Price decimal(19,3) NOT NULL CONSTRAINT DF_Courses_Price DEFAULT 0,
    CurrencyCode char(3) NOT NULL,
    DurationMinutes int NOT NULL,
    PracticalProject nvarchar(2000) NULL,
    CONSTRAINT CK_Courses_Type CHECK(ListingType='course'),
    CONSTRAINT FK_Courses_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT FK_Courses_Instructor FOREIGN KEY(InstructorUserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Courses_Currency FOREIGN KEY(CurrencyCode) REFERENCES dbo.Currencies(CurrencyCode),
    CONSTRAINT CK_Courses_Level CHECK(LevelCode IN ('beginner','intermediate','advanced')),
    CONSTRAINT CK_Courses_Price CHECK(Price>=0),
    CONSTRAINT CK_Courses_Duration CHECK(DurationMinutes>0)
);
CREATE TABLE dbo.Workshops (
    ListingId bigint NOT NULL CONSTRAINT PK_Workshops PRIMARY KEY,
    ListingType varchar(16) NOT NULL CONSTRAINT DF_Workshops_Type DEFAULT 'workshop',
    PresenterName nvarchar(150) NOT NULL,
    LevelCode varchar(16) NOT NULL,
    StartsAt datetime2(3) NOT NULL,
    EndsAt datetime2(3) NOT NULL,
    TimeZoneId varchar(60) NOT NULL CONSTRAINT DF_Workshops_TimeZone DEFAULT 'Asia/Amman',
    Venue nvarchar(250) NULL,
    MeetingUrl nvarchar(1000) NULL,
    Capacity int NOT NULL,
    Price decimal(19,3) NOT NULL CONSTRAINT DF_Workshops_Price DEFAULT 0,
    CurrencyCode char(3) NOT NULL,
    CONSTRAINT CK_Workshops_Type CHECK(ListingType='workshop'),
    CONSTRAINT FK_Workshops_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT FK_Workshops_Currency FOREIGN KEY(CurrencyCode) REFERENCES dbo.Currencies(CurrencyCode),
    CONSTRAINT CK_Workshops_Level CHECK(LevelCode IN ('beginner','intermediate','advanced')),
    CONSTRAINT CK_Workshops_Dates CHECK(EndsAt>StartsAt),
    CONSTRAINT CK_Workshops_Capacity CHECK(Capacity>0),
    CONSTRAINT CK_Workshops_Price CHECK(Price>=0)
);
CREATE TABLE dbo.Events (
    ListingId bigint NOT NULL CONSTRAINT PK_Events PRIMARY KEY,
    ListingType varchar(16) NOT NULL CONSTRAINT DF_Events_Type DEFAULT 'event',
    EventType varchar(16) NOT NULL,
    StartsAt datetime2(3) NOT NULL,
    EndsAt datetime2(3) NOT NULL,
    TimeZoneId varchar(60) NOT NULL CONSTRAINT DF_Events_TimeZone DEFAULT 'Asia/Amman',
    Venue nvarchar(250) NOT NULL,
    MeetingUrl nvarchar(1000) NULL,
    Capacity int NOT NULL,
    Price decimal(19,3) NOT NULL CONSTRAINT DF_Events_Price DEFAULT 0,
    CurrencyCode char(3) NOT NULL,
    CONSTRAINT CK_Events_Type CHECK(ListingType='event'),
    CONSTRAINT FK_Events_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT FK_Events_Currency FOREIGN KEY(CurrencyCode) REFERENCES dbo.Currencies(CurrencyCode),
    CONSTRAINT CK_Events_EventType CHECK(EventType IN ('meetup','talk','conference')),
    CONSTRAINT CK_Events_Dates CHECK(EndsAt>StartsAt),
    CONSTRAINT CK_Events_Capacity CHECK(Capacity>0),
    CONSTRAINT CK_Events_Price CHECK(Price>=0)
);
CREATE TABLE dbo.Applications (
    ApplicationId bigint IDENTITY NOT NULL CONSTRAINT PK_Applications PRIMARY KEY,
    ListingId bigint NOT NULL,
    ListingType varchar(16) NOT NULL,
    ApplicantUserId bigint NOT NULL,
    FullNameSnapshot nvarchar(150) NOT NULL,
    EmailSnapshot nvarchar(254) NOT NULL,
    PhoneSnapshot nvarchar(30) NULL,
    LocationSnapshot nvarchar(200) NULL,
    ExperienceYears decimal(4,1) NULL,
    CoverLetter nvarchar(4000) NOT NULL,
    PortfolioUrl nvarchar(1000) NULL,
    ResumeFileId bigint NULL,
    ResumeFileKind varchar(12) NOT NULL CONSTRAINT DF_Applications_ResumeKind DEFAULT 'pdf',
    ProposedAmount decimal(19,3) NULL,
    CurrencyCode char(3) NULL,
    Status varchar(16) NOT NULL CONSTRAINT DF_Applications_Status DEFAULT 'pending',
    ReviewedByUserId bigint NULL,
    ReviewedAt datetime2(3) NULL,
    SubmittedAt datetime2(3) NOT NULL CONSTRAINT DF_Applications_Submitted DEFAULT SYSUTCDATETIME(),
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_Applications_Updated DEFAULT SYSUTCDATETIME(),
    Version rowversion NOT NULL,
    CONSTRAINT UQ_Applications_UserListing UNIQUE(ApplicantUserId,ListingId),
    CONSTRAINT CK_Applications_Type CHECK(ListingType IN ('project','job','internship')),
    CONSTRAINT FK_Applications_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT FK_Applications_User FOREIGN KEY(ApplicantUserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Applications_Reviewer FOREIGN KEY(ReviewedByUserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Applications_Resume FOREIGN KEY(ResumeFileId,ResumeFileKind) REFERENCES dbo.Files(FileId,FileKind),
    CONSTRAINT FK_Applications_Currency FOREIGN KEY(CurrencyCode) REFERENCES dbo.Currencies(CurrencyCode),
    CONSTRAINT CK_Applications_ResumeKind CHECK(ResumeFileKind IN ('pdf','document')),
    CONSTRAINT CK_Applications_Status CHECK(Status IN ('pending','reviewing','accepted','rejected','withdrawn')),
    CONSTRAINT CK_Applications_Experience CHECK(ExperienceYears BETWEEN 0 AND 80),
    CONSTRAINT CK_Applications_Proposed CHECK((ProposedAmount IS NULL AND CurrencyCode IS NULL) OR (ListingType='project' AND ProposedAmount IS NOT NULL AND ProposedAmount>=0 AND CurrencyCode IS NOT NULL)),
    CONSTRAINT CK_Applications_Reviewed CHECK((ReviewedAt IS NULL AND ReviewedByUserId IS NULL) OR (ReviewedAt IS NOT NULL AND ReviewedByUserId IS NOT NULL))
);
CREATE INDEX IX_Applications_ListingStatus ON dbo.Applications(ListingId,Status,SubmittedAt DESC);
CREATE TABLE dbo.ApplicationStatusHistory (
    HistoryId bigint IDENTITY NOT NULL CONSTRAINT PK_ApplicationStatusHistory PRIMARY KEY,
    ApplicationId bigint NOT NULL,
    OldStatus varchar(16) NULL,
    NewStatus varchar(16) NOT NULL,
    ChangedByUserId bigint NULL,
    ChangedAt datetime2(3) NOT NULL CONSTRAINT DF_ApplicationHistory_Date DEFAULT SYSUTCDATETIME(),
    Note nvarchar(1000) NULL,
    CONSTRAINT FK_ApplicationHistory_Application FOREIGN KEY(ApplicationId) REFERENCES dbo.Applications(ApplicationId),
    CONSTRAINT FK_ApplicationHistory_User FOREIGN KEY(ChangedByUserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT CK_ApplicationHistory_Old CHECK(OldStatus IN ('pending','reviewing','accepted','rejected','withdrawn')),
    CONSTRAINT CK_ApplicationHistory_New CHECK(NewStatus IN ('pending','reviewing','accepted','rejected','withdrawn'))
);
CREATE TABLE dbo.Favorites (
    UserId bigint NOT NULL,
    ListingId bigint NOT NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Favorites_Date DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Favorites PRIMARY KEY(UserId,ListingId),
    CONSTRAINT FK_Favorites_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Favorites_Listing FOREIGN KEY(ListingId) REFERENCES dbo.Listings(ListingId)
);
CREATE TABLE dbo.Carts (
    CartId bigint IDENTITY NOT NULL CONSTRAINT PK_Carts PRIMARY KEY,
    UserId bigint NOT NULL CONSTRAINT UQ_Carts_User UNIQUE,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Carts_Date DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Carts_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId)
);
CREATE TABLE dbo.CartItems (
    CartId bigint NOT NULL,
    ListingId bigint NOT NULL,
    ListingType varchar(16) NOT NULL,
    AddedAt datetime2(3) NOT NULL CONSTRAINT DF_CartItems_Date DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CartItems PRIMARY KEY(CartId,ListingId),
    CONSTRAINT FK_CartItems_Cart FOREIGN KEY(CartId) REFERENCES dbo.Carts(CartId),
    CONSTRAINT FK_CartItems_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT CK_CartItems_Type CHECK(ListingType IN ('course','workshop','event','internship'))
);
CREATE TABLE dbo.Orders (
    OrderId bigint IDENTITY NOT NULL CONSTRAINT PK_Orders PRIMARY KEY,
    OrderNumber uniqueidentifier NOT NULL CONSTRAINT DF_Orders_Number DEFAULT NEWSEQUENTIALID(),
    UserId bigint NOT NULL,
    CurrencyCode char(3) NOT NULL,
    Status varchar(16) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT 'pending',
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Orders_Date DEFAULT SYSUTCDATETIME(),
    PaidAt datetime2(3) NULL,
    Version rowversion NOT NULL,
    CONSTRAINT UQ_Orders_Number UNIQUE(OrderNumber),
    CONSTRAINT UQ_Orders_IdCurrency UNIQUE(OrderId,CurrencyCode),
    CONSTRAINT FK_Orders_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Orders_Currency FOREIGN KEY(CurrencyCode) REFERENCES dbo.Currencies(CurrencyCode),
    CONSTRAINT CK_Orders_Status CHECK(Status IN ('pending','paid','cancelled','refunded')),
    CONSTRAINT CK_Orders_PaidAt CHECK(Status NOT IN ('paid','refunded') OR PaidAt IS NOT NULL)
);
CREATE INDEX IX_Orders_User ON dbo.Orders(UserId,CreatedAt DESC);
CREATE TABLE dbo.OrderItems (
    OrderItemId bigint IDENTITY NOT NULL CONSTRAINT PK_OrderItems PRIMARY KEY,
    OrderId bigint NOT NULL,
    ListingId bigint NOT NULL,
    ListingType varchar(16) NOT NULL,
    TitleSnapshot nvarchar(250) NOT NULL,
    UnitPrice decimal(19,3) NOT NULL,
    CurrencyCode char(3) NOT NULL,
    CONSTRAINT UQ_OrderItems_OrderListing UNIQUE(OrderId,ListingId),
    CONSTRAINT UQ_OrderItems_IdListing UNIQUE(OrderItemId,ListingId),
    CONSTRAINT FK_OrderItems_Order FOREIGN KEY(OrderId,CurrencyCode) REFERENCES dbo.Orders(OrderId,CurrencyCode),
    CONSTRAINT FK_OrderItems_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT CK_OrderItems_Type CHECK(ListingType IN ('course','workshop','event')),
    CONSTRAINT CK_OrderItems_Price CHECK(UnitPrice>=0)
);
CREATE TABLE dbo.Payments (
    PaymentId bigint IDENTITY NOT NULL CONSTRAINT PK_Payments PRIMARY KEY,
    OrderId bigint NOT NULL,
    CurrencyCode char(3) NOT NULL,
    Provider varchar(40) NOT NULL,
    ProviderReference nvarchar(150) NULL,
    IdempotencyKey uniqueidentifier NOT NULL CONSTRAINT UQ_Payments_Idempotency UNIQUE,
    Amount decimal(19,3) NOT NULL,
    Status varchar(16) NOT NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Payments_Date DEFAULT SYSUTCDATETIME(),
    ProcessedAt datetime2(3) NULL,
    CONSTRAINT FK_Payments_Order FOREIGN KEY(OrderId,CurrencyCode) REFERENCES dbo.Orders(OrderId,CurrencyCode),
    CONSTRAINT CK_Payments_Amount CHECK(Amount>=0),
    CONSTRAINT CK_Payments_Status CHECK(Status IN ('pending','succeeded','failed','refunded'))
);
CREATE UNIQUE INDEX UX_Payments_ProviderReference ON dbo.Payments(Provider,ProviderReference) WHERE ProviderReference IS NOT NULL;
CREATE TABLE dbo.CourseEnrollments (
    EnrollmentId bigint IDENTITY NOT NULL CONSTRAINT PK_CourseEnrollments PRIMARY KEY,
    UserId bigint NOT NULL,
    CourseId bigint NOT NULL,
    OrderItemId bigint NULL,
    Status varchar(16) NOT NULL CONSTRAINT DF_Enrollments_Status DEFAULT 'active',
    EnrolledAt datetime2(3) NOT NULL CONSTRAINT DF_Enrollments_Date DEFAULT SYSUTCDATETIME(),
    CompletedAt datetime2(3) NULL,
    CONSTRAINT UQ_Enrollments_UserCourse UNIQUE(UserId,CourseId),
    CONSTRAINT UQ_Enrollments_IdCourse UNIQUE(EnrollmentId,CourseId),
    CONSTRAINT FK_Enrollments_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Enrollments_Course FOREIGN KEY(CourseId) REFERENCES dbo.Courses(ListingId),
    CONSTRAINT FK_Enrollments_OrderItem FOREIGN KEY(OrderItemId,CourseId) REFERENCES dbo.OrderItems(OrderItemId,ListingId),
    CONSTRAINT CK_Enrollments_Status CHECK(Status IN ('active','completed','cancelled')),
    CONSTRAINT CK_Enrollments_Completed CHECK(Status<>'completed' OR CompletedAt IS NOT NULL)
);
CREATE TABLE dbo.Lessons (
    LessonId bigint IDENTITY NOT NULL CONSTRAINT PK_Lessons PRIMARY KEY,
    CourseId bigint NOT NULL,
    Title nvarchar(250) NOT NULL,
    Body nvarchar(max) NULL,
    VideoUrl nvarchar(1000) NULL,
    DurationSeconds int NOT NULL CONSTRAINT DF_Lessons_Duration DEFAULT 0,
    SortOrder int NOT NULL,
    IsPreview bit NOT NULL CONSTRAINT DF_Lessons_Preview DEFAULT 0,
    CONSTRAINT UQ_Lessons_IdCourse UNIQUE(LessonId,CourseId),
    CONSTRAINT UQ_Lessons_Order UNIQUE(CourseId,SortOrder),
    CONSTRAINT FK_Lessons_Course FOREIGN KEY(CourseId) REFERENCES dbo.Courses(ListingId),
    CONSTRAINT CK_Lessons_Order CHECK(SortOrder>=0),
    CONSTRAINT CK_Lessons_Duration CHECK(DurationSeconds>=0)
);
CREATE TABLE dbo.LessonProgress (
    EnrollmentId bigint NOT NULL,
    LessonId bigint NOT NULL,
    CourseId bigint NOT NULL,
    IsCompleted bit NOT NULL CONSTRAINT DF_LessonProgress_Completed DEFAULT 0,
    PlaybackSeconds int NOT NULL CONSTRAINT DF_LessonProgress_Playback DEFAULT 0,
    Notes nvarchar(3000) NULL,
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_LessonProgress_Updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_LessonProgress PRIMARY KEY(EnrollmentId,LessonId),
    CONSTRAINT FK_LessonProgress_Enrollment FOREIGN KEY(EnrollmentId,CourseId) REFERENCES dbo.CourseEnrollments(EnrollmentId,CourseId),
    CONSTRAINT FK_LessonProgress_Lesson FOREIGN KEY(LessonId,CourseId) REFERENCES dbo.Lessons(LessonId,CourseId),
    CONSTRAINT CK_LessonProgress_Playback CHECK(PlaybackSeconds>=0)
);
CREATE TABLE dbo.Registrations (
    RegistrationId bigint IDENTITY NOT NULL CONSTRAINT PK_Registrations PRIMARY KEY,
    UserId bigint NOT NULL,
    ListingId bigint NOT NULL,
    ListingType varchar(16) NOT NULL,
    OrderItemId bigint NULL,
    Status varchar(16) NOT NULL CONSTRAINT DF_Registrations_Status DEFAULT 'pending',
    RegisteredAt datetime2(3) NOT NULL CONSTRAINT DF_Registrations_Date DEFAULT SYSUTCDATETIME(),
    AttendedAt datetime2(3) NULL,
    CONSTRAINT UQ_Registrations_UserListing UNIQUE(UserId,ListingId),
    CONSTRAINT FK_Registrations_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Registrations_Listing FOREIGN KEY(ListingId,ListingType) REFERENCES dbo.Listings(ListingId,ListingType),
    CONSTRAINT FK_Registrations_OrderItem FOREIGN KEY(OrderItemId,ListingId) REFERENCES dbo.OrderItems(OrderItemId,ListingId),
    CONSTRAINT CK_Registrations_Type CHECK(ListingType IN ('workshop','event')),
    CONSTRAINT CK_Registrations_Status CHECK(Status IN ('pending','confirmed','waitlisted','cancelled','attended')),
    CONSTRAINT CK_Registrations_Attended CHECK(Status<>'attended' OR AttendedAt IS NOT NULL)
);
CREATE INDEX IX_Registrations_Listing ON dbo.Registrations(ListingId,Status);
CREATE TABLE dbo.Conversations (
    ConversationId bigint IDENTITY NOT NULL CONSTRAINT PK_Conversations PRIMARY KEY,
    Subject nvarchar(250) NULL,
    RelatedListingId bigint NULL,
    CreatedByUserId bigint NOT NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Conversations_Date DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Conversations_Listing FOREIGN KEY(RelatedListingId) REFERENCES dbo.Listings(ListingId),
    CONSTRAINT FK_Conversations_Creator FOREIGN KEY(CreatedByUserId) REFERENCES dbo.Users(UserId)
);
CREATE TABLE dbo.ConversationParticipants (
    ConversationId bigint NOT NULL,
    UserId bigint NOT NULL,
    JoinedAt datetime2(3) NOT NULL CONSTRAINT DF_ConversationParticipants_Date DEFAULT SYSUTCDATETIME(),
    LeftAt datetime2(3) NULL,
    LastReadAt datetime2(3) NULL,
    CONSTRAINT PK_ConversationParticipants PRIMARY KEY(ConversationId,UserId),
    CONSTRAINT FK_ConversationParticipants_Conversation FOREIGN KEY(ConversationId) REFERENCES dbo.Conversations(ConversationId),
    CONSTRAINT FK_ConversationParticipants_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId)
);
CREATE TABLE dbo.Messages (
    MessageId bigint IDENTITY NOT NULL CONSTRAINT PK_Messages PRIMARY KEY,
    ConversationId bigint NOT NULL,
    SenderUserId bigint NOT NULL,
    Body nvarchar(4000) NOT NULL,
    SentAt datetime2(3) NOT NULL CONSTRAINT DF_Messages_Date DEFAULT SYSUTCDATETIME(),
    DeletedAt datetime2(3) NULL,
    CONSTRAINT FK_Messages_Participant FOREIGN KEY(ConversationId,SenderUserId) REFERENCES dbo.ConversationParticipants(ConversationId,UserId),
    CONSTRAINT CK_Messages_Body CHECK(LEN(LTRIM(RTRIM(Body)))>0)
);
CREATE INDEX IX_Messages_Conversation ON dbo.Messages(ConversationId,SentAt DESC,MessageId DESC);
CREATE TABLE dbo.MessageAttachments (
    MessageId bigint NOT NULL,
    FileId bigint NOT NULL,
    CONSTRAINT PK_MessageAttachments PRIMARY KEY(MessageId,FileId),
    CONSTRAINT FK_MessageAttachments_Message FOREIGN KEY(MessageId) REFERENCES dbo.Messages(MessageId),
    CONSTRAINT FK_MessageAttachments_File FOREIGN KEY(FileId) REFERENCES dbo.Files(FileId)
);
CREATE TABLE dbo.Notifications (
    NotificationId bigint IDENTITY NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY,
    UserId bigint NOT NULL,
    TypeCode varchar(40) NOT NULL,
    Title nvarchar(200) NOT NULL,
    Body nvarchar(2000) NULL,
    RelatedListingId bigint NULL,
    RelatedConversationId bigint NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Notifications_Date DEFAULT SYSUTCDATETIME(),
    ReadAt datetime2(3) NULL,
    CONSTRAINT FK_Notifications_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Notifications_Listing FOREIGN KEY(RelatedListingId) REFERENCES dbo.Listings(ListingId),
    CONSTRAINT FK_Notifications_Conversation FOREIGN KEY(RelatedConversationId) REFERENCES dbo.Conversations(ConversationId)
);
CREATE INDEX IX_Notifications_User ON dbo.Notifications(UserId,ReadAt,CreatedAt DESC);
CREATE TABLE dbo.UserSettings (
    UserId bigint NOT NULL CONSTRAINT PK_UserSettings PRIMARY KEY,
    Theme varchar(8) NOT NULL CONSTRAINT DF_UserSettings_Theme DEFAULT 'light',
    ProjectNotifications bit NOT NULL CONSTRAINT DF_UserSettings_Project DEFAULT 1,
    CourseNotifications bit NOT NULL CONSTRAINT DF_UserSettings_Course DEFAULT 1,
    CommunityNotifications bit NOT NULL CONSTRAINT DF_UserSettings_Community DEFAULT 0,
    CONSTRAINT FK_UserSettings_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT CK_UserSettings_Theme CHECK(Theme IN ('light','dark','system'))
);
CREATE TABLE dbo.Comments (
    CommentId bigint IDENTITY NOT NULL CONSTRAINT PK_Comments PRIMARY KEY,
    ListingId bigint NOT NULL,
    UserId bigint NOT NULL,
    ParentCommentId bigint NULL,
    Body nvarchar(3000) NOT NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_Comments_Date DEFAULT SYSUTCDATETIME(),
    DeletedAt datetime2(3) NULL,
    CONSTRAINT UQ_Comments_IdListing UNIQUE(CommentId,ListingId),
    CONSTRAINT FK_Comments_Listing FOREIGN KEY(ListingId) REFERENCES dbo.Listings(ListingId),
    CONSTRAINT FK_Comments_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Comments_Parent FOREIGN KEY(ParentCommentId,ListingId) REFERENCES dbo.Comments(CommentId,ListingId),
    CONSTRAINT CK_Comments_Parent CHECK(ParentCommentId IS NULL OR ParentCommentId<>CommentId),
    CONSTRAINT CK_Comments_Body CHECK(LEN(LTRIM(RTRIM(Body)))>0)
);
CREATE INDEX IX_Comments_Listing ON dbo.Comments(ListingId,CreatedAt DESC);
CREATE TABLE dbo.AuditLogs (
    AuditLogId bigint IDENTITY NOT NULL CONSTRAINT PK_AuditLogs PRIMARY KEY,
    ActorUserId bigint NULL,
    ActionCode varchar(40) NOT NULL,
    EntityName varchar(80) NOT NULL,
    EntityId nvarchar(100) NOT NULL,
    Details nvarchar(4000) NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_AuditLogs_Date DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_AuditLogs_Actor FOREIGN KEY(ActorUserId) REFERENCES dbo.Users(UserId)
);
CREATE INDEX IX_AuditLogs_Entity ON dbo.AuditLogs(EntityName,EntityId,CreatedAt DESC);

INSERT dbo.SchemaVersions(VersionNumber) VALUES(1);
COMMIT;
PRINT N'Masterpiece schema version 1 installed successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK;
    THROW;
END CATCH;
GO
