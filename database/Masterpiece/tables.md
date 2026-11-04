# جداول Masterpiece

عدد الجداول: **50**. جميع أسماء الجداول والأعمدة بالإنجليزية، والنصوص العربية محفوظة في حقول `nvarchar`.

## المستخدمون والشركات

| الجدول | وظيفته | المفتاح الأساسي |
|---|---|---|
| `Users` | حسابات المستخدمين وبيانات التواصل وتجزئة كلمة المرور. | `UserId` |
| `Roles` | أنواع الصلاحيات. | `RoleId` |
| `UserRoles` | ربط المستخدم بالأدوار. | `UserId,RoleId` |
| `Profiles` | المعلومات الشخصية والمهنية. | `UserId` |
| `ProfileAttachments` | السيرة الذاتية والشهادات. | `ProfileAttachmentId` |
| `Skills` | المهارات المتاحة. | `SkillId` |
| `UserSkills` | مهارات المستخدم. | `UserId,SkillId` |
| `Companies` | بيانات الشركة. | `CompanyId` |
| `CompanyMembers` | الأشخاص المخولون بإدارة الشركة. | `CompanyId,UserId` |
| `UserSettings` | المظهر وتفضيلات الإشعارات. | `UserId` |

## المحتوى والملفات

| الجدول | وظيفته | المفتاح الأساسي |
|---|---|---|
| `Categories` | تصنيفات المحتوى. | `CategoryId` |
| `Currencies` | العملات وعدد الخانات العشرية. | `CurrencyCode` |
| `Files` | معلومات الملفات ومكان تخزينها وحالة فحصها. | `FileId` |
| `Listings` | البيانات المشتركة لكل أنواع المحتوى والكاردات. | `ListingId` |
| `ListingDetails` | بنود التفاصيل والمتطلبات والمخرجات والخطوات مرتبة. | `ListingDetailId` |
| `ListingSkills` | مهارات المحتوى. | `ListingId,SkillId` |
| `ListingAttachments` | صورة الكارد وملف PDF الخاص بالناشر. | `ListingAttachmentId` |
| `Projects` | ميزانية المشروع ومدته ونوعه. | `ListingId` |
| `Jobs` | نوع الوظيفة والخبرة والراتب. | `ListingId` |
| `Internships` | مدة التدريب والمقابل وعدد المقاعد. | `ListingId` |
| `Courses` | الدورة والمدرب والمستوى والسعر. | `ListingId` |
| `Workshops` | الورشة وموعدها وسعتها ورسومها. | `ListingId` |
| `Events` | الفعالية ونوعها ومكانها وموعدها. | `ListingId` |
| `Comments` | تعليقات المحتوى والردود. | `CommentId` |

## الطلبات والتعلّم

| الجدول | وظيفته | المفتاح الأساسي |
|---|---|---|
| `Applications` | طلبات المشاريع والوظائف والتدريبات وبيانات التقديم وقت الإرسال. | `ApplicationId` |
| `ApplicationStatusHistory` | سجل تغيّر حالة الطلب. | `HistoryId` |
| `Favorites` | المفضلة المشتركة لجميع الأقسام. | `UserId,ListingId` |
| `Carts` | سلة واحدة لكل مستخدم. | `CartId` |
| `CartItems` | عناصر السلة مع منع الوظائف والمشاريع. | `CartId,ListingId` |
| `Orders` | طلبات الشراء. | `OrderId` |
| `OrderItems` | عناصر الطلب وعناوينها وأسعارها وقت الشراء. | `OrderItemId` |
| `Payments` | محاولات الدفع والمراجع الخارجية دون بيانات بطاقات. | `PaymentId` |
| `CourseEnrollments` | الالتحاق بالدورات. | `EnrollmentId` |
| `Lessons` | الدروس وترتيبها ومحتواها. | `LessonId` |
| `LessonProgress` | إكمال الدروس وموضع المشاهدة والملاحظات. | `EnrollmentId,LessonId` |
| `Registrations` | التسجيل في الورش والفعاليات والحضور. | `RegistrationId` |

## التواصل والإدارة

| الجدول | وظيفته | المفتاح الأساسي |
|---|---|---|
| `Conversations` | المحادثات وسياقها. | `ConversationId` |
| `ConversationParticipants` | أطراف المحادثة. | `ConversationId,UserId` |
| `Messages` | الرسائل والمرسل. | `MessageId` |
| `MessageAttachments` | ملفات الرسائل. | `MessageId,FileId` |
| `Notifications` | الإشعارات وحالة قراءتها. | `NotificationId` |
| `AuditLogs` | سجل إجراءات الإدارة. | `AuditLogId` |
| `SchemaVersions` | إصدارات مخطط قاعدة البيانات. | `VersionNumber` |

## الاختبارات والمقابلات

| الجدول | وظيفته | المفتاح الأساسي |
|---|---|---|
| `CourseQuizzes` | اختبارات الدورات. | `QuizId` |
| `QuizQuestions` | أسئلة الاختبارات. | `QuestionId` |
| `QuizChoices` | خيارات السؤال والإجابة الصحيحة. | `ChoiceId` |
| `QuizAttempts` | محاولات المتعلم ونتيجتها. | `AttemptId` |
| `QuizAnswers` | إجابات المتعلم في كل محاولة. | `AttemptId,QuestionId` |
| `MeetingRooms` | غرف المقابلات ومواعيدها. | `MeetingId` |
| `MeetingParticipants` | المشاركون في المقابلة وحالة حضورهم. | `MeetingId,UserId` |

