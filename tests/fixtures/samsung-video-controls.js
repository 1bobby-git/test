// Public Samsung SDK control-method snapshot, 2026-10-19. Used only by the regression runner.
// Source: https://www.samsung.com/sec/static/_script/newComponent.js
module.exports={placeholder:0,videoPlay:function(vodId){var item=
this.obj[vodId];if(!item)return;this.hidePreview(vodId);try{if(item.sort==="video"){if(item.state==="ready"||item.state==="pause")setTimeout(function(){var p=item.vod.play();if(p&&typeof p.catch==="function")p.catch(function(){})},100)}else if(item.sort==="bc"){if(item.state==="ready"||item.state==="pause")setTimeout(function(){try{item.vod.play()}catch(e){}},100)}else if(item.sort==="youtube")if(item.state==="ready"||item.state==="pause")setTimeout(function(){try{item.vod.playVideo()}catch(e){}},
100)}catch(e){}},videoPause:function(){},videoStop:function(vodId,showPreview){var item=this.obj[vodId];if(!item)return;try{if(item.sort==="video"){item.vod.pause();item.vod.currentTime=0}else if(item.sort==="youtube"){item.vod.stopVideo();item.vod.seekTo(0,
true)}else if(item.sort==="bc"){item.vod.currentTime(0);item.vod.pause()}}catch(e){}item.state="ready";if(showPreview!==false)this.showPreview(vodId)},videoToggle:function(){}};
