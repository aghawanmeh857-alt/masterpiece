const assert = require('node:assert/strict');
const fs = require('node:fs');
const {activityRows} = require('../Account/Profile/profile-activity.js');
const root = 'https://ofoq.example/';
const app = {
  applications: [
    {kind:'job',id:'j1',title:'وظيفة',status:'قيد المراجعة',href:'/Jobs/Job/job.html?id=j1'},
    {kind:'project',id:'p1',title:'<script>text</script>',status:'مقبول',href:'/Freelance/Project/project.html?id=p1'},
    {kind:'internship',id:'i1',title:'تدريب',href:'/Internships/Internship/internship.html?id=i1'}
  ],
  courses: [{id:'react',title:'React',syllabus:['a','b','c','d']},{id:'workshop',title:'ورشة',format:'workshop',syllabus:['a']}],
  learning: {enrolled:['react','workshop','unknown'],progress:{react:[0,0,1,50,-1],workshop:[0]}},
  registrations:[{id:'e1',title:'فعالية',href:'/Events/Event/event.html?id=e1'}],
  ideas:[{id:'own',title:'فكرتي'}]
};
let rows = activityRows(app,root,'dark');
assert.equal(rows.length,7);
assert.equal(rows.find(row=>row.title==='React').percent,50);
assert.equal(rows.find(row=>row.title==='ورشة').status,'مكتملة');
assert.equal(rows.find(row=>row.title==='ورشة').label,'دورة');
assert.equal(rows.filter(row=>row.type==='course'&&row.format==='workshop').length,0,'No separate workshop activity remains');
assert.equal(rows.filter(row=>row.type==='course'&&row.format!=='workshop').length,2,'All learning activity belongs to courses');
assert.equal(rows.find(row=>row.type==='project').status,'مقبول');
assert(rows.every(row=>new URL(row.href).searchParams.get('theme')==='dark'));
assert.equal(rows.filter(row=>row.type==='job').length,1);
app.applications=[];app.registrations=[];
rows=activityRows(app,root);
assert(!rows.some(row=>['job','project','internship','event'].includes(row.type)),'Withdrawn applications and cancelled events disappear');
assert.deepEqual(activityRows({},root),[],'Fresh visit has no invented activity');
assert.equal(activityRows({applications:[{href:'javascript:alert(1)'}]},root)[0].href,null);
assert.equal(activityRows({applications:[{href:'https://external.example/'}]},root)[0].href,null);
const source=fs.readFileSync('Account/Profile/profile-activity.js','utf8');
assert(source.includes(".has('user')"),'Publisher profiles must hide visitor activity');
assert(source.includes('element.textContent = text'),'User content renders as text');
console.log('Passed: all activity types, enrollment progress, completion, withdrawal/cancellation, safe themed links, empty visit and private profile separation.');
