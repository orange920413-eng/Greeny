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
async function restore() {
  try {
    const response = await fetch('https://gin-greeny-shanghai-2027.bettergreeny.chatgpt.site/api/reply', { headers: {Authorization: 'Bearer ' + editKey} });
    if (!response.ok) return;
    const saved = await response.json();
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
  try {
    const attending = form.elements.attending.value === 'yes';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const result = await fetch('https://gin-greeny-shanghai-2027.bettergreeny.chatgpt.site/api/reply', {
      method: 'POST', signal: controller.signal,
      headers: {'Content-Type': 'text/plain;charset=UTF-8'},
      body: JSON.stringify({editKey, name, attending, guests: attending ? Number(count.value) : 0})
    }).finally(() => clearTimeout(timeout));
    if (!result.ok || (await result.json()).ok !== true) throw new Error();
    showStatus('谢谢，已收到你的回执。', 'Thank you, your reply is saved.');
  } catch {
    document.querySelector('#backup').open=true;
    showStatus('未能确认提交。请重试，或把下面的回执发给我们。', 'Please retry or send the message below.');
  } finally { button.disabled = false; }
});

const backup = document.getElementById('backup');
const message = backup.querySelector('textarea');
function updateMessage(){
  const guest=form.elements.guest.value.trim() || '（填写姓名）';
  const answer=form.elements.attending.value;
  const reply=answer==='yes' ? '出席，含我共 '+(count.value || '___')+' 人' : answer==='no' ? '无法出席' : '（出席，共___人 / 无法出席）';
  message.value='晓宇、诗宜，你们好！我是'+guest+'。我的婚礼回执：'+reply+'。';
}
form.addEventListener('input',updateMessage);
backup.addEventListener('toggle',updateMessage);
document.querySelector('#copy').addEventListener('click',async()=>{
  if (!form.reportValidity()) return;
  updateMessage();
  try {await navigator.clipboard.writeText(message.value);document.querySelector('#copied').textContent='已复制，请粘贴到微信发给新人。 Copied. Please send it to the couple.';}
  catch {message.focus();message.select();document.querySelector('#copied').textContent='请长按复制，然后发给新人。 Select and copy the message.';}
});
updateMessage();

const songButton = document.getElementById('load-song');
if (songButton) {
  songButton.addEventListener('click', () => {
    songButton.replaceWith(document.getElementById('song-template').content.cloneNode(true));
  });
}
