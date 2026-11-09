import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraIcon, ChevronLeftIcon, PhoneCallIcon } from '@/components/icons';
import { RouteMap } from '@/components/rider/route-map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { useRiderVehicle } from '@/hooks/use-rider-vehicle';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { getCurrentPosition } from '@/lib/location';
import {
  collectParcel,
  completeLeg,
  getDelivery,
  markArrived,
  reportDeliveryLocation,
  reportDeliveryProblem,
  type DeliveryProblemReason,
  type RiderJob,
  type Stop,
} from '@/lib/rider-api';
import { canReportProblem, legStep, nextStop } from '@/lib/rider-jobs';
import { uploadFile } from '@/lib/uploads';

const POSITION_STALE_MS = 10_000;
const POSITION_INTERVAL_MS = 15_000;

function callNumber(phone: string | null) {
  if (phone) {
    void Linking.openURL(`tel:${phone}`);
  }
}

export default function RiderJobScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicleType = useRiderVehicle();

  const [focus, setFocus] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [proofKey, setProofKey] = useState<string | null>(null);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [cashCollected, setCashCollected] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState<number>();

  const jobQuery = useQuery({
    queryKey: ['rider-delivery', id],
    queryFn: () => getDelivery(id as string),
    enabled: Boolean(id),
  });
  const locationQuery = useQuery({
    queryKey: ['rider-position'],
    queryFn: getCurrentPosition,
    staleTime: POSITION_STALE_MS,
    refetchInterval: POSITION_INTERVAL_MS,
  });

  // Heartbeat the rider's position while they hold the parcel, so the customer
  // and dispatch can follow it. Best-effort: a dropped ping only means a
  // slightly staler dot. Keyed on the fetch time to send every tick.
  const isActive = jobQuery.data?.isActive ?? false;
  const position = locationQuery.data;
  const positionUpdatedAt = locationQuery.dataUpdatedAt;
  useEffect(() => {
    if (!id || !isActive || !position) {
      return;
    }
    reportDeliveryLocation(id, position.latitude, position.longitude).catch(() => undefined);
  }, [id, isActive, position, positionUpdatedAt]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['rider-delivery', id] });
    void queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
  };
  const onFailure = (failure: unknown) => setError(getApiErrorMessage(failure));

  const arrive = useMutation({ mutationFn: () => markArrived(id as string), onSuccess: refresh, onError: onFailure });
  const collect = useMutation({ mutationFn: () => collectParcel(id as string), onSuccess: refresh, onError: onFailure });
  const complete = useMutation({
    mutationFn: () => completeLeg(id as string, { proofImageKey: proofKey as string, cashCollected }),
    onSuccess: refresh,
    onError: onFailure,
  });
  const report = useMutation({
    mutationFn: (reason: DeliveryProblemReason) => reportDeliveryProblem(id as string, reason),
    onSuccess: () => {
      setReportOpen(false);
      refresh();
    },
    onError: (failure) => {
      setReportOpen(false);
      onFailure(failure);
    },
  });

  const takeProof = async () => {
    tapFeedback();
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Allow camera access to take the proof photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) {
      return;
    }
    setUploadingProof(true);
    try {
      const key = await uploadFile({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' }, 'proofs');
      setProofKey(key);
      setProofUri(asset.uri);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Upload failed.');
    } finally {
      setUploadingProof(false);
    }
  };

  const navigateTo = (stop: Stop) => {
    tapFeedback();
    if (stop.lat != null && stop.lng != null) {
      setFocus({ lat: stop.lat, lng: stop.lng, label: STOP_LABELS[stop.kind] });
      return;
    }
    // No coordinates for this stop: hand the address to the platform maps app.
    if (stop.address) {
      const query = encodeURIComponent(stop.address);
      void Linking.openURL(Platform.select({ ios: `maps:0,0?q=${query}`, default: `geo:0,0?q=${query}` }));
    }
  };

  if (!id) {
    return <Redirect href="/rider/home" />;
  }
  if (jobQuery.isError) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 40 }}>
        <StatusBar style="dark" />
        <QueryError onRetry={() => jobQuery.refetch()} />
      </View>
    );
  }
  const job = jobQuery.data;
  if (jobQuery.isLoading || !job) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <StatusBar style="dark" />
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }

  const step = legStep(job);

  return (
    <View className="flex-1 bg-brand-surface">
      <StatusBar style="dark" />

      <RouteMap
        pickupLat={job.from.lat}
        pickupLng={job.from.lng}
        dropoffLat={job.to.lat}
        dropoffLng={job.to.lng}
        meLat={position?.latitude}
        meLng={position?.longitude}
        focusTarget={focus}
        focusLabel={focus?.label}
        vehicleType={vehicleType}
        bottomInset={panelHeight}
        fill
        interactive
      />

      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={{ top: insets.top + 8 }}
        className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/95 active:opacity-80"
      >
        <ChevronLeftIcon size={22} color={Brand.navy} />
      </Pressable>

      <View
        onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)}
        style={[panelShadow, { paddingBottom: insets.bottom + 12 }]}
        className="absolute inset-x-0 bottom-0 gap-4 rounded-t-3xl bg-white px-5 pt-5"
      >
        {step ? (
          <View className="gap-3">
            <StepProgress index={step.index} total={step.total} />
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-lg font-bold text-brand-navy">{step.title}</Text>
              <PaymentPill job={job} />
            </View>
          </View>
        ) : null}

        <ActionCard
          job={job}
          proofUri={proofUri}
          proofKey={proofKey}
          uploadingProof={uploadingProof}
          cashCollected={cashCollected}
          onToggleCash={() => setCashCollected((value) => !value)}
          pending={arrive.isPending || collect.isPending || complete.isPending}
          onArrive={() => arrive.mutate()}
          onCollect={() => collect.mutate()}
          onTakeProof={takeProof}
          onComplete={() => complete.mutate()}
          onDone={() => router.replace('/rider/deliveries')}
          onNavigate={navigateTo}
        />

        {error ? <Text className="text-center text-sm text-red-500">{error}</Text> : null}

        {canReportProblem(job) ? (
          <Pressable
            onPress={() => {
              tapFeedback();
              setReportOpen(true);
            }}
            hitSlop={6}
            className="items-center active:opacity-60"
          >
            <Text className="text-sm font-medium text-gray-400">Report a problem</Text>
          </Pressable>
        ) : null}
      </View>

      <ReportSheet
        visible={reportOpen}
        job={job}
        pending={report.isPending}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason) => report.mutate(reason)}
      />
    </View>
  );
}

const STOP_LABELS: Record<Stop['kind'], string> = { SENDER: 'Sender', HUB: 'Hub', RECIPIENT: 'Recipient' };

function PaymentPill({ job }: { job: RiderJob }) {
  if (job.cashToCollectNaira != null) {
    return (
      <View className="rounded-full bg-amber-50 px-2.5 py-1">
        <Text className="text-xs font-semibold text-amber-700">Collect {formatNaira(job.cashToCollectNaira)}</Text>
      </View>
    );
  }
  if (job.leg !== 'DELIVERY') return null;
  return (
    <View className="rounded-full bg-green-50 px-2.5 py-1">
      <Text className="text-xs font-semibold text-green-700">Prepaid</Text>
    </View>
  );
}

function StepProgress({ index, total }: { index: number; total: number }) {
  return (
    <View className="gap-1.5">
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }, (_, position) => (
          <View
            key={position}
            className={`h-1 flex-1 rounded-full ${position <= index ? 'bg-brand-blue' : 'bg-gray-200'}`}
          />
        ))}
      </View>
      <Text className="text-xs font-medium text-gray-400">
        Step {index + 1} of {total}
      </Text>
    </View>
  );
}

type ActionCardProps = {
  job: RiderJob;
  proofUri: string | null;
  proofKey: string | null;
  uploadingProof: boolean;
  cashCollected: boolean;
  onToggleCash: () => void;
  pending: boolean;
  onArrive: () => void;
  onCollect: () => void;
  onTakeProof: () => void;
  onComplete: () => void;
  onDone: () => void;
  onNavigate: (stop: Stop) => void;
};

/** What the rider sees and can do at each point of their leg. */
function ActionCard(props: ActionCardProps) {
  const { job } = props;
  const stop = nextStop(job);
  if (!stop) {
    return <FinishedCard job={job} onDone={props.onDone} />;
  }
  const stopCard = <StopCard stop={stop} onNavigate={props.onNavigate} />;
  const arrived = job.arrivedAt != null;

  switch (job.stage) {
    case 'PICKUP_ASSIGNED':
      return (
        <View className="gap-4">
          {stopCard}
          {arrived ? (
            <Button label="Package collected" loading={props.pending} onPress={props.onCollect} />
          ) : (
            <Button label="I’ve arrived at pickup" loading={props.pending} onPress={props.onArrive} />
          )}
        </View>
      );
    case 'PICKED_UP':
    case 'DELIVERY_FAILED':
      return (
        <View className="gap-3">
          {stopCard}
          <Text className="text-center text-sm text-gray-500">
            Hand the package to hub staff. They’ll check it in and close your job.
          </Text>
        </View>
      );
    default:
      return arrived ? (
        <ProofStep {...props} stopCard={stopCard} />
      ) : (
        <View className="gap-4">
          {stopCard}
          <Button
            label={job.leg === 'RETURN' ? 'I’ve arrived at the sender' : 'I’ve arrived at drop-off'}
            loading={props.pending}
            onPress={props.onArrive}
          />
        </View>
      );
  }
}

function ProofStep(props: ActionCardProps & { stopCard: React.ReactNode }) {
  const { job } = props;
  const cashDue = job.cashToCollectNaira;
  const ready = Boolean(props.proofKey) && (cashDue == null || props.cashCollected);
  return (
    <View className="gap-4">
      {props.stopCard}
      <Pressable
        onPress={props.onTakeProof}
        disabled={props.uploadingProof}
        accessibilityRole="button"
        accessibilityLabel={props.proofKey ? 'Retake proof photo' : 'Take proof photo'}
        className="h-28 overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-brand-surface active:opacity-80"
      >
        {props.proofUri ? (
          <>
            <Image source={{ uri: props.proofUri }} className="h-full w-full" resizeMode="cover" />
            <View className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1">
              <Text className="text-xs font-semibold text-white">Retake</Text>
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-1.5">
            {props.uploadingProof ? <ActivityIndicator color={Brand.blue} /> : <CameraIcon size={24} color={Brand.navy} />}
            <Text className="text-sm font-semibold text-brand-navy">
              {props.uploadingProof ? 'Uploading…' : 'Take proof photo'}
            </Text>
            <Text className="text-xs text-gray-500">Required to finish this job</Text>
          </View>
        )}
      </Pressable>
      {cashDue != null ? (
        <Pressable
          onPress={props.onToggleCash}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: props.cashCollected }}
          className="flex-row items-center gap-3 rounded-2xl bg-amber-50 p-4 active:opacity-80"
        >
          <MaterialCommunityIcons
            name={props.cashCollected ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color="#b45309"
          />
          <Text className="flex-1 text-sm font-semibold text-amber-800">
            I collected {formatNaira(cashDue)} in cash
          </Text>
        </Pressable>
      ) : null}
      <Button
        label={job.leg === 'RETURN' ? 'Mark returned' : 'Complete delivery'}
        loading={props.pending}
        disabled={!ready}
        onPress={props.onComplete}
      />
    </View>
  );
}

const FINISHED_COPY: Record<RiderJob['leg'], { title: string; body: string }> = {
  PICKUP: { title: 'Handed over at the hub', body: 'Hub staff checked the package in. Nice work.' },
  DELIVERY: { title: 'Delivery complete', body: 'Nice work. The customer has been notified.' },
  RETURN: { title: 'Returned to sender', body: 'The package is back with the sender.' },
};

function FinishedCard({ job, onDone }: { job: RiderJob; onDone: () => void }) {
  const handedBack = job.leg === 'DELIVERY' && job.stage !== 'DELIVERED';
  const copy = handedBack
    ? { title: 'Handed back to the hub', body: 'Hub staff took the package back after the failed attempt.' }
    : FINISHED_COPY[job.leg];
  return (
    <View className="gap-4">
      <View className="items-center gap-2 pt-1">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <MaterialCommunityIcons name="check-circle" size={32} color="#16A34A" />
        </View>
        <Text className="text-lg font-bold text-brand-navy">{copy.title}</Text>
        <Text className="text-center text-sm text-gray-500">{copy.body}</Text>
      </View>
      {job.proofUrl ? (
        <Image source={{ uri: job.proofUrl }} className="h-32 w-full rounded-2xl" resizeMode="cover" />
      ) : null}
      <Button label="Done" onPress={onDone} />
    </View>
  );
}

const REPORT_REASONS: { key: DeliveryProblemReason; label: string; cashOnly?: boolean }[] = [
  { key: 'WRONG_ADDRESS', label: 'Address is wrong or I can’t find it' },
  { key: 'RECIPIENT_UNAVAILABLE', label: 'Nobody is available' },
  { key: 'CANNOT_REACH', label: 'Can’t reach the contact' },
  { key: 'PACKAGE_ISSUE', label: 'Problem with the package' },
  { key: 'PAYMENT_REFUSED', label: 'Recipient won’t pay', cashOnly: true },
  { key: 'OTHER', label: 'Something else' },
];

function ReportSheet({
  visible,
  job,
  pending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  job: RiderJob;
  pending: boolean;
  onClose: () => void;
  onSubmit: (reason: DeliveryProblemReason) => void;
}) {
  const reasons = REPORT_REASONS.filter((reason) => !reason.cashOnly || job.cashToCollectNaira != null);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="text-lg font-extrabold text-brand-navy">Report a problem</Text>
      <Text className="mb-4 mt-1 text-sm text-gray-500">
        {job.stage === 'OUT_FOR_DELIVERY'
          ? 'This marks the attempt as failed. Bring the package back to the hub.'
          : 'This sends the pickup back to dispatch to reassign.'}
      </Text>
      <View className="gap-2">
        {reasons.map((reason) => (
          <Pressable
            key={reason.key}
            disabled={pending}
            onPress={() => onSubmit(reason.key)}
            className="rounded-2xl bg-brand-surface px-4 py-3.5 active:opacity-70"
          >
            <Text className="text-base font-medium text-brand-navy">{reason.label}</Text>
          </Pressable>
        ))}
      </View>
      {pending ? (
        <View className="items-center pt-4">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : null}
    </BottomSheet>
  );
}

const STOP_ICONS: Record<Stop['kind'], { icon: 'package-variant-closed' | 'warehouse' | 'map-marker'; tint: string; color: string }> = {
  SENDER: { icon: 'package-variant-closed', tint: 'bg-brand-blue-tint', color: Brand.blue },
  HUB: { icon: 'warehouse', tint: 'bg-brand-gold-tint', color: '#b45309' },
  RECIPIENT: { icon: 'map-marker', tint: 'bg-brand-indigo-tint', color: Brand.indigo },
};

function StopCard({ stop, onNavigate }: { stop: Stop; onNavigate: (stop: Stop) => void }) {
  const style = STOP_ICONS[stop.kind];
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-gray-100 p-3">
      <View className={`h-11 w-11 items-center justify-center rounded-xl ${style.tint}`}>
        <MaterialCommunityIcons name={style.icon} size={22} color={style.color} />
      </View>
      <View className="flex-1">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {STOP_LABELS[stop.kind]}
        </Text>
        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
          {stop.name ?? '—'}
        </Text>
        <Text className="text-sm text-gray-500" numberOfLines={2}>
          {stop.address ?? '—'}
        </Text>
      </View>
      <View className="gap-2">
        <CircleButton
          label={`Call ${STOP_LABELS[stop.kind].toLowerCase()}`}
          disabled={!stop.phone}
          onPress={() => {
            tapFeedback();
            callNumber(stop.phone);
          }}
        >
          <PhoneCallIcon size={18} color={Brand.navy} />
        </CircleButton>
        <CircleButton label="Navigate" primary onPress={() => onNavigate(stop)}>
          <MaterialCommunityIcons name="navigation-variant" size={18} color="#ffffff" />
        </CircleButton>
      </View>
    </View>
  );
}

function CircleButton({
  label,
  primary = false,
  disabled = false,
  onPress,
  children,
}: {
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`h-10 w-10 items-center justify-center rounded-full active:opacity-80 ${primary ? 'bg-brand-blue' : 'bg-brand-surface'} ${disabled ? 'opacity-40' : ''}`}
    >
      {children}
    </Pressable>
  );
}

const panelShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.1,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: -4 },
  elevation: 12,
} as const;
