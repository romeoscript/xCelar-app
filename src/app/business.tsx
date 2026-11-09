import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  BusinessQueryKeys,
  applyForBusiness,
  getMyBusiness,
  type Business,
  type BusinessApplication,
  type CreditSummary,
} from '@/lib/business-api';
import { formatNaira } from '@/lib/format';
import { toast } from '@/lib/toast-store';

/** Apply for a business account, follow the review, or see credit once approved. */
export default function BusinessScreen() {
  const query = useQuery({ queryKey: BusinessQueryKeys.mine, queryFn: getMyBusiness });
  const business = query.data?.business ?? null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Business account" />
      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : query.isError ? (
        <QueryError message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : !business || business.status === 'REJECTED' ? (
        <ApplicationForm previous={business} />
      ) : business.status === 'PENDING' ? (
        <PendingReview business={business} />
      ) : (
        <ApprovedAccount business={business} credit={query.data?.credit ?? null} />
      )}
    </SafeAreaView>
  );
}

function ApplicationForm({ previous }: { previous: Business | null }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BusinessApplication>({
    companyName: previous?.companyName ?? '',
    registrationNumber: previous?.registrationNumber ?? '',
    contactEmail: previous?.contactEmail ?? '',
    contactPhone: previous?.contactPhone ?? '',
    address: previous?.address ?? '',
  });
  const update = (field: keyof BusinessApplication) => (value: string) => setForm((current) => ({ ...current, [field]: value }));

  const apply = useMutation({
    mutationFn: () => applyForBusiness({ ...form, registrationNumber: form.registrationNumber?.trim() || undefined }),
    onSuccess: (business) => {
      queryClient.setQueryData(BusinessQueryKeys.mine, { business, credit: null });
      toast('Application sent');
    },
  });
  const complete = form.companyName.trim() && form.contactEmail.trim() && form.contactPhone.trim() && form.address.trim();

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
        {previous?.status === 'REJECTED' ? (
          <View className="gap-1 rounded-2xl bg-amber-50 p-4">
            <Text className="font-semibold text-amber-800">Your application wasn’t approved</Text>
            {previous.statusReason ? <Text className="text-sm text-amber-700">{previous.statusReason}</Text> : null}
            <Text className="text-sm text-amber-700">Update the details below and send it again.</Text>
          </View>
        ) : (
          <View className="gap-1.5">
            <Text className="text-lg font-bold text-brand-navy">Ship on account</Text>
            <Text className="text-sm leading-5 text-gray-500">
              Book local deliveries without paying each time. We send one invoice a month for everything you sent.
              Our team reviews each application.
            </Text>
          </View>
        )}

        <TextField label="Business name" required value={form.companyName} onChangeText={update('companyName')} placeholder="Mama Onyinye Stores" />
        <TextField
          label="CAC registration number"
          value={form.registrationNumber}
          onChangeText={update('registrationNumber')}
          placeholder="Optional, e.g. RC123456"
          autoCapitalize="characters"
        />
        <TextField
          label="Email for invoices"
          required
          value={form.contactEmail}
          onChangeText={update('contactEmail')}
          placeholder="accounts@yourbusiness.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="Phone for invoices"
          required
          value={form.contactPhone}
          onChangeText={update('contactPhone')}
          placeholder="+234…"
          keyboardType="phone-pad"
        />
        <TextField label="Business address" required value={form.address} onChangeText={update('address')} placeholder="Street, town" />

        {apply.isError ? <Text className="text-sm text-red-500">{getApiErrorMessage(apply.error)}</Text> : null}
        <Button label="Send application" disabled={!complete} loading={apply.isPending} onPress={() => apply.mutate()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PendingReview({ business }: { business: Business }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View className="gap-1.5 rounded-3xl bg-brand-surface p-5">
        <Text className="text-lg font-bold text-brand-navy">Application under review</Text>
        <Text className="text-sm leading-5 text-gray-500">
          We’ll notify you once {business.companyName} is approved. Until then you can book and pay as usual.
        </Text>
      </View>
      <BusinessDetails business={business} />
    </ScrollView>
  );
}

function ApprovedAccount({ business, credit }: { business: Business; credit: CreditSummary | null }) {
  const router = useRouter();
  const suspended = business.status === 'SUSPENDED';
  const overdue = (credit?.overdueInvoices ?? 0) > 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      {suspended ? (
        <View className="gap-1 rounded-2xl bg-red-50 p-4">
          <Text className="font-semibold text-red-700">Booking on account is paused</Text>
          <Text className="text-sm text-red-600">{business.statusReason ?? 'Contact us to restore it.'}</Text>
        </View>
      ) : overdue ? (
        <View className="gap-1 rounded-2xl bg-red-50 p-4">
          <Text className="font-semibold text-red-700">You have an overdue invoice</Text>
          <Text className="text-sm text-red-600">Pay it to keep booking on account.</Text>
        </View>
      ) : null}

      {credit ? (
        <View className="gap-4 rounded-3xl bg-brand-navy p-5">
          <View>
            <Text className="text-sm text-white/60">Credit available</Text>
            <Text className="text-3xl font-extrabold text-white">{formatNaira(credit.availableNaira)}</Text>
            <Text className="text-xs text-white/50">of {formatNaira(credit.limitNaira)} limit</Text>
          </View>
          <View className="flex-row gap-3">
            <CreditFigure label="Unpaid invoices" value={formatNaira(credit.unpaidInvoicesNaira)} />
            <CreditFigure label="Not invoiced yet" value={formatNaira(credit.unbilledNaira)} />
          </View>
        </View>
      ) : null}

      <Text className="text-sm leading-5 text-gray-500">
        Choose “Business account” when you pay for a local delivery. Invoices are sent at the start of each month;
        pay within {business.paymentTermsDays} days by card in the app or by bank transfer.
      </Text>
      <Button label="View invoices" onPress={() => router.push('/invoices')} />
      <BusinessDetails business={business} />
    </ScrollView>
  );
}

function CreditFigure({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white/10 p-3">
      <Text className="text-xs text-white/60">{label}</Text>
      <Text className="text-base font-bold text-white">{value}</Text>
    </View>
  );
}

function BusinessDetails({ business }: { business: Business }) {
  const rows: [string, string | null][] = [
    ['Business', business.companyName],
    ['Registration', business.registrationNumber],
    ['Invoice email', business.contactEmail],
    ['Invoice phone', business.contactPhone],
    ['Address', business.address],
  ];
  return (
    <View className="gap-3 rounded-3xl border border-gray-100 p-5">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <View key={label} className="gap-0.5">
            <Text className="text-xs text-gray-400">{label}</Text>
            <Text className="text-sm text-gray-800">{value}</Text>
          </View>
        ))}
    </View>
  );
}
