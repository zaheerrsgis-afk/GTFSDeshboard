let routes = [], indoor = {}, metrics = {}, districts = {};
let punjabMap, routeMap, indoorMap;
let selectedRouteIndex = 0;
const $ = (id)=>document.getElementById(id);

Promise.all([
  fetch('data/routes.json').then(r=>r.json()),
  fetch('data/indoor.json').then(r=>r.json()),
  fetch('data/metrics.json').then(r=>r.json()),
  fetch('data/districts.geojson').then(r=>r.json())
]).then(([r,i,m,d])=>{routes=r; indoor=i; metrics=m; districts=d; initNavigation(); initHomeMap(); initLahore(); initDeveloper();});

function initNavigation(){
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.page)));
  $('openLahoreBtn').onclick=()=>showPage('lahore');
  $('homeLahoreCard').onclick=()=>showPage('lahore');
  if($('lahoreAdminBtn')) $('lahoreAdminBtn').onclick=()=>showPage('developer');
  document.querySelectorAll('.subtab').forEach(btn=>btn.addEventListener('click',()=>showLahoreTab(btn.dataset.lahoreTab)));
}
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active-page'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
  $(id).classList.add('active-page');
  setTimeout(()=>{ if(id==='home'&&punjabMap) punjabMap.invalidateSize(); if(id==='lahore'){if(routeMap)routeMap.invalidateSize(); if(indoorMap) indoorMap.invalidateSize();}},250);
}
function showLahoreTab(tab){
  document.querySelectorAll('.subtab').forEach(b=>b.classList.toggle('active',b.dataset.lahoreTab===tab));
  $('lahoreNetwork').classList.toggle('active-subpage',tab==='network');
  $('lahoreIndoor').classList.toggle('active-subpage',tab==='indoor');
  setTimeout(()=>{ if(routeMap)routeMap.invalidateSize(); if(indoorMap) indoorMap.invalidateSize(); },250);
}
function baseLayer(){return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'&copy; OpenStreetMap'});}

function initHomeMap(){
  punjabMap=L.map('punjabMap',{zoomControl:true,scrollWheelZoom:true}).setView([30.9,72.7],7);
  baseLayer().addTo(punjabMap);
  const districtLayer = L.geoJSON(districts,{
    style:f=>{
      const name=(f.properties.name||f.properties.name_ds||'').trim();
      const active=name.toLowerCase()==='lahore';
      return {
        color: active ? '#008845' : '#7f8a96',
        weight: active ? 3.2 : 1.15,
        fillColor: active ? '#1ecb75' : '#cfd5dc',
        fillOpacity: active ? 0.62 : 0.36
      };
    },
    onEachFeature:(f,l)=>{
      const name=(f.properties.name||f.properties.name_ds||'District').trim();
      const active=name.toLowerCase()==='lahore';
      l.bindTooltip(name,{sticky:true});
      l.bindPopup(`<b>${name}</b><br>${active?'Active PMA GTFS data available':'Coming soon'}`);
      if(active){
        l.on('click',()=>showPage('lahore'));
        l.on('mouseover',()=>l.setStyle({weight:4.2,fillOpacity:.72}));
        l.on('mouseout',()=>districtLayer.resetStyle(l));
      }
      const c=l.getBounds().getCenter();
      L.marker(c,{interactive:false,icon:L.divIcon({className:active?'district-label-active':'district-label',html:name,iconSize:[110,18]})}).addTo(punjabMap);
    }
  }).addTo(punjabMap);
  if(districtLayer.getBounds && districtLayer.getBounds().isValid()){
    punjabMap.fitBounds(districtLayer.getBounds(),{padding:[18,18]});
  }
}

function initLahore(){
  $('quickMetrics').innerHTML=`<div class="metric-line"><span>Live routes</span><b>${metrics.routes}</b></div><div class="metric-line"><span>Trips</span><b>${metrics.trips}</b></div><div class="metric-line"><span>Passenger stops</span><b>${metrics.stops_public}</b></div>`;
  buildRouteList();
  routeMap=L.map('routeMap',{zoomControl:true,scrollWheelZoom:true}).setView([31.52,74.34],11);
  baseLayer().addTo(routeMap);
  updateRouteMap(0);
  indoorMap=L.map('indoorMap',{zoomControl:true,scrollWheelZoom:true}).setView([31.55,74.32],13);
  baseLayer().addTo(indoorMap);
  $('indoorSystem').onchange=populateStations;
  $('stationSelect').onchange=updateIndoorMap;
  populateStations();
}
function buildRouteList(){
  const box=$('routeList'); box.innerHTML='';
  routes.forEach((r,idx)=>{
    const div=document.createElement('div'); div.className='route-item'+(idx===0?' active':'');
    div.innerHTML=`<span class="route-color" style="background:${r.color}"></span><div><b>${cleanName(r.name)}</b><small>${r.stop_count} stops · ${r.directions.length || 1} direction(s)</small></div>`;
    div.onclick=()=>{document.querySelectorAll('.route-item').forEach(x=>x.classList.remove('active'));div.classList.add('active');updateRouteMap(idx);};
    box.appendChild(div);
  });
}
function cleanName(n){return (n||'Route').replace(/([a-z])([A-Z])/g,'$1 $2').replace('Orange Line','Orange Line').trim();}
function updateRouteMap(idx){
  selectedRouteIndex=idx; const r=routes[idx];
  routeMap.eachLayer(layer=>{if(!layer._url)routeMap.removeLayer(layer)});
  $('selectedRouteTitle').innerText=cleanName(r.name);
  $('selectedRouteDesc').innerText=r.desc || 'Selected Lahore PMA route';
  let bounds=[];
  r.polylines.forEach(pl=>{
    const line=L.polyline(pl.points,{color:r.color,weight:6,opacity:.9}).addTo(routeMap);
    bounds.push(...pl.points);
  });
  r.stops.forEach((s,i)=>{
    if(s.lat&&s.lon){
      const marker=L.circleMarker([s.lat,s.lon],{radius:5,color:'#08254a',weight:2,fillColor:'#fff',fillOpacity:1}).addTo(routeMap);
      marker.bindPopup(`<b>${i+1}. ${s.name}</b>${s.ur?'<br><span dir="rtl">'+s.ur+'</span>':''}`);
      bounds.push([s.lat,s.lon]);
    }
  });
  if(bounds.length){routeMap.fitBounds(bounds,{padding:[35,35]});}
  $('routeStats').innerHTML=`<div><b>${r.stop_count}</b><span>Passenger stops</span></div><div><b>${r.trip_count}</b><span>GTFS trips</span></div>`;
  const sl=$('routeStops'); sl.innerHTML='';
  r.stops.forEach((s,i)=>{const row=document.createElement('div'); row.className='stop-row'; row.innerHTML=`<b>${i+1}. ${s.name}</b><small>${s.ur?'<span dir="rtl">'+s.ur+'</span> · ':''}${s.stop_id}</small>`; sl.appendChild(row);});
}
function populateStations(){
  const sys=$('indoorSystem').value;
  const stations=(indoor[sys]&&indoor[sys].stations)||[];
  $('stationSelect').innerHTML=stations.map((s,i)=>`<option value="${i}">${s.name}</option>`).join('');
  updateIndoorMap();
}
function updateIndoorMap(){
  const sys=$('indoorSystem').value; const stations=(indoor[sys]&&indoor[sys].stations)||[]; const idx=+$('stationSelect').value||0; const st=stations[idx];
  indoorMap.eachLayer(layer=>{if(!layer._url)indoorMap.removeLayer(layer)});
  if(!st){$('stationSummary').innerHTML='No station infrastructure available.'; return;}
  $('indoorTitle').innerText=`${indoor[sys].label}: ${st.name}`;
  let bounds=[];
  st.nodes.forEach(n=>{
    if(n.lat&&n.lon){
      L.circleMarker([n.lat,n.lon],{radius:n.kind==='Station complex'?8:6,color:'#ffffff',weight:2,fillColor:n.kind==='Entrance/Exit'?'#e88b00':'#008845',fillOpacity:.95}).addTo(indoorMap).bindPopup(`<b>${n.name}</b><br>${n.kind}<br>${n.level_id||'Level not specified'}<br>${n.stop_id}`);
      bounds.push([n.lat,n.lon]);
    }
  });
  if(bounds.length) indoorMap.fitBounds(bounds,{padding:[60,60],maxZoom:19});
  const counts=st.nodes.reduce((a,n)=>{a[n.kind]=(a[n.kind]||0)+1;return a;},{});
  $('stationSummary').innerHTML=`<b>${st.name}</b><br>${st.nodes.length} indoor/station points<br>`+Object.entries(counts).map(([k,v])=>`${k}: <b>${v}</b>`).join('<br>');
}
function initDeveloper(){
  $('readinessList').innerHTML=`<li>Website structure: <b>Ready</b></li><li>Lahore PMA GTFS package: <b>Available</b></li><li>PTC / Multan / Punjab EVs: <b>Coming soon</b></li><li>Calendar validity: <b>Update required before Google submission</b></li>`;
}
