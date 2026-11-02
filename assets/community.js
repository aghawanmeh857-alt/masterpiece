// Community posts and comments exist in memory for this visit only.
(() => {
  const get = id => document.getElementById(id);
  if (!get('postForm')) return;
  const app = window.OfoqFrontend;
  const form = get('postForm');
  let editingId=null;
  window.OfoqPublishing.mount(form);
  const weeks=document.createElement('label');weeks.textContent='مدة تنفيذ المشروع بالأسابيع';weeks.innerHTML+='<input name="weeks" type="number" min="1" max="104" value="3" required class="form-control">';form.insertBefore(weeks,form.querySelector('.publisher-fields'));
  const publish=idea=>{app.publishContent('projects',{id:idea.id,title:idea.title,description:idea.description,category:idea.category,budget:Number(idea.budget),weeks:Number(idea.weeks),skills:idea.skills.split(/[,،]/).map(s=>s.trim()).filter(Boolean),details:idea.details,pdf:idea.pdf,coverImage:idea.coverImage,owner:idea.name,publisherName:idea.name,publisherRole:'member',status:'published',icon:'code',type:'fixed'});dispatchEvent(new Event('ofoq:projects-changed'));};
  form.addEventListener('reset',()=>{editingId=null;});
  const text = (card, selector, value) => { card.querySelector(selector).textContent = value; };
  function render() {
    get('ideaFeed').replaceChildren();
    get('community').hidden = app.ideas.length === 0;
    for (const idea of app.ideas) {
      const card = get('ideaCardTemplate').content.firstElementChild.cloneNode(true);
      card.id = 'idea-' + idea.id;
      text(card, '.idea-avatar', idea.name[0]); text(card, '.idea-author', idea.name);
      text(card, '.idea-category', idea.category); text(card, '.idea-title', idea.title);
      text(card, '.idea-description', idea.description); text(card, '.idea-budget', idea.budget ? '$' + idea.budget : 'الميزانية بالاتفاق');
      for (const skill of idea.skills.split(/[,،]/).map(value => value.trim()).filter(Boolean)) {
        const tag = document.createElement('span'); tag.textContent = skill; card.querySelector('.idea-skills').append(tag);
      }
      const comments = card.querySelector('.idea-comments');
      const showComments = () => {
        comments.replaceChildren();
        text(card, '.comment-count', idea.comments.length + ' تعليقات');
        for (const comment of idea.comments) {
          const row = document.createElement('p'), name = document.createElement('strong');
          name.textContent = comment.name + ': '; row.append(name, document.createTextNode(comment.text)); comments.append(row);
        }
      };
      showComments();
      const commentForm = card.querySelector('form');
      commentForm.querySelector('.comment-name').value = app.profile.name;
      commentForm.addEventListener('submit', event => {
        event.preventDefault();
        const name = commentForm.querySelector('.comment-name'), message = commentForm.querySelector('.comment-message');
        name.value = name.value.trim(); message.value = message.value.trim();
        name.setCustomValidity(name.value.length >= 2 ? '' : 'اكتب اسمًا من حرفين على الأقل.');
        message.setCustomValidity(message.value ? '' : 'اكتب تعليقًا.');
        if (!commentForm.reportValidity()) return;
        idea.comments.push({name: name.value, text: message.value}); message.value = ''; showComments();
        text(card, '.comment-status', 'أُضيف تعليقك.');
      });
      commentForm.addEventListener('input', event => event.target.setCustomValidity(''));
      const edit=document.createElement('button');edit.type='button';edit.className='text-button';edit.textContent='تعديل مشروعي';edit.addEventListener('click',()=>{form.reset();editingId=idea.id;for(const [id,key]of [['postName','name'],['postTitle','title'],['postDescription','description'],['postCategory','category'],['postBudget','budget'],['postSkills','skills']])get(id).value=idea[key]||'';form.elements.weeks.value=idea.weeks||3;window.OfoqPublishing.fill(form,idea);bootstrap.Modal.getOrCreateInstance(get('postModal')).show();});card.append(edit);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.textContent = 'حذف منشوري';
      remove.addEventListener('click', () => {
        app.ideas = app.ideas.filter(row => row.id !== idea.id);
        app.contentChanges.projects=(app.contentChanges.projects||[]).filter(row=>row.id!==idea.id);((app.removedContent||={}).projects||=[]).push(idea.id);dispatchEvent(new Event('ofoq:projects-changed'));
        render();
      });
      card.append(remove); get('ideaFeed').append(card);
    }
  }
  form.addEventListener('input', event => event.target.setCustomValidity(''));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    for (const [id, min] of [['postName',2],['postTitle',5],['postDescription',20]]) {
      get(id).value = get(id).value.trim(); get(id).setCustomValidity(get(id).value.length >= min ? '' : 'أدخل ' + min + ' أحرف على الأقل.');
    }
    if (!form.reportValidity()) return;
    let attachment;try{attachment=await window.OfoqPublishing.read(form);}catch{return;}
    const old=app.ideas.find(row=>row.id===editingId);
    const idea = {...attachment,weeks:Number(form.elements.weeks.value),id: old?.id||crypto.randomUUID(), name:get('postName').value, title:get('postTitle').value, description:get('postDescription').value, category:get('postCategory').value, budget:get('postBudget').value, skills:get('postSkills').value, comments:old?.comments||[]};
    if(old)Object.assign(old,idea);else app.ideas.unshift(idea);publish(idea);render(); form.reset();
    const modal = bootstrap.Modal.getInstance(get('postModal'));
    get('postModal').addEventListener('hidden.bs.modal', () => get('idea-' + idea.id)?.focus(), {once:true});
    modal.hide();
  });
  get('postModal').addEventListener('show.bs.modal', () => { if (!get('postName').value) get('postName').value = app.profile.name; });
  render();
})();
