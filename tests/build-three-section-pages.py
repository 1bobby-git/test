from pathlib import Path
import re,json,sys
repo=Path(__file__).resolve().parents[1]
pages={name:(repo/file).read_text(encoding='utf-8').replace('href="./','href="http://127.0.0.1:8765/').replace('href="/sec/','href="http://127.0.0.1:8765/sec/').replace('src="/sec/','src="http://127.0.0.1:8765/sec/').replace('//images.samsung.com/','https://images.samsung.com/') for name,file in [('column','revamp-new-column.html'),('benefit','revamp-new-benefit-card.html')]}
html=r'''<!doctype html><html lang="ko"><meta charset="utf-8"><title>3개 section 페이지 검사</title><h1>Column·Benefit — 각 3개 section</h1><p id="status">RUNNING</p><pre id="results"></pre><div id="host"></div><script>
const pages=DATA,results=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
function check(name,ok,detail){results.push({name,status:ok?'PASS':'FAIL',detail});document.querySelector('#results').textContent=JSON.stringify(results,null,2);}
async function until(fn){for(let i=0;i<150;i++){if(fn())return true;await wait(80);}return false;}
async function run(){for(const [name,source]of Object.entries(pages)){
 const frame=document.createElement('iframe');frame.style.cssText='width:1200px;height:850px';document.querySelector('#host').append(frame);frame.srcdoc=source;
 const ready=await until(()=>{const r=frame.contentDocument.querySelectorAll('section.rvmp-cmpnt');return r.length===3&&Array.from(r).every(x=>x.querySelector('.swiper-container').swiper);});
 check(name+' three sections initialized',ready);if(!ready){frame.remove();continue;}
 const d=frame.contentDocument,w=frame.contentWindow,roots=Array.from(d.querySelectorAll('section.rvmp-cmpnt')),sw=roots.map(r=>r.querySelector('.swiper-container').swiper);
 check(name+' one shared script set',['newCarouselCommonScript','newCarouselVideoScript','newCarouselInitScript'].every(id=>d.querySelectorAll('[id="'+id+'"]').length===1));
 check(name+' unique IDs',new Set(Array.from(d.querySelectorAll('[id]'),e=>e.id)).size===d.querySelectorAll('[id]').length);
 check(name+' three independent instances',new Set(sw).size===3&&new Set(roots.map(r=>r.__ncSupport)).size===3);
 check(name+' autoplay defaults',sw.every(s=>!!s.autoplay.running===(name==='column')));
 roots.forEach(r=>r.querySelector('.swiper-button-stop')?.click());await wait(100);
 const indices=sw.map(s=>s.activeIndex);roots[1].querySelector('.swiper-button-next').click();await wait(550);
 check(name+' middle navigation isolated',sw[1].activeIndex!==indices[1]&&sw[0].activeIndex===indices[0]&&sw[2].activeIndex===indices[2],sw.map(s=>s.activeIndex));
 check(name+' pagination independent',roots.every(r=>r.querySelectorAll('.swiper-pagination-bullet[aria-current="true"]').length===1));
 function covered(){return roots.every(r=>{const box=r.querySelector('.swiper-container'),b=box.getBoundingClientRect(),wrapper=box.querySelector('.swiper-wrapper');const visible=Array.from(wrapper.children).filter(s=>{const x=s.getBoundingClientRect();return x.right>b.left+1&&x.left<b.right-1;});return visible.length>0&&wrapper.offsetHeight>=Math.max(...visible.map(s=>s.offsetHeight))-1;});}
 check(name+' PC height covers visible slides',covered());
 frame.style.width='390px';await wait(800);check(name+' mobile height covers visible slides',covered());
 frame.style.width='1200px';await wait(3400);check(name+' stops survive responsive resize',sw.every(s=>!s.autoplay.running));
 w.NewCarouselSetup.init();check(name+' repeat init reuses all instances',roots.every((r,i)=>r.querySelector('.swiper-container').swiper===sw[i]));
 frame.remove();
}document.querySelector('#status').textContent='DONE '+results.filter(x=>x.status==='PASS').length+' PASS / '+results.filter(x=>x.status==='FAIL').length+' FAIL';}
run().catch(e=>document.querySelector('#status').textContent='ERROR '+e.stack);
</script></html>'''
Path(sys.argv[1]).write_text(html.replace('DATA',json.dumps(pages,ensure_ascii=False).replace('</script','<\\/script')),encoding='utf-8')
