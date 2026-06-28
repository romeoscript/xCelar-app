import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export type RouteMapProps = {
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  /** The rider's current location ("Me"), if known. */
  meLat?: number | null;
  meLng?: number | null;
  height?: number;
  /** Fill the parent (flex-1) instead of using a fixed height + rounded corners. */
  fill?: boolean;
  /** Allow panning/zooming. Off for previews embedded in scroll views. */
  interactive?: boolean;
};

type Point = { lat: number; lng: number };

/** Self-contained Leaflet page with labelled Me / Pick Up / Drop Off markers and
 *  a route through them (via OSRM, straight-line fallback). Clean Carto tiles. */
function buildHtml(pickup: Point, dropoff: Point, me: Point | null, interactive: boolean): string {
  const options = interactive
    ? '{zoomControl:false,attributionControl:false}'
    : '{zoomControl:false,attributionControl:false,dragging:false,touchZoom:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false}';
  const points = me ? [me, pickup, dropoff] : [pickup, dropoff];
  const bounds = JSON.stringify(points.map((p) => [p.lat, p.lng]));
  const osrm = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const meMarker = me
    ? `L.marker([${me.lat},${me.lng}],{icon:meIcon(),zIndexOffset:1000}).addTo(map);`
    : '';

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html,body,#map{height:100%;margin:0;background:#eef1f5}
  .cal{display:flex;flex-direction:column;align-items:center}
  .pill{padding:4px 11px;border-radius:8px;font:600 12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,.25)}
  .tip{width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #000;margin-top:-1px}
  .dot{width:16px;height:16px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 0 0 9px rgba(22,163,74,.18)}
</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map=L.map('map',${options});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{maxZoom:20,subdomains:'abcd'}).addTo(map);
  function callout(text,bg,col){return L.divIcon({className:'',iconSize:[0,0],iconAnchor:[0,0],html:'<div style="transform:translate(-50%,-100%)"><div class="cal"><div class="pill" style="background:'+bg+';color:'+col+'">'+text+'</div><div class="tip" style="border-top-color:'+bg+'"></div></div></div>'});}
  function meIcon(){return L.divIcon({className:'',iconSize:[0,0],iconAnchor:[0,0],html:'<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center"><div class="pill" style="background:#F8B81B;color:#23205C;margin-bottom:7px">Me</div><div class="dot"></div></div>'});}
  L.marker([${pickup.lat},${pickup.lng}],{icon:callout('Pick Up','#EF4444','#fff')}).addTo(map);
  L.marker([${dropoff.lat},${dropoff.lng}],{icon:callout('Drop Off','#23205C','#fff')}).addTo(map);
  ${meMarker}
  var wp=${bounds};
  map.fitBounds(L.latLngBounds(wp).pad(0.35));
  fetch('https://router.project-osrm.org/route/v1/driving/${osrm}?overview=full&geometries=geojson')
    .then(function(r){return r.json();})
    .then(function(j){
      if(j.routes&&j.routes[0]){
        var c=j.routes[0].geometry.coordinates.map(function(x){return [x[1],x[0]];});
        L.polyline(c,{color:'#F97316',weight:5,lineJoin:'round'}).addTo(map);
      } else { L.polyline(wp,{color:'#F97316',weight:4,dashArray:'6'}).addTo(map); }
    })
    .catch(function(){ L.polyline(wp,{color:'#F97316',weight:4,dashArray:'6'}).addTo(map); });
</script></body></html>`;
}

export function RouteMap({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  meLat,
  meLng,
  height = 220,
  fill = false,
  interactive = false,
}: RouteMapProps) {
  const hasCoords =
    pickupLat != null && pickupLng != null && dropoffLat != null && dropoffLng != null;
  const containerStyle = fill ? undefined : { height };
  const containerClass = fill
    ? 'flex-1 overflow-hidden bg-brand-surface'
    : 'overflow-hidden rounded-2xl bg-brand-surface';

  if (!hasCoords) {
    return (
      <View style={containerStyle} className={`${containerClass} items-center justify-center`}>
        <Text className="text-sm text-gray-400">Route map unavailable</Text>
      </View>
    );
  }

  const me = meLat != null && meLng != null ? { lat: meLat, lng: meLng } : null;
  const html = buildHtml(
    { lat: pickupLat, lng: pickupLng },
    { lat: dropoffLat, lng: dropoffLng },
    me,
    interactive,
  );

  return (
    <View style={containerStyle} className={containerClass}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
}
