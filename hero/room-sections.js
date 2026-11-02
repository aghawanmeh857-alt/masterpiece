// Homepage content follows the room reached by the camera.
export const ROOM_SECTIONS = [
  { title: 'سعي.<br><em>مسارات نحو مستقبلك.</em>', description: 'منصة تجمع التعلّم والفرص المهنية في تجربة واحدة. استكشف الأقسام واختر المسار المناسب لمهاراتك وطموحك.', heading: 'خدمات المنصة', items: [
    ['التعلّم والتطوير', 'دورات متخصصة وورش تطبيقية لتطوير مهاراتك.', '../Academy/academy.html'],
    ['الفرص المهنية', 'وظائف وتدريبات تربطك بالشركات وأصحاب الفرص.', '../Jobs/jobs.html'],
    ['المشاريع والعمل الحر', 'مشاريع متنوعة لتوظيف خبراتك وتنفيذ أفكار جديدة.', '../Freelance/freelance.html']
  ] },
  { title: 'العمل الحر.<br><em>خبرات تصنع قيمة.</em>', description: 'استعرض المشاريع وتعرّف على نطاق العمل والمتطلبات قبل التقديم. يمكنك متابعة طلباتك من ملفك الشخصي.', heading: 'مسارات العمل الحر', items: [
    ['استكشاف المشاريع', 'اطّلع على المهارات المطلوبة والميزانية ومدة التنفيذ.', '../Freelance/freelance.html'],
    ['مشاركة فكرة مشروع', 'اعرض فكرتك وأضف التفاصيل والمرفقات من قسم العمل الحر.', '../Freelance/freelance.html']
  ] },
  { title: 'الأكاديمية.<br><em>تعلّم بخطوات واضحة.</em>', description: 'اختر مسارك التعليمي، واستعرض المحتوى قبل الالتحاق. تابع دوراتك وتقدّمك من ملفك الشخصي.', heading: 'التعلّم والتطوير', items: [
    ['الدورات والمسارات', 'محتوى تعليمي منظّم يساعدك على بناء المعرفة والمهارات.', '../Academy/academy.html'],
    ['الورش التدريبية', 'تجارب تطبيقية تركّز على ممارسة المهارات وتطويرها.', '../Academy/academy.html?format=workshop']
  ] },
  { title: 'فرص التدريب.<br><em>بداية مهنية مدروسة.</em>', description: 'اكتسب خبرة عملية من خلال فرص التدريب. راجع متطلبات الجهة الناشرة وقدّم للفرصة المناسبة لتخصصك.', heading: 'من التعلّم إلى الممارسة', items: [
    ['الفرص المتاحة', 'تعرّف على مجال التدريب ونمط العمل والمتطلبات.', '../Internships/internships.html'],
    ['السيرة والطلبات', 'جهّز سيرتك الذاتية وتابع فرص التدريب التي تقدّمت لها.', '../Account/Profile/profile.html']
  ] },
  { title: 'الوظائف.<br><em>فرص تناسب خبراتك.</em>', description: 'تعرّف على الشركات والوظائف المتاحة، واقرأ التفاصيل والمرفقات المنشورة قبل إرسال طلبك.', heading: 'للباحثين عن عمل والشركات', items: [
    ['البحث عن وظيفة', 'استعرض الوظائف وفق المجال والخبرة ونمط العمل.', '../Jobs/jobs.html'],
    ['نشر فرص الشركة', 'أنشئ حساب شركة لإضافة الوظائف والتدريبات وإدارة المتقدمين.', '../Auth/Register/register.html?account=company']
  ] },
  { title: 'الفعاليات.<br><em>معرفة وتواصل.</em>', description: 'استكشف اللقاءات والفعاليات، واطّلع على المواعيد وطريقة الحضور قبل التسجيل.', heading: 'شارك وتابع', items: [
    ['الفعاليات القادمة', 'اطّلع على تفاصيل الفعاليات واختر ما يناسب اهتماماتك.', '../Events/events.html'],
    ['تسجيلاتك في مكان واحد', 'تابع الفعاليات والدورات وطلبات الفرص من ملفك الشخصي.', '../Account/Profile/profile.html']
  ] }
];

export function renderRoomSections(container, index, themeUrl) {
  const section = ROOM_SECTIONS[index];
  const heading = document.createElement('h2');
  heading.textContent = section.heading;
  container.replaceChildren(heading);
  section.items.forEach(([title, description, href], i) => {
    const link = document.createElement('a');
    link.href = themeUrl(href);
    const number = document.createElement('span'); number.className = 'room-service-number'; number.textContent = String(i + 1).padStart(2, '0');
    const text = document.createElement('span');
    const strong = document.createElement('strong'); strong.textContent = title;
    const small = document.createElement('small'); small.textContent = description;
    const arrow = document.createElement('span'); arrow.textContent = '←'; arrow.setAttribute('aria-hidden', 'true');
    text.append(strong, small); link.append(number, text, arrow); container.append(link);
  });
}
