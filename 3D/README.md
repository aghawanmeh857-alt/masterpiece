# موديلات أفق المختارة

الملفات الأصلية نُزّلت من Sketchfab بواسطة المستخدم، ثم نُسخت إلى هذا المجلد دون تغيير. ضبط الحجم والخامات وترتيب النسخ والحركة يتم في JavaScript داخل المشهد.

| الملف | الموديل والمصمم | الترخيص المعروض بالمصدر |
| --- | --- | --- |
| `generic-sedan-car.glb` | [Generic Sedan Car — MMC Works](https://sketchfab.com/3d-models/generic-sedan-car-58c33766470d46e7b2aed542650494e5) | CC Attribution |
| `modern-city-block.glb` | [Modern City Block — akselmot](https://sketchfab.com/3d-models/modern-city-block-c80dba249d9547cbb48d00828d23cfa7) | Free Standard |
| `business-male-4.glb` | [Business Male 4 — POLYTRICITY](https://sketchfab.com/3d-models/business-male-4--low-poly-style-5e53bf1cdd264ad08f420e05ee7aa7bf) | CC Attribution |
| `airplane.glb` | [Airplane — gompirulo](https://sketchfab.com/3d-models/airplane-c93fcd7042e3451bb82e03f6cda0ea81) | CC Attribution |

راجع صفحة كل مصدر لشروطه. الشخصيات الأصلية ومواد الأثاث والمبنى السابق تبقى في `hero/assets/3d` مع اعتماداتها؛ لا تُنزّل مرتين.

`preview.html` يعرض الموديلات المختارة للتحقق من شكلها. افتحه عبر Live Server. تستعمل المعاينة والمشهد نفس ملفات GLB المحلية، وتُحمّل مكتبة Three.js من CDN.

الإضافات: ست سيارات سيدان بألوان مختلفة على مسارات مرورية منفصلة، مدينة Modern City Block بجانب مقر أفق، 24 شخصًا من ثلاثة موديلات (18 مشاة و6 ضمن مجموعات)، بينهم 6 يمشون في الساحة الخارجية فقط؛ لا يدخل المشاة المبنى، وطائرة فوق المدينة. الشخصية الجديدة ذات حركة أصلية داخل مجموعة المحادثة؛ لم نفترض أنها تملك حركة مشي. الأبواب تستجيب للكاميرا وللموظفين عند المدخل. اختيار مبنى إداري جديد من 8–12 طابقًا ما زال منفصلًا عن المدينة المحيطة.

في الوضع الليلي تختفي مجموعة المشاة الخارجية وتتوقف حركتها، بينما تبقى السيارات متحركة وتُضاء مصابيحها الأمامية والخلفية. المصابيح الأمامية الأقرب فقط تسقط ضوءًا حقيقيًا على الشارع لتقليل كلفة الرسم. الرجوع للنهار يعيد المشاة ويطفئ مصابيح السيارات.
