(() => {
  const root = new URL('../', document.currentScript.src);
  const rows = [
    ['omar', 'عمر خليل', 'مطوّر مواقع ومدرّب', 'HTML, CSS, JavaScript, React', 'blue'],
    ['lina', 'لينا حداد', 'مصممة واجهات وتجربة مستخدم', 'Figma, تصميم الواجهات, أبحاث المستخدمين', 'orange'],
    ['sara', 'سارة ناصر', 'مصممة ومستشارة مسار مهني', 'تصميم المنتجات, بناء معرض الأعمال, الإرشاد', 'purple'],
    ['rami', 'رامي صالح', 'مختص تسويق وصناعة محتوى', 'التسويق الرقمي, كتابة المحتوى, إدارة الحملات', 'green'],
    ['bright', 'برايت لابز', 'فريق تطوير منتجات رقمية', 'React, JavaScript, تطوير المواقع', 'blue'],
    ['north', 'استوديو نورث', 'استوديو تصميم منتجات وتجارب رقمية', 'Figma, تصميم المنتجات, تجربة المستخدم', 'purple'],
    ['career', 'مجتمع المسار المهني', 'مجتمع للتعلّم والتطوير المهني', 'الإرشاد, بناء المسار المهني, التواصل', 'green'],
    ['orange', 'أورنج كولكتيف', 'فريق تسويق وصناعة محتوى', 'التسويق الرقمي, كتابة المحتوى, التصميم', 'orange'],
    ['cloud', 'كلاود وركس', 'فريق تطوير وخدمات سحابية', 'تطوير المواقع, الخدمات السحابية, JavaScript', 'blue'],
    ['ofoq', 'مجتمع أفق', 'مجتمع يجمع أصحاب الأفكار والمستقلين', 'التواصل, العمل الجماعي, تطوير الأفكار', 'orange']
  ];
  const accounts = rows.map(([id, name, role, skills, portrait]) => ({
    id, name, role, skills,
    location: 'عمّان، الأردن',
    bio: `${name} — ${role}. أشارك فرصًا وأفكارًا للتعاون، وأهتم بالتواصل مع أصحاب المهارات لإنجاز مشاريع مميزة.`,
    avatar: new URL(`assets/avatars/${portrait}.svg`, root).href
  }));
  const get = id => accounts.find(account => account.id === id);
  const url = (page, id) => {
    const result = new URL(`Account/${page}/${page.toLowerCase()}.html`, root);
    result.searchParams.set(page === 'Profile' ? 'user' : 'recipient', id);
    result.searchParams.set('theme', document.documentElement.dataset.theme || new URLSearchParams(location.search).get('theme') || 'light');
    return result.href;
  };
  const forRecord = (kind, record) => {
    if (kind === 'project') return get(['bright', 'north', 'cloud', 'orange'][Number(record.id) - 1]);
    return accounts.find(account => account.name === (record.instructor || record.company));
  };
  // Card content comes only from the fixed account directory above.
  const card = account => account ? `<div class="publisher-card" data-publisher="${account.id}">
    <a class="publisher-account" href="${url('Profile', account.id)}" aria-label="عرض حساب ${account.name}">
      <img class="publisher-avatar" src="${account.avatar}" alt="صورة حساب ${account.name}" width="44" height="44" loading="lazy">
      <span><small>الناشر</small><strong>${account.name}</strong></span>
    </a>
    <a class="publisher-message" href="${url('Messages', account.id)}" aria-label="مراسلة ${account.name}">مراسلة ↗</a>
  </div>` : '';
  window.OfoqPublishers = { get, forRecord, card, url };
})();
