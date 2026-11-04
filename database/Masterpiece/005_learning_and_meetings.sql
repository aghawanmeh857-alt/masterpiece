USE [Masterpiece];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;
GO
IF NOT EXISTS(SELECT 1 FROM dbo.SchemaVersions WHERE VersionNumber=2)
BEGIN
 BEGIN TRY
 BEGIN TRANSACTION;
 CREATE TABLE dbo.CourseQuizzes (
    QuizId bigint IDENTITY NOT NULL CONSTRAINT PK_CourseQuizzes PRIMARY KEY,
    CourseId bigint NOT NULL,
    Title nvarchar(200) NOT NULL,
    PassingPercent decimal(5,2) NOT NULL CONSTRAINT DF_Quizzes_Passing DEFAULT 70,
    MaxAttempts int NOT NULL CONSTRAINT DF_Quizzes_Attempts DEFAULT 3,
    CONSTRAINT UQ_Quizzes_IdCourse UNIQUE(QuizId,CourseId),
    CONSTRAINT FK_Quizzes_Course FOREIGN KEY(CourseId) REFERENCES dbo.Courses(ListingId),
    CONSTRAINT CK_Quizzes_Passing CHECK(PassingPercent BETWEEN 0 AND 100),
    CONSTRAINT CK_Quizzes_Attempts CHECK(MaxAttempts>0)
 );
 CREATE TABLE dbo.QuizQuestions (
    QuestionId bigint IDENTITY NOT NULL CONSTRAINT PK_QuizQuestions PRIMARY KEY,
    QuizId bigint NOT NULL,
    Prompt nvarchar(2000) NOT NULL,
    Explanation nvarchar(2000) NULL,
    Points decimal(8,2) NOT NULL CONSTRAINT DF_QuizQuestions_Points DEFAULT 1,
    SortOrder int NOT NULL,
    CONSTRAINT UQ_QuizQuestions_IdQuiz UNIQUE(QuestionId,QuizId),
    CONSTRAINT UQ_QuizQuestions_Order UNIQUE(QuizId,SortOrder),
    CONSTRAINT FK_QuizQuestions_Quiz FOREIGN KEY(QuizId) REFERENCES dbo.CourseQuizzes(QuizId),
    CONSTRAINT CK_QuizQuestions_Points CHECK(Points>0),
    CONSTRAINT CK_QuizQuestions_Order CHECK(SortOrder>=0)
 );
 CREATE TABLE dbo.QuizChoices (
    ChoiceId bigint IDENTITY NOT NULL CONSTRAINT PK_QuizChoices PRIMARY KEY,
    QuestionId bigint NOT NULL,
    Body nvarchar(1000) NOT NULL,
    IsCorrect bit NOT NULL CONSTRAINT DF_QuizChoices_Correct DEFAULT 0,
    SortOrder int NOT NULL,
    CONSTRAINT UQ_QuizChoices_IdQuestion UNIQUE(ChoiceId,QuestionId),
    CONSTRAINT UQ_QuizChoices_Order UNIQUE(QuestionId,SortOrder),
    CONSTRAINT FK_QuizChoices_Question FOREIGN KEY(QuestionId) REFERENCES dbo.QuizQuestions(QuestionId),
    CONSTRAINT CK_QuizChoices_Order CHECK(SortOrder>=0)
 );
 CREATE UNIQUE INDEX UX_QuizChoices_Correct ON dbo.QuizChoices(QuestionId) WHERE IsCorrect=1;
 CREATE TABLE dbo.QuizAttempts (
    AttemptId bigint IDENTITY NOT NULL CONSTRAINT PK_QuizAttempts PRIMARY KEY,
    EnrollmentId bigint NOT NULL,
    CourseId bigint NOT NULL,
    QuizId bigint NOT NULL,
    AttemptNumber int NOT NULL,
    StartedAt datetime2(3) NOT NULL CONSTRAINT DF_QuizAttempts_Date DEFAULT SYSUTCDATETIME(),
    SubmittedAt datetime2(3) NULL,
    EarnedPoints decimal(10,2) NULL,
    TotalPoints decimal(10,2) NULL,
    CONSTRAINT UQ_QuizAttempts_Number UNIQUE(EnrollmentId,QuizId,AttemptNumber),
    CONSTRAINT UQ_QuizAttempts_IdQuiz UNIQUE(AttemptId,QuizId),
    CONSTRAINT FK_QuizAttempts_Enrollment FOREIGN KEY(EnrollmentId,CourseId) REFERENCES dbo.CourseEnrollments(EnrollmentId,CourseId),
    CONSTRAINT FK_QuizAttempts_Quiz FOREIGN KEY(QuizId,CourseId) REFERENCES dbo.CourseQuizzes(QuizId,CourseId),
    CONSTRAINT CK_QuizAttempts_Number CHECK(AttemptNumber>0),
    CONSTRAINT CK_QuizAttempts_Score CHECK((SubmittedAt IS NULL AND EarnedPoints IS NULL AND TotalPoints IS NULL) OR (SubmittedAt IS NOT NULL AND EarnedPoints IS NOT NULL AND TotalPoints IS NOT NULL AND TotalPoints>0 AND EarnedPoints BETWEEN 0 AND TotalPoints))
 );
 CREATE TABLE dbo.QuizAnswers (
    AttemptId bigint NOT NULL,
    QuizId bigint NOT NULL,
    QuestionId bigint NOT NULL,
    ChoiceId bigint NOT NULL,
    CONSTRAINT PK_QuizAnswers PRIMARY KEY(AttemptId,QuestionId),
    CONSTRAINT FK_QuizAnswers_Attempt FOREIGN KEY(AttemptId,QuizId) REFERENCES dbo.QuizAttempts(AttemptId,QuizId),
    CONSTRAINT FK_QuizAnswers_Question FOREIGN KEY(QuestionId,QuizId) REFERENCES dbo.QuizQuestions(QuestionId,QuizId),
    CONSTRAINT FK_QuizAnswers_Choice FOREIGN KEY(ChoiceId,QuestionId) REFERENCES dbo.QuizChoices(ChoiceId,QuestionId)
 );
 CREATE TABLE dbo.MeetingRooms (
    MeetingId bigint IDENTITY NOT NULL CONSTRAINT PK_MeetingRooms PRIMARY KEY,
    PublicId uniqueidentifier NOT NULL CONSTRAINT DF_MeetingRooms_Public DEFAULT NEWSEQUENTIALID(),
    ConversationId bigint NULL,
    RelatedApplicationId bigint NULL,
    HostUserId bigint NOT NULL,
    Title nvarchar(200) NOT NULL,
    ScheduledAt datetime2(3) NULL,
    StartedAt datetime2(3) NULL,
    EndedAt datetime2(3) NULL,
    Status varchar(16) NOT NULL CONSTRAINT DF_MeetingRooms_Status DEFAULT 'scheduled',
    CONSTRAINT UQ_MeetingRooms_Public UNIQUE(PublicId),
    CONSTRAINT FK_MeetingRooms_Host FOREIGN KEY(HostUserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_MeetingRooms_Conversation FOREIGN KEY(ConversationId) REFERENCES dbo.Conversations(ConversationId),
    CONSTRAINT FK_MeetingRooms_Application FOREIGN KEY(RelatedApplicationId) REFERENCES dbo.Applications(ApplicationId),
    CONSTRAINT CK_MeetingRooms_Status CHECK(Status IN ('scheduled','active','ended','cancelled')),
    CONSTRAINT CK_MeetingRooms_Dates CHECK(EndedAt IS NULL OR (StartedAt IS NOT NULL AND EndedAt>=StartedAt))
 );
 CREATE TABLE dbo.MeetingParticipants (
    MeetingId bigint NOT NULL,
    UserId bigint NOT NULL,
    Status varchar(16) NOT NULL CONSTRAINT DF_MeetingParticipants_Status DEFAULT 'invited',
    JoinedAt datetime2(3) NULL,
    LeftAt datetime2(3) NULL,
    CONSTRAINT PK_MeetingParticipants PRIMARY KEY(MeetingId,UserId),
    CONSTRAINT FK_MeetingParticipants_Meeting FOREIGN KEY(MeetingId) REFERENCES dbo.MeetingRooms(MeetingId),
    CONSTRAINT FK_MeetingParticipants_User FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT CK_MeetingParticipants_Status CHECK(Status IN ('invited','joined','left','declined')),
    CONSTRAINT CK_MeetingParticipants_Dates CHECK(LeftAt IS NULL OR (JoinedAt IS NOT NULL AND LeftAt>=JoinedAt))
 );
 INSERT dbo.SchemaVersions(VersionNumber) VALUES(2);
 COMMIT;
 END TRY
 BEGIN CATCH
   IF @@TRANCOUNT>0 ROLLBACK;
   THROW;
 END CATCH;
END;
GO
