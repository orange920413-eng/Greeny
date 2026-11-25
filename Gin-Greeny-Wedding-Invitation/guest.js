const form = document.getElementById('rsvp');
const party = document.getElementById('party');
const count = document.getElementById('count');
const statusLine = document.getElementById('status');
function showStatus(chinese, english) {
  const translation = document.createElement('i');
  translation.lang = 'en';
  translation.textContent = english;
  statusLine.replaceChildren(chinese, translation);
}
let editKey;
try { editKey = localStorage.getItem('gg-rsvp-key'); } catch {}
editKey ||= crypto.randomUUID();
try { localStorage.setItem('gg-rsvp-key', editKey); } catch {}
function showCount() {
  party.hidden = form.elements.attending.value !== 'yes';
  count.required = !party.hidden;
}
form.addEventListener('change', showCount);
async function restore() {
  try {
    const response = await fetch('/api/reply', { headers: {Authorization: 'Bearer ' + editKey} });
    if (!response.ok) return;
    const saved = await response.json();
    if (!saved || form.matches(':focus-within')) return;
    form.elements.guest.value = saved.name;
    form.elements.attending.value = saved.attending ? 'yes' : 'no';
    count.value = saved.guests || 1;
    showCount();
    showStatus('已收到你的回执。你可以在此修改。', 'Your reply is saved. You can update it here.');
  } catch {}
}
restore();
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  const name = form.elements.guest.value.trim();
  if (!name) { form.elements.guest.focus(); return; }
  button.disabled = true;
  showStatus('正在提交…', 'Sending…');
  try {
    const attending = form.elements.attending.value === 'yes';
    const result = await fetch('/api/reply', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + editKey},
      body: JSON.stringify({name, attending, guests: attending ? Number(count.value) : 0})
    });
    if (!result.ok) throw new Error();
    showStatus('谢谢，已收到你的回执。', 'Thank you, your reply is saved.');
  } catch {
    showStatus('回执未确认，请重试。', 'We couldn’t confirm your reply. Please try again.');
  } finally { button.disabled = false; }
});
