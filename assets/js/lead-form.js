/* Avenir Solutions — comportements des formulaires de pré-demande.
   Transport inchangé : POST FormSubmit (formulaire) et AJAX FormSubmit (copie WhatsApp). */
(function () {
  'use strict';
  var form = document.querySelector('form[data-lead-form]');
  if (!form) return;
  var status = document.getElementById('formStatus');

  function say(text, link) {
    if (!status) return;
    status.textContent = text;
    if (link) {
      status.appendChild(document.createTextNode(' '));
      var a = document.createElement('a');
      a.href = link.href; a.textContent = link.label; a.target = '_blank'; a.rel = 'noopener noreferrer';
      status.appendChild(a);
    }
  }

  /* Sélecteur de métier (page décennale) */
  var metier = document.getElementById('metier');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.metier'));
  function mark(value) {
    chips.forEach(function (b) {
      var on = b.getAttribute('data-v') === value;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  chips.forEach(function (b) {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { metier.value = b.getAttribute('data-v'); mark(metier.value); });
  });
  if (metier && chips.length) metier.addEventListener('input', function () { mark(metier.value); });

  /* Anti double-envoi sur l'envoi e-mail */
  var submit = form.querySelector('button[type="submit"]');
  var submitLabel = submit ? submit.textContent : '';
  form.addEventListener('submit', function () {
    if (submit) { submit.disabled = true; submit.textContent = 'Envoi en cours…'; }
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && submit) { submit.disabled = false; submit.textContent = submitLabel; }
  });

  /* Demande par WhatsApp : copie e-mail confirmée, puis ouverture de WhatsApp */
  var wa = document.getElementById('whatsappRequest');
  if (!wa) return;
  wa.addEventListener('click', function () {
    if (!form.reportValidity()) return;
    var previous = wa.textContent;
    wa.disabled = true;
    wa.textContent = 'Enregistrement de la demande…';
    say('');

    var fields = (wa.getAttribute('data-fields') || '').split(';').filter(Boolean).map(function (p) { return p.split('|'); });
    var lines = [wa.getAttribute('data-intro')];
    fields.forEach(function (f) {
      var el = document.getElementById(f[0]);
      var v = el ? el.value.trim() : '';
      if (!v && f[0] === 'mail') v = 'Non renseigné';
      lines.push(f[1] + ' : ' + v);
    });
    var msg = lines.join('\n');
    var waUrl = 'https://wa.me/33621381079?text=' + encodeURIComponent(msg);

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    data._subject = wa.getAttribute('data-subject');
    data._captcha = 'false';
    data.canal = 'WhatsApp (demande préparée)';
    data.message = msg;

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);
    fetch(wa.getAttribute('data-endpoint'), {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !(j.success === true || j.success === 'true')) throw new Error(j.message || 'Envoi non confirmé');
      });
    }).then(function () {
      clearTimeout(timer);
      window.location.assign(waUrl);
    }).catch(function () {
      clearTimeout(timer);
      wa.disabled = false; wa.textContent = previous;
      say('La copie par e-mail n’a pas pu être confirmée.', { href: waUrl, label: 'Continuer quand même vers WhatsApp' });
    });
  });
})();
