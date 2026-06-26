import { useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Button } from '@/components/ui/button';
import { type PickedLocation, reverseGeocode } from '@/lib/location';

// Lagos as the default starting point.
const DEFAULT_CENTER = { lat: 6.5244, lng: 3.3792 };

export type MapPickerProps = {
  visible: boolean;
  initial?: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
};

function buildHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html,body,#map{height:100%;margin:0;padding:0}
  #pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);z-index:1000;font-size:40px;pointer-events:none}
</style></head><body>
<div id="map"></div>
<div id="pin">📍</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map',{zoomControl:false}).setView([${lat}, ${lng}], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  function post(){var c=map.getCenter();window.ReactNativeWebView.postMessage(JSON.stringify({lat:c.lat,lng:c.lng}));}
  map.on('moveend', post);
  post();
</script></body></html>`;
}

export function MapPicker({ visible, initial, onClose, onConfirm }: MapPickerProps) {
  const center = useRef({
    lat: initial?.latitude ?? DEFAULT_CENTER.lat,
    lng: initial?.longitude ?? DEFAULT_CENTER.lng,
  });
  const [resolving, setResolving] = useState(false);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        center.current = { lat: data.lat, lng: data.lng };
      }
    } catch {
      // Ignore malformed messages.
    }
  };

  const handleConfirm = async () => {
    setResolving(true);
    try {
      const { lat, lng } = center.current;
      const address = await reverseGeocode(lat, lng);
      onConfirm({ address, latitude: lat, longitude: lng });
    } finally {
      setResolving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-6 py-2">
          <Text className="text-lg font-bold text-brand-navy">Set pickup on map</Text>
          <Pressable onPress={onClose} className="active:opacity-70">
            <Text className="text-base font-semibold text-brand-blue">Close</Text>
          </Pressable>
        </View>

        <View className="flex-1 overflow-hidden">
          <WebView
            source={{ html: buildHtml(center.current.lat, center.current.lng) }}
            onMessage={handleMessage}
            originWhitelist={['*']}
            style={{ flex: 1 }}
          />
        </View>

        <View className="px-6 pb-2 pt-3">
          <Text className="mb-3 text-center text-sm text-gray-500">
            Drag the map to position the pin, then confirm.
          </Text>
          <Button label="Use this location" loading={resolving} onPress={handleConfirm} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
