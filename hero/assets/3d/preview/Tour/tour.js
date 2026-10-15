import * as THREE from 'three';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/utils/SkeletonUtils.js';
const scene=new THREE.Scene();scene.background=new THREE.Color('#18283e');scene.fog=new THREE.Fog('#18283e',75,210);
const camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.08,250);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight('#d5e6ff','#747568',2));const sun=new THREE.DirectionalLight('#fff0d9',3.5);sun.position.set(-30,65,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-35,right:35,top:20,bottom:-90,near:1,far:160});sun.shadow.bias=-.0005;scene.add(sun);
const mat=(color,metalness=0,roughness=.65)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const navy=mat('#111e30'),orange=mat('#ff783d'),steel=mat('#50667a',.7,.32),wall=mat('#d7dbe0'),floor=mat('#a8b5c1'),wood=mat('#b88d61'),black=mat('#162233'),glass=mat('#24455e',.6,.21),green=mat('#42765a');
const lightMat=new THREE.MeshStandardMaterial({color:'#fff0d9',emissive:'#fff0d9',emissiveIntensity:1.1});
function box(w,h,d,x,y,z,m,parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cylinder(r,h,x,y,z,m,parent=scene){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
function sign(text,width,height,x,y,z,{size=80,bg='#111e30',color='#ffffff',rotation=0}={}){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*height/width);const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`750 ${size}px Segoe UI,Arial`;ctx.fillStyle=color;ctx.fillText(text,c.width/2,c.height/2);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));o.position.set(x,y,z);o.rotation.y=rotation;scene.add(o);return o;}
function logo(width,x,y,z){const tex=new THREE.TextureLoader().load('../../../../../assets/branding/ofoq-logo.png');tex.colorSpace=THREE.SRGBColorSpace;tex.repeat.set(740/1254,770/1254);tex.offset.set(260/1254,239/1254);const o=new THREE.Mesh(new THREE.PlaneGeometry(width,width*770/740),new THREE.MeshBasicMaterial({map:tex}));o.position.set(x,y,z);scene.add(o);}
function plant(x,z){cylinder(.32,.65,x,.33,z,navy);cylinder(.045,1,x,1.0,z,wood);for(let i=0;i<6;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.45,8,6),green);leaf.scale.set(1,.7,.7);leaf.position.set(x+Math.sin(i)*.25,1.45+(i%3)*.18,z+Math.cos(i)*.25);scene.add(leaf);}}
const people=[];
function person(x,z,{seated=false,color='#ff783d',rotation=0}={}){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);const shirt=mat(color),skin=mat('#c69778');box(.48,.58,.28,0,seated?1.1:1.26,0,shirt,g);const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),skin);head.position.set(0,seated?1.6:1.8,0);g.add(head);const hair=new THREE.Mesh(new THREE.SphereGeometry(.205,12,8,0,Math.PI*2,0,Math.PI/2),black);hair.position.copy(head.position);g.add(hair);for(const s of [-1,1]){box(.15,seated?.45:.75,.17,s*.13,seated?.43:.47,seated?.18:0,black,g);box(.19,.13,.38,s*.13,.12,.09,navy,g);const arm=box(.14,.55,.14,s*.32,seated?1.03:1.21,seated?.2:0,shirt,g);if(seated)arm.rotation.x=-.7;}g.userData.seated=seated;people.push(g);return g;}
function desk(x,z,{rotation=0,personColor='#4b7eaf'}={}){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);box(2.15,.14,1.05,0,1.12,0,wood,g);for(const a of [-.85,.85])box(.09,1.08,.72,a,.54,0,steel,g);box(.82,.52,.08,0,1.57,-.25,black,g);box(.72,.42,.012,0,1.57,-.202,new THREE.MeshStandardMaterial({color:'#75bdd8',emissive:'#2c6586',emissiveIntensity:.6}),g);box(.08,.22,.08,0,1.21,-.25,steel,g);box(.65,.025,.21,0,1.21,.17,navy,g);box(.55,.12,.58,0,.72,.87,black,g);box(.55,.63,.12,0,1.1,1.15,navy,g);cylinder(.045,.65,0,.35,.9,steel,g);cylinder(.28,.06,0,.05,.9,steel,g);const px=x-Math.sin(rotation)*.85,pz=z+Math.cos(rotation)*.85;person(px,pz,{seated:true,color:personColor,rotation});}
// Concept geometry only: final meshes will come from the approved Sketchfab downloads.
box(160,.3,220,0,-.32,-25,mat('#68798a'));box(22,.18,90,0,-.05,-39,floor);box(20,.2,20,0,.02,10,mat('#b4b8bd'));box(5,.04,20,0,.15,10,mat('#d8d6cd'));
// Enclosed podium and a slender, closed skyscraper facade above its entrance.
box(20,55,20,0,32.5,-8,glass);for(let y=5;y<=60;y+=2.6){box(20.15,.11,20.15,0,y,-8,steel);}for(let x=-10;x<=10;x+=2.5){box(.14,55,20.2,x,32.5,-8,steel);}for(let z=-18;z<=2;z+=2.5){box(20.2,55,.14,0,32.5,z,steel);}box(20.8,.5,20.8,0,60.3,-8,navy);box(8,1.5,8,0,61.2,-8,steel);logo(12,0,55.5,2.13);
for(const [x,z,h] of [[-38,-25,27],[40,-45,36],[-48,-65,45],[34,9,22]]){box(16,h,16,x,h/2,z,mat('#263c53'));for(let y=2;y<h;y+=3)box(16.1,.15,16.1,x,y,z,steel);}
box(.3,4.8,86,-10,2.4,-40,wall);box(.3,4.8,86,10,2.4,-40,wall);box(20,4.8,.3,0,2.4,-83,wall);box(20,.2,86,0,4.85,-40,navy);
box(8.35,4.8,.3,-5.8,2.4,2,glass);box(8.35,4.8,.3,5.8,2.4,2,glass);box(3.3,1.35,.45,0,4.15,2,navy);logo(1.4,0,3.75,2.25);box(4.7,.18,3.1,0,3.15,3.3,steel);box(3.2,.08,.16,0,3.03,4.85,lightMat);
const doorMat=new THREE.MeshStandardMaterial({color:'#84adc3',metalness:.3,roughness:.2,transparent:true,opacity:.55});const doorLeft=box(1.5,3,.14,-.77,1.5,2.05,doorMat),doorRight=box(1.5,3,.14,.77,1.5,2.05,doorMat);box(.1,3,.1,-1.55,1.5,2.1,steel);box(.1,3,.1,1.55,1.5,2.1,steel);
plant(-4,6);plant(4,6);for(let z=-5;z>-82;z-=10){box(1.8,.04,2.5,0,4.7,z,lightMat);const l=new THREE.PointLight('#e2efff',10,16,2);l.position.set(0,3.8,z);scene.add(l);box(.07,.015,8,-1.75,.14,z,orange);box(.07,.015,8,1.75,.14,z,orange);}
// Lobby: reception, waiting lounge and a clear passage into the corridor.
box(3.6,1.1,1.2,5,.55,-8,wood);box(3.5,.2,.05,5,.86,-7.37,orange);person(5,-9.05,{color:'#344d7a'});logo(3,5,2.8,-12);plant(-7,-4);plant(8,-4);for(let z of [-5,-8]){box(2.8,.52,1,-6,.6,z,navy);box(2.8,.65,.18,-6,1.1,z-.43,navy);}box(1.3,.08,1.3,-4,.5,-6.5,wood);cylinder(.15,.5,-4,.25,-6.5,steel);
const rooms=[{name:'العمل الحر',x:-6,z:-22},{name:'الأكاديمية',x:6,z:-36},{name:'فرص التدريب',x:-6,z:-50},{name:'الوظائف',x:6,z:-64}];
for(const r of rooms){const side=Math.sign(r.x),partition=side*2.25;box(7.6,4.7,.22,r.x,2.35,r.z-6.8,wall);box(7.6,4.7,.22,r.x,2.35,r.z+6.8,wall);box(.18,4.7,4.3,partition,2.35,r.z-4.7,wall);box(.18,4.7,4.3,partition,2.35,r.z+4.7,wall);box(.18,1.3,5.1,partition,4.05,r.z,wall);sign(r.name,5.6,.72,r.x,3.7,r.z-6.66,{color:'#ff783d',size:85});plant(side*8.7,r.z-5);box(5,.04,2.4,r.x,4.69,r.z,lightMat);const l=new THREE.PointLight('#fff0dc',17,14,2);l.position.set(r.x,3.65,r.z);scene.add(l);}
for(const [x,z] of [[-7.2,-24.7],[-4.1,-24.7],[-7.2,-20.5]])desk(x,z);sign('صمّم / برمج / ابتكر',4.8,.48,-6,2.4,-28.65,{size:54,color:'#c5d5e8'});
// Academy: tutorial screen, desks, a tutor and seated learners.
box(4.3,1.8,.13,6,2.35,-42.56,navy);sign('ابنِ خطوتك القادمة',3.9,.66,6,2.4,-42.45,{color:'#ff783d',size:70});for(const [x,z]of [[4.25,-37.2],[7.7,-37.2],[4.25,-33.7],[7.7,-33.7]])desk(x,z,{personColor:'#50897c'});person(8.3,-40.4,{color:'#ff783d',rotation:Math.PI});
desk(-7,-53.5,{personColor:'#8c5fa1'});desk(-4.2,-49,{personColor:'#477ba7'});box(2.6,1.5,.1,-5.5,2.5,-56.65,navy);sign('تعلّم ← طبّق ← تطوّر',2.3,.55,-5.5,2.5,-56.56,{size:68,color:'#ff9a6d'});
box(4.7,.15,1.7,6,1.1,-66,wood);for(const x of [4.3,6,7.7]){box(.55,.12,.55,x,.65,-64.7,navy);box(.55,.6,.12,x,.98,-64.4,navy);person(x,-64.6,{seated:true,color:'#46627e'});}person(6,-67.3,{color:'#ff783d',rotation:Math.PI});sign('فرصتك القادمة',4.8,.5,6,2.2,-70.65,{size:57,color:'#a9c3d8'});
// Events: enclosed auditorium at the end of the same corridor.
box(15,.35,3.5,0,.2,-80,wood);box(8,2.5,.15,0,2.9,-82.72,navy);sign('فعاليات أفق',7.2,1,0,3.1,-82.59,{color:'#ff783d',size:85});person(2,-79.6,{color:'#ff783d',rotation:Math.PI});for(let z=-73;z>=-77;z-=2){for(const x of [-6,-4,4,6]){box(.65,.12,.65,x,.65,z,navy);box(.65,.75,.13,x,1.1,z+.35,navy);person(x,z,{seated:true,color:x<0?'#476a92':'#497d6e'});}}plant(-8,-80);plant(8,-80);
const stages=[
  {start:0,tag:'01 / EXTERIOR',title:'مقرّ OFOQ الجديد',description:'ناطحة سحاب مغلقة من الخارج، والشعار واضح على الواجهة وفوق باب المدخل.',step:'Exterior'},
  {start:7,tag:'02 / ENTRANCE',title:'الدخول من الباب',description:'مع السكرول تقترب الكاميرا، يفتح الباب، وتبدأ الجولة داخل المبنى.',step:'Entrance'},
  {start:14,tag:'03 / LOBBY',title:'غرفة الاستقبال',description:'مساحة ترحيب، مكتب استقبال، وأثاث وشخصيات موجودة من البداية.',step:'الرئيسية'},
  {start:23,tag:'04 / FREELANCE',title:'مساحة المستقلين',description:'مكاتب وشاشات وأشخاص يعملون. نصل إليها من الممر، دون المرور داخل الجدران.',step:'العمل الحر'},
  {start:32,tag:'05 / ACADEMY',title:'الأكاديمية',description:'قاعة تعليم مزوّدة بشاشة، مدرس، ومقاعد للمتعلّمين.',step:'الأكاديمية'},
  {start:41,tag:'06 / INTERNSHIPS',title:'غرفة التدريب',description:'مكاتب تدريب ومساحة للتعلّم العملي بجانب الفريق.',step:'فرص التدريب'},
  {start:50,tag:'07 / JOBS',title:'غرفة الوظائف',description:'مساحة مقابلات واجتماعات، ضمن نفس المبنى والمسار.',step:'الوظائف'},
  {start:59,tag:'08 / EVENTS',title:'قاعة الفعاليات',description:'تنتهي الجولة في قاعة لقاءات، بمنصّة وشاشة وحضور.',step:'الفعاليات'}
];
// Timed keyframes follow door openings, then return to the corridor between rooms.
const keys=[
 [0,[50,36,78],[0,29,-8]], [4,[26,22,48],[0,27,-8]], [7,[0,3.0,17],[0,2.7,0]], [11,[0,1.9,6],[0,1.9,-6]], [15,[0,1.95,-2],[5,1.7,-8]], [19,[1,2.1,-6],[5,1.4,-9]],
 [21,[0,2,-14],[0,2,-22]], [23,[0,2,-22],[-6,1.8,-24]], [26,[-4.3,2.0,-22],[-7,1.4,-26]], [29,[-4.6,2.1,-22],[-6,1.5,-27]], [31,[0,2,-22],[0,2,-36]],
 [32,[0,2,-36],[6,1.8,-38]], [35,[4.3,2.0,-36],[6.5,1.6,-40]], [38,[4.6,2.1,-36],[6,1.8,-42]], [40,[0,2,-36],[0,2,-50]],
 [41,[0,2,-50],[-6,1.7,-53]], [44,[-4.5,2,-50],[-6.5,1.6,-54]], [47,[-4.8,2.1,-50],[-5.7,1.8,-55]], [49,[0,2,-50],[0,2,-64]],
 [50,[0,2,-64],[6,1.7,-66]], [53,[4.1,2,-64],[6,1.5,-67]], [56,[4.4,2.1,-64],[6.3,1.7,-68]], [58,[0,2,-64],[0,2,-77]],
 [59,[0,2,-69],[0,2.5,-81]], [63,[0,2.2,-74],[0,2.6,-81]], [68,[0,2.3,-76],[0,2.7,-81]]
];
const smooth=x=>x*x*(3-2*x);const steps=document.querySelector('#steps');stages.forEach(s=>{const span=document.createElement('span');span.textContent=s.step;steps.append(span);});
const scrub=document.querySelector('#scrub');let playing=false,time=0,last=0;
window.seek=function(t){time=Math.max(0,Math.min(68,t));let i=keys.findIndex(k=>k[0]>time)-1;if(i<0)i=keys.length-2;const a=keys[i],b=keys[i+1];const u=smooth(Math.min(1,Math.max(0,(time-a[0])/(b[0]-a[0]))));camera.position.fromArray(a[1]).lerp(new THREE.Vector3(...b[1]),u);camera.lookAt(new THREE.Vector3(...a[2]).lerp(new THREE.Vector3(...b[2]),u));const open=smooth(Math.min(1,Math.max(0,(time-8)/3)));doorLeft.position.x=-.77-1.55*open;doorRight.position.x=.77+1.55*open;people.forEach((p,n)=>{if(p.userData.mixer)p.userData.mixer.setTime(time);});const stage=stages.filter(s=>s.start<=time).at(-1);document.querySelector('#eyebrow').textContent=stage.tag;document.querySelector('#title').textContent=stage.title;document.querySelector('#description').textContent=stage.description;[...steps.children].forEach((el,i)=>el.classList.toggle('active',stages[i]===stage));scrub.value=time;renderer.render(scene,camera);};
document.querySelector('#play').onclick=()=>{if(time>=68)time=0;playing=!playing;document.querySelector('#play').textContent=playing?'إيقاف':'تشغيل';};scrub.oninput=()=>{playing=false;window.seek(+scrub.value);document.querySelector('#play').textContent='تشغيل';};window.addEventListener('wheel',e=>{playing=false;window.seek(time+e.deltaY*.018);},{passive:true});window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);window.seek(time);});
if(new URLSearchParams(location.search).has('export'))document.body.classList.add('export');
// The preview now uses the downloaded formal characters; rooms and exterior remain conceptual.
const loader=new GLTFLoader();
const [boss,woman]=await Promise.all([loader.loadAsync('../../people/formal-boss.glb'),loader.loadAsync('../../people/formal-businesswoman.glb')]);
for(let n=0;n<people.length;n++){
 const holder=people[n],seated=holder.userData.seated,asset=seated||n%2===0?boss:woman;
 holder.clear();const model=clone(asset.scene);const mixer=new THREE.AnimationMixer(model);
 const idle=asset.animations.find(a=>a.name.endsWith('Idle1'))||asset.animations[0];
 const idleAction=mixer.clipAction(idle).play();mixer.setTime(0);model.updateMatrixWorld(true);
 const standing=new THREE.Box3().setFromObject(model,true);const size=standing.getSize(new THREE.Vector3());const scale=1.82/size.y;
 if(seated){idleAction.stop();mixer.clipAction(asset.animations.find(a=>a.name.endsWith('SitIdle1'))).play();mixer.setTime(0);holder.rotation.y+=Math.PI;}
 model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model,true),center=bounds.getCenter(new THREE.Vector3());
 model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale+(seated?.35:0),-center.z*scale);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 holder.add(model);holder.userData.mixer=mixer;
}
window.seek(0);
function animate(ms){if(playing){time+=(ms-last)/1000;if(time>=68){time=68;playing=false;}window.seek(time);}last=ms;requestAnimationFrame(animate);}window.seek(0);window.previewReady=true;requestAnimationFrame(animate);




