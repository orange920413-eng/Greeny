const alternative = document.getElementById('alternative');
alternative.addEventListener('toggle', () => {
  const frame = alternative.querySelector('iframe');
  if (alternative.open && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
});
const form = document.getElementById('rsvp');
const party = document.getElementById('party');
const count = document.getElementById('count');
const statusLine = document.getElementById('status');
function showStatus(chinese, english) {
  const translation = document.createElement('i');
  translation.lang = 'en';
  translation.textContent = english;
  statusLine.textContent = chinese;
  statusLine.appendChild(translation);
}
let editKey;
try { editKey = localStorage.getItem('gg-rsvp-key'); } catch {}
const hadSavedKey = Boolean(editKey);
if (!editKey) editKey = (crypto.randomUUID && crypto.randomUUID()) || '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(Number(c)^crypto.getRandomValues(new Uint8Array(1))[0]&15>>Number(c)/4).toString(16));
try { localStorage.setItem('gg-rsvp-key', editKey); } catch {}
function showCount() {
  party.hidden = form.elements.attending.value !== 'yes';
  count.required = !party.hidden;
  count.disabled = party.hidden;
}
showCount();
let edited = false;
form.addEventListener('input', () => { edited = true; });
form.addEventListener('change', showCount);
const endpoint = 'https://gin-greeny-shanghai-2027.bettergreeny.chatgpt.site/api/reply';
async function readReply() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(endpoint, {cache: 'no-store', signal: controller.signal,
      headers: {Authorization: 'Bearer ' + editKey}});
    if (!response.ok) throw new Error('Read failed');
    return await response.json();
  } finally { clearTimeout(timer); }
}
async function restore() {
  try {
    const saved = await readReply();
    if (!saved || edited || form.contains(document.activeElement)) return;
    form.elements.guest.value = saved.name;
    form.elements.attending.value = saved.attending ? 'yes' : 'no';
    count.value = saved.guests || 1;
    showCount();
    showStatus('已收到你的回执。你可以在此修改。', 'Your reply is saved. You can update it here.');
  } catch {}
}
if (hadSavedKey) restore();
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  const name = form.elements.guest.value.trim();
  if (!name) { form.elements.guest.focus(); return; }
  button.disabled = true;
  showStatus('正在提交…', 'Sending…');
  const attending = form.elements.attending.value === 'yes';
  const guests = attending ? Number(count.value) : 0;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const result = await fetch(endpoint, {
      method: 'POST', signal: controller.signal,
      headers: {'Content-Type': 'text/plain;charset=UTF-8'},
      body: JSON.stringify({editKey, name, attending, guests})
    }).finally(() => clearTimeout(timeout));
    if (!result.ok || (await result.json()).ok !== true) throw new Error();
    showStatus('谢谢，已收到你的回执。', 'Thank you, your reply is saved.');
  } catch {
    const saved = await readReply().catch(() => null);
    if (saved && saved.name === name && Boolean(saved.attending) === attending && saved.guests === guests) {
      showStatus('谢谢，已收到你的回执。', 'Thank you, your reply is saved.');
    } else {
      showStatus('未能确认收到回执。你可以重试，或填写下方备用表单。', 'Please retry or use the backup form below.');
      alternative.open = true;
    }
  } finally { button.disabled = false; }
});
