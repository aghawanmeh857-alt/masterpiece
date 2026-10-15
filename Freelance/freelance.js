
// Forms are interface examples. Only search and filter forms process their inputs.
document.addEventListener('submit', function (event) {
  const form = event.target;
  if (['searchForm', 'filterForm', 'applicationForm'].includes(form.id)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  form.reset();
  let status = form.querySelector('[data-screen-status]');
  if (!status) {
    status = document.createElement('p');
    status.dataset.screenStatus = '';
    status.setAttribute('role', 'status');
    form.append(status);
  }
  status.textContent = 'هذه شاشة عرض فقط؛ لا يتم حفظ أو إرسال أي بيانات.';
}, true);
document.querySelectorAll('form').forEach(form => form.autocomplete = 'off');
(function () {
// Theme travels in page links; no browser storage or backend is needed.

window.siteThemeUrl = function(href) {
  const url = new URL(href, location.href);
  url.searchParams.set('theme', document.documentElement.dataset.theme);
  return url.href;
};
function updateThemeLinks(root = document) {
  const links = [...root.querySelectorAll('a[href]')];
  if (root.matches?.('a[href]')) links.push(root);
  links.forEach(link => {
    if (link.getAttribute('href').startsWith('#')) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && url.pathname.endsWith('.html')) {
      link.href = window.siteThemeUrl(url.href);
    }
  });
}
window.setSiteTheme = function(theme) {
  const dark = theme === 'dark';
  const current = document.documentElement.dataset.theme;
  if (current && current !== (dark ? 'dark' : 'light')) document.documentElement.classList.add('theme-transition');
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  updateThemeLinks();
  const url = new URL(location.href);
  url.searchParams.set('theme', dark ? 'dark' : 'light');
  history.replaceState(null, '', url);
  document.querySelectorAll('.theme-toggle').forEach(button => {
    button.textContent = dark ? '☀ الوضع النهاري' : '☾ الوضع الليلي';
    button.setAttribute('aria-label', dark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي');
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#0b1526' : '#f3f6fb';
};
window.setSiteTheme(new URLSearchParams(location.search).get('theme'));
// Include newly rendered cards, menus and detail links before they are opened.
new MutationObserver(records => {
  records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === 1) updateThemeLinks(node);
  }));
}).observe(document.body, { childList: true, subtree: true });

document.addEventListener('click', event => {
  const toggle = event.target.closest('.theme-toggle');
  if (toggle) {
    const dark = document.documentElement.dataset.theme === 'dark';
    // The entrance buttons also animate the sun, moon and street lights.
    const sceneButton = document.getElementById(dark ? 'dayMode' : 'nightMode');
    if (sceneButton) sceneButton.click();
    else window.setSiteTheme(dark ? 'light' : 'dark');
  }
  const link = event.target.closest('a[href]');
  if (!link || link.getAttribute('href').startsWith('#')) return;
  const url = new URL(link.href);
  if (url.origin === location.origin && url.pathname.endsWith('.html')) link.href = window.siteThemeUrl(link.href);
}, true);


window.componentsReady = Promise.resolve();

})();

// Fixed examples for this screen.
const projects = [
  {
    id: 1,
    title: "لوحة متابعة بـReact لشركة خدمات لوجستية",
    description: "بناء لوحة إدارة تتضمن رسومًا بيانية وأدوارًا للمستخدمين.",
    skills: ["React", "Node.js", "رسوم بيانية"],
    category: "development",
    budget: 800,
    weeks: 3,
    type: "fixed",
    date: "2026-10-08",
    icon: "dashboard",
    color: "orange"
  },
  {
    id: 2,
    title: "إعادة تصميم واجهات تطبيق جوّال",
    description: "إعادة تصميم شاشات تطبيق لياقة بدنية قائم.",
    skills: ["Figma", "UI/UX"],
    category: "design",
    budget: 450,
    weeks: 2,
    type: "fixed",
    date: "2026-10-07",
    icon: "mobile",
    color: "blue"
  },
  {
    id: 3,
    title: "صفحة تعريفية لمنتج برمجي",
    description: "صفحة تعريفية متجاوبة تعرض الأسعار ونموذج التواصل.",
    skills: ["HTML", "CSS"],
    category: "development",
    budget: 300,
    weeks: 1,
    type: "fixed",
    date: "2026-10-06",
    icon: "code",
    color: "green"
  },
  {
    id: 4,
    title: "محتوى تواصل اجتماعي لمقهى",
    description: "خطة شهرية للمنشورات والقصص على Instagram.",
    skills: ["التسويق الرقمي"],
    category: "marketing",
    budget: 200,
    weeks: 4,
    type: "ongoing",
    date: "2026-10-05",
    icon: "marketing",
    color: "purple"
  }
];


(function () {
Promise.resolve().then(() => {
  if (!window.componentsReady || typeof window.componentsReady.then !== 'function') {
    throw new Error('Page initialization is unavailable.');
  }
  return window.componentsReady;
}).then(() => {



  const $ = id => document.getElementById(id);

  const state = {
    query: "",
    category: "",
    budget: "",
    deadline: "",
    projectType: "",
    skills: "",
    sort: "recent"
  };

  const icons = {
    dashboard: `
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M9 4v16M9 10h11M14 10v10"/>
    `,
    mobile: `
      <rect x="7" y="2" width="10" height="20" rx="2"/>
      <path d="M11 18h2"/>
    `,
    code: `
      <path d="m7 6-5 6 5 6m10-12 5 6-5 6m-3-15-4 18"/>
    `,
    marketing: `
      <path d="m3 10 16-6v16L3 14zM6 15l2 6h4l-2-5M22 8v8"/>
    `
  };

  const normalize = value => value.trim().toLowerCase();

  const money = value =>
    new Intl.NumberFormat("ar-JO", {
      maximumFractionDigits: 0
    }).format(value) + ' دولار';

  function filteredProjects() {
    const query = normalize(state.query);
    const skills = normalize(state.skills);

    return projects.filter(project => {
      const haystack = (
        project.title + " " +
        project.description + " " +
        project.skills.join(" ")
      ).toLowerCase();

      const matchesQuery = !query || haystack.includes(query);

      const matchesCategory =
        !state.category || project.category === state.category;

      const matchesSkills =
        !skills ||
        project.skills.some(skill =>
          skill.toLowerCase().includes(skills)
        );

      const matchesDeadline =
        !state.deadline ||
        project.weeks <= Number(state.deadline);

      const matchesType =
        !state.projectType ||
        project.type === state.projectType;

      const matchesBudget =
        !state.budget ||
        (
          state.budget === "low"
            ? project.budget <= 300
            : state.budget === "medium"
              ? project.budget > 300 && project.budget <= 600
              : project.budget > 600
        );

      return (
        matchesQuery &&
        matchesCategory &&
        matchesSkills &&
        matchesDeadline &&
        matchesType &&
        matchesBudget
      );
    }).sort((a, b) => {
      if (state.sort === "budget-high") {
        return b.budget - a.budget;
      }

      if (state.sort === "budget-low") {
        return a.budget - b.budget;
      }

      if (state.sort === "deadline") {
        return a.weeks - b.weeks;
      }

      return b.date.localeCompare(a.date);
    });
  }

  function createProjectCard(project) {
    const article = document.createElement("article");
    article.className = "project-card";
    article.dataset.project = project.id;

    const icon = document.createElement("div");
    icon.className = `project-icon ${project.color}`;
    icon.setAttribute("aria-hidden", "true");

    icon.innerHTML = `
      <svg viewBox="0 0 24 24">
        ${icons[project.icon]}
      </svg>
    `;

    const details = document.createElement("div");
    details.className = "project-details";

    const title = document.createElement("h2");
    title.textContent = project.title;

    const description = document.createElement("p");
    description.textContent = project.description;

    const tags = document.createElement("div");
    tags.className = "skill-tags";

    project.skills.forEach(skill => {
      const tag = document.createElement("span");
      tag.textContent = skill;
      tags.append(tag);
    });

    details.append(title, description, tags);
    details.insertAdjacentHTML("afterbegin", window.OfoqPublishers.card(window.OfoqPublishers.forRecord("project", project)));

    const offer = document.createElement("div");
    offer.className = "project-offer";

    const price = document.createElement("p");
    price.className = "project-price";
    price.textContent = money(project.budget);

    const duration = document.createElement("p");
    duration.className = "project-duration";
    duration.textContent =
      `${project.weeks === 1 ? "أسبوع واحد" : project.weeks === 2 ? "أسبوعان" : project.weeks + " أسابيع"}`;

    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "btn btn-orange";
    apply.textContent = "قدّم على المشروع";

    apply.setAttribute(
      "aria-label",
      `قدّم على المشروع: ${project.title}`
    );

    apply.addEventListener("click", () => {
      openApplication(project);
    });

    const detailsLink = document.createElement('a');
    detailsLink.className = 'details-link';
    detailsLink.href = './Project/project.html?id=' + project.id;
    detailsLink.textContent = 'تفاصيل المشروع ←';
    offer.append(price, duration, apply, detailsLink);
    article.append(icon, details, offer);

    return article;
  }

  function render() {
    const list = filteredProjects();

    $("projectList").replaceChildren(
      ...list.map(createProjectCard)
    );

    $("emptyState").hidden = list.length > 0;

    $("resultCount").textContent =
      `${list.length} من المشاريع المتاحة`;

    renderChips();
  }

  function renderChips() {
    $("activeFilters").replaceChildren();

    const keys = [
      "query",
      "category",
      "budget",
      "deadline",
      "projectType",
      "skills"
    ];

    for (const key of keys) {
      if (!state[key]) continue;

      let label = state[key];

      if (
        ["category", "budget", "deadline", "projectType"]
          .includes(key)
      ) {
        label = $(key).selectedOptions[0].textContent;
      }

      if (key === "query") {
        label = `بحث: ${label}`;
      }

      if (key === "skills") {
        label = `مهارة: ${label}`;
      }

      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "filter-chip";
      chip.textContent = label;

      const close = document.createElement("span");
      close.textContent = "×";
      close.setAttribute("aria-hidden", "true");

      chip.append(close);

      chip.setAttribute(
        "aria-label",
        `إزالة الفلتر: ${label}`
      );

      chip.addEventListener("click", () => {
        state[key] = "";

        const inputId =
          key === "query" ? "searchQuery" : key;

        $(inputId).value = "";

        render();
      });

      $("activeFilters").append(chip);
    }
  }

  function clearAll() {
    const keys = [
      "query",
      "category",
      "budget",
      "deadline",
      "projectType",
      "skills"
    ];

    keys.forEach(key => {
      state[key] = "";
    });

    $("filterForm").reset();
    $("searchQuery").value = "";

    render();
  }

  $("filterForm").addEventListener("submit", event => {
    event.preventDefault();

    const keys = [
      "category",
      "budget",
      "deadline",
      "projectType",
      "skills"
    ];

    keys.forEach(key => {
      state[key] = $(key).value.trim();
    });

    render();
  });

  $("searchForm").addEventListener("submit", event => {
    event.preventDefault();

    state.query = $("searchQuery").value.trim();

    render();
  });

  $("searchQuery").addEventListener("search", () => {
    if (!$("searchQuery").value) {
      state.query = "";
      render();
    }
  });

  $("sortBy").addEventListener("change", () => {
    state.sort = $("sortBy").value;
    render();
  });

  $("clearFilters").addEventListener("click", clearAll);
  $("resetEmpty").addEventListener("click", clearAll);

  function openApplication(project) {
    $("applicationForm").reset();
    $("applicationForm").hidden = false;
    $("applicationSuccess").hidden = true;

    $("applyTitle").textContent = project.title;

    $("applySummary").textContent =
      `${money(project.budget)} · ` +
      `${project.weeks === 1 ? "أسبوع واحد" : project.weeks === 2 ? "أسبوعان" : project.weeks + " أسابيع"} · ` +
      `${project.type === "fixed" ? "بسعر ثابت" : "مشروع مستمر"}`;

    bootstrap.Modal
      .getOrCreateInstance($("applyModal"))
      .show();
  }

  $("applicationForm").addEventListener("submit", event => {
    event.preventDefault();

    if (!$("applicationForm").reportValidity()) return;

    $("applicationForm").hidden = true;
    $("applicationSuccess").hidden = false;

    $("applicationSuccess").setAttribute("tabindex", "-1");
    $("applicationSuccess").focus();
  });

  $("applyModal").addEventListener("shown.bs.modal", () => {
    $("applicantName").focus();
  });

  $("applyModal").addEventListener("hidden.bs.modal", () => {
    $("applicationForm").reset();
    $("applicationForm").hidden = false;
    $("applicationSuccess").hidden = true;
  });

  $("year").textContent = new Date().getFullYear();

  render();

}).catch(error => {
  console.error("Freelance page:", error);
});
})();

(function () {
// The community is a screen preview; posting does not change the feed.
document.getElementById('openPost').addEventListener('click', function () {
  bootstrap.Modal.getOrCreateInstance(document.getElementById('postModal')).show();
});

})();
