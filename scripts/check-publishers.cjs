const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const { fileURLToPath, pathToFileURL } = require('url');
const path = require('path');
const window = {};
const context = vm.createContext({window, URL, URLSearchParams, location:{search:'?theme=dark'}, document:{currentScript:{src:pathToFileURL(path.resolve('assets/publishers.js')).href},documentElement:{dataset:{theme:'dark'}}}});
vm.runInContext(fs.readFileSync('assets/publishers.js','utf8'),context);
vm.runInContext(fs.readFileSync('Academy/catalog.js','utf8'),context);
let checked = 0;
for (const [file,kind,variable] of [
 ['Freelance/freelance','project','projects'],['Academy/academy','course','courses'],
 ['Jobs/jobs','job','pageData'],['Internships/internships','internship','pageData'],['Events/events','event','pageData'],
 ['Freelance/Project/project','project','projects'],['Academy/Course/course','course','courses'],
 ['Jobs/Job/job','job','pageData'],['Internships/Internship/internship','internship','pageData'],['Events/Event/event','event','pageData']
]) {
 const source = fs.readFileSync(file+'.js','utf8');
 new vm.Script(source,{filename:file+'.js'});
 const start = source.indexOf('const '+variable+' =');
 const end = source.indexOf('\n(function () {',start);
 const data = vm.runInNewContext(source.slice(start,end)+'\n'+variable, {window});
 const records = Array.isArray(data)?data:data.items;
 const html = fs.readFileSync(file+'.html','utf8');
 assert(html.indexOf('assets/publishers.js') < html.indexOf('src="'+path.basename(file)+'.js"'));
 for (const record of records) {
  const account=window.OfoqPublishers.forRecord(kind,record);
  assert(account,`${file}: Missing publisher for ${record.id}`);
  assert(fs.existsSync(fileURLToPath(account.avatar)));
  for (const page of ['Profile','Messages']) {
   const link=new URL(window.OfoqPublishers.url(page,account.id));
   assert(fs.existsSync(fileURLToPath(link)));
   assert.equal(link.searchParams.get(page==='Profile'?'user':'recipient'),account.id);
   assert.equal(link.searchParams.get('theme'),'dark');
  }
  const card=window.OfoqPublishers.card(account);
  assert(card.includes(account.name) && card.includes('مراسلة') && card.includes('<img'));
  checked++;
 }
}
for(const file of ['assets/publishers.js','Account/Profile/profile.js','Account/Messages/messages.js'])new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
assert.equal(window.OfoqPublishers.get('unknown'),undefined);
console.log(`Passed: ${checked} listing/detail records resolve to existing avatar, account and message routes; theme retained; JavaScript syntax valid.`);
