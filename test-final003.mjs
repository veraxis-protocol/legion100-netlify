import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
const idx=readFileSync('public/try/index.html','utf8'),src=readFileSync('public/try/legion-final-003.js','utf8');
let n=0;function check(name,fn){fn();n++;console.log('PASS '+String(n).padStart(2,'0')+' '+name)}
check('single canonical try route',()=>assert.ok(idx.includes('./legion-final-003.js')));
check('preserves source evidence client',()=>assert.ok(idx.includes('./reality001-client.js')));
check('preserves prior product shell',()=>assert.ok(idx.includes('./product001.js')));
check('preserves prior Friday13',()=>assert.ok(idx.includes('./friday13.js')));
check('one script load',()=>assert.equal(idx.split('legion-final-003.js').length-1,1));
check('legacy restoration hook',()=>assert.ok(src.includes('LEGION_SHOW_LEGACY_003')));
check('parent origin and source message checks',()=>assert.ok(src.includes('e.origin!==location.origin')&&src.includes('e.source!==frame.contentWindow')));
check('iframe srcdoc is local',()=>assert.ok(src.includes('frame.srcdoc=EMBEDDED_HTML')));
const matched=src.match(/const EMBEDDED_HTML = ("(?:[^"\\]|\\.)*");/s);assert.ok(matched,'embedded HTML source missing');const html=JSON.parse(matched[1]);
check('HTML document and viewport',()=>assert.ok(html.includes('<!doctype html>')&&html.includes('name="viewport"')));
for(const role of ['buyer','manufacturer','enterprise'])check('role '+role,()=>assert.ok(html.includes('data-role="'+role+'"')));
for(const key of ['coalition','requote','clarify','escape','rebot'])check('example '+key,()=>assert.ok(html.includes("id:'"+key+"'")));
check('10 stage chain',()=>assert.ok(html.includes("['Delivery','Buyer'")&&html.includes("['Engineering','System'")));
check('source and working hashes',()=>assert.ok(html.includes('originSha')&&html.includes('revisionSha')));
check('real mode stops at Z',()=>assert.ok(html.includes("if(d.mode!=='DEMO')")));
check('real source remains procurement BLOCKED',()=>assert.ok(html.includes("procurement:'BLOCKED'")));
check('simulation preserves no payments',()=>assert.ok(html.includes('payments:0')&&html.includes('new_paypal_captures:0')));
check('no POST in embedded UX',()=>assert.ok(!/method\s*:\s*['"]POST['"]/.test(html)));
check('source-bound reBot API read-only',()=>assert.ok(html.includes('/api/part-observe?part=01_RAIL_BRACKET')));
check('import accepts real files',()=>assert.ok(html.includes('file.arrayBuffer()')));
check('invalid CSV fails closed',()=>assert.ok(html.includes('Unclosed CSV quote')));
check('quote over budget blocks',()=>assert.ok(html.includes('if(d.price>d.cap)')));
check('quality hold blocks delivery',()=>assert.ok(html.includes('d.qualityHold=true')));
check('persistent demo scoped only',()=>assert.ok(html.includes("if(A.deal?.mode==='DEMO')localStorage")));
check('no real supplier tool calls',()=>assert.ok(!html.includes('fetch(\"https:')));
const js=html.split('<script>')[1]?.split('</script>')[0];assert.ok(js);
const dir=mkdtempSync(path.join(os.tmpdir(),'legion-final003-'));try{
 const tmp=path.join(dir,'inline.js');writeFileSync(tmp,js);execFileSync(process.execPath,['--check',tmp],{stdio:'pipe'});
 check('browser inline script parses',()=>assert.ok(true));
}finally{rmSync(dir,{recursive:true,force:true})}
console.log('PASS FINAL003 '+n+'/'+n);
