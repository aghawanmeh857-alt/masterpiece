// Integration tests: every fixture runs inside a transaction and is rolled back.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
if (!process.argv.includes('--integration')) {
  const assert=require('node:assert/strict');
  const schema=fs.readFileSync(path.join(__dirname,'../database/Masterpiece/002_schema.sql'),'utf8');
  assert(schema.includes('CREATE TABLE dbo.Listings'));
  assert(schema.includes("CHECK(ListingType IN ('course','workshop','event','internship'))"));
  assert(schema.includes('FOREIGN KEY(EnrollmentId,CourseId)'));
  assert(!/DROP DATABASE|DROP TABLE/i.test(schema));
  console.log('Passed: database script structure and core relationship declarations. For real SQL Server tests, add --integration.');
  process.exit(0);
}
const serverIndex=process.argv.indexOf('--server');
const server=serverIndex>=0?process.argv[serverIndex+1]:'localhost';
const fixture=fs.readFileSync(path.join(__dirname,'../database/Masterpiece/006_demo_data.sql'),'utf8').replace('DECLARE @KeepDemoData bit = 1;','DECLARE @KeepDemoData bit = 0;');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'masterpiece-db-check-'));
let count=0;
function run(name,sql){
  const file=path.join(folder,`${++count}.sql`);fs.writeFileSync(file,sql,'utf8');
  const result=spawnSync('sqlcmd',['-S',server,'-E','-b','-f','65001','-i',file],{encoding:'utf8',timeout:60000,windowsHide:true});
  fs.unlinkSync(file);
  if(result.error||result.status!==0)throw Error(name+'\n'+(result.error?.message||'')+'\n'+result.stdout+'\n'+result.stderr);
  if(!result.stdout.includes('CHECK_PASSED'))throw Error(name+' did not finish its assertions.\n'+result.stdout);
  console.log('Passed: '+name);
}
try {
 run('database metadata and clean test namespace',`USE Masterpiece; SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM dbo.Users WHERE NormalizedEmail=N'admin@masterpiece.example') THROW 51100,'Run integration tests before installing optional demo data.',1;
 IF EXISTS(SELECT 1 FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) THROW 51101,'Untrusted or disabled relationship.',1;
 IF (SELECT COUNT(*) FROM dbo.SchemaVersions)<>2 THROW 51102,'Missing schema migration.',1;
 PRINT 'CHECK_PASSED';`);
 run('all six listing types, applications, learning, purchase, registration, messaging and quizzes',fixture.replace('-- TEST_INSERT_POINT',`
 IF (SELECT COUNT(*) FROM dbo.vPublishedListings WHERE ListingId IN(@project,@job,@internship,@course,@workshop,@event))<>6 THROW 51103,'Listing visibility mismatch.',1;
 IF (SELECT ProgressPercent FROM dbo.vCourseProgress WHERE EnrollmentId=@enrollment)<>50 THROW 51104,'Incorrect course progress.',1;
 IF (SELECT TotalAmount FROM dbo.vOrderTotals WHERE OrderId=@order)<>25 THROW 51105,'Incorrect order total.',1;
 IF (SELECT COUNT(*) FROM dbo.vUserActivity WHERE UserId=@member)<>4 THROW 51106,'Incorrect profile activity.',1;
 PRINT 'CHECK_PASSED';`));
 const tests=[
  ['normalized duplicate email',`INSERT dbo.Users(FullName,Email) VALUES(N'Duplicate',N' MEMBER@MASTERPIECE.EXAMPLE ');`,[2601,2627]],
  ['duplicate application',`INSERT dbo.Applications(ListingId,ListingType,ApplicantUserId,FullNameSnapshot,EmailSnapshot,CoverLetter) VALUES(@job,'job',@member,N'Test',N'test@example.test',N'Test');`,[2601,2627]],
  ['jobs excluded from cart',`INSERT dbo.CartItems(CartId,ListingId,ListingType) VALUES(@cart,@job,'job');`,[547]],
  ['projects excluded from cart',`INSERT dbo.CartItems(CartId,ListingId,ListingType) VALUES(@cart,@project,'project');`,[547]],
  ['wrong listing subtype',`INSERT dbo.Courses(ListingId,InstructorName,LevelCode,Price,CurrencyCode,DurationMinutes) VALUES(@project,N'Test','beginner',0,'USD',60);`,[547]],
  ['duplicate favorite',`INSERT dbo.Favorites(UserId,ListingId) VALUES(@member,@job);`,[2601,2627]],
  ['cross-course lesson progress',`INSERT dbo.Listings(ListingType,PublisherUserId,CategoryId,Title,Description) VALUES('course',@admin,@category,N'Second',N'Test');DECLARE @second bigint=SCOPE_IDENTITY();INSERT dbo.Courses(ListingId,InstructorName,LevelCode,Price,CurrencyCode,DurationMinutes) VALUES(@second,N'Test','beginner',0,'USD',60);INSERT dbo.Lessons(CourseId,Title,SortOrder) VALUES(@second,N'Other',0);DECLARE @otherLesson bigint=SCOPE_IDENTITY();INSERT dbo.LessonProgress(EnrollmentId,LessonId,CourseId) VALUES(@enrollment,@otherLesson,@course);`,[547]],
  ['PDF cannot be a card cover',`INSERT dbo.Files(UploadedByUserId,OriginalName,StorageKey,FileKind,MimeType,SizeBytes) VALUES(@admin,N'test.pdf',N'test/pdf','pdf','application/pdf',100);DECLARE @pdf bigint=SCOPE_IDENTITY();INSERT dbo.ListingAttachments(ListingId,FileId,FileKind,Purpose) VALUES(@project,@pdf,'pdf','cover');`,[547]],
  ['negative course price',`UPDATE dbo.Courses SET Price=-1 WHERE ListingId=@course;`,[547]],
  ['duplicate event registration',`INSERT dbo.Registrations(UserId,ListingId,ListingType) VALUES(@member,@event,'event');`,[2601,2627]],
  ['message sender must belong to conversation',`INSERT dbo.Messages(ConversationId,SenderUserId,Body) VALUES(@conversation,@admin,N'Not a member');`,[547]],
  ['order and item currency must match',`INSERT dbo.OrderItems(OrderId,ListingId,ListingType,TitleSnapshot,UnitPrice,CurrencyCode) VALUES(@order,@event,'event',N'Test',0,'JOD');`,[547]],
  ['one correct choice per question',`INSERT dbo.QuizChoices(QuestionId,Body,IsCorrect,SortOrder) VALUES(@question,N'Other',1,2);`,[2601,2627]]
 ];
 for(const [name,statement,errors] of tests){
   const sql=fixture.replace('-- TEST_INSERT_POINT',statement+"\nTHROW 51199,'Expected constraint did not reject invalid data.',1;")
    .replace(' IF @@TRANCOUNT>0 ROLLBACK;\n THROW;',` IF @@TRANCOUNT>0 ROLLBACK;\n IF ERROR_NUMBER() NOT IN (${errors.join(',')}) THROW;\n PRINT 'CHECK_PASSED';`);
   run(name,sql);
 }
 console.log(`All ${count} SQL Server checks passed. Fixtures were rolled back; no website connection was made.`);
} finally { fs.rmdirSync(folder); }
