const {JSDOM}=require('jsdom');
const JSZip=require('jszip');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {test}=require('node:test');

function app(){
  const html=fs.readFileSync('index.html','utf8');
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost/'});
  dom.window.JSZip=JSZip;
  const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  dom.window.eval(source+`\nwindow.api={get state(){return state},parseWorkbook,patchWorkbook,makeDemoXlsx,cellFillHex,readStyles,readTheme,repairSpreadsheetNamespaces,populateFilters,filterState,accountMatchesFilters,changeStatus,readStatusPalette,statusFromCell,tint};`);
  return dom;
}
async function load(dom,buffer){
  const api=dom.window.api;
  api.state.zip=await JSZip.loadAsync(buffer);
  await api.parseWorkbook();
  return api;
}
function normalizedXml(dom,text){
  const d=new dom.window.DOMParser().parseFromString(text,'application/xml');
  dom.window.api.repairSpreadsheetNamespaces(d);
  return d;
}
function xml(dom,doc){return new dom.window.XMLSerializer().serializeToString(doc)}
async function compareUntouched(dom,api,out,allowed){
  for(const name of Object.keys(api.state.zip.files).filter(n=>!api.state.zip.files[n].dir)){
    if(allowed.includes(name))continue;
    assert.deepEqual(await out.file(name).async('uint8array'),await api.state.zip.file(name).async('uint8array'),name);
  }
}
test('untouched workbook, repeated export, exact marker colors and legacy namespace repair',async()=>{
  const dom=app(),api=await load(dom,process.env.TEST_XLSX?fs.readFileSync(process.env.TEST_XLSX):await dom.window.api.makeDemoXlsx());
  assert.ok(api.state.accounts.length);
  const sourceSheet=await api.state.zip.file(api.state.sheetPath).async('string');
  const sheet=normalizedXml(dom,sourceSheet);
  const cells=new Map([...sheet.getElementsByTagName('c')].map(c=>[c.getAttribute('r'),c]));
  for(const a of api.state.accounts)assert.equal(a.statusHex,'#'+(api.cellFillHex(cells.get('B'+a.row)||cells.get('A'+a.row))||'FFFFFF'));
  const out=await api.patchWorkbook(),again=await api.patchWorkbook();
  await compareUntouched(dom,api,out,[api.state.sheetPath,api.state.stylesPath]);
  for(const path of [api.state.sheetPath,api.state.stylesPath]){
    const actual=await out.file(path).async('string');
    assert.ok(!actual.includes('xmlns=""'),path);
    assert.equal(actual,await again.file(path).async('string'),'repeat is idempotent');
    assert.equal(xml(dom,normalizedXml(dom,actual)),xml(dom,normalizedXml(dom,await api.state.zip.file(path).async('string'))),'only legacy namespaces repaired');
  }
  assert.equal(await api.state.zip.file(api.state.sheetPath).async('string'),sourceSheet,'source archive unchanged');
  dom.window.close();
});

test('status export preserves values, row layout, other worksheets and non-fill style properties',async()=>{
  const dom=app(),api=await load(dom,process.env.TEST_XLSX?fs.readFileSync(process.env.TEST_XLSX):await dom.window.api.makeDemoXlsx());
  const a=api.state.accounts[0];a.status=a.originalStatus==='sleeping'?'projects':'sleeping';a.statusHex=a.status==='sleeping'?'#FF0000':'#92D050';
  const out=await api.patchWorkbook();
  await compareUntouched(dom,api,out,[api.state.sheetPath,api.state.stylesPath]);
  const before=normalizedXml(dom,await api.state.zip.file(api.state.sheetPath).async('string'));
  const after=normalizedXml(dom,await out.file(api.state.sheetPath).async('string'));
  const oldStyles=normalizedXml(dom,await api.state.zip.file(api.state.stylesPath).async('string')).getElementsByTagName('cellXfs')[0];
  const newStyles=normalizedXml(dom,await out.file(api.state.stylesPath).async('string')).getElementsByTagName('cellXfs')[0];
  const oldCells=[...before.getElementsByTagName('c')],newCells=[...after.getElementsByTagName('c')];
  assert.equal(newCells.length,oldCells.length);
  let changed=0;
  newCells.forEach((cell,i)=>{
    const original=oldCells[i];
    if(cell.getAttribute('s')!==original.getAttribute('s')){
      changed++;assert.equal(Number(cell.getAttribute('r').replace(/\D/g,'')),a.row);
      const x=newStyles.children[Number(cell.getAttribute('s'))].cloneNode(true);
      const y=oldStyles.children[Number(original.getAttribute('s')||0)].cloneNode(true);
      for(const attr of ['fillId','applyFill']){x.removeAttribute(attr);y.removeAttribute(attr)}
      assert.equal(xml(dom,x),xml(dom,y),'font, border, number format, alignment preserved');
      if(original.hasAttribute('s'))cell.setAttribute('s',original.getAttribute('s'));else cell.removeAttribute('s');
    }
  });
  assert.ok(changed);
  assert.equal(xml(dom,after),xml(dom,before),'worksheet differs only in intended style references');
  a.status=a.originalStatus;a.statusHex=a.originalHex;
  const undo=await api.patchWorkbook();
  assert.equal(xml(dom,normalizedXml(dom,await undo.file(api.state.sheetPath).async('string'))),xml(dom,before));
  dom.window.close();
});

test('GPS opt-in: stable columns, proper namespaces and blank missing coordinates',async()=>{
  const dom=app(),api=await load(dom,await dom.window.api.makeDemoXlsx());
  dom.window.document.getElementById('exportGeo').checked=true;
  const a=api.state.accounts[0];a.mappable=false;a.lat=null;a.lon=null;
  const out=await api.patchWorkbook(),again=await api.patchWorkbook();
  const text=await out.file(api.state.sheetPath).async('string');
  assert.equal(text,await again.file(api.state.sheetPath).async('string'));
  assert.ok(!text.includes('xmlns=""'));
  const doc=normalizedXml(dom,text);
  const header=[...doc.getElementsByTagName('row')].find(r=>Number(r.getAttribute('r'))===api.state.headerRow);
  const lat=[...header.children].find(c=>c.textContent==='GPS Latitude').getAttribute('r').replace(/\d/g,'');
  const cell=[...doc.getElementsByTagName('c')].find(c=>c.getAttribute('r')===lat+a.row);
  assert.equal(cell.textContent,'','missing coordinates must not become zero');
  for(const row of doc.getElementsByTagName('row')){
    const refs=[...row.children].map(c=>c.getAttribute('r'));assert.equal(new Set(refs).size,refs.length);
  }
  await load(dom,await out.generateAsync({type:'nodebuffer'}));
  assert.equal(api.state.accounts.length>0,true);
  const reexport=await api.patchWorkbook();
  const next=normalizedXml(dom,await reexport.file(api.state.sheetPath).async('string'));
  assert.equal(next.getElementsByTagName('dimension')[0]?.getAttribute('ref'),doc.getElementsByTagName('dimension')[0]?.getAttribute('ref'));
  dom.window.close();
});

test('checkbox selection persists across refresh, OR within categories and AND across categories',async()=>{
  const dom=app(),api=await load(dom,await dom.window.api.makeDemoXlsx());
  api.populateFilters();
  const d=dom.window.document,status=d.getElementById('fStatus'),owner=d.getElementById('fOwner');
  assert.ok(api.state.accounts.every(a=>api.accountMatchesFilters(a)));
  [...status.options].forEach(o=>o.selected=false);
  assert.ok(api.state.accounts.every(a=>!api.accountMatchesFilters(a)));
  status.options[0].selected=true;status.options[1].selected=true;
  assert.equal(api.filterState().status.size,2);
  for(const a of api.state.accounts)assert.equal(api.accountMatchesFilters(a),['projects','contact'].includes(a.status));
  [...owner.options].forEach((o,i)=>o.selected=i===0);
  for(const a of api.state.accounts)assert.equal(api.accountMatchesFilters(a),['projects','contact'].includes(a.status)&&a.owner===owner.value);
  api.populateFilters();assert.equal(api.filterState().status.size,2);assert.equal(api.filterState().owner.size,1);
  assert.equal(d.getElementById('fadeMode').checked,false);
  assert.equal(d.querySelectorAll('#fStatusChoices input:checked').length,2);
  dom.window.close();
});

test('theme tint uses HLS luminance and white is unclassified',async()=>{
  const dom=app(),api=await load(dom,await dom.window.api.makeDemoXlsx());
  assert.equal(api.tint('4F81BD',0.4),'95B3D7');
  assert.equal(api.tint('FFFFFF',0),'FFFFFF');
  const doc=new dom.window.DOMParser().parseFromString('<c/>','application/xml');
  assert.equal(api.statusFromCell(doc.documentElement).id,'none');
  dom.window.close();
});
