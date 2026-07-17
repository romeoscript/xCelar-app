import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { type PickedLocation, reverseGeocode } from '@/lib/location';

// Lagos as the default starting point.
const DEFAULT_CENTER = { lat: 6.5244, lng: 3.3792 };

export type MapPickerProps = {
  visible: boolean;
  initial?: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
};

export function MapPicker({ visible, initial, onClose, onConfirm }: MapPickerProps) {
  const center = useRef({
    lat: initial?.latitude ?? DEFAULT_CENTER.lat,
    lng: initial?.longitude ?? DEFAULT_CENTER.lng,
  });
  const [resolving, setResolving] = useState(false);

  const handleRegionChange = (region: Region) => {
    center.current = { lat: region.latitude, lng: region.longitude };
  };

  const handleConfirm = async () => {
    setResolving(true);
    try {
      const { lat, lng } = center.current;
      const geocode = await reverseGeocode(lat, lng);
      onConfirm({ ...geocode, latitude: lat, longitude: lng });
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
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: center.current.lat,
              longitude: center.current.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onRegionChangeComplete={handleRegionChange}
            showsUserLocation
            toolbarEnabled={false}
          />
          {/* Fixed pin over the map centre; the map moves underneath it. */}
          <View pointerEvents="none" style={styles.pinOverlay}>
            <MaterialCommunityIcons
              name="map-marker"
              size={44}
              color={Brand.blue}
              style={styles.pin}
            />
          </View>
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

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    // Lift the pin so its point — not its middle — sits on the map centre.
    transform: [{ translateY: -22 }],
  },
});
