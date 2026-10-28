// Local learning prototype. No payments, credentials or server calls.
(() => {
  const base = new URL('./', document.currentScript.src);
  const key = 'ofoq-learning-v1';
  window.OfoqLearning = {
    cover(id) { return new URL('../assets/project-covers/' + ({web:'code', ux:'mobile', portfolio:'dashboard', react:'dashboard', brand:'marketing', marketing:'marketing'}[id] || 'code') + '.svg', base).href; },
    url(id) {
      const url = new URL('Course/course.html', base);
      url.searchParams.set('id', id);
      url.searchParams.set('theme', document.documentElement.dataset.theme || 'light');
      return url.href;
    },
    create(courses) {
      const catalog = new Map(courses.map(course => [course.id, course]));
      let saved = {}; let persistent = true;
      try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { persistent = false; }
      const validIds = value => Array.isArray(value) ? [...new Set(value.filter(id => catalog.has(id)))] : [];
      const state = { enrolled: validIds(saved.enrolled), cart: validIds(saved.cart), wishlist: validIds(saved.wishlist), progress: {}, current: {}, notes: {} };
      state.cart = state.cart.filter(id => !state.enrolled.includes(id));
      for (const course of courses) {
        const valid = index => Number.isInteger(index) && index >= 0 && index < course.syllabus.length;
        state.progress[course.id] = Array.isArray(saved.progress?.[course.id]) ? [...new Set(saved.progress[course.id].filter(valid))] : [];
        state.current[course.id] = valid(saved.current?.[course.id]) ? saved.current[course.id] : 0;
        for (let i = 0; i < course.syllabus.length; i++) {
          const note = saved.notes?.[course.id + ':' + i];
          if (typeof note === 'string') state.notes[course.id + ':' + i] = note.slice(0, 3000);
        }
      }
      function save() {
        try { localStorage.setItem(key, JSON.stringify(state)); persistent = true; } catch { persistent = false; }
        const notice = document.getElementById('storageNotice');
        if (notice) { notice.hidden = persistent; notice.textContent = 'التخزين المحلي غير متاح؛ تغييراتك ستبقى خلال هذه الزيارة فقط.'; }
        return persistent;
      }
      const store = {
        state, save,
        has(id) { return state.enrolled.includes(id); },
        cartSummary(selectedIds) {
          const items = state.cart.map(id => catalog.get(id));
          const selected = new Set(validIds(selectedIds));
          const chosen = items.filter(course => selected.has(course.id));
          const total = items.reduce((sum, course) => sum + course.price, 0);
          const selectedTotal = chosen.reduce((sum, course) => sum + course.price, 0);
          return {items, chosen, total, selectedTotal, unselectedTotal: total - selectedTotal};
        },
        toggle(list, id) {
          if (!['cart','wishlist'].includes(list) || !catalog.has(id) || (list === 'cart' && this.has(id))) return;
          state[list] = state[list].includes(id) ? state[list].filter(value => value !== id) : [...state[list], id]; save();
        },
        enroll(ids) {
          state.enrolled = [...new Set([...state.enrolled, ...validIds(ids)])];
          state.cart = state.cart.filter(id => !state.enrolled.includes(id)); save();
        },
        complete(id, index, done = true) {
          const course = catalog.get(id);
          if (!course || !this.has(id) || !Number.isInteger(index) || index < 0 || index >= course.syllabus.length) return;
          const values = new Set(state.progress[id]); done ? values.add(index) : values.delete(index);
          state.progress[id] = [...values]; save();
        },
        percent(id) { const course = catalog.get(id); return course && this.has(id) ? Math.round(state.progress[id].length / course.syllabus.length * 100) : 0; },
        remember(id, index) { const course = catalog.get(id); if (course && this.has(id) && Number.isInteger(index) && index >= 0 && index < course.syllabus.length) { state.current[id] = index; save(); } },
        note(id, index, text) { if (this.has(id)) { state.notes[id+':'+index] = String(text).slice(0,3000); return save(); } return false; },
        checkout(ids, onComplete) {
          const items = validIds(ids).filter(id => !this.has(id)).map(id => catalog.get(id));
          if (!items.length) return;
          const dialog = document.createElement('dialog'); dialog.className = 'learning-checkout';
          dialog.setAttribute('aria-label', 'إتمام الشراء التجريبي');
          const heading = document.createElement('h2'); heading.textContent = 'خطوتك القادمة تبدأ هنا';
          const notice = document.createElement('p'); notice.textContent = 'شراء تجريبي فقط. لا يُخصم أي مبلغ ولا نطلب بيانات بطاقة.';
          const list = document.createElement('ul');
          items.forEach(course => { const row = document.createElement('li'); row.textContent = course.title + ' — ' + (course.price ? '$'+course.price : 'مجاني'); list.append(row); });
          const total = document.createElement('strong'); total.textContent = 'الإجمالي: $' + items.reduce((sum,item) => sum+item.price,0);
          const methods = document.createElement('fieldset'); methods.innerHTML = '<legend>طريقة الدفع التجريبية</legend><label><input type="radio" name="demoMethod" value="card" checked> بطاقة بنكية</label><label><input type="radio" name="demoMethod" value="wallet"> محفظة إلكترونية</label>';
          const confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'learn-primary'; confirm.textContent = 'تأكيد الشراء التجريبي';
          const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'learn-secondary'; cancel.textContent = 'إلغاء';
          confirm.addEventListener('click', () => { this.enroll(items.map(item => item.id)); dialog.close(); onComplete?.(); });
          cancel.addEventListener('click', () => dialog.close());
          const opener = document.activeElement;
          dialog.addEventListener('close', () => { dialog.remove(); opener?.focus(); }, {once:true});
          dialog.append(heading,notice,list,total,methods,confirm,cancel); document.body.append(dialog); dialog.showModal();
        }
      };
      save(); return store;
    }
  };
})();
