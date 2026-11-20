CREATE TABLE UserDocuments (
    Id INT PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    DocumentType NVARCHAR(50),
    FileName NVARCHAR(250),
    FileUrl NVARCHAR(1000),
    FileType NVARCHAR(100),
    FileSizeBytes INT,
    UploadedAt DATETIME,

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id)
);


CREATE TABLE Companies (
    Id INT PRIMARY KEY,
    OwnerUserId NVARCHAR(450) NOT NULL,
    Name NVARCHAR(200),
    Description NVARCHAR(MAX),
    LogoUrl NVARCHAR(1000),
    Email NVARCHAR(254),
    Phone NVARCHAR(30),
    WebsiteUrl NVARCHAR(1000),
    Address NVARCHAR(300),

    FOREIGN KEY (OwnerUserId)
        REFERENCES AspNetUsers(Id)
);


CREATE TABLE Courses (
    Id INT PRIMARY KEY,
    AdminUserId NVARCHAR(450),
    CompanyId INT,
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
    Capacity INT,
    Status NVARCHAR(50),
    CreatedAt DATETIME,

    FOREIGN KEY (AdminUserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (CompanyId)
        REFERENCES Companies(Id)
);


CREATE TABLE CourseLessons (
    Id INT PRIMARY KEY,
    CourseId INT NOT NULL,
    Title NVARCHAR(250),
    Content NVARCHAR(MAX),
    VideoUrl NVARCHAR(1000),
    AttachmentUrl NVARCHAR(1000),
    SortOrder INT,
    DurationMinutes INT,

    FOREIGN KEY (CourseId)
        REFERENCES Courses(Id)
);


CREATE TABLE Projects (
    Id INT PRIMARY KEY,
    OwnerUserId NVARCHAR(450) NOT NULL,
    Title NVARCHAR(250),
    Description NVARCHAR(MAX),
    Requirements NVARCHAR(MAX),
    ImageUrl NVARCHAR(1000),
    DetailsPdfUrl NVARCHAR(1000),
    Category NVARCHAR(100),
    ProjectType NVARCHAR(50),
    Skills NVARCHAR(1000),
    Budget DECIMAL(10,2),
    DurationDays INT,
    Deadline DATETIME,
    Status NVARCHAR(50),
    CreatedAt DATETIME,

    FOREIGN KEY (OwnerUserId)
        REFERENCES AspNetUsers(Id)
);


CREATE TABLE Jobs (
    Id INT PRIMARY KEY,
    CompanyId INT NOT NULL,
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
    CreatedAt DATETIME,

    FOREIGN KEY (CompanyId)
        REFERENCES Companies(Id)
);


CREATE TABLE Internships (
    Id INT PRIMARY KEY,
    CompanyId INT NOT NULL,
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
    CreatedAt DATETIME,

    FOREIGN KEY (CompanyId)
        REFERENCES Companies(Id)
);


CREATE TABLE Events (
    Id INT PRIMARY KEY,
    AdminUserId NVARCHAR(450),
    CompanyId INT,
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
    Status NVARCHAR(50),
    CreatedAt DATETIME,

    FOREIGN KEY (AdminUserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (CompanyId)
        REFERENCES Companies(Id)
);


CREATE TABLE Orders (
    Id INT PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    TotalAmount DECIMAL(10,2),
    Status NVARCHAR(50),
    CreatedAt DATETIME,

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id)
);


CREATE TABLE OrderItems (
    Id INT PRIMARY KEY,
    OrderId INT NOT NULL,
    CourseId INT,
    EventId INT,
    InternshipId INT,
    Title NVARCHAR(250),
    Price DECIMAL(10,2),

    FOREIGN KEY (OrderId)
        REFERENCES Orders(Id),

    FOREIGN KEY (CourseId)
        REFERENCES Courses(Id),

    FOREIGN KEY (EventId)
        REFERENCES Events(Id),

    FOREIGN KEY (InternshipId)
        REFERENCES Internships(Id)
);


CREATE TABLE Payments (
    Id INT PRIMARY KEY,
    OrderId INT NOT NULL,
    Amount DECIMAL(10,2),
    PaymentMethod NVARCHAR(50),
    TransactionReference NVARCHAR(200),
    Status NVARCHAR(50),
    PaidAt DATETIME,

    FOREIGN KEY (OrderId)
        REFERENCES Orders(Id)
);


CREATE TABLE CourseEnrollments (
    Id INT PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    CourseId INT NOT NULL,
    OrderItemId INT,
    Status NVARCHAR(50),
    EnrolledAt DATETIME,
    CompletedAt DATETIME,

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (CourseId)
        REFERENCES Courses(Id),

    FOREIGN KEY (OrderItemId)
        REFERENCES OrderItems(Id),

    UNIQUE (UserId, CourseId)
);


CREATE TABLE LessonProgress (
    Id INT PRIMARY KEY,
    EnrollmentId INT NOT NULL,
    LessonId INT NOT NULL,
    IsCompleted BIT,
    PlaybackSeconds INT,
    Notes NVARCHAR(MAX),
    UpdatedAt DATETIME,

    FOREIGN KEY (EnrollmentId)
        REFERENCES CourseEnrollments(Id),

    FOREIGN KEY (LessonId)
        REFERENCES CourseLessons(Id),

    UNIQUE (EnrollmentId, LessonId)
);


CREATE TABLE ProjectApplications (
    Id INT PRIMARY KEY,
    ProjectId INT NOT NULL,
    UserId NVARCHAR(450) NOT NULL,
    FullName NVARCHAR(150),
    Email NVARCHAR(254),
    Phone NVARCHAR(30),
    CoverLetter NVARCHAR(MAX),
    Experience NVARCHAR(MAX),
    PortfolioUrl NVARCHAR(1000),
    ResumeUrl NVARCHAR(1000),
    ProposedAmount DECIMAL(10,2),
    Status NVARCHAR(50),
    ReviewedByUserId NVARCHAR(450),
    ReviewedAt DATETIME,
    AppliedAt DATETIME,

    FOREIGN KEY (ProjectId)
        REFERENCES Projects(Id),

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (ReviewedByUserId)
        REFERENCES AspNetUsers(Id),

    UNIQUE (UserId, ProjectId)
);


CREATE TABLE JobApplications (
    Id INT PRIMARY KEY,
    JobId INT NOT NULL,
    UserId NVARCHAR(450) NOT NULL,
    FullName NVARCHAR(150),
    Email NVARCHAR(254),
    Phone NVARCHAR(30),
    Location NVARCHAR(200),
    ExperienceYears DECIMAL(4,1),
    CoverLetter NVARCHAR(MAX),
    PortfolioUrl NVARCHAR(1000),
    ResumeUrl NVARCHAR(1000),
    Status NVARCHAR(50),
    ReviewedByUserId NVARCHAR(450),
    ReviewedAt DATETIME,
    AppliedAt DATETIME,

    FOREIGN KEY (JobId)
        REFERENCES Jobs(Id),

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (ReviewedByUserId)
        REFERENCES AspNetUsers(Id),

    UNIQUE (UserId, JobId)
);


CREATE TABLE InternshipApplications (
    Id INT PRIMARY KEY,
    InternshipId INT NOT NULL,
    UserId NVARCHAR(450) NOT NULL,
    OrderItemId INT,
    FullName NVARCHAR(150),
    Email NVARCHAR(254),
    Phone NVARCHAR(30),
    CoverLetter NVARCHAR(MAX),
    Experience NVARCHAR(MAX),
    PortfolioUrl NVARCHAR(1000),
    ResumeUrl NVARCHAR(1000),
    Status NVARCHAR(50),
    ReviewedByUserId NVARCHAR(450),
    ReviewedAt DATETIME,
    AppliedAt DATETIME,

    FOREIGN KEY (InternshipId)
        REFERENCES Internships(Id),

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (OrderItemId)
        REFERENCES OrderItems(Id),

    FOREIGN KEY (ReviewedByUserId)
        REFERENCES AspNetUsers(Id),

    UNIQUE (UserId, InternshipId)
);


CREATE TABLE Registrations (
    Id INT PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    EventId INT NOT NULL,
    OrderItemId INT,
    Status NVARCHAR(50),
    RegisteredAt DATETIME,

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (EventId)
        REFERENCES Events(Id),

    FOREIGN KEY (OrderItemId)
        REFERENCES OrderItems(Id),

    UNIQUE (UserId, EventId)
);


CREATE TABLE CartItems (
    Id INT PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    CourseId INT,
    EventId INT,
    InternshipId INT,
    AddedAt DATETIME,

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (CourseId)
        REFERENCES Courses(Id),

    FOREIGN KEY (EventId)
        REFERENCES Events(Id),

    FOREIGN KEY (InternshipId)
        REFERENCES Internships(Id)
);


CREATE TABLE Favorites (
    Id INT PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    CourseId INT,
    ProjectId INT,
    JobId INT,
    InternshipId INT,
    EventId INT,
    AddedAt DATETIME,

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (CourseId)
        REFERENCES Courses(Id),

    FOREIGN KEY (ProjectId)
        REFERENCES Projects(Id),

    FOREIGN KEY (JobId)
        REFERENCES Jobs(Id),

    FOREIGN KEY (InternshipId)
        REFERENCES Internships(Id),

    FOREIGN KEY (EventId)
        REFERENCES Events(Id)
);


CREATE TABLE Conversations (
    Id INT PRIMARY KEY,
    FirstUserId NVARCHAR(450) NOT NULL,
    SecondUserId NVARCHAR(450) NOT NULL,
    ProjectId INT,
    CreatedAt DATETIME,

    FOREIGN KEY (FirstUserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (SecondUserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (ProjectId)
        REFERENCES Projects(Id)
);


CREATE TABLE Messages (
    Id INT PRIMARY KEY,
    ConversationId INT NOT NULL,
    SenderUserId NVARCHAR(450) NOT NULL,
    Body NVARCHAR(MAX),
    AttachmentUrl NVARCHAR(1000),
    MessageType NVARCHAR(50),
    CallStatus NVARCHAR(50),
    CallRoomUrl NVARCHAR(1000),
    CallDurationSeconds INT,
    SentAt DATETIME,
    ReadAt DATETIME,

    FOREIGN KEY (ConversationId)
        REFERENCES Conversations(Id),

    FOREIGN KEY (SenderUserId)
        REFERENCES AspNetUsers(Id)
);


CREATE TABLE Follows (
    Id INT PRIMARY KEY,
    FollowerUserId NVARCHAR(450) NOT NULL,
    FollowedUserId NVARCHAR(450) NOT NULL,
    CreatedAt DATETIME,

    FOREIGN KEY (FollowerUserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (FollowedUserId)
        REFERENCES AspNetUsers(Id),

    UNIQUE (FollowerUserId, FollowedUserId)
);

CREATE TABLE UserActivities (
    Id INT PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    ActorUserId NVARCHAR(450),
    ActivityType NVARCHAR(50),
    Title NVARCHAR(250),
    Description NVARCHAR(MAX),
    PreviousStatus NVARCHAR(50),
    NewStatus NVARCHAR(50),
    ProjectId INT,
    JobId INT,
    InternshipId INT,
    CourseId INT,
    EventId INT,
    LessonId INT,
    ProjectApplicationId INT,
    JobApplicationId INT,
    InternshipApplicationId INT,
    EnrollmentId INT,
    RegistrationId INT,
    OrderId INT,
    ConversationId INT,
    CreatedAt DATETIME,

    FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (ActorUserId)
        REFERENCES AspNetUsers(Id),

    FOREIGN KEY (ProjectId)
        REFERENCES Projects(Id),

    FOREIGN KEY (JobId)
        REFERENCES Jobs(Id),

    FOREIGN KEY (InternshipId)
        REFERENCES Internships(Id),

    FOREIGN KEY (CourseId)
        REFERENCES Courses(Id),

    FOREIGN KEY (EventId)
        REFERENCES Events(Id),

    FOREIGN KEY (LessonId)
        REFERENCES CourseLessons(Id),

    FOREIGN KEY (ProjectApplicationId)
        REFERENCES ProjectApplications(Id),

    FOREIGN KEY (JobApplicationId)
        REFERENCES JobApplications(Id),

    FOREIGN KEY (InternshipApplicationId)
        REFERENCES InternshipApplications(Id),

    FOREIGN KEY (EnrollmentId)
        REFERENCES CourseEnrollments(Id),

    FOREIGN KEY (RegistrationId)
        REFERENCES Registrations(Id),

    FOREIGN KEY (OrderId)
        REFERENCES Orders(Id),

    FOREIGN KEY (ConversationId)
        REFERENCES Conversations(Id)
);
