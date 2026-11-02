(() => {
  const get = id => document.getElementById(id);
  const form = get('detailCommentForm');
  if (!form) return;
  const app = window.OfoqFrontend;
  const key = location.pathname + '?id=' + new URLSearchParams(location.search).get('id');
  const comments = (app.comments ||= {})[key] ||= [];
  get('commentName').value = app.profile.name;
  function render() {
    get('detailComments').replaceChildren(...comments.map(comment => {
      const row = document.createElement('p'), name = document.createElement('strong');
      row.className = 'detail-comment'; name.textContent = comment.name + ': ';
      row.append(name, document.createTextNode(comment.text)); return row;
    }));
  }
  form.addEventListener('input', event => event.target.setCustomValidity(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = get('commentName'), message = get('commentText');
    name.value = name.value.trim(); message.value = message.value.trim();
    name.setCustomValidity(name.value.length >= 2 ? '' : 'اكتب اسمًا من حرفين على الأقل.');
    message.setCustomValidity(message.value ? '' : 'اكتب تعليقًا.');
    if (!form.reportValidity()) return;
    comments.push({name: name.value, text: message.value}); message.value = '';
    render(); get('commentStatus').textContent = 'أُضيف تعليقك خلال هذه الزيارة.';
  });
  render();
})();
