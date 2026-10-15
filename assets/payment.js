// Payment-method UI only: no card data, network requests or persistent storage.
(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'payment-dialog';
  dialog.id = 'paymentDialog';
  dialog.setAttribute('aria-labelledby', 'paymentTitle');
  dialog.setAttribute('aria-describedby', 'paymentNotice');
  dialog.innerHTML = `
    <div class="payment-heading"><div><p class="payment-eyebrow">أفق / الدفع</p><h2 id="paymentTitle">اختر طريقة الدفع</h2></div><button class="payment-close" type="button" aria-label="إغلاق نافذة الدفع">×</button></div>
    <div class="payment-summary"><div><span id="paymentKind"></span><h3 id="paymentItem"></h3></div><div class="payment-total"><span>المبلغ الإجمالي</span><strong id="paymentAmount"></strong></div></div>
    <fieldset class="payment-methods"><legend>كيف تفضّل الدفع؟</legend>
      <label class="payment-method"><input type="radio" name="paymentMethod" value="card" checked><span class="payment-method-icon" aria-hidden="true">▣</span><span><strong>بطاقة بنكية</strong><small>Visa · Mastercard</small></span><span class="payment-check" aria-hidden="true">✓</span></label>
      <label class="payment-method"><input type="radio" name="paymentMethod" value="wallet"><span class="payment-method-icon" aria-hidden="true">◈</span><span><strong>محفظة إلكترونية</strong><small>الدفع من رصيد المحفظة</small></span><span class="payment-check" aria-hidden="true">✓</span></label>
    </fieldset>
    <p id="paymentMethodHint" class="payment-hint">يمكنك استخدام بطاقة Visa أو Mastercard.</p>
    <p id="paymentNotice" class="payment-notice">واجهة تجريبية لا تخصم أي مبلغ ولا تطلب بيانات دفع حقيقية.</p>
    <p id="paymentStatus" class="payment-status" role="status" hidden></p>
    <div class="payment-actions"><button class="payment-continue" type="button">متابعة الدفع <span aria-hidden="true">←</span></button><button class="payment-cancel" type="button">إلغاء</button></div>`;
  document.body.append(dialog);
  const get = id => dialog.querySelector('#' + id);
  let opener = null;

  function openPayment(trigger) {
    const amount = Number(trigger.dataset.paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    opener = trigger;
    get('paymentKind').textContent = trigger.dataset.paymentKind || 'تفاصيل الدفع';
    get('paymentItem').textContent = trigger.dataset.paymentTitle;
    get('paymentAmount').textContent = new Intl.NumberFormat('ar-JO', {maximumFractionDigits: 2}).format(amount) + ' دولار';
    dialog.querySelector('[value="card"]').checked = true;
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
    get('paymentMethodHint').textContent = event.target.value === 'card' ? 'يمكنك استخدام بطاقة Visa أو Mastercard.' : 'ستُكمل الدفع من محفظتك عند تفعيل خدمة الدفع.';
    get('paymentStatus').hidden = true;
  });
  dialog.querySelector('.payment-continue').addEventListener('click', () => {
    const card = dialog.querySelector('[value="card"]').checked;
    get('paymentStatus').textContent = 'طريقة الدفع المختارة: ' + (card ? 'بطاقة بنكية.' : 'محفظة إلكترونية.') + ' الدفع الفعلي غير متاح في النسخة الحالية، ولم يُخصم أي مبلغ.';
    get('paymentStatus').hidden = false;
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
