import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import './build.mjs';
import worker from './dist/server/index.js';
const database = new DatabaseSync(':memory:');
database.exec(readFileSync('drizzle/0000_replies.sql','utf8'));
const DB={prepare(sql){const stmt=database.prepare(sql);let args=[];return {bind(...data){args=data;return this},run(){return stmt.run(...args)},first(){return stmt.get(...args)||null},all(){return {results:stmt.all(...args)}}}}};
const parameters=process.argv.slice(2);
http.createServer(async(req,res)=>{
 try{
  const chunks=[]; for await (const chunk of req) chunks.push(chunk);
  const r=await worker.fetch(new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,body:chunks.length?Buffer.concat(chunks):undefined}),{DB});
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));
 } catch {res.writeHead(500);res.end();}
}).listen(Number(parameters[parameters.indexOf('--port')+1])||4173,'0.0.0.0');
