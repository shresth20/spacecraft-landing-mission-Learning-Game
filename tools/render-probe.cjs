// Local browser probe. No installed browser profile is accessed.
// node tools/render-probe.cjs --playwright /path/to/playwright --label baseline
// --mode camera: isolated cancellation/plate synchronization assertions.
// --mode transit: answer the actual shape task, then record the next-zone zoom.
// --mode reveal --section 1: record from the scanner's blackout fade through island emergence.
// --mode tour --section 1: answer square, rectangle, triangle and record the flights.
// --mode landing --section 7: record spacecraft arrival; --land 36 also plays the fitting square landing.
// --mode navigation --cycles 4: repeated surveys, landings and lessons.
// --mode resize --sea-resources: assert water cache eviction and release.
// --mode motion --baseline-dir DIR: compare rise animation values with original CSS.
// --trace --categories devtools.timeline,cc,gpu,viz: DevTools-compatible trace.
// --filmstrip: presented-frame capture; use separately from timing comparisons.
// --baseline-dir DIR: serve baseline script copies over the unchanged assets.
// --ablate shore|islands|motion|wash|clip|transitions|roll|caustic|deep: diagnostic CSS only.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const args = process.argv.slice(2);
const opt = (key, fallback) => args.includes('--' + key) ? args[args.indexOf('--' + key) + 1] : fallback;
const pw = require(opt('playwright', process.env.PLAYWRIGHT_MODULE || 'playwright'));
const root = path.resolve(__dirname, '..');
const output = opt('output', '/tmp/spacecraft-render');
const label = opt('label', 'baseline');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json', '.avif':'image/avif','.webp':'image/webp','.webm':'audio/webm','.woff2':'font/woff2'};
const server = http.createServer((req, res) => {
  const filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  const original = opt('baseline-dir','') && path.join(opt('baseline-dir',''),path.relative(root,filename));
  const override = original && fs.existsSync(original) ? original : path.basename(filename) === 'animation.js' && opt('animation','');
  fs.readFile(override || filename, (error, data) => {
    if(!error && path.basename(filename) === 'water.js' && args.includes('--sea-resources')) {
      data=String(data).replace('var scImages = Object.create(null);', `var scImages = Object.create(null);
        Object.defineProperty(global, '__seaResourceStats', {get: function () {
          var tiles=Object.keys(scTiles).map(function(k) { return scTiles[k]; });
          return {tiles:tiles.length,tilePixels:tiles.reduce(function(n,c) {return n+c.width*c.height;},0),
            scratchPixels:scScratch ? scScratch.width*scScratch.height : 0};
        }});`);
    }
    res.writeHead(error ? 404 : 200, {'Content-Type': types[path.extname(filename)] || 'application/octet-stream'});
    res.end(error ? 'Not found' : data);
  });
});
(async () => {
  fs.mkdirSync(output, {recursive:true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const engine = opt('engine', 'chrome');
  const browser = await (pw[engine] || pw.chromium).launch({
    ...(pw[engine] ? {} : {channel:engine}), headless: !args.includes('--headed'),
    ...(opt('executable','') ? {executablePath:opt('executable','')} : {})
  });
  const watchdog = setTimeout(async () => { console.error('Probe deadline exceeded'); await browser.close(); server.close(); }, 180000);
  try {
    const context = await browser.newContext({viewport: {width: +opt('width',1512), height: +opt('height',850)}, deviceScaleFactor: +opt('dpr',2)});
    const page = await context.newPage();
    if(opt('seed','')) await page.addInitScript(seed => {
      let value=seed>>>0;
      Math.random=()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
    },+opt('seed',1));
    if(args.includes('--canvas-profile')) await page.addInitScript(() => {
      window.__canvasCosts = {};
      for(const method of ['fillRect','drawImage','clearRect','createPattern','createLinearGradient','createRadialGradient']) {
        const original=CanvasRenderingContext2D.prototype[method];
        CanvasRenderingContext2D.prototype[method]=function(...args) {
          if(!window.__probe?.active) return original.apply(this,args);
          const key=[method,this.canvas.className || 'offscreen',this.globalCompositeOperation].join(' ');
          const start=performance.now();
          const result=original.apply(this,args);
          const ms=performance.now()-start;
          const cost=__canvasCosts[key] ||= {count:0,ms:0,max:0};
          cost.count++;cost.ms+=ms;cost.max=Math.max(cost.max,ms);
          return result;
        };
      }
    });
    const errors = [], failures = [], cancelledRequests = [];
    page.on('pageerror', e => { errors.push(e.message); if(errors.length<5) console.error('Page error:',e.message); });
    page.on('response', r => { if(r.status() >= 400) failures.push({url:r.url(),status:r.status()}); });
    page.on('requestfailed', r => {
      const item={url:r.url(),type:r.resourceType(),error:r.failure()?.errorText};
      // Navigation and audio stop/replay can cancel a request intentionally.
      // Retain these separately; also verify every image's loaded state below.
      (/^(cancelled|net::ERR_ABORTED|NS_BINDING_ABORTED)$/.test(item.error) ? cancelledRequests : failures).push(item);
    });
    if(opt('mode','') === 'motion') {
      assert.ok(opt('baseline-dir',''), 'Motion comparison needs original css/ files');
      const values = [];
      for(const directory of [opt('baseline-dir',''), root]) {
        await page.setContent('<div class="screen is-active"><div class="islet is-up"><img class="islet__img"></div><div class="pad is-up"><img class="pad__img"></div></div>');
        for(const file of ['css/style.css','css/animation.css']) await page.addStyleTag({path:path.join(directory,file)});
        values.push(await page.evaluate(async () => {
          const out = {};
          for(const selector of ['.islet__img','.pad__img']) {
            const el=document.querySelector(selector), animations=el.getAnimations().filter(a=>a instanceof CSSAnimation);
            await Promise.all(animations.map(a=>a.ready));
            const startTimes=animations.map(a=>a.startTime);
            animations.forEach(a=>a.pause());
            const samples=[];
            for(let i=0;i<=100;i++) {
              animations.forEach(a=>{a.currentTime=a.effect.getTiming().duration*i/100;});
              const cs=getComputedStyle(el);
              samples.push({transform:cs.transform,opacity:cs.opacity,filter:cs.filter});
            }
            out[selector]={startTimes,samples};
          }
          return out;
        }));
      }
      for(const selector of Object.keys(values[0])) {
        assert.deepEqual(values[1][selector].samples,values[0][selector].samples,'Preserve scale, opacity and filter at every sampled time');
        const starts=values[1][selector].startTimes;
        assert.ok(starts.every(t=>Math.abs(t-starts[0])<.001),'Motion and focus must share their start time: '+starts);
      }
      fs.writeFileSync(path.join(output,label+'.json'),JSON.stringify({engine,samplesPerAnimation:101,identical:true,values},null,2));
      console.log('Rise motion, opacity, filters and start times verified');
      return;
    }
    if(opt('mode','') === 'camera') {
      await page.setContent('<div id="one"><div class="cam"></div><div class="s2-bg"></div></div><div id="two"><div class="cam"></div></div><style>#one,#two {position:relative;width:1000px;height:500px} .cam,.s2-bg {position:absolute;width:100%;height:100%}</style>');
      await page.addScriptTag({path:opt('animation',path.join(root,'js/animation.js'))});
      const races = await page.evaluate(async () => {
        const one=document.getElementById('one'), two=document.getElementById('two');
        const wait=ms=>new Promise(r=>setTimeout(r,ms));
        GeoMotion.camSet(one,{s:.32,x:50,y:50});
        const old=GeoMotion.camFly(one,[{s:1,x:50,y:50}],{ms:1000});
        await wait(100);
        const current=GeoMotion.camFly(one,[{s:.7,x:90,y:65}],{ms:700});
        const plateStarts=[...one.querySelectorAll('.cam,.s2-bg')].flatMap(x=>x.getAnimations().filter(a=>a.id==='geo-cam').map(a=>a.startTime));
        await Promise.all([old,current]);
        const interrupted=GeoMotion.camRead(one);
        GeoMotion.camSet(one,{s:.32,x:50,y:50});
        const other=GeoMotion.camFly(one,[{s:1,x:50,y:50}],{ms:500});
        await wait(50); GeoMotion.camReset(two); await other;
        return {interrupted,plateStarts,activeAfterOtherReset:one.querySelector('.cam').getAnimations().map(a=>({id:a.id,state:a.playState})),errors:[]};
      });
      fs.writeFileSync(path.join(output,label+'.json'),JSON.stringify(races,null,2));
      console.log(races);
      if(!args.includes('--expect-before')) {
        assert.ok(Math.abs(races.interrupted.s-.7)<.001 && Math.abs(races.interrupted.x-90)<.01 && Math.abs(races.interrupted.y-65)<.01,'Newest flight must own the destination');
        assert.equal(races.activeAfterOtherReset.length,0,'Other screen reset must not prevent cleanup');
        assert.ok(races.plateStarts.every(t=>t===races.plateStarts[0]),'All plates must share a timeline start');
      }
      return;
    }
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html${opt('query','')}`);
    const ablations = {
      shore: '.shore__warp, .surf__warp { filter:none !important; }',
      islands: '.cam { visibility:hidden !important; } .cam * { visibility:hidden !important; }',
      motion: '* { animation-play-state:paused !important; }',
      wash: '.wash { display:none !important; }',
      clip: '.screen { overflow:clip; }',
      transitions: '.screen {filter:none !important;}',
      roll: '.sea__roll {display:none !important;}',
      caustic: '.sea__caustic {display:none !important;}',
      deep: '.sea__deep, .sea__swell {display:none !important;}',
      refraction: '.wave__warp {backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}',
      fronts: '.wave {visibility:hidden !important;}',
      'pad-hint': '.pad__img {will-change:auto !important;}',
      'world-hints': '.cam, .cam * {will-change:auto !important;}',
    };
    if (ablations[opt('ablate','')]) await page.addStyleTag({content:ablations[opt('ablate','')]});
    await page.getByRole('button', {name: 'Start the mission', exact: true}).click({timeout: 60000});
    console.log('Started');
    await page.waitForTimeout(1800);
    await page.locator('#jumpBtn').click();
    await page.locator('.jump-opt[data-i="' + opt('section',10) + '"]').click();
    await page.waitForTimeout(+opt('settle',2)*1000);
    console.log('Survey ready');
    const cdp = engine === 'webkit' || engine === 'firefox' ? null : await context.newCDPSession(page);
    let gpu = null;
    if(cdp) {
      const system = await browser.newBrowserCDPSession();
      gpu = (await system.send('SystemInfo.getInfo')).gpu;
      await system.detach();
    }
    if (cdp) { await cdp.send('Performance.enable'); await cdp.send('LayerTree.enable'); }
    let layers = [];
    if (cdp) cdp.on('LayerTree.layerTreeDidChange', e => { if(e.layers) layers = e.layers; });
    const mode = opt('mode','survey');
    if(mode === 'reveal') {
      await page.waitForSelector('#blackout.is-clear',{state:'attached',timeout:90000});
      console.log('Scan completed');
    }
    if(mode === 'transit' || mode === 'resize' || mode === 'tour') {
      await page.waitForSelector('.screen.is-active .pads.is-picking',{timeout:90000});
      console.log('Shape task ready');
    }
    if(mode === 'landing') {
      await page.waitForSelector('.screen.is-active .ship.is-in',{state:'attached',timeout:90000});
      console.log('Spacecraft arriving');
    }
    if(mode === 'menu') {
      await page.locator('#jumpBtn').click();
      console.log(await page.locator('#jumpMenu').innerText());
      await page.locator('#jumpBtn').click();
    }
    await page.evaluate(() => {
      window.__probe = {frames:[], longFrames:[], hiddenChanges:{}, activeSpriteChanges:0, active:true};
      __probe.mutations = new MutationObserver(records => {
        for(const r of records) {
          const screen=r.target.closest('.screen');
          if(screen && !screen.matches('.is-active,.is-leaving')) {
            const key=screen.id+' '+r.target.className;
            __probe.hiddenChanges[key]=(__probe.hiddenChanges[key]||0)+1;
          }
          if(screen?.classList.contains('is-active') && r.target.style.getPropertyValue('--sw-pos')) __probe.activeSpriteChanges++;
        }
      });
      __probe.mutations.observe(document.getElementById('stage'),{subtree:true,attributes:true,attributeFilter:['style']});
      let last;
      function tick(t) { if(last) __probe.frames.push(t-last); last=t; if(__probe.active) requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
      if(PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
        const ob = new PerformanceObserver(list => { for(const e of list.getEntries()) __probe.longFrames.push(e.toJSON()); });
        ob.observe({type:'long-animation-frame'}); __probe.ob = ob;
      }
    });
    console.log('Frame sampler ready');
    const before = cdp ? await cdp.send('Performance.getMetrics') : null;
    if(+opt('trace-delay',0)) await page.waitForTimeout(+opt('trace-delay',0)*1000);
    if(cdp && args.includes('--trace')) await cdp.send('Tracing.start', {
      ...(opt('trace-buffer-kb','') ? {traceConfig:{
        recordMode:'recordAsMuchAsPossible', traceBufferSizeInKb:+opt('trace-buffer-kb',65536),
        includedCategories:opt('categories','devtools.timeline').split(',')
      }} : {categories:opt('categories','devtools.timeline')}),
      transferMode:'ReturnAsStream'
    });
    if(cdp && args.includes('--cpu')) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); }
    console.log('Recording');
    const navigation = [];
    const resources = [];
    let resizePixelsIdentical = null;
    if(mode === 'resize') {
      await page.evaluate(() => {
        document.querySelectorAll('.screen.is-active > .sea, .screen.is-active > .s2-bg, .screen.is-active > .s3-bg').forEach(el=>el.getAnimations().forEach(a=>a.pause()));
      });
      await page.waitForTimeout(100);
      const pixelsBefore=await page.locator('.screen.is-active .sea-canvas').evaluate(c=>c.toDataURL());
      resources.push(await page.evaluate(()=>window.__seaResourceStats));
      for(let i=1;i<=12;i++) {
        await page.setViewportSize({width:960+i*40,height:540+i*22});
        await page.waitForTimeout(300);
        resources.push(await page.evaluate(()=>window.__seaResourceStats));
      }
      await page.setViewportSize({width:960,height:540});
      await page.waitForTimeout(300);
      resources.push(await page.evaluate(()=>window.__seaResourceStats));
      resizePixelsIdentical=pixelsBefore === await page.locator('.screen.is-active .sea-canvas').evaluate(c=>c.toDataURL());
      assert.ok(resizePixelsIdentical,'Rebuilding the cache at the original viewport must preserve every sea pixel');
      await page.locator('#jumpBtn').click();
      await page.locator('.jump-opt[data-i="14"]').click();
      await page.waitForTimeout(2000);
      resources.push(await page.evaluate(()=>window.__seaResourceStats));
      if(!args.includes('--expect-before')) {
        assert.ok(resources.slice(0,-1).every(x=>x.tiles<=resources[0].tiles),'Resizing must evict old pattern textures');
        assert.deepEqual(resources.at(-1),{tiles:0,tilePixels:0,scratchPixels:0},'Leaving the sea must release temporary canvases');
      }
    }
    if(mode === 'navigation') {
      for(let cycle=0;cycle<+opt('cycles',4);cycle++) {
        for(const section of [7,39,5,14,1,10]) {
          await page.locator('#jumpBtn').click();
          await page.locator('.jump-opt[data-i="'+section+'"]').click();
          await page.waitForTimeout(2000);
          const state=await page.evaluate(()=>({active:document.querySelectorAll('.screen.is-active').length,leaving:document.querySelectorAll('.screen.is-leaving').length,canvases:[...document.querySelectorAll('.screen:not(.is-active):not(.is-leaving) .sea-canvas')].map(x=>x.width*x.height)}));
          assert.equal(state.active,1); assert.equal(state.leaving,0); assert.ok(state.canvases.every(x=>x===0));
        }
        if(cdp) { await cdp.send('HeapProfiler.collectGarbage'); navigation.push(await cdp.send('Memory.getDOMCounters')); }
        console.log('Navigation cycle',cycle+1,navigation.at(-1));
      }
    }
    let filmFrames=0;
    if(cdp && args.includes('--filmstrip')) {
      fs.mkdirSync(path.join(output,label+'-frames'),{recursive:true});
      cdp.on('Page.screencastFrame',e=>{
        cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});
        fs.writeFileSync(path.join(output,label+'-frames',String(filmFrames++).padStart(4,'0')+'.jpg'),Buffer.from(e.data,'base64'));
      });
      await cdp.send('Page.startScreencast',{format:'jpeg',quality:70,maxWidth:1280,maxHeight:720,everyNthFrame:6});
    }
    if(mode === 'transit' || mode === 'tour') {
      const shapes=mode === 'tour' ? opt('shapes','square,rectangle,triangle').split(',') : [opt('shape','parallelogram')];
      for(const shape of shapes) {
        const selector='.screen.is-active .pads.is-picking .pad[data-shape="'+shape+'"] .pad__hit';
        await page.waitForFunction(s=>document.querySelectorAll(s).length===3,selector,{timeout:90000});
        const matches=page.locator(selector);
        for(const pad of await matches.all()) await pad.click();
        console.log('Answered',shape);
      }
    }
    if(mode === 'landing' && opt('land','')) {
      const target=page.locator('.screen.is-active .pads.is-choosing .pad[data-area="'+opt('land',20)+'"] .pad__hit');
      await target.click({timeout:90000});
      console.log('Landing selected');
    }
    await page.waitForTimeout(+opt('seconds',15)*1000);
    if(cdp && args.includes('--filmstrip')) await cdp.send('Page.stopScreencast');
    await page.evaluate(() => { __probe.active=false; __probe.ob?.disconnect(); __probe.mutations.disconnect(); });
    const after = cdp ? await cdp.send('Performance.getMetrics') : null;
    if(cdp && args.includes('--cpu')) fs.writeFileSync(path.join(output,label+'.cpuprofile'), JSON.stringify((await cdp.send('Profiler.stop')).profile));
    console.log('Recorded');
    let traceStatus = null;
    if(cdp && args.includes('--trace')) {
      const done = new Promise(resolve => cdp.once('Tracing.tracingComplete',resolve));
      await cdp.send('Tracing.end');
      const {stream, dataLossOccurred} = await done;
      traceStatus = {dataLossOccurred: !!dataLossOccurred};
      const file = fs.openSync(path.join(output,label+'.trace.json'),'w');
      for(;;) { const r = await cdp.send('IO.read',{handle:stream}); fs.writeSync(file,r.data); if(r.eof) break; }
      fs.closeSync(file); await cdp.send('IO.close',{handle:stream});
    }
    const state = await page.evaluate(() => {
      __probe.active=false; __probe.ob?.disconnect();
      const frames = __probe.frames.slice().sort((a,b)=>a-b);
      return {ua:navigator.userAgent,dpr:devicePixelRatio,size:[innerWidth,innerHeight],
        frames:frames.length, fps:1000*frames.length/frames.reduce((a,b)=>a+b,0),
        p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],p99:frames[Math.floor(frames.length*.99)],max:frames.at(-1),over33:frames.filter(x=>x>33.34).length,
        over25:frames.filter(x=>x>25).length,
        longFrames:__probe.longFrames,hiddenChanges:__probe.hiddenChanges,
        longFramesSupported:PerformanceObserver.supportedEntryTypes.includes('long-animation-frame'),
        activeSpriteChanges:__probe.activeSpriteChanges,
        canvasCosts:window.__canvasCosts,
        label:document.querySelector('#jumpLabel').textContent,
        screens:[...document.querySelectorAll('.screen')].map(x=>({id:x.id,class:x.className,canvas:!!x.querySelector('canvas')})),
        images:[...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.src),
        animations:document.getAnimations().length,
        canvases:[...document.querySelectorAll('canvas')].map(x=>({class:x.className,w:x.width,h:x.height})),
        sea:[...document.querySelectorAll('.screen.is-active > .sea, .screen.is-active > .s2-bg')].map(x=>({class:x.className,background:getComputedStyle(x).background,visibility:getComputedStyle(x).visibility})),
      };
    });
    const result = {state,errors,failures,cancelledRequests,before,after,layers,navigation,resources,resizePixelsIdentical,gpu,traceStatus,options:args};
    fs.writeFileSync(path.join(output,label+'.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify({label,...state,longFrames:state.longFrames.length,sea:undefined,errors,failures,layers:layers.length},null,2));
    if(cdp && !args.includes('--no-shot')) {
      const shot = await cdp.send('Page.captureScreenshot', {format:'png'});
      fs.writeFileSync(path.join(output,label+'.png'), Buffer.from(shot.data,'base64'));
    } else if(!args.includes('--no-shot')) await page.screenshot({path:path.join(output,label+'.png'),timeout:10000});
    assert.deepEqual(errors,[],'No browser exceptions');
    assert.deepEqual(failures,[],'No failed assets');
    assert.deepEqual(state.images,[],'All image elements loaded successfully');
  } finally { clearTimeout(watchdog); await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode=1; });
