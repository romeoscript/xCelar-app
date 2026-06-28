import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export type RouteMapProps = {
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  height?: number;
  /** Fill the parent (flex-1) instead of using a fixed height + rounded corners. */
  fill?: boolean;
};

/** Builds a self-contained Leaflet/OSM page that draws the pickup→drop-off
 *  route (via the public OSRM router, falling back to a straight line). The map
 *  is non-interactive — it's a preview; live nav is the "Navigate" handoff. */
function buildHtml(pLat: number, pLng: number, dLat: number, dLng: number): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;background:#eef1f5}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var p=[${pLat},${pLng}], d=[${dLat},${dLng}];
  var map=L.map('map',{zoomControl:false,attributionControl:false,dragging:false,touchZoom:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  function dot(color){return L.divIcon({className:'',iconSize:[16,16],iconAnchor:[8,8],html:'<div style="background:'+color+';width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.15)"></div>'});}
  L.marker(p,{icon:dot('#16a34a')}).addTo(map);
  L.marker(d,{icon:dot('#ef4444')}).addTo(map);
  function fitTo(layer){map.fitBounds(layer.getBounds().pad(0.25));}
  var straight=L.polyline([p,d]);
  fetch('https://router.project-osrm.org/route/v1/driving/'+p[1]+','+p[0]+';'+d[1]+','+d[0]+'?overview=full&geometries=geojson')
    .then(function(r){return r.json();})
    .then(function(j){
      if(j.routes&&j.routes[0]){
        var coords=j.routes[0].geometry.coordinates.map(function(c){return [c[1],c[0]];});
        var line=L.polyline(coords,{color:'#208AEF',weight:5}).addTo(map);
        fitTo(line);
      } else { L.polyline([p,d],{color:'#208AEF',weight:4,dashArray:'6'}).addTo(map); fitTo(straight); }
    })
    .catch(function(){ L.polyline([p,d],{color:'#208AEF',weight:4,dashArray:'6'}).addTo(map); fitTo(straight); });
</script></body></html>`;
}

export function RouteMap({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  height = 220,
  fill = false,
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

  return (
    <View style={containerStyle} className={containerClass}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildHtml(pickupLat, pickupLng, dropoffLat, dropoffLng) }}
        scrollEnabled={false}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
}
