import * as WebBrowser from 'expo-web-browser';
import { Pressable } from 'react-native';

import { ChatIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { env } from '@/lib/env';

/**
 * Floating customer-care button. Opens the external support widget/chat in an
 * in-app browser. Replace `env.supportUrl` with the real provider link
 * (Crisp/Intercom/tawk.to/WhatsApp) to go live.
 */
export function SupportWidget() {
  const openSupport = () => {
    void WebBrowser.openBrowserAsync(env.supportUrl);
  };

  return (
    <Pressable
      onPress={openSupport}
      accessibilityRole="button"
      accessibilityLabel="Contact support"
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-brand-blue active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <ChatIcon size={26} color="#ffffff" dotColor={Brand.blue} />
    </Pressable>
  );
}
