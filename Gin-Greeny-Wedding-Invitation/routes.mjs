const noCache = {'Cache-Control':'no-store'};
const json = (value, status = 200) => Response.json(value, {status, headers:noCache});
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,'0')).join('');
}
export async function handle(request, env, assets, ownerHash) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === '/admin' || path === '/api/summary') {
    if(request.method !== 'GET') return new Response(null,{status:405});
    const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
    if (!email && path === '/admin') return Response.redirect(url.origin+'/signin-with-chatgpt?return_to=%2Fadmin');
    if (!email || await digest(email) !== ownerHash) return json({error:'Forbidden'},403);
    if(path === '/api/summary') {
      const {results} = await env.DB.prepare('SELECT name, attending, guests FROM replies ORDER BY updated_at DESC, name').all();
      return json(results);
    }
  }
  if(path === '/api/reply'){
    const auth=request.headers.get('Authorization') || '';
    if(!/^Bearer [0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(auth)) return json(null,401);
    const key = await digest(auth.slice(7));
    if(request.method === 'GET') return json(await env.DB.prepare('SELECT name, attending, guests FROM replies WHERE key_hash=?').bind(key).first());
    if(request.method !== 'POST') return json(null,405);
    if(request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return json(null,403);
    let body;
    try {body = await request.json();} catch {return json(null,400);}
    const name = typeof body?.name === 'string' && body.name.trim();
    if(!name || name.length>80 || typeof body.attending !== 'boolean' || !Number.isSafeInteger(body.guests) || (body.attending ? body.guests < 1 : body.guests !== 0)) return json(null,400);
    await env.DB.prepare('INSERT INTO replies (key_hash,name,attending,guests) VALUES (?,?,?,?) ON CONFLICT(key_hash) DO UPDATE SET name=excluded.name, attending=excluded.attending, guests=excluded.guests, updated_at=CURRENT_TIMESTAMP').bind(key,name,+body.attending,body.guests).run();
    return json({ok:true});
  }
  const asset=Object.hasOwn(assets,path) && assets[path];
  if(!asset || !['GET','HEAD'].includes(request.method)) return new Response('Not found',{status:404});
  const [type,text] = asset;
  const binary = type === 'image/jpeg' || type === 'font/woff';
  const content = binary ? Uint8Array.from(atob(text),c=>c.charCodeAt(0)) : text;
  return new Response(request.method==='HEAD'?null:content,{headers:{'Content-Type':type,'Cache-Control':path==='/admin'?'no-store':'no-cache','X-Content-Type-Options':'nosniff'}});
}
