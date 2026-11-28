// Place the couple's licensed recording next to index.html.
async function prepareMusic() {
  const source = './wedding-song.mp3';
  try {
    const response = await fetch(source, {method: 'HEAD'});
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) return;
  } catch { return; }

  const audio = new Audio(source);
  audio.loop = true;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'music-toggle';
  const label = () => {
    toggle.textContent = audio.paused ? '♫ 开启音乐' : '♫ 暂停音乐';
    toggle.setAttribute('aria-pressed', String(!audio.paused));
  };
  label();
  document.body.append(toggle);
  const start = () => audio.play().catch(() => {});
  const firstTouch = event => {
    if (event.target !== toggle) start();
    document.removeEventListener('click', firstTouch, true);
  };
  document.addEventListener('click', firstTouch, true);
  toggle.addEventListener('click', () => audio.paused ? start() : audio.pause());
  audio.addEventListener('playing', () => {
    document.removeEventListener('click', firstTouch, true);
    label();
  });
  audio.addEventListener('pause', label);
  start();
}
prepareMusic();
