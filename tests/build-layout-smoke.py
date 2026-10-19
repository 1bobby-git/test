from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
names={'column':'revamp-new-column.html','bentfit':'revamp-new-benefit-card.html'}
pages={n:(root/file).read_text(encoding='utf-8').replace('href="./','href="http://127.0.0.1:8765/').replace('src="/sec/','src="http://127.0.0.1:8765/sec/').replace('href="/sec/','href="http://127.0.0.1:8765/sec/').replace('//images.samsung.com/','https://images.samsung.com/') for n,file in names.items()}
html='''<!doctype html><meta charset="utf-8"><title>높이·서체 회귀 확인</title><p id="status">RUNNING</p><pre id="results"></pre><div id="host"></div><script>
const pages=DATA,results=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
function check(name,ok,detail){results.push({name,status:ok?'PASS':'FAIL',detail});document.querySelector('#results').textContent=JSON.stringify(results,null,2);}
async function until(fn){for(let n=0;n<100;n++){if(fn())return true;await wait(80);}return false;}
async function run(){for(const [name,html]of Object.entries(pages)){
 const f=document.createElement('iframe');f.style.cssText='width:1200px;height:900px';document.querySelector('#host').append(f);f.srcdoc=html;
 if(!await until(()=>f.contentDocument.querySelector('.swiper-container')?.swiper))throw Error(name+' init');
 const d=f.contentDocument,w=f.contentWindow,box=d.querySelector('.swiper-container'),sw=box.swiper,wrapper=box.querySelector('.swiper-wrapper');sw.autoplay.stop();
 // Deliberately unequal late-loading images exercise actual markup and ResizeObserver.
 const slides=Array.from(wrapper.children);for(const [i,s]of slides.entries()){for(const source of s.querySelectorAll('source'))source.remove();for(const img of s.querySelectorAll('img'))img.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="'+(i===1?1100:500)+'"></svg>');}
 await wait(1200);
 function covered(){const b=box.getBoundingClientRect();const visible=slides.filter(s=>{const r=s.getBoundingClientRect();return r.right>b.left+1&&r.left<b.right-1;});const max=Math.max(...visible.map(s=>s.offsetHeight));return {wrapper:wrapper.offsetHeight,max,visible:visible.length,heights:visible.map(s=>s.offsetHeight)};}
 let v=covered();check(name+' PC tallest visible slide',v.max>0&&v.wrapper>=v.max-1,v);
 check(name+' all slides observed',slides.every(s=>d.querySelector('section').__ncSupport?.observed.includes(s)),slides.length);
 check(name+' PC legacy headline size',Math.abs(parseFloat(w.getComputedStyle(d.querySelector('.headline')).fontSize)-46)<1,w.getComputedStyle(d.querySelector('.headline')).fontSize);
 check(name+' font fallback',w.getComputedStyle(slides[0].querySelector('.title-area')).fontFamily.includes('SamsungOneKorean'),w.getComputedStyle(slides[0].querySelector('.title-area')).fontFamily);
 const image=slides[1].querySelector('img');image.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1500"></svg>');await wait(700);v=covered();check(name+' late image growth',v.wrapper>=v.max-1&&v.max>0,v);
 f.style.width='390px';await wait(800);check(name+' mobile legacy headline size',Math.abs(parseFloat(w.getComputedStyle(d.querySelector('.headline')).fontSize)-30)<1,w.getComputedStyle(d.querySelector('.headline')).fontSize);v=covered();check(name+' mobile visible slide coverage',v.wrapper>=v.max-1&&v.max>0,v);
 const stop=d.querySelector('.swiper-button-stop');if(stop){stop.click();await wait(80);const active=sw.activeIndex;f.style.width='801px';await wait(3800);check(name+' manual stop survives resize',!sw.autoplay.running&&sw.activeIndex===active,{running:sw.autoplay.running,active,after:sw.activeIndex});}
 f.remove();
}document.querySelector('#status').textContent='DONE '+results.filter(x=>x.status==='PASS').length+' PASS / '+results.filter(x=>x.status==='FAIL').length+' FAIL';}
run().catch(e=>document.querySelector('#status').textContent='ERROR '+e.stack);
</script>'''
Path(__import__('sys').argv[1]).write_text(html.replace('DATA',json.dumps(pages,ensure_ascii=False).replace('</script','<\\/script')),encoding='utf-8')
