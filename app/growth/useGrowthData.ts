import useSWR from 'swr';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`An error occurred while fetching data: ${res.statusText}`);
    }
    const json = await res.json();
    return json?.data || json;
};

// Helper function to safely extract the base URL, stripping out copy-paste {date} artifacts
const getBaseUrl = (envValue: string | undefined, defaultBase: string) => {
    if (!envValue) return defaultBase;
    let clean = envValue.split('?')[0];
    clean = clean.replace('/{user_id}', '');
    return clean;
};

export function useGrowthData(startDate: string, endDate: string) {
    // Only fetch if dates are provided
    const shouldFetch = startDate && endDate;
    const query = shouldFetch ? `?start_date=${startDate}&end_date=${endDate}` : '';

    const urlNewRegist = getBaseUrl(process.env.NEXT_PUBLIC_API_GROWTH_NEW_REGIST, 'https://devserver.mapid.io/admins/users/new-registrations');
    const urlSuccess = getBaseUrl(process.env.NEXT_PUBLIC_API_GROWTH_PAYMENT_SUCCESS, 'https://devserver.mapid.io/admins/users/payment-success');
    const urlAllPayments = getBaseUrl(process.env.NEXT_PUBLIC_API_GROWTH_ALL_PAYMENTS, 'https://devserver.mapid.io/admins/users/all_payments');

    const {
        data: newRegistersData,
        error: newRegistersError,
        isLoading: newRegistersLoading
    } = useSWR(
        shouldFetch ? `${urlNewRegist}${query}` : null,
        fetcher,
        {
            revalidateOnFocus: false, // Optional: adjust SWR caching policy if needed
        }
    );

    const {
        data: paymentSuccessData,
        error: paymentSuccessError,
        isLoading: paymentSuccessLoading
    } = useSWR(
        shouldFetch ? `${urlSuccess}${query}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const {
        data: allPaymentsData,
        error: allPaymentsError,
        isLoading: allPaymentsLoading
    } = useSWR(
        shouldFetch ? `${urlAllPayments}${query}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const isLoading = newRegistersLoading || paymentSuccessLoading || allPaymentsLoading;
    const isError = newRegistersError || paymentSuccessError || allPaymentsError;

    return {
        newRegisters: Array.isArray(newRegistersData) ? newRegistersData : [],
        paidConversions: Array.isArray(paymentSuccessData) ? paymentSuccessData : [],
        allPayments: Array.isArray(allPaymentsData) ? allPaymentsData : [],
        isLoading,
        isError,
    };
}

export function useUserPaymentHistory(userId: string | null) {
    const urlHistory = getBaseUrl(process.env.NEXT_PUBLIC_API_GROWTH_PAYMENT_HISTORY, 'https://devserver.mapid.io/admins/users/payments');

    const { data, error, isLoading } = useSWR(
        userId ? `${urlHistory}/${userId}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const historyData = data?.history || data;

    return {
        history: Array.isArray(historyData) ? historyData : [],
        isLoading,
        isError: error
    };
}
