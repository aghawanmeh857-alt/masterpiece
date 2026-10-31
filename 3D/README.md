# موديلات أفق المختارة

الملفات الأصلية نُزّلت من Sketchfab بواسطة المستخدم، ثم نُسخت إلى هذا المجلد دون تغيير. ضبط الحجم والخامات وترتيب النسخ والحركة يتم في JavaScript داخل المشهد.

| الملف | الموديل والمصمم | الترخيص المعروض بالمصدر |
| --- | --- | --- |
| `generic-sedan-car.glb` | [Generic Sedan Car — MMC Works](https://sketchfab.com/3d-models/generic-sedan-car-58c33766470d46e7b2aed542650494e5) | CC Attribution |
| `fixed-new-york-highway-interstate-95.glb` | [[FIXED] New York, Highway Interstate 95 — 99.Miles](https://sketchfab.com/3d-models/fixed-new-york-highway-interstate-95-f668f36f01d44a6cae4b6bfa2f9b3021) | Sketchfab Standard، حسب بيانات GLB الأصلية |
| `free-london-skyscraper.glb` | [[FREE] London Skyscraper — 99.Miles](https://sketchfab.com/3d-models/free-london-skyscraper-52b73f6ea18a440cb42734840d5edc72) | CC BY 4.0، حسب بيانات GLB الأصلية |
| `business-male-4.glb` | [Business Male 4 — POLYTRICITY](https://sketchfab.com/3d-models/business-male-4--low-poly-style-5e53bf1cdd264ad08f420e05ee7aa7bf) | CC Attribution |
| `airplane.glb` | [Airplane — gompirulo](https://sketchfab.com/3d-models/airplane-c93fcd7042e3451bb82e03f6cda0ea81) | CC Attribution |
| `maple-trees.glb` | [Maple Trees — Jagobo](https://sketchfab.com/3d-models/maple-trees-9f51e08e56cd4e44b35fd02a3ad8d3a6) | CC BY 4.0 |
| `italian-fountain.glb` | [Fountain — yorre.detavernier](https://sketchfab.com/3d-models/fountain-8580500134194ba5be3f6df7593049f2) | CC BY 4.0 |
| `office-desk.glb` | [Shared Office Desk — Daniel Quaresma](https://sketchfab.com/3d-models/free-3d-model-shared-office-desk-204cf9e210c34d908e92c89afe4f1dc3) | CC BY 4.0 |
| `office-chair.glb` | [Office Chair — Tomaso](https://sketchfab.com/3d-models/office-chair-69208f9465c346308a2bf423c7e5b8f6) | CC BY 4.0 |
| `lobby-sofa.glb` | [Couch PBR Free — donnichols](https://sketchfab.com/3d-models/couch-pbr-free-c3787995a9954e1c937dd7bef5c189ad) | CC BY 4.0 |

راجع صفحة كل مصدر لشروطه. الشخصيات الأصلية ومواد الأثاث والمبنى السابق تبقى في `hero/assets/3d` مع اعتماداتها؛ لا تُنزّل مرتين.

`preview.html` يعرض الموديلات المختارة للتحقق من شكلها. افتحه عبر Live Server. تستعمل المعاينة والمشهد نفس ملفات GLB المحلية، وتُحمّل مكتبة Three.js من CDN.

المدينة الحالية هي New York, Highway Interstate 95، ومقر الشركة هو London Skyscraper. ملف `model-layout.js` يضبط حجمهما وموضعهما فقط، مع الحفاظ على النسب والخامات الأصلية. البرج فوق منصة المدخل الحالية؛ الأبواب والجولة والغرف الداخلية والشط والجسر والأشخاص والسيارات والطائرة كما هي. ملفات GLB تحتوي الخامات والصور داخلها ولا تحتاج ملفات خارجية. حُذف موديل Modern City Block السابق بعد استبداله وتحديث المعاينة.

في الوضع الليلي تختفي مجموعة المشاة الخارجية وتتوقف حركتها، بينما تبقى السيارات متحركة وتُضاء مصابيحها الأمامية والخلفية. المصابيح الأمامية الأقرب فقط تسقط ضوءًا حقيقيًا على الشارع لتقليل كلفة الرسم. الرجوع للنهار يعيد المشاة ويطفئ مصابيح السيارات.

`rear-district.js` يضيف ست مبانٍ خلف المقر من نفس موديل نيويورك، بارتفاعات متفاوتة وشوارع بينها. تشترك النسخ في الهندسة والخامات، ولا تحتاج ملفات GLB أو صورًا إضافية؛ تبقى خارج حدود المقر والشط والطريق الحالي.

`autumn-walk.js` يستخدم أوسع شجرة من مجموعة Maple Trees لتغطية ممر المدخل بأربع نسخ كبيرة. تغييرات المشهد: أوراق نحاسية وبرتقالية وحمراء، ارتفاع التيجان لتوفير ممر للكاميرا، تساقط أوراق متحرك وأوراق على الأرض. يمر الجزء الخارجي من مسار السكرول تحت التيجان. ملف GLB الأصلي بخامات 1K محفوظ دون تعديل. مجموعة Red Maple 6 Variations غير متاحة للتنزيل؛ وافق المستخدم على هذه المجموعة البديلة من نفس المصمم.

`plaza-fountain.js` يضع نافورة إيطالية بعرض 6.4 متر داخل المساحة الخضراء جهة البحر، بجانب المقاعد وخارج الممر، على منصة دائرية. يضيف حركة لخامات الماء ويحوّل إعدادات خامات specular/glossiness القديمة وقت التشغيل لتظهر صور الموديل مع نسخة Three.js الحالية. ملف GLB الأصلي بخامات 1K محفوظ دون تعديل؛ النافورة البرمجية السابقة تبقى بديلًا عند تعذّر التحميل.

`realistic-furniture.js` يجهّز محطة عمل واحدة من المكتب المشترك مع الحفاظ على إحداثيات UV وخامات الخشب الأصلية، بارتفاع سطح 78 سم؛ ارتفاع الكرسي 115 سم وارتفاع كنبة الاستقبال حتى 105 سم. الخامات الأصلية للألوان والخشونة والمعدن والتفاصيل محفوظة. المكتب بخامات 4K، الكنبة 2K، والكرسي 1K. تستبدل النماذج قطع الأثاث المبسطة داخل الغرف والاستقبال مع إبقاء مسار الكاميرا والأبواب والغرف كما هي. ملفات GLB الأصلية لا تتغير.
