/* Presentation only: existing common.js/script.js retain all API and payment actions. */
(() => {
'use strict';
const key='central-airtech-dashboard-theme';
let theme='dark';
const originalIconNodes=new Map();
try{const requested=new URLSearchParams(location.search).get('theme');const saved=localStorage.getItem(key);theme=requested==='dark'||requested==='light'?requested:saved==='light'?'light':'dark';}catch{}
document.documentElement.dataset.erpTheme=theme;
function applyTheme(next,broadcast=true){
 theme=next==='dark'?'dark':'light';document.documentElement.dataset.erpTheme=theme;
 try{localStorage.setItem(key,theme);}catch{}
 document.querySelectorAll('.erp-theme-toggle').forEach(b=>{const label=theme==='dark'?'Light mode':'Dark mode';b.setAttribute('aria-pressed',String(theme==='dark'));b.title='Switch to '+label.toLowerCase();b.setAttribute('aria-label',b.title);const text=b.querySelector('span');if(text){text.textContent=label;if(b.firstChild?.nodeType===Node.TEXT_NODE)b.firstChild.textContent=theme==='dark'?'☀ ':'☾ ';}});
 if(broadcast){document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.postMessage({type:'cat-dashboard-theme',theme},location.origin);}catch{}});if(parent!==window)parent.postMessage({type:'cat-dashboard-theme',theme},location.origin);}
}
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='cat-dashboard-theme')return;const allowed=e.source===parent||Array.from(document.querySelectorAll('iframe')).some(f=>f.contentWindow===e.source);if(allowed){applyTheme(e.data.theme,false);document.querySelectorAll('iframe').forEach(f=>f.contentWindow?.postMessage({type:'cat-dashboard-theme',theme},location.origin));}});
window.addEventListener('storage',e=>{if(e.key===key)applyTheme(e.newValue,false);});
const icons={"clients":"<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 21v-3a6 6 0 0 1 12 0v3m0-16a3 3 0 0 1 0 6m3 4a5 5 0 0 1 3 5\"/>","credit-notes":"<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 9h18m-6 5H7m3-3-3 3 3 3\"/>","customer-orders":"<path d=\"m12 3 9 5v9l-9 5-9-5V8l9-5zM3 8l9 5 9-5m-9 5v9m-4-5 2 2 4-4\"/>","dashboard":"<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/>","delivery-orders":"<path d=\"M3 6h11v11H3zm11 4h4l3 4v3h-7\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/><circle cx=\"18\" cy=\"18\" r=\"2\"/>","expenses":"<rect x=\"3\" y=\"6\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 10h18m-6 5h3M7 6V3h10v3\"/>","invoices":"<path d=\"M6 3h9l4 4v14H5V4a1 1 0 0 1 1-1zM14 3v5h5M9 12h6m-6 4h6\"/>","products":"<path d=\"m12 3 9 5v9l-9 5-9-5V8l9-5zM3 8l9 5 9-5m-9 5v9M8 5l9 5\"/>","purchase-orders":"<rect x=\"5\" y=\"4\" width=\"14\" height=\"17\" rx=\"2\"/><path d=\"M9 3h6v3H9zM9 11h6m-6 4h6\"/>","purchases":"<path d=\"M3 4h2l3 12h11l3-9H6\"/><circle cx=\"10\" cy=\"20\" r=\"1\"/><circle cx=\"18\" cy=\"20\" r=\"1\"/>","quotations":"<path d=\"M5 4h14v13H9l-4 4V4zm4 4h6m-6 4h4\"/>","vat-report":"<path d=\"M5 3h14v18H5zM9 7h6m-6 10 6-6\"/><circle cx=\"9\" cy=\"11\" r=\"1\"/><circle cx=\"15\" cy=\"17\" r=\"1\"/>"};
function ready(){
 const mobileRow=document.querySelector('.mobile-header-row');
 if(mobileRow&&!mobileRow.querySelector('.dashboard-mobile-title')){const heading=document.createElement('h1');heading.className='dashboard-mobile-title';heading.textContent='Dashboard';mobileRow.insertBefore(heading,mobileRow.querySelector('.mobile-header-logo'));}
 document.querySelectorAll('.erp-theme-toggle').forEach(b=>b.addEventListener('click',()=>applyTheme(theme==='dark'?'light':'dark')));
 const mobile=document.querySelector('.mobile-header-row');if(mobile&&!mobile.querySelector('.erp-mobile-theme')){const b=document.createElement('button');b.type='button';b.className='erp-theme-toggle erp-mobile-theme';b.setAttribute('aria-label','Dark mode');b.innerHTML='☾';b.addEventListener('click',()=>applyTheme(theme==='dark'?'light':'dark'));mobile.insertBefore(b,mobile.querySelector('.mobile-header-avatar'));}
 const frame=document.getElementById('main-content-viewport');
 if(frame){window.addEventListener('message',e=>{
  if(!window.matchMedia('(max-width:767px)').matches||!document.body.classList.contains('erp-dashboard-active')||e.origin!==location.origin||e.source!==frame.contentWindow)return;
  const tip=document.getElementById('iframeCrossTooltip'),action=e.data?.action;if(!tip||!['showTooltip','moveTooltip','hideTooltip'].includes(action))return;
  if(action==='showTooltip'){tip.innerHTML=e.data.html;tip.style.opacity='1';}
  if(action==='hideTooltip'&&e.data.mobileDismiss)tip.style.opacity='0';
  e.stopImmediatePropagation();
 },true);
 document.addEventListener('pointerdown',()=>{if(window.matchMedia('(max-width:767px)').matches){const tip=document.getElementById('iframeCrossTooltip');if(tip)tip.style.opacity='0';}});}
 if(frame){
 const desktopHeading=window.matchMedia('(min-width:768px)');let ledgerHeadingObserver=null;
 const actions=document.querySelector('.dashboard-portal-actions');let portalDate=document.getElementById('erp-portal-date');
 if(actions&&!portalDate){portalDate=document.createElement('time');portalDate.id='erp-portal-date';portalDate.hidden=true;actions.append(portalDate);}
 function frameLoaded(){try{
  ledgerHeadingObserver?.disconnect();
  const doc=frame.contentDocument,dashboard=doc?.body?.classList.contains('dashboard-redesign');const pages=[{prefix:'inv',rows:'invoice-rows',title:'Invoices',nav:'btn-invoices',subtitle:'Your invoices and payments, in one place.'},{prefix:'do',rows:'do-rows',title:'Delivery Orders',nav:'btn-deliveryorders',subtitle:'Your deliveries and dispatch records, in one place.'},{prefix:'quote',rows:'quote-rows',title:'Quotations',nav:'btn-quotations',subtitle:'Your quotations and customer offers, in one place.'},{prefix:'lpo',rows:'lpo-rows',title:'Purchase Orders',nav:'btn-purchaseorders',subtitle:'Your purchase orders and suppliers, in one place.'},{"prefix":"co","rows":"co-rows","title":"Customer Orders","nav":"btn-customerorders","subtitle":"Your customer orders and deliveries, in one place."},{"prefix":"cn","rows":"cn-rows","title":"Credit Notes","nav":"btn-creditnote","subtitle":"Your credit notes and adjustments, in one place."},{"prefix":"client","rows":"client-rows","title":"Customers","nav":"btn-clients","subtitle":"Your customers and contact details, in one place."},{"prefix":"products","rows":"products-rows","title":"Products","nav":"btn-products","subtitle":"Your products, pricing and stock, in one place."},{"prefix":"purchases","rows":"purchases-rows","title":"Purchases","nav":"btn-purchases","subtitle":"Your supplier bills and payments, in one place."},{"prefix":"expenses","rows":"expenses-rows","title":"Expenses","nav":"btn-expenses","subtitle":"Your operating expenses and payments, in one place."}];const page=doc?.body?.classList.contains('invoice-redesign')?pages.find(p=>doc.getElementById(p.prefix+'-head')):null,workspace=dashboard||page;
  document.body.classList.toggle('erp-dashboard-active',!!workspace);
  const title=document.querySelector('.dashboard-portal-title h1'),subtitle=document.querySelector('.dashboard-portal-title p');
  if(title)title.textContent=page?.title||'Dashboard';
  if(subtitle)subtitle.textContent=page?.subtitle||'Your invoices, finances and inventory, in one place.';
  if(workspace){const active=page?document.getElementById(page.nav):document.querySelector('.sidebar-pane>.nav-btn[data-tooltip="Dashboard"]');document.querySelectorAll('.sidebar-pane>.nav-btn').forEach(b=>b.classList.toggle('active',b===active));}
  doc?.body?.classList.toggle('dashboard-title-in-portal',!!dashboard&&desktopHeading.matches);
  doc?.body?.classList.toggle('invoice-title-in-portal',!!page&&desktopHeading.matches);
  if(portalDate)portalDate.hidden=!page||!desktopHeading.matches;
  if(page){
   const updateHeading=()=>{
    const rows=doc.getElementById(page.rows),count=rows?[...rows.children].filter(r=>r.cells.length>1).length:0;
    if(title)title.textContent=page.title+' ('+count.toLocaleString('en-US')+')';
    const date=doc.getElementById(page.prefix+'-head-date')?.textContent.trim();
    if(portalDate){portalDate.textContent=date&&date!=='date'?date:new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'2-digit'}).format(new Date()).replace(/ /g,'-');portalDate.dateTime=new Date().toISOString().slice(0,10);}
   };
   ledgerHeadingObserver=new MutationObserver(updateHeading);
   [page.prefix+'-head',page.prefix+'-head-date',page.rows].forEach(id=>{const node=doc.getElementById(id);if(node)ledgerHeadingObserver.observe(node,{childList:true,subtree:true,characterData:true});});updateHeading();
  }
  originalIconNodes.forEach((markup,node)=>{node.innerHTML=workspace?markup.dashboard:markup.original;});
  doc?.documentElement.setAttribute('data-erp-theme',theme);frame.contentWindow.postMessage({type:'cat-dashboard-theme',theme},location.origin);
 }catch{document.body.classList.remove('erp-dashboard-active');}}
 frame.addEventListener('load',frameLoaded);desktopHeading.addEventListener('change',frameLoaded);if(frame.contentDocument?.readyState==='complete')frameLoaded();
 const sidebarIconNames={'Dashboard':'dashboard','Invoices':'invoices','Delivery Orders':'delivery-orders','Quotations':'quotations','Purchase Orders':'purchase-orders','Customer Orders':'customer-orders','Credit Notes':'credit-notes','Clients':'clients','Products':'products','Purchases':'purchases','Expenses':'expenses','VAT Reports':'vat-report'};
 document.querySelectorAll('.sidebar-pane .nav-btn').forEach(button=>{
  const art=icons[sidebarIconNames[button.dataset.tooltip]],slot=button.querySelector('.fa-stack');
  if(!art||!slot)return;
  const markup='<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+art+'</svg>';
  slot.innerHTML=markup;
  originalIconNodes.set(slot,{original:markup,dashboard:markup});
 });
 const collapse=document.getElementById('toggle-sidebar-btn');if(collapse){const original=collapse.innerHTML;collapse.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>';originalIconNodes.set(collapse,{original,dashboard:collapse.innerHTML});collapse.setAttribute('role','button');const pane=document.getElementById('sidebar-pane');const syncCollapse=()=>{const closed=pane?.classList.contains('collapsed');collapse.setAttribute('aria-label',closed?'Expand sidebar':'Collapse sidebar');collapse.setAttribute('aria-expanded',String(!closed));collapse.title=closed?'Expand sidebar':'Collapse sidebar';};if(pane)new MutationObserver(syncCollapse).observe(pane,{attributes:true,attributeFilter:['class']});syncCollapse();collapse.tabIndex=0;collapse.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();collapse.click();}});}}
 const body=document.body;if(body.classList.contains('dashboard-redesign')){
  body.classList.toggle('dashboard-embedded',parent!==window);
  const mobileTips=window.matchMedia('(max-width:767px)');let holdTimer=0,holdPoint=null;
  const hideTip=()=>parent.postMessage({action:'hideTooltip',mobileDismiss:true},location.origin);
  const showTip=target=>target.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));
  const cancelHold=()=>{clearTimeout(holdTimer);holdPoint=null;};
  document.addEventListener('pointerdown',e=>{if(!mobileTips.matches)return;hideTip();cancelHold();const target=e.target.closest('.mouse-over [data-type]');if(e.pointerType!=='touch'||!target)return;holdPoint={x:e.clientX,y:e.clientY};holdTimer=setTimeout(()=>{showTip(target);holdPoint=null;},550);});
  document.addEventListener('pointermove',e=>{if(holdPoint&&Math.hypot(e.clientX-holdPoint.x,e.clientY-holdPoint.y)>8)cancelHold();},{passive:true});
  document.addEventListener('pointerup',cancelHold);document.addEventListener('pointercancel',cancelHold);
  document.addEventListener('contextmenu',e=>{if(!mobileTips.matches)return;const target=e.target.closest('.mouse-over [data-type]');if(target){e.preventDefault();cancelHold();showTip(target);}});
  document.addEventListener('scroll',()=>{if(mobileTips.matches){cancelHold();hideTip();}},true);
  const date=document.getElementById('dash-current-date');if(date){date.dateTime=new Date().toISOString().slice(0,10);date.textContent=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());}
  const chart=document.getElementById('performanceChart'),axis=document.getElementById('dashboard-y-axis'),readout=document.getElementById('dashboard-chart-readout');
  function updateAxis(){const values=Array.from(chart.querySelectorAll('.bar[data-exact]')).map(b=>Number(b.dataset.exact)||0),max=Math.max(...values,0);axis.replaceChildren(...[1,.75,.5,.25,0].map(f=>{const n=document.createElement('span'),v=max*f;n.textContent=v>=1000000?(v/1000000).toFixed(1)+'m':v>=1000?Math.round(v/1000)+'k':Math.round(v).toLocaleString('en-US');return n;}));chart.querySelectorAll('.month-group').forEach(group=>{const label=group.querySelector('.bar-label');if(!label)return;group.tabIndex=0;group.setAttribute('role','button');group.setAttribute('aria-label',label.dataset.month+' financial summary');});}
  function inspectMonth(e){const group=e.target.closest('.month-group');if(!group)return;const d=group.querySelector('.bar-label')?.dataset;if(!d)return;const money=n=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});readout.textContent=d.month+' · Sales '+money(d.sales)+' · Operating costs '+money(d.expenses)+' · Net margin '+money(d.margin)+' AED';}
  chart.addEventListener('click',inspectMonth);chart.addEventListener('focusin',inspectMonth);new MutationObserver(updateAxis).observe(chart,{childList:true});updateAxis();
  const rows=document.getElementById('transactions-table-body');function updateCount(){const all=rows.querySelectorAll('tr');document.getElementById('dashboard-pdc-count').textContent=all.length;const overdue=[...all].filter(r=>r.hasAttribute('data-amount'));const amount=overdue.reduce((sum,r)=>sum+(Number(String(r.dataset.amount||0).replace(/,/g,''))||0),0);const cardAmount=document.querySelector('#dashboard-pdc-overdue .dashboard-amount');if(cardAmount)cardAmount.textContent=amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});const cardNote=document.getElementById('dashboard-pdc-overdue-note');if(cardNote)cardNote.textContent=overdue.length+' overdue invoice'+(overdue.length===1?'':'s');all.forEach(row=>{const box=row.querySelector('.row-select');if(box)box.setAttribute('aria-label','Select invoice '+row.dataset.invoice);});}new MutationObserver(updateCount).observe(rows,{childList:true});updateCount();
  // Keep full mobile amounts on one line, including narrow Android WebViews.
  const mobileCards=window.matchMedia('(max-width:767px)'),cardGrid=document.querySelector('.card-container');let fitFrame=0;
  function fitCardValues(){fitFrame=0;cardGrid.querySelectorAll('.metrics-value').forEach(value=>{if(!mobileCards.matches){value.style.removeProperty('--dash-mobile-value-size');return;}let size=16;value.style.setProperty('--dash-mobile-value-size',size+'px');while(size>11&&value.scrollWidth>value.clientWidth+1){size--;value.style.setProperty('--dash-mobile-value-size',size+'px');}});}
  function scheduleCardFit(){if(!fitFrame)fitFrame=requestAnimationFrame(fitCardValues);}
  new MutationObserver(scheduleCardFit).observe(cardGrid,{childList:true,characterData:true,subtree:true});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(scheduleCardFit).observe(cardGrid);
  mobileCards.addEventListener('change',scheduleCardFit);scheduleCardFit();
  const summary=document.querySelector('.dashboard-financials');function decimals(){summary.querySelectorAll('.metric-value').forEach(el=>{const text=el.textContent.trim();if(!/\d/.test(text))return;const val=Number(text.replace(/,/g,''));if(!Number.isFinite(val))return;const formatted=val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});if(text===formatted)return;Array.from(el.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>n.remove());el.append(document.createTextNode(formatted));});}new MutationObserver(decimals).observe(summary,{subtree:true,childList:true});decimals();
 }
 applyTheme(theme);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
