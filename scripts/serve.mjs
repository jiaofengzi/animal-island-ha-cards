import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const port=Number(process.env.ISLAND_TEST_PORT??4173);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('ISLAND_TEST_PORT must be an integer from 1024 to 65535');
const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const target=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/demo/index.html':pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!target.startsWith(root+path.sep)||!Object.hasOwn(types,path.extname(target))) {res.writeHead(403).end();return;}
  let data=await readFile(target);
  if(pathname==='/')data=Buffer.from(data.toString().replace('href="./style.css"','href="./demo/style.css"').replace('src="./mock.js"','src="./demo/mock.js"'));
  res.setHeader('Content-Type',types[path.extname(target)]);
  res.setHeader('Cache-Control','no-store');res.end(data);
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Mock only: http://127.0.0.1:${port}`));

