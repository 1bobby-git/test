from pathlib import Path
import re,sys
repo=Path(__file__).resolve().parents[1]
s=(repo/'revamp-new-carousel.html').read_text(encoding='utf-8')
s=re.sub(r'//images.samsung.com/[^"\s]+\.mp4','http://127.0.0.1:8766/mp4-autoplay.mp4',s)
s=s.replace('href="./','href="http://127.0.0.1:8765/').replace('href="/sec/','href="http://127.0.0.1:8765/sec/').replace('src="/sec/','src="http://127.0.0.1:8765/sec/').replace('//images.samsung.com/','https://images.samsung.com/')
# Test layout only: keep all three videos inside the viewport so SDK visibility policy is equal.
s=re.sub(r'<div style="height: 20vh;background:#efefef;">\s*</div>','',s)
style='''<style>body{padding-top:45px!important}section.rvmp-cmpnt.cmpnt-new-carousel{display:inline-block!important;vertical-align:top;width:32.5%!important;padding:0!important;margin:0!important}section .innr{width:100%!important;padding:0!important;gap:0!important}section .headline-area,section .bundle-area>.title-area,section .bundle-area>.description-area,section .bundle-area>.disclaimer-area,section .kvBox>.kvCont,.kvText{display:none!important}#status{position:fixed;top:0;left:0;background:#fff;color:#000;z-index:10000;padding:8px;font:16px sans-serif}#results{white-space:pre-wrap;font:12px monospace}</style>'''
s=s.replace('</head>',style+'</head>')
test=r'''<output id="status">RUNNING — 3개 carousel 실제 MP4 재생 검사</output><pre id="results"></pre><script>
const results=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
function check(name,ok,detail){results.push({name,status:ok?'PASS':'FAIL',detail});document.querySelector('#results').textContent=JSON.stringify(results,null,2);}
async function until(fn){for(let i=0;i<180;i++){if(fn())return true;await wait(100);}return false;}
async function run(){const roots=Array.from(document.querySelectorAll('section.rvmp-cmpnt'));
 const ready=await until(()=>roots.length===3&&roots.every(r=>r.querySelector('.swiper-container')?.swiper));check('three carousel instances',ready);if(!ready)throw Error('init');
 const sw=roots.map(r=>r.querySelector('.swiper-container').swiper);
 check('independent instances',new Set(sw).size===3);
 check('unique IDs',new Set(Array.from(document.querySelectorAll('[id]'),e=>e.id)).size===document.querySelectorAll('[id]').length);
 roots.forEach(r=>r.querySelector('.swiper-button-stop')?.click());sw.forEach(s=>s.slideTo(1,0));
 let videos=[];const mediaReady=await until(()=>{videos=roots.map(r=>r.querySelectorAll('.kvVideo')[0].querySelector('video'));return videos.every(v=>v&&v.readyState>=2);});check('all MP4 data loaded',mediaReady);if(!mediaReady)throw Error('media unavailable');
 const buttons=roots.map(r=>r.querySelectorAll('.kvItem')[1].querySelector('.kvVideoBtn'));
 check('all three SDK auto play',await until(()=>videos.every(v=>!v.paused&&v.currentTime>0)),videos.map(v=>({paused:v.paused,time:v.currentTime})));
 for(let i=0;i<3;i++){
  const before=videos.map(v=>v.currentTime);buttons[i].click();await wait(400);
  check('section '+(i+1)+' circle stop isolated',videos[i].paused&&videos.every((v,j)=>j===i||!v.paused&&v.currentTime>before[j]),videos.map(v=>({paused:v.paused,time:v.currentTime})));
  check('section '+(i+1)+' stopped accessible label',buttons[i].getAttribute('aria-label')==='동영상 재생');
  buttons[i].click();check('section '+(i+1)+' resumes',await until(()=>videos.every(v=>!v.paused)));
 }
 const before=videos.map(v=>v.currentTime);roots[1].querySelectorAll('.swiper-pagination-bullet')[0].click();await wait(600);
 check('middle pagination isolated',sw[0].activeIndex===1&&sw[1].activeIndex===0&&sw[2].activeIndex===1,sw.map(s=>s.activeIndex));
 check('middle navigation keeps outer MP4 playing',!videos[0].paused&&!videos[2].paused&&videos[0].currentTime>before[0]&&videos[2].currentTime>before[2]);
 roots[1].querySelectorAll('.swiper-pagination-bullet')[1].click();check('middle MP4 autoplay after return',await until(()=>sw[1].activeIndex===1&&!videos[1].paused));
 const saved=sw.slice();NewCarouselSetup.init();check('repeat init does not replace instances',roots.every((r,i)=>r.querySelector('.swiper-container').swiper===saved[i]));
 videos.forEach((v,i)=>{if(!v.paused)buttons[i].click();});await wait(150);window.dispatchEvent(new Event('resize'));await wait(600);
 check('manual stops survive resize together',videos.every(v=>v.paused));
 document.querySelector('#status').textContent='DONE '+results.filter(x=>x.status==='PASS').length+' PASS / '+results.filter(x=>x.status==='FAIL').length+' FAIL';
}document.addEventListener('DOMContentLoaded',()=>run().catch(e=>document.querySelector('#status').textContent='ERROR '+e.stack));
</script>'''
Path(sys.argv[1]).write_text(s.replace('</body>',test+'</body>'),encoding='utf-8')
