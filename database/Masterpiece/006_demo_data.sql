-- OPTIONAL: fictitious development data. No login passwords or real payment credentials.
USE [Masterpiece];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @KeepDemoData bit = 1;
IF EXISTS(SELECT 1 FROM dbo.Users WHERE NormalizedEmail=N'admin@masterpiece.example')
BEGIN
 PRINT N'Demo data already exists. Skipped.';
 RETURN;
END;
BEGIN TRY
BEGIN TRANSACTION;
DECLARE @admin bigint,@member bigint,@recruiter bigint,@company bigint,@category int;
INSERT dbo.Users(FullName,Email) VALUES(N'إدارة سعي التجريبية',N'admin@masterpiece.example');SET @admin=SCOPE_IDENTITY();
INSERT dbo.Users(FullName,Email) VALUES(N'مستخدم تجريبي',N'member@masterpiece.example');SET @member=SCOPE_IDENTITY();
INSERT dbo.Users(FullName,Email) VALUES(N'مسؤول شركة تجريبية',N'company@masterpiece.example');SET @recruiter=SCOPE_IDENTITY();
INSERT dbo.Profiles(UserId,ProfessionalTitle,Bio) VALUES(@member,N'مطوّر واجهات',N'ملف توضيحي لتجربة العلاقات داخل قاعدة البيانات.');
INSERT dbo.UserSettings(UserId) VALUES(@admin),(@member),(@recruiter);
INSERT dbo.UserRoles(UserId,RoleId) SELECT @admin,RoleId FROM dbo.Roles WHERE Code='admin';
INSERT dbo.UserRoles(UserId,RoleId) SELECT @member,RoleId FROM dbo.Roles WHERE Code='member';
INSERT dbo.UserRoles(UserId,RoleId) SELECT @recruiter,RoleId FROM dbo.Roles WHERE Code='company';
INSERT dbo.Companies(Name,Slug,Status) VALUES(N'شركة سعي التجريبية','masterpiece-demo-company','active');SET @company=SCOPE_IDENTITY();
INSERT dbo.CompanyMembers(CompanyId,UserId,MemberRole) VALUES(@company,@recruiter,'owner');
SELECT @category=CategoryId FROM dbo.Categories WHERE Code='development';
DECLARE @project bigint,@job bigint,@internship bigint,@course bigint,@workshop bigint,@event bigint;
INSERT dbo.Listings(ListingType,PublisherUserId,CategoryId,Title,Description,LegacyKey)
 VALUES('project',@member,@category,N'تطوير واجهات موقع',N'مشروع تجريبي لعرض الميزانية والمرفقات والتقديم.','demo-project');SET @project=SCOPE_IDENTITY();
INSERT dbo.Projects(ListingId,BudgetMin,BudgetMax,CurrencyCode,DurationDays,ProjectType,ApplicationDeadline)
 VALUES(@project,500,800,'USD',21,'fixed',DATEADD(day,90,SYSUTCDATETIME()));
INSERT dbo.Listings(ListingType,PublisherUserId,CompanyId,CategoryId,Title,Description,LegacyKey)
 VALUES('job',@recruiter,@company,@category,N'مطوّر واجهات أمامية',N'وظيفة تجريبية لفريق تطوير الواجهات.','demo-job');SET @job=SCOPE_IDENTITY();
INSERT dbo.Jobs(ListingId,EmploymentType,ExperienceLevel,SalaryMin,SalaryMax,CurrencyCode,ApplicationDeadline)
 VALUES(@job,'full-time','mid',1200,1800,'USD',DATEADD(day,90,SYSUTCDATETIME()));
INSERT dbo.Listings(ListingType,PublisherUserId,CompanyId,CategoryId,Title,Description,LegacyKey)
 VALUES('internship',@recruiter,@company,@category,N'متدرّب تطوير واجهات',N'تدريب تجريبي لا يدخل حساب الدفع.','demo-internship');SET @internship=SCOPE_IDENTITY();
INSERT dbo.Internships(ListingId,DurationMonths,MonthlyStipend,CurrencyCode,Capacity) VALUES(@internship,3,350,'USD',5);
INSERT dbo.Listings(ListingType,PublisherUserId,CategoryId,Title,Description,LegacyKey)
 VALUES('course',@admin,@category,N'أساسيات تطوير المواقع',N'دورة مجانية تجريبية مع دروس وتقدّم واختبار.','demo-course');SET @course=SCOPE_IDENTITY();
INSERT dbo.Courses(ListingId,InstructorName,LevelCode,Price,CurrencyCode,DurationMinutes) VALUES(@course,N'مدرّب تجريبي','beginner',0,'USD',120);
INSERT dbo.Listings(ListingType,PublisherUserId,CategoryId,Title,Description,LegacyKey)
 VALUES('workshop',@admin,@category,N'ورشة تطبيقات الواجهات',N'ورشة مدفوعة تجريبية لاختبار الطلب والتسجيل.','demo-workshop');SET @workshop=SCOPE_IDENTITY();
INSERT dbo.Workshops(ListingId,PresenterName,LevelCode,StartsAt,EndsAt,Capacity,Price,CurrencyCode)
 VALUES(@workshop,N'مقدّم تجريبي','beginner',DATEADD(day,30,SYSUTCDATETIME()),DATEADD(hour,3,DATEADD(day,30,SYSUTCDATETIME())),20,25,'USD');
INSERT dbo.Listings(ListingType,PublisherUserId,CategoryId,Title,Description,LegacyKey)
 VALUES('event',@admin,@category,N'لقاء صنّاع الأفكار',N'فعالية مجانية تجريبية.','demo-event');SET @event=SCOPE_IDENTITY();
INSERT dbo.Events(ListingId,EventType,StartsAt,EndsAt,Venue,Capacity,Price,CurrencyCode)
 VALUES(@event,'meetup',DATEADD(day,45,SYSUTCDATETIME()),DATEADD(hour,2,DATEADD(day,45,SYSUTCDATETIME())),N'عمّان',50,0,'USD');
UPDATE dbo.Listings SET Status='published',PublishedAt=SYSUTCDATETIME()
 WHERE ListingId IN(@project,@job,@internship,@course,@workshop,@event);
INSERT dbo.ListingDetails(ListingId,SectionCode,Body,SortOrder) VALUES
 (@job,'requirement',N'إتقان JavaScript وReact.',0),(@project,'output',N'واجهات متجاوبة مع الهاتف.',0),(@workshop,'detail',N'تطبيق عملي ومراجعة النتائج.',0);
INSERT dbo.Favorites(UserId,ListingId) VALUES(@member,@job),(@member,@course),(@member,@workshop);
DECLARE @cart bigint;
INSERT dbo.Carts(UserId) VALUES(@member);SET @cart=SCOPE_IDENTITY();
INSERT dbo.CartItems(CartId,ListingId,ListingType) VALUES(@cart,@course,'course'),(@cart,@workshop,'workshop'),(@cart,@internship,'internship');
INSERT dbo.Applications(ListingId,ListingType,ApplicantUserId,FullNameSnapshot,EmailSnapshot,CoverLetter)
 VALUES(@job,'job',@member,N'مستخدم تجريبي',N'member@masterpiece.example',N'طلب توضيحي للتقديم على وظيفة.');
DECLARE @application bigint=SCOPE_IDENTITY(),@enrollment bigint,@lesson bigint,@quiz bigint,@question bigint,@choice bigint,@attempt bigint;
INSERT dbo.ApplicationStatusHistory(ApplicationId,NewStatus,ChangedByUserId) VALUES(@application,'pending',@member);
INSERT dbo.Lessons(CourseId,Title,Body,SortOrder,DurationSeconds) VALUES(@course,N'مقدمة الويب',N'محتوى درس تجريبي.',0,900);SET @lesson=SCOPE_IDENTITY();
INSERT dbo.Lessons(CourseId,Title,Body,SortOrder,DurationSeconds) VALUES(@course,N'تطبيق عملي',N'محتوى الدرس الثاني.',1,1200);
INSERT dbo.CourseEnrollments(UserId,CourseId) VALUES(@member,@course);SET @enrollment=SCOPE_IDENTITY();
INSERT dbo.LessonProgress(EnrollmentId,LessonId,CourseId,IsCompleted,PlaybackSeconds,Notes) VALUES(@enrollment,@lesson,@course,1,900,N'ملاحظة تجريبية.');
INSERT dbo.CourseQuizzes(CourseId,Title) VALUES(@course,N'اختبار المقدمة');SET @quiz=SCOPE_IDENTITY();
INSERT dbo.QuizQuestions(QuizId,Prompt,Points,SortOrder) VALUES(@quiz,N'ما اللغة المستخدمة لبنية صفحات الويب؟',1,0);SET @question=SCOPE_IDENTITY();
INSERT dbo.QuizChoices(QuestionId,Body,IsCorrect,SortOrder) VALUES(@question,N'HTML',1,0);SET @choice=SCOPE_IDENTITY();
INSERT dbo.QuizChoices(QuestionId,Body,IsCorrect,SortOrder) VALUES(@question,N'CSS',0,1);
INSERT dbo.QuizAttempts(EnrollmentId,CourseId,QuizId,AttemptNumber) VALUES(@enrollment,@course,@quiz,1);SET @attempt=SCOPE_IDENTITY();
INSERT dbo.QuizAnswers(AttemptId,QuizId,QuestionId,ChoiceId) VALUES(@attempt,@quiz,@question,@choice);
UPDATE dbo.QuizAttempts SET SubmittedAt=SYSUTCDATETIME(),EarnedPoints=1,TotalPoints=1 WHERE AttemptId=@attempt;
DECLARE @order bigint,@orderItem bigint;
INSERT dbo.Orders(UserId,CurrencyCode) VALUES(@member,'USD');SET @order=SCOPE_IDENTITY();
INSERT dbo.OrderItems(OrderId,ListingId,ListingType,TitleSnapshot,UnitPrice,CurrencyCode) VALUES(@order,@workshop,'workshop',N'ورشة تطبيقات الواجهات',25,'USD');SET @orderItem=SCOPE_IDENTITY();
INSERT dbo.Payments(OrderId,CurrencyCode,Provider,ProviderReference,IdempotencyKey,Amount,Status,ProcessedAt)
 VALUES(@order,'USD','demo','demo-payment-001',NEWID(),25,'succeeded',SYSUTCDATETIME());
UPDATE dbo.Orders SET Status='paid',PaidAt=SYSUTCDATETIME() WHERE OrderId=@order;
INSERT dbo.Registrations(UserId,ListingId,ListingType,OrderItemId,Status) VALUES(@member,@workshop,'workshop',@orderItem,'confirmed');
INSERT dbo.Registrations(UserId,ListingId,ListingType,Status) VALUES(@member,@event,'event','confirmed');
DECLARE @conversation bigint,@message bigint,@meeting bigint;
INSERT dbo.Conversations(Subject,RelatedListingId,CreatedByUserId) VALUES(N'مناقشة طلب الوظيفة',@job,@recruiter);SET @conversation=SCOPE_IDENTITY();
INSERT dbo.ConversationParticipants(ConversationId,UserId) VALUES(@conversation,@recruiter),(@conversation,@member);
INSERT dbo.Messages(ConversationId,SenderUserId,Body) VALUES(@conversation,@recruiter,N'مرحبًا، نود مناقشة طلبك.');SET @message=SCOPE_IDENTITY();
INSERT dbo.MeetingRooms(ConversationId,RelatedApplicationId,HostUserId,Title,ScheduledAt)
 VALUES(@conversation,@application,@recruiter,N'مقابلة تعريفية تجريبية',DATEADD(day,7,SYSUTCDATETIME()));SET @meeting=SCOPE_IDENTITY();
INSERT dbo.MeetingParticipants(MeetingId,UserId) VALUES(@meeting,@recruiter),(@meeting,@member);
INSERT dbo.Notifications(UserId,TypeCode,Title,RelatedListingId) VALUES(@member,'application',N'تم استلام طلبك',@job);
INSERT dbo.Comments(ListingId,UserId,Body) VALUES(@project,@recruiter,N'نرغب في معرفة المزيد عن تفاصيل المشروع.');
INSERT dbo.AuditLogs(ActorUserId,ActionCode,EntityName,EntityId,Details) VALUES(@admin,'seed-demo','Database','Masterpiece',N'إضافة بيانات تجريبية اختيارية.');
-- TEST_INSERT_POINT
IF @KeepDemoData=1
BEGIN
 COMMIT;
 PRINT N'Optional demo data installed. These users have no password hashes.';
END
ELSE
BEGIN
 ROLLBACK;
 PRINT N'Demo workflow verified and rolled back; no demo rows were kept.';
END;
END TRY
BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK;
 THROW;
END CATCH;
GO
