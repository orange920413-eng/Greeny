import {readFileSync as read,writeFileSync as write,mkdirSync as mkdir,copyFileSync as copy} from 'node:fs';
const assets={};
for(const [path,file,type] of [['/','index.html','text/html; charset=utf-8'],['/admin','admin.html','text/html; charset=utf-8'],['/style.css','style.css','text/css'],['/guest.js','guest.js','text/javascript'],['/fonts/invitation-song.woff','fonts/invitation-song.woff','font/woff'],['/fonts/LICENSE.txt','fonts/LICENSE.txt','text/plain; charset=utf-8'],...['red','portrait'].map(n=>['/photos/'+n+'.jpg','photos/'+n+'.jpg','image/jpeg'])]){
  assets[path]=[type,read(file,(type==='image/jpeg'||type==='font/woff')?'base64':'utf8')];
}

for (const name of ['night', 'studio', 'kiss', 'bride', 'doors', 'groom', 'hands', 'veil', 'garden']) {
  const path = '/photos/' + name + '.webp';
  assets[path] = ['image/webp', read('.' + path, 'base64')];
}
assets['/invitation-qr.png'] = ['image/png', read('invitation-qr.png', 'base64')];
mkdir('dist/server',{recursive:true});
const ownerHash=read('owner-hash.txt','utf8').trim();
write('dist/server/index.js',read('routes.mjs','utf8')+'\nconst assets='+JSON.stringify(assets)+';\nexport default {fetch:(req,env)=>handle(req,env,assets,'+JSON.stringify(ownerHash)+')};');
mkdir('dist/.openai',{recursive:true});
copy('.openai/hosting.json','dist/.openai/hosting.json');
