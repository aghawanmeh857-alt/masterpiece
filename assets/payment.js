// Payment-method UI only: no card data, network requests or persistent storage.
(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'payment-dialog';
  dialog.id = 'paymentDialog';
  dialog.setAttribute('aria-labelledby', 'paymentTitle');
  dialog.setAttribute('aria-describedby', 'paymentNotice');
  dialog.innerHTML = `
    <div class="payment-heading"><div><p class="payment-eyebrow">سعي / الدفع</p><h2 id="paymentTitle">إتمام الدفع</h2></div><button class="payment-close" type="button" aria-label="إغلاق نافذة الدفع">×</button></div>
    <div class="payment-summary"><div><span id="paymentKind"></span><h3 id="paymentItem"></h3></div><div class="payment-total"><span>المبلغ الإجمالي</span><strong id="paymentAmount"></strong></div></div>
    <div class="payment-billing">
      <h3>معلومات الفوترة</h3>
      <label for="billingName">الاسم الكامل</label><input id="billingName" type="text" autocomplete="off" placeholder="الاسم كما يظهر على الفاتورة" maxlength="150">
      <label for="billingCountry">الدولة أو المنطقة</label><select id="billingCountry"><option>الأردن</option><option>فلسطين</option><option>السعودية</option><option>الإمارات</option><option>مصر</option><option>دولة أخرى</option></select>
      <label for="billingAddress">العنوان</label><input id="billingAddress" type="text" autocomplete="off" placeholder="المدينة، الشارع" maxlength="250">
      <label for="billingInvoiceName">اسم مختلف على الفاتورة <small>(اختياري)</small></label><input id="billingInvoiceName" type="text" autocomplete="off" maxlength="150">
    </div>
    <fieldset class="payment-methods"><legend>طريقة الدفع</legend>
      <label class="payment-method"><input type="radio" name="paymentMethod" value="card" checked><span class="payment-method-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 9h20M6 15h4"/></svg></span><span><strong>بطاقة بنكية</strong><small>Visa · Mastercard</small></span></label>
      <label class="payment-method"><input type="radio" name="paymentMethod" value="wallet"><span class="payment-method-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M20 12h-6v5h6"/></svg></span><span><strong>محفظة إلكترونية</strong><small>الدفع من رصيد المحفظة</small></span></label>
    </fieldset>
    <div id="paymentCardPreview" class="payment-card-fields">
      <label for="demoCardNumber">رقم البطاقة <small>بيانات توضيحية</small></label>
      <div class="payment-card-number"><input id="demoCardNumber" type="text" value="4242 4242 4242 4242" dir="ltr" readonly><span aria-hidden="true">VISA · Mastercard</span></div>
      <div class="payment-card-row"><div><label for="demoCardExpiry">تاريخ الانتهاء</label><input id="demoCardExpiry" type="text" value="MM / YY" dir="ltr" readonly></div><div><label for="demoCardSecurity">رمز الأمان</label><input id="demoCardSecurity" type="text" value="•••" readonly></div></div>
    </div>
    <p id="paymentMethodHint" class="payment-hint">يمكنك استخدام بطاقة Visa أو Mastercard.</p>
    <p id="paymentNotice" class="payment-notice">واجهة تجريبية لا تخصم أي مبلغ ولا تطلب بيانات دفع حقيقية.</p>
    <p id="paymentStatus" class="payment-status" role="status" hidden></p>
    <div class="payment-actions"><button class="payment-continue" type="button">متابعة الدفع <span aria-hidden="true">←</span></button><button class="payment-cancel" type="button">إلغاء</button></div>`;
  document.body.append(dialog);
  const layout = document.createElement('div');
  layout.className = 'payment-layout';
  const details = document.createElement('div');
  details.className = 'payment-details';
  const summary = document.createElement('aside');
  summary.className = 'payment-order-card';
  summary.setAttribute('aria-label', 'ملخص الطلب');
  const summaryTitle = document.createElement('h3');
  summaryTitle.textContent = 'ملخص الطلب';
  summary.append(summaryTitle, dialog.querySelector('.payment-summary'));
  for (const selector of ['.payment-billing', '.payment-methods', '.payment-card-fields', '.payment-hint']) details.append(dialog.querySelector(selector));
  for (const selector of ['.payment-notice', '.payment-status', '.payment-actions']) summary.append(dialog.querySelector(selector));
  layout.append(details, summary);
  dialog.append(layout);
  const get = id => dialog.querySelector('#' + id);
  let opener = null;
  let completion = null;
  window.OfoqPayment = {
    open({title, amount, kind = 'رسوم المشاركة', onComplete}) {
      const trigger = document.createElement('button');
      trigger.dataset.paymentAmount = String(amount);
      trigger.dataset.paymentTitle = title;
      trigger.dataset.paymentKind = kind;
      openPayment(trigger, onComplete);
    }
  };

  function openPayment(trigger, onComplete = null) {
    const amount = Number(trigger.dataset.paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    opener = trigger;
    completion = onComplete;
    dialog.querySelector('.payment-continue').disabled = false;
    dialog.querySelector('.payment-continue').textContent = 'تأكيد الدفع التجريبي';
    dialog.querySelector('.payment-cancel').textContent = 'إلغاء';
    get('paymentKind').textContent = trigger.dataset.paymentKind || 'تفاصيل الدفع';
    get('paymentItem').textContent = trigger.dataset.paymentTitle;
    get('paymentAmount').textContent = new Intl.NumberFormat('ar-JO', {maximumFractionDigits: 2}).format(amount) + ' دولار';
    dialog.querySelector('[value="card"]').checked = true;
    get('paymentCardPreview').hidden = false;
    for (const id of ['billingName', 'billingAddress', 'billingInvoiceName']) get(id).value = '';
    get('billingCountry').selectedIndex = 0;
    get('paymentMethodHint').textContent = 'يمكنك استخدام بطاقة Visa أو Mastercard.';
    get('paymentStatus').hidden = true;
    get('paymentStatus').textContent = '';
    dialog.showModal();
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('button[data-payment-title]');
    if (!trigger) return;
    event.preventDefault();
    const modal = trigger.closest('.modal.show');
    if (modal && window.bootstrap) {
      modal.addEventListener('hidden.bs.modal', () => openPayment(trigger), {once: true});
      window.bootstrap.Modal.getInstance(modal).hide();
    } else openPayment(trigger);
  });
  dialog.addEventListener('change', event => {
    if (event.target.name !== 'paymentMethod') return;
    get('paymentCardPreview').hidden = event.target.value !== 'card';
    get('paymentMethodHint').textContent = event.target.value === 'card' ? 'يمكنك استخدام بطاقة Visa أو Mastercard.' : 'ستُكمل الدفع من محفظتك عند تفعيل خدمة الدفع.';
    get('paymentStatus').hidden = true;
  });
  dialog.querySelector('.payment-continue').addEventListener('click', () => {
    if (dialog.querySelector('.payment-continue').disabled) return;
    const card = dialog.querySelector('[value="card"]').checked;
    if (completion) {
      const finish = completion; completion = null;
      dialog.close(); finish(); return;
    }
    const id = opener.closest('[data-item]')?.dataset.item || new URLSearchParams(location.search).get('id') || opener.dataset.paymentTitle;
    const path = new URL('../Events/Event/event.html', [...document.scripts].find(script => script.src.endsWith('/assets/payment.js')).src);
    path.searchParams.set('id', id);
    window.OfoqFrontend.register(id, opener.dataset.paymentTitle, path.href);
    get('paymentStatus').textContent = 'تم تأكيد التسجيل ضمن التجربة باستخدام ' + (card ? 'البطاقة البنكية.' : 'المحفظة الإلكترونية.') + ' لم يُخصم أي مبلغ. تجد الفعالية في لوحة متابعتك.';
    get('paymentStatus').hidden = false;
    opener.textContent = '✓ مسجّل';
    dialog.querySelector('.payment-continue').disabled = true;
    dialog.querySelector('.payment-continue').textContent = '✓ تم التسجيل';
    dialog.querySelector('.payment-cancel').textContent = 'إغلاق';
  });
  for (const button of dialog.querySelectorAll('.payment-close, .payment-cancel')) button.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    get('paymentStatus').textContent = '';
    get('paymentStatus').hidden = true;
    if (opener?.isConnected && opener.getClientRects().length) opener.focus();
  });
})();
