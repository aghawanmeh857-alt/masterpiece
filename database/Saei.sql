CREATE TABLE Users (
    Id INT PRIMARY KEY,
    FullName NVARCHAR(150),
    Email NVARCHAR(254),
    PasswordHash NVARCHAR(512),
    Phone NVARCHAR(30),
    Role NVARCHAR(20),
    ProfessionalTitle NVARCHAR(150),
    Bio NVARCHAR(MAX),
    City NVARCHAR(100),
    ProfileImageUrl NVARCHAR(1000),
    ResumeUrl NVARCHAR(1000),
    CertificatesUrl NVARCHAR(1000),
    PortfolioUrl NVARCHAR(1000),
    Skills NVARCHAR(1000),
    CreatedAt DATETIME
);

CREATE TABLE Companies (
    Id INT PRIMARY KEY,
    OwnerUserId INT REFERENCES Users(Id),
    Name NVARCHAR(200),
    Description NVARCHAR(MAX),
    LogoUrl NVARCHAR(1000),
    Email NVARCHAR(254),
    Phone NVARCHAR(30),
    WebsiteUrl NVARCHAR(1000),
    Address NVARCHAR(300)
);

CREATE TABLE Courses (
    Id INT PRIMARY KEY,
    AdminUserId INT REFERENCES Users(Id),
    Title NVARCHAR(250),
    Description NVARCHAR(MAX),
    ImageUrl NVARCHAR(1000),
    DetailsPdfUrl NVARCHAR(1000),
    Price DECIMAL(10,2),
    Category NVARCHAR(100),
    Skills NVARCHAR(1000),
    InstructorName NVARCHAR(150),
    Level NVARCHAR(50),
    DurationMinutes INT,
    CreatedAt DATETIME
);

CREATE TABLE CourseLessons (
    Id INT PRIMARY KEY,
    CourseId INT REFERENCES Courses(Id),
    Title NVARCHAR(250),
    Content NVARCHAR(MAX),
    VideoUrl NVARCHAR(1000),
    AttachmentUrl NVARCHAR(1000),
    SortOrder INT,
    DurationMinutes INT
);

CREATE TABLE Projects (
    Id INT PRIMARY KEY,
    OwnerUserId INT REFERENCES Users(Id),
    Title NVARCHAR(250),
    Description NVARCHAR(MAX),
    Requirements NVARCHAR(MAX),
    ImageUrl NVARCHAR(1000),
    DetailsPdfUrl NVARCHAR(1000),
    Category NVARCHAR(100),
    Skills NVARCHAR(1000),
    Budget DECIMAL(10,2),
    DurationDays INT,
    Deadline DATETIME,
    Status NVARCHAR(50),
    CreatedAt DATETIME
);

CREATE TABLE Jobs (
    Id INT PRIMARY KEY,
    CompanyId INT REFERENCES Companies(Id),
    Title NVARCHAR(250),
    Description NVARCHAR(MAX),
    Requirements NVARCHAR(MAX),
    ImageUrl NVARCHAR(1000),
    DetailsPdfUrl NVARCHAR(1000),
    Category NVARCHAR(100),
    Skills NVARCHAR(1000),
    WorkMode NVARCHAR(50),
    EmploymentType NVARCHAR(50),
    ExperienceLevel NVARCHAR(50),
    Location NVARCHAR(200),
    Salary DECIMAL(10,2),
    Deadline DATETIME,
    Status NVARCHAR(50),
    CreatedAt DATETIME
);

CREATE TABLE Internships (
    Id INT PRIMARY KEY,
    CompanyId INT REFERENCES Companies(Id),
    Title NVARCHAR(250),
    Description NVARCHAR(MAX),
    Requirements NVARCHAR(MAX),
    ImageUrl NVARCHAR(1000),
    DetailsPdfUrl NVARCHAR(1000),
    Category NVARCHAR(100),
    Skills NVARCHAR(1000),
    WorkMode NVARCHAR(50),
    Location NVARCHAR(200),
    DurationMonths INT,
    Price DECIMAL(10,2),
    MonthlyStipend DECIMAL(10,2),
    Deadline DATETIME,
    Status NVARCHAR(50),
    CreatedAt DATETIME
);

CREATE TABLE Events (
    Id INT PRIMARY KEY,
    AdminUserId INT REFERENCES Users(Id),
    Title NVARCHAR(250),
    Description NVARCHAR(MAX),
    ImageUrl NVARCHAR(1000),
    DetailsPdfUrl NVARCHAR(1000),
    Category NVARCHAR(100),
    Location NVARCHAR(250),
    MeetingUrl NVARCHAR(1000),
    StartsAt DATETIME,
    EndsAt DATETIME,
    Price DECIMAL(10,2),
    Capacity INT,
    CreatedAt DATETIME
);

CREATE TABLE Workshops (
    Id INT PRIMARY KEY,
    AdminUserId INT REFERENCES Users(Id),
    Title NVARCHAR(250),
    Description NVARCHAR(MAX),
    ImageUrl NVARCHAR(1000),
    DetailsPdfUrl NVARCHAR(1000),
    Category NVARCHAR(100),
    Skills NVARCHAR(1000),
    PresenterName NVARCHAR(150),
    Location NVARCHAR(250),
    MeetingUrl NVARCHAR(1000),
    StartsAt DATETIME,
    EndsAt DATETIME,
    Price DECIMAL(10,2),
    Capacity INT,
    CreatedAt DATETIME
);

CREATE TABLE Orders (
    Id INT PRIMARY KEY,
    UserId INT REFERENCES Users(Id),
    TotalAmount DECIMAL(10,2),
    Status NVARCHAR(50),
    CreatedAt DATETIME
);

CREATE TABLE OrderItems (
    Id INT PRIMARY KEY,
    OrderId INT REFERENCES Orders(Id),
    CourseId INT REFERENCES Courses(Id),
    WorkshopId INT REFERENCES Workshops(Id),
    EventId INT REFERENCES Events(Id),
    InternshipId INT REFERENCES Internships(Id),
    Title NVARCHAR(250),
    Price DECIMAL(10,2)
);

CREATE TABLE Payments (
    Id INT PRIMARY KEY,
    OrderId INT REFERENCES Orders(Id),
    Amount DECIMAL(10,2),
    PaymentMethod NVARCHAR(50),
    TransactionReference NVARCHAR(200),
    Status NVARCHAR(50),
    PaidAt DATETIME
);

CREATE TABLE CourseEnrollments (
    Id INT PRIMARY KEY,
    UserId INT REFERENCES Users(Id),
    CourseId INT REFERENCES Courses(Id),
    OrderItemId INT REFERENCES OrderItems(Id),
    Status NVARCHAR(50),
    EnrolledAt DATETIME,
    CompletedAt DATETIME
);

CREATE TABLE LessonProgress (
    Id INT PRIMARY KEY,
    EnrollmentId INT REFERENCES CourseEnrollments(Id),
    LessonId INT REFERENCES CourseLessons(Id),
    IsCompleted BIT,
    PlaybackSeconds INT,
    Notes NVARCHAR(MAX),
    UpdatedAt DATETIME
);

CREATE TABLE ProjectApplications (
    Id INT PRIMARY KEY,
    ProjectId INT REFERENCES Projects(Id),
    UserId INT REFERENCES Users(Id),
    FullName NVARCHAR(150),
    Email NVARCHAR(254),
    Phone NVARCHAR(30),
    CoverLetter NVARCHAR(MAX),
    Experience NVARCHAR(MAX),
    PortfolioUrl NVARCHAR(1000),
    ResumeUrl NVARCHAR(1000),
    ProposedAmount DECIMAL(10,2),
    Status NVARCHAR(50),
    AppliedAt DATETIME
);

CREATE TABLE JobApplications (
    Id INT PRIMARY KEY,
    JobId INT REFERENCES Jobs(Id),
    UserId INT REFERENCES Users(Id),
    FullName NVARCHAR(150),
    Email NVARCHAR(254),
    Phone NVARCHAR(30),
    Location NVARCHAR(200),
    ExperienceYears INT,
    CoverLetter NVARCHAR(MAX),
    PortfolioUrl NVARCHAR(1000),
    ResumeUrl NVARCHAR(1000),
    Status NVARCHAR(50),
    AppliedAt DATETIME
);

CREATE TABLE InternshipApplications (
    Id INT PRIMARY KEY,
    InternshipId INT REFERENCES Internships(Id),
    UserId INT REFERENCES Users(Id),
    OrderItemId INT REFERENCES OrderItems(Id),
    FullName NVARCHAR(150),
    Email NVARCHAR(254),
    Phone NVARCHAR(30),
    CoverLetter NVARCHAR(MAX),
    ResumeUrl NVARCHAR(1000),
    Status NVARCHAR(50),
    AppliedAt DATETIME
);

CREATE TABLE Registrations (
    Id INT PRIMARY KEY,
    UserId INT REFERENCES Users(Id),
    WorkshopId INT REFERENCES Workshops(Id),
    EventId INT REFERENCES Events(Id),
    OrderItemId INT REFERENCES OrderItems(Id),
    Status NVARCHAR(50),
    RegisteredAt DATETIME
);

CREATE TABLE CartItems (
    Id INT PRIMARY KEY,
    UserId INT REFERENCES Users(Id),
    CourseId INT REFERENCES Courses(Id),
    WorkshopId INT REFERENCES Workshops(Id),
    EventId INT REFERENCES Events(Id),
    InternshipId INT REFERENCES Internships(Id),
    AddedAt DATETIME
);

CREATE TABLE Favorites (
    Id INT PRIMARY KEY,
    UserId INT REFERENCES Users(Id),
    CourseId INT REFERENCES Courses(Id),
    ProjectId INT REFERENCES Projects(Id),
    JobId INT REFERENCES Jobs(Id),
    InternshipId INT REFERENCES Internships(Id),
    EventId INT REFERENCES Events(Id),
    WorkshopId INT REFERENCES Workshops(Id),
    AddedAt DATETIME
);

CREATE TABLE Conversations (
    Id INT PRIMARY KEY,
    FirstUserId INT REFERENCES Users(Id),
    SecondUserId INT REFERENCES Users(Id),
    ProjectId INT REFERENCES Projects(Id),
    CreatedAt DATETIME
);

CREATE TABLE Messages (
    Id INT PRIMARY KEY,
    ConversationId INT REFERENCES Conversations(Id),
    SenderUserId INT REFERENCES Users(Id),
    Body NVARCHAR(MAX),
    AttachmentUrl NVARCHAR(1000),
    MessageType NVARCHAR(50),
    CallStatus NVARCHAR(50),
    CallDurationSeconds INT,
    SentAt DATETIME,
    ReadAt DATETIME
);
