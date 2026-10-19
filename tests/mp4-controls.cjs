const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'revamp-new-carousel.html'), 'utf8');
const source = html.match(/<script id="newCarouselVideoScript">([\s\S]*?)<\/script>/)[1];
const sdk = fs.readFileSync(path.join(__dirname, 'fixtures/samsung-video-controls.js'), 'utf8');
function fixture(auto = true, sort = 'video', delayed = false) {
  let now=0, id=0; const timers=new Map(), listeners={}, calls=[];
  function setTimeout(fn, delay=0) { const key=++id; timers.set(key,{fn,at:now+delay}); return key; }
  function tick(ms) { const end=now+ms; let entry; while ((entry=[...timers].sort((a,b)=>a[1].at-b[1].at).find(e=>e[1].at<=end))) { timers.delete(entry[0]); now=entry[1].at; entry[1].fn(); } now=end; }
  class Node {
    constructor(classes='',parent=null) { this.nodeType=1; this.parentElement=parent; this.style={}; this.attrs={}; this.classes=new Set(classes.split(' ').filter(Boolean)); this.events={}; const c=this.classes; this.classList={contains:v=>c.has(v),add:(...vs)=>vs.forEach(v=>c.add(v)),remove:(...vs)=>vs.forEach(v=>c.delete(v)),toggle:(v,on)=>on?c.add(v):c.delete(v)}; }
    matches(s) { return s.split(',').some(s=> { s=s.trim(); if(s==='video')return this===target; if(s==='.rvmp-cmpnt[class*="cmpnt-new-"]')return this===root; return s.startsWith('.')&&s.split('.').filter(Boolean).every(c=>this.classes.has(c)); }); }
    setAttribute(k,v){this.attrs[k]=v;} getAttribute(k){return k==='id'?this.id:this.attrs[k]??null;}
    querySelector(s){return this.querySelectorAll(s)[0]||null;}
    querySelectorAll(s){ if(s==='.kvVideo .target[id]'||s==='.kvVideo video')return [target]; if(s==='.kvVideo')return [box]; if(s==='.previewBox'||s==='.kvVideo .previewBox')return [preview]; return []; }
    addEventListener(n,fn){(this.events[n]??=[]).push(fn);} removeEventListener(n,fn){this.events[n]=(this.events[n]||[]).filter(x=>x!==fn);}
    contains(){return true;}
  }
  const root=new Node('rvmp-cmpnt cmpnt-new-carousel'), container=new Node('swiper-container',root), slide=new Node('kvItem swiper-slide swiper-slide-active',container), visual=new Node('visual-area',slide), box=new Node('kvVideo',visual), target=new Node('target',box), preview=new Node('',box), button=new Node('kvVideoBtn '+(auto?'play':'pause'),visual);
  target.id='vod'; target.paused=!auto; target.currentTime=auto?12:0; target.play=()=>{target.paused=false;(target.events.play||[]).slice().forEach(fn=>fn());}; target.pause=()=>{target.paused=true;};
  const swiperEvents={};
  container.swiper={el:container,slides:[slide],activeIndex:0,destroyed:false,on(n,fn){(swiperEvents[n]??=[]).push(fn);},off(){},emit(n){(swiperEvents[n]||[]).slice().forEach(fn=>fn());}};
  const item={auto,sort,type:sort,videoBtn:button,vod:target,state:auto?'played':'ready'};
  const api={obj:{vod:item},videoPlay(){calls.push('play'); if(delayed)setTimeout(()=>target.play(),100);else target.play(); item.state='played';},videoStop(){calls.push('stop');target.pause();target.currentTime=0;item.state='ready';},hidePreview(){calls.push('hide');},showPreview(){calls.push('show');}};
  if (delayed) {
    // Execute the public SDK methods unchanged, including their actual 100ms timer.
    const play=sdk.slice(sdk.indexOf(',videoPlay:function')+1,sdk.indexOf(',videoPause:function'));
    const stop=sdk.slice(sdk.indexOf(',videoStop:function')+1,sdk.indexOf(',videoToggle:function'));
    const methods=vm.runInNewContext('({'+play+','+stop+'})',{setTimeout});
    api.videoPlay=methods.videoPlay; api.videoStop=methods.videoStop;
  }
  const doc={readyState:'loading',documentElement:{contains:()=>true},addEventListener(n,fn){(listeners[n]??=[]).push(fn);},querySelector(){return null;}};
  const win={NewCarouselSetup:{},kvVideoPlayer:api,setTimeout,clearTimeout:k=>timers.delete(k),console:{info(){},warn(){},error(){}}}; win.window=win;
  vm.runInNewContext(source,{window:win,document:doc,Element:Node,setTimeout,clearTimeout:win.clearTimeout}); win.NewCarouselSetup.video();
  function click(){let prevented=false; const e={target:button,defaultPrevented:false,preventDefault(){prevented=true;},stopImmediatePropagation(){}}; (listeners.click||[]).forEach(fn=>fn(e)); return prevented;}
  return {win,api,item,target,box,button,slide,visual,container,click,tick,calls,setTimeout};
}
const tests={
  'MP4 blocked autoplay preserves native play Promise contract'(){const f=fixture();f.win.Promise=Promise;f.click();const result=f.target.play();assert.equal(typeof result?.then,'function');assert.equal(f.target.paused,true);},
  'MP4 rejected play restores intent and retries with one click'(){const f=fixture();f.click();const guarded=f.target.play;f.target.play=()=>({catch(reject){reject(new Error('source temporarily unavailable'));}});f.click();assert.equal(f.visual.__ncManualRequest.playing,false);assert.equal(f.button.classList.contains('pause'),true);f.target.play=guarded;f.click();assert.equal(f.target.paused,false);},
  'Unmarked native MP4 stop also works without SDK registry'(){const f=fixture();f.win.kvVideoPlayer=undefined;assert.equal(f.click(),true);assert.equal(f.target.paused,true);},
  'MP4 native stop does not require public SDK registry'(){const f=fixture();f.box.attrs['data-video-provider']='mp4';f.win.kvVideoPlayer=undefined;assert.equal(f.click(),true);assert.equal(f.target.paused,true);assert.equal(f.button.classList.contains('pause'),true);},
  'MP4 native stop accepts a different SDK type name'(){const f=fixture(true,'mp4');f.box.attrs['data-video-provider']='mp4';assert.equal(f.click(),true);assert.equal(f.target.paused,true);},
  'MP4 native stop survives a throwing internal SDK stop'(){const f=fixture();f.box.attrs['data-video-provider']='mp4';f.api.videoStop=()=>{throw new Error('internal SDK contract differs');};f.click();assert.equal(f.target.paused,true);assert.equal(f.button.classList.contains('pause'),true);},
  'MP4 playing with stale pause icon still stops'(){const f=fixture();f.button.classList.remove('play');f.button.classList.add('pause');f.click();assert.equal(f.target.paused,true);assert.equal(f.visual.__ncManualRequest.playing,false);},
  'MP4 stopped after resize icon reset resumes on next click'(){const f=fixture();f.click();f.button.classList.add('play');f.click();assert.equal(f.target.paused,false);},
  'MP4 AutoON playing click stops and shows preview'(){const f=fixture();assert.equal(f.click(),true);assert.equal(f.target.paused,true);assert.equal(f.target.currentTime,0);assert.equal(f.button.classList.contains('pause'),true);assert.ok(f.calls.includes('show'));assert.equal(f.item.auto,true);},
  'MP4 AutoON stop then resume'(){const f=fixture('true');f.click();assert.equal(f.target.paused,true);f.click();assert.equal(f.target.paused,false);assert.equal(f.button.classList.contains('play'),true);},
  'MP4 AutoOFF keeps existing play and reset-stop'(){const f=fixture(false);f.click();f.target.currentTime=7;f.click();assert.equal(f.target.paused,true);assert.equal(f.target.currentTime,0);},
  'MP4 rapid play-stop rejects SDK delayed play'(){const f=fixture(true,'video',true);f.click();f.click();f.click();f.tick(500);assert.equal(f.target.paused,true);assert.equal(f.button.classList.contains('pause'),true);},
  'MP4 cancels pending swiper reset timer'(){const f=fixture();f.container.swiper.__kvResetTimer=f.setTimeout(()=>f.api.videoPlay('vod'),200);f.click();f.tick(500);assert.equal(f.target.paused,true);},
  'MP4 manual stop rejects SDK scroll and resize play and restores UI'(){const f=fixture();f.click();f.button.classList.add('play');f.target.play();f.api.videoPlay('vod');assert.equal(f.target.paused,true);assert.equal(f.button.classList.contains('play'),false);assert.ok(f.calls.includes('show'));},
  'MP4 destroy restores original native play'(){const f=fixture();const original=f.target.play;f.click();assert.notEqual(f.target.play,original);f.container.swiper.emit('destroy');assert.equal(f.target.play,original);assert.equal(f.target.__ncManualPlayGuard,undefined);},
  'MP4 same-active refresh preserves manual stop'(){const f=fixture();f.click();f.win.KvVideoStopper.reset(f.container.swiper);f.tick(500);assert.equal(f.target.paused,true);assert.equal(f.button.classList.contains('play'),false);f.target.play();assert.equal(f.target.paused,true);},
  'MP4 auto policy resumes after actual leave and reentry'(){const f=fixture();f.click();f.slide.classList.remove('swiper-slide-active');f.container.swiper.activeIndex=1;f.container.swiper.emit('slideChange');f.slide.classList.add('swiper-slide-active');f.container.swiper.activeIndex=0;f.container.swiper.emit('slideChange');f.win.KvVideoStopper.reset(f.container.swiper);f.tick(500);assert.equal(f.target.paused,false);assert.equal(f.item.auto,true);},
  'YouTube AutoON remains delegated'(){const f=fixture(true,'youtube');assert.equal(f.click(),false);assert.deepEqual(f.calls,[]);},
  'YouTube AutoOFF keeps manual stop'(){const f=fixture(false,'youtube');f.click();f.click();assert.ok(f.calls.includes('stop'));},
  'BC AutoON remains separate player request path'(){const f=fixture(true,'bc');assert.equal(f.click(),false);assert.ok(f.visual.__ncBrightcoveRequest);assert.deepEqual(f.calls,[]);}
};
let failed=0;for(const [name,test] of Object.entries(tests)){try{test();console.log('PASS '+name);}catch(e){failed++;console.log('FAIL '+name+': '+e.message);}}
console.log(`${Object.keys(tests).length-failed} pass / ${failed} fail`);process.exitCode=failed?1:0;
