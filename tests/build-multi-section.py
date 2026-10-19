from pathlib import Path
import re,json
repo=Path(__file__).resolve().parents[1]
pages=[(repo/n).read_text(encoding='utf-8') for n in ['revamp-new-carousel.html','revamp-new-column.html','revamp-new-benefit-card.html']]
head=pages[0].split('</head>')[0]+'</head>'
head=head.replace('href="./','href="http://127.0.0.1:8765/').replace('src="/sec/','src="http://127.0.0.1:8765/sec/').replace('href="/sec/','href="http://127.0.0.1:8765/sec/')
sections=[re.search(r'<section\b[\s\S]*?</section>',p).group() for p in pages]
scripts='\n'.join(re.findall(r'<script id="newCarousel(?:Common|Video|Init)Script">[\s\S]*?</script>',pages[0]))
stub='''<script>window.mediaCreates=[];window.kvVideoPlayer={obj:{},create:function(pc,mo,id,type,auto,loop){mediaCreates.push({pc,mo,id,type,auto,loop});this.obj[id]={id:id,type:type,isAuto:auto,isLoop:loop};const old=document.getElementById(id),next=document.createElement(type==='video'?'video':'div');next.id=id;next.className=old.className;old.replaceWith(next);},videoStop:function(){},videoPlay:function(){}};</script>'''
test=r'''<script>
const wait=ms=>new Promise(r=>setTimeout(r,ms)),results=[];
function check(name,ok,detail){results.push({name,status:ok?'PASS':'FAIL',detail});document.querySelector('#results').textContent=JSON.stringify(results,null,2);}
async function run(){await wait(1800);const roots=Array.from(document.querySelectorAll('section.rvmp-cmpnt'));
 check('six sections initialized',roots.every(r=>r.querySelector('.swiper-container').swiper),roots.filter(r=>r.querySelector('.swiper-container').swiper).length);
 check('unique IDs',new Set(Array.from(document.querySelectorAll('[id]'),n=>n.id)).size===document.querySelectorAll('[id]').length);
 check('video targets created once',mediaCreates.length===12&&new Set(mediaCreates.map(x=>x.id)).size===12,mediaCreates.length);
 check('provider and Auto Loop settings preserved',mediaCreates.filter(x=>x.type==='video').length===4&&mediaCreates.filter(x=>x.type==='youtube').length===4&&mediaCreates.filter(x=>x.type==='bc').length===4&&mediaCreates.filter(x=>x.auto&&x.loop).length===6);
 check('SDK target replacement keeps creation state',roots.slice(0,2).every(r=>Array.from(r.querySelectorAll('.kvVideo')).every(b=>b.__ncVideoCreated)));
 if(!roots.every(r=>r.querySelector('.swiper-container').swiper)){document.querySelector('#status').textContent='DONE WITH INITIALIZATION FAILURES';return;}
 roots.forEach(r=>r.querySelector('.swiper-button-stop')?.click());
 const sw=roots.map(r=>r.querySelector('.swiper-container').swiper),before=sw.map(s=>s.activeIndex);
 roots[1].querySelectorAll('.swiper-pagination-bullet')[1].click();await wait(600);
 check('navigation isolated',sw[1].activeIndex!==before[1]&&sw.every((s,i)=>i===1||s.activeIndex===before[i]),sw.map(s=>s.activeIndex));
 check('pagination owned by section',roots.every(r=>r.querySelectorAll('.swiper-pagination-bullet[aria-current="true"]').length===1));
 check('support state isolated',new Set(roots.map(r=>r.__ncSupport)).size===6);
 check('per-type autoplay policy',!sw[4].autoplay.running&&!sw[5].autoplay.running);
 const count=mediaCreates.length;window.NewCarouselSetup.init();await wait(200);
 check('repeat init reuses instances',roots.every((r,i)=>r.querySelector('.swiper-container').swiper===sw[i])&&mediaCreates.length===count);
 const clone=document.createElement('div');clone.innerHTML=LATE;document.body.append(clone);await wait(1000);
 const late=clone.querySelector('section');check('late section automatically initialized',!!late.querySelector('.swiper-container').swiper);
 check('late video IDs isolated',mediaCreates.length===18&&new Set(mediaCreates.map(x=>x.id)).size===18,mediaCreates.length);
 check('late insertion keeps original instances',roots.every((r,i)=>r.querySelector('.swiper-container').swiper===sw[i]));
 const all=Array.from(document.querySelectorAll('section.rvmp-cmpnt'));all.forEach(r=>r.querySelector('.swiper-button-stop')?.click());const indexes=all.map(r=>r.querySelector('.swiper-container').swiper.activeIndex);
 window.dispatchEvent(new Event('resize'));await wait(3400);
 check('manual stops survive multi-section resize',all.every((r,i)=>{const s=r.querySelector('.swiper-container').swiper;return !s.autoplay.running&&s.activeIndex===indexes[i];}));
 document.querySelector('#status').textContent='DONE '+results.filter(x=>x.status==='PASS').length+' PASS / '+results.filter(x=>x.status==='FAIL').length+' FAIL';
}document.addEventListener('DOMContentLoaded',()=>run().catch(e=>document.querySelector('#status').textContent='ERROR '+e.stack));
</script>'''.replace('LATE',json.dumps(sections[0],ensure_ascii=False).replace('</script','<\\/script'))
html=head+'<body><h1>여러 section 독립 동작 검사</h1><p id="status">RUNNING</p><pre id="results"></pre>'+''.join(s*2 for s in sections)+stub+scripts+test+'</body>'
Path(__import__('sys').argv[1]).write_text(html.replace('//images.samsung.com/','https://images.samsung.com/'),encoding='utf-8')
