# مخطط علاقات Masterpiece

`||` = واحد، و`o|` = اختياري واحد، و`o{` = صفر أو أكثر. المخططات مبسطة؛ التعريف الدقيق للمفاتيح والقيود في ملفات SQL. كل سجل Listings له نوع تفاصيل واحد، والورش والفعاليات تستخدم Registrations.

## المستخدمون والشركات

```mermaid
erDiagram
    Users ||--o{ UserRoles : roles
    Roles ||--o{ UserRoles : users
    Users ||--o| Profiles : profile
    Profiles ||--o{ ProfileAttachments : documents
    Files ||--o{ ProfileAttachments : file
    Profiles ||--o{ UserSkills : skills
    Skills ||--o{ UserSkills : users
    Users ||--o{ CompanyMembers : membership
    Companies ||--o{ CompanyMembers : staff
    Users ||--o| UserSettings : settings
```

## المحتوى المنشور

```mermaid
erDiagram
    Users ||--o{ Listings : publisher
    Companies o|--o{ Listings : company
    Categories ||--o{ Listings : category
    Listings ||--o| Projects : project
    Listings ||--o| Jobs : job
    Listings ||--o| Internships : internship
    Listings ||--o| Courses : course
    Listings ||--o| Workshops : workshop
    Listings ||--o| Events : event
    Listings ||--o{ ListingDetails : details
    Listings ||--o{ ListingAttachments : attachments
    Files ||--o{ ListingAttachments : file
    Listings ||--o{ ListingSkills : skills
    Skills ||--o{ ListingSkills : listings
```

## التقديم والسلة والشراء

```mermaid
erDiagram
    Users ||--o{ Applications : applies
    Listings ||--o{ Applications : applications
    Applications ||--o{ ApplicationStatusHistory : history
    Users ||--o{ Favorites : saves
    Listings ||--o{ Favorites : saved
    Users ||--o| Carts : cart
    Carts ||--o{ CartItems : items
    Listings ||--o{ CartItems : selected
    Users ||--o{ Orders : orders
    Orders ||--o{ OrderItems : items
    Listings ||--o{ OrderItems : purchased
    Orders ||--o{ Payments : payment_attempts
```

## التعلّم والفعاليات

```mermaid
erDiagram
    Users ||--o{ CourseEnrollments : enrolls
    Courses ||--o{ CourseEnrollments : learners
    Courses ||--o{ Lessons : lessons
    CourseEnrollments ||--o{ LessonProgress : progress
    Lessons ||--o{ LessonProgress : completed
    Users ||--o{ Registrations : registers
    Listings ||--o{ Registrations : workshop_or_event
    OrderItems o|--o| CourseEnrollments : purchase
    OrderItems o|--o| Registrations : purchase
    Courses ||--o{ CourseQuizzes : quizzes
    CourseQuizzes ||--o{ QuizQuestions : questions
    QuizQuestions ||--o{ QuizChoices : choices
    CourseEnrollments ||--o{ QuizAttempts : attempts
    CourseQuizzes ||--o{ QuizAttempts : attempts
    QuizAttempts ||--o{ QuizAnswers : answers
    QuizQuestions ||--o{ QuizAnswers : answered
    QuizChoices ||--o{ QuizAnswers : selected
```

## التواصل والمقابلات

```mermaid
erDiagram
    Users ||--o{ ConversationParticipants : joins
    Conversations ||--o{ ConversationParticipants : members
    ConversationParticipants ||--o{ Messages : sends
    Messages ||--o{ MessageAttachments : attachments
    Files ||--o{ MessageAttachments : file
    Users ||--o{ Notifications : receives
    Users ||--o{ Comments : writes
    Listings ||--o{ Comments : discussion
    Users o|--o{ AuditLogs : actor
    Conversations o|--o{ MeetingRooms : meetings
    Applications o|--o{ MeetingRooms : interviews
    MeetingRooms ||--o{ MeetingParticipants : participants
    Users ||--o{ MeetingParticipants : attends
```

