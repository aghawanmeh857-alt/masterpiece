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


if (window.OfoqFrontend?.contentFor) projects.splice(0, projects.length, ...window.OfoqFrontend.contentFor('projects',projects));

(function () {
Promise.resolve().then(() => {
  if (!window.componentsReady || typeof window.componentsReady.then !== 'function') {
    throw new Error('Page initialization is unavailable.');
  }
  return window.componentsReady;
}).then(() => {



  const $ = id => document.getElementById(id);

  const favoritesKey = 'ofoq-project-favorites-v1';
  let savedProjects = new Set();
  function readFavorites() {
    try {
      const stored = JSON.parse(window.OfoqFrontend.memory.getItem(favoritesKey) || '[]');
      savedProjects = new Set(Array.isArray(stored) ? stored.filter(id => projects.some(project => project.id === id)) : []);
    } catch { savedProjects = new Set(); }
  }
  readFavorites();
  const state = {
    savedOnly: new URLSearchParams(location.search).get('favorites') === '1',
    query: "",
    category: "",
    budget: "",
    deadline: "",
    projectType: "",
    skills: "",
    sort: "recent"
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
      if (state.savedOnly && !savedProjects.has(project.id)) return false;
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
    article.ofoqDetails = project;

    const cover = document.createElement('a');
    cover.className = 'project-cover';
    cover.href = './Project/project.html?id=' + project.id;
    cover.setAttribute('aria-label', 'تفاصيل ' + project.title);
    const image = document.createElement('img');
    image.src = '../assets/project-covers/' + project.icon + '.svg';
    image.alt = ''; image.width = 800; image.height = 450; image.loading = 'lazy';
    cover.append(image);
    const publisher = window.OfoqPublishers.forRecord('project', project);
    const avatar = document.createElement('img');
    avatar.className = 'cover-avatar'; avatar.src = publisher.avatar;
    avatar.alt = publisher.name; avatar.width = 42; avatar.height = 42;
    cover.append(avatar);

    const details = document.createElement("div");
    details.className = "project-details";

    const title = document.createElement("h2");
    const titleLink = document.createElement('a');
    titleLink.href = cover.href; titleLink.textContent = project.title;
    title.append(titleLink);

    const category = document.createElement('p');
    category.className = 'project-category';
    category.textContent = ({development: 'برمجة وتطوير', design: 'تصميم', marketing: 'تسويق رقمي'}[project.category] || 'خدمات مهنية') + ' / ' + project.skills.join('، ');
    details.append(title, category);
    const description = document.createElement('p');
    description.className = 'project-summary';
    description.textContent = project.description;
    const skills = document.createElement('div');
    skills.className = 'project-skill-tags';
    for (const skill of project.skills) { const tag = document.createElement('span'); tag.textContent = skill; skills.append(tag); }
    details.append(description, skills);
    const owner = document.createElement('a');
    owner.className = 'project-owner'; owner.href = window.OfoqPublishers.url('Profile', publisher.id);
    owner.textContent = publisher.name;
    details.append(owner);

    const offer = document.createElement("div");
    offer.className = "project-offer";

    const price = document.createElement("p");
    price.className = "project-price";
    price.textContent = 'الميزانية ' + money(project.budget);

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
    const favorite = document.createElement('button');
    favorite.type = 'button';
    favorite.className = 'project-favorite-button';
    const saved = savedProjects.has(project.id);
    favorite.textContent = saved ? '♥ في المفضلة' : '♡ أضف للمفضلة';
    favorite.setAttribute('aria-pressed', String(saved));
    favorite.setAttribute('aria-label', (saved ? 'إزالة من المفضلة: ' : 'إضافة للمفضلة: ') + project.title);
    favorite.addEventListener('click', () => {
      if (savedProjects.has(project.id)) savedProjects.delete(project.id);
      else savedProjects.add(project.id);
      const nowSaved = savedProjects.has(project.id);
      try {
        window.OfoqFrontend.memory.setItem(favoritesKey, JSON.stringify([...savedProjects]));
        $('favoritesStatus').textContent = nowSaved ? 'أُضيف المشروع إلى المفضلة.' : 'أُزيل المشروع من المفضلة.';
      } catch {
        $('favoritesStatus').textContent = 'تم تحديث المفضلة لهذه الجلسة؛ تعذّر حفظها في المتصفح.';
      }
      render();
    });
    offer.append(price, duration, favorite, apply, detailsLink);
    article.append(cover, details, offer);

    return article;
  }

  function render() {
    const list = filteredProjects();
    $('projectFavoritesCount').textContent = savedProjects.size;
    $('project-favorites').setAttribute('aria-pressed', String(state.savedOnly));

    $("projectList").replaceChildren(
      ...list.map(createProjectCard)
    );

    $("emptyState").hidden = list.length > 0;

    $("resultCount").textContent =
      `${list.length} من المشاريع المتاحة`;

    renderChips();
    renderCategories();
  }

  function renderCategories() {
    const labels = {'': 'كل المشاريع', development: 'برمجة وتطوير', design: 'تصميم', marketing: 'تسويق رقمي'};
    $('categoryList').replaceChildren(...Object.entries(labels).map(([value, label]) => {
      const button = document.createElement('button'); button.type = 'button';
      button.setAttribute('aria-pressed', String(state.category === value));
      const name = document.createElement('span'); name.textContent = label;
      const count = document.createElement('span'); count.className = 'category-count';
      count.textContent = projects.filter(project => !value || project.category === value).length;
      button.append(name, count);
      button.addEventListener('click', () => { state.category = value; $('category').value = value; render(); });
      return button;
    }));
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
    state.savedOnly = false;
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

  function applyFilters() {
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
    state.query = $("searchQuery").value.trim();
    render();
  }

  $("filterForm").addEventListener("change", applyFilters);
  $("skills").addEventListener("input", applyFilters);
  $("filterForm").addEventListener("submit", event => {
    event.preventDefault();
    applyFilters();
  });

  $("searchForm").addEventListener("submit", event => {
    event.preventDefault();

    applyFilters();
  });

  $("searchQuery").addEventListener("input", applyFilters);

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
  $('project-favorites').addEventListener('click', () => { state.savedOnly = !state.savedOnly; render(); });
  addEventListener('storage', event => {
    if (event.key === favoritesKey || event.key === null) { readFavorites(); render(); }
  });
  addEventListener('pageshow', () => { readFavorites(); render(); });

  function openApplication(project) {
    window.OfoqFrontend.activeApplication = { kind: 'project', id: project.id, title: project.title, href: new URL('Project/project.html?id=' + project.id, location.href).href };
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

  addEventListener('ofoq:projects-changed',()=>{projects.splice(0,projects.length,...window.OfoqFrontend.contentFor('projects',projects));render();});
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
