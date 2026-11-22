# SAEI / سعي

الموقع واجهات HTML وCSS وJavaScript. تبدأ الجولة من `hero/userHero.html`، وتفتح الصفحات داخل `app.html`. بيانات التجربة في ذاكرة الصفحة المضيفة فقط، وتُمسح عند إعادة تحميلها. لا يوجد Backend متصل.

## المكونات المشتركة

- `assets/shared-navbar.js` و`assets/shared-navbar.css`: نافبار واحد للصفحات، مع وضع خاص للجولة ووضع مبسط للدخول والتسجيل.
- `assets/theme.js`: تغيير الثيم، تحديث الروابط، والتحقق من جاهزية المكونات للصفحات العادية.
- `assets/site-base.css`: أساس التنسيق المشترك، ويُحمّل بعد Bootstrap وقبل تنسيق الصفحة.
- `assets/auth.css` و`assets/detail-page.css` و`assets/project-page.css`: التنسيقات المتطابقة التي كانت منسوخة بين صفحات الدخول والتفاصيل.
- `assets/fonts.css`: خط Tajawal. `assets/arabic-ui.*`: التنقل المتجاوب ورسائل التحقق العربية.
- `assets/cards.css` و`assets/card-details.js`: الكاردات ونافذة التفاصيل المشتركة.
- `assets/popup-ui.css`: تنسيق النوافذ والنماذج والمرفقات.
- `assets/frontend-runtime.js`: جلسة الفرونت إند داخل الزيارة. `assets/platform-data.js`: المحتوى المنشور والمعدّل.
- `assets/payment.*`: واجهة الدفع التجريبية. `assets/publishing.js`: حقول النشر والصور وملفات PDF.

## الأقسام

- `Freelance/`: المشاريع والتقديم والمجتمع.
- `Academy/`: الدورات والدروس والسلة.
- `Jobs/` و`Internships/` و`Events/`: الفرص والفعاليات.
- `Account/`: الملف الشخصي والرسائل والإعدادات والمتابعة والمفضلة العامة.
- `company/` و`Admin/`: مساحات الإدارة المنفصلة.
- `Meeting/`: مقابلات Jitsi اختيارية عند الانضمام.
- `hero/` و`3D/`: مشهد Three.js والإضافات والموديلات المستخدمة. المعاينة المعتمدة: `3D/preview.html`.
- `Credits/`: المصادر والتراخيص.
- `database/Saei.sql` و`Saei-ERD.dbml`: مخطط قاعدة بيانات سعي وعلاقاته. مجلد `database/Masterpiece/` يحفظ السكربتات السابقة.
- `scripts/`: الفحوصات وخادم الملفات المحلي.

شغّل `index.html` باستخدام Live Server، أو استخدم `node scripts/ofoq-server.cjs` لخادم ملفات Node على المنفذ 8766. Bootstrap وThree.js وخط Tajawal تُحمّل من المصادر الخارجية المعرفة في الصفحات.

المفضلة مشتركة لكل المحتوى. السلة تشمل الدورات والفعاليات والتدريب. ملف PDF هو مرفق الناشر الأصلي.

## ملفات الجولة

- `hero/userHero.js`: التمرير والبطاقات والتنقل. يحمّل محرك المشهد حسب الحاجة.
- `hero/building-tour.js`: بناء المبنى وتحديث الكاميرا والأبواب والرسم.
- `hero/tour-camera-path.js` و`hero/tour-motion.js`: نقاط التصوير وحساب التقدم والسرعة.
- `hero/coastal-environment.js` و`hero/celestial-discs.js`: البحر والسماء وإضاءة النهار والليل.
- `hero/outdoor-facilities.js` و`hero/city-skyline.js`: الساحة والمباني المحيطة وإنارتها.
- `hero/exterior-lod.js`: صور العناصر الخارجية البعيدة والتحويل للمجسّمات عند الاقتراب.
- `hero/room-art.js` و`hero/interior-people.js`: لوحات الأقسام ومجسّمات الأشخاص.
- `3D/tour-interior.js`: أثاث الأقسام والخامات ونقاط الجلوس.

تنسيق ملفات HTML وCSS وJavaScript مشترَك في `.prettierrc.json`.
