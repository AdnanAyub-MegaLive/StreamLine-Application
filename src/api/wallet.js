import { apiClient } from './client';

function authHeaders(sessionToken) {
  return { headers: { Authorization: `Bearer ${sessionToken}` } };
}

export async function fetchWallet(sessionToken) {
  const response = await apiClient.get('/api/wallet', authHeaders(sessionToken));
  return response.data.data;
}

export async function fetchCoinPackages(sessionToken) {
  const response = await apiClient.get('/api/wallet/coin-packages', authHeaders(sessionToken));
  return response.data.data;
}

export async function fetchWalletTransactions(sessionToken, { limit = 20, cursor } = {}) {
  const response = await apiClient.get('/api/wallet/transactions', {
    ...authHeaders(sessionToken),
    params: { limit, cursor }
  });
  return response.data.data;
}

export class WalletTopUpError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = 'WalletTopUpError';
    this.code = code;
  }
}

export async function createTopUp(sessionToken, { packageId, paymentMethod }) {
  try {
    const response = await apiClient.post('/api/wallet/top-ups', { packageId, paymentMethod }, authHeaders(sessionToken));
    return response.data.data;
  } catch (error) {
    const backendError = error?.response?.data?.error;
    if (backendError) {
      throw new WalletTopUpError(backendError.message ?? 'Top up failed.', backendError.code);
    }
    throw new WalletTopUpError('Unable to reach the server. Check your connection and try again.', 'NETWORK_ERROR');
  }
}

export async function transferCoins(sessionToken, { recipientPublicId, coins }) {
  try {
    const response = await apiClient.post('/api/wallet/transfers', { recipientPublicId, coins }, authHeaders(sessionToken));
    return response.data.data;
  } catch (error) {
    const backendError = error?.response?.data?.error;
    if (backendError) {
      throw new WalletTopUpError(backendError.message ?? 'Transfer failed.', backendError.code);
    }
    throw new WalletTopUpError('Unable to reach the server. Check your connection and try again.', 'NETWORK_ERROR');
  }
}

export async function requestWithdrawal(sessionToken, { coins }) {
  try {
    const response = await apiClient.post('/api/wallet/withdrawals', { coins }, authHeaders(sessionToken));
    return response.data.data;
  } catch (error) {
    const backendError = error?.response?.data?.error;
    if (backendError) {
      throw new WalletTopUpError(backendError.message ?? 'Withdrawal failed.', backendError.code);
    }
    throw new WalletTopUpError('Unable to reach the server. Check your connection and try again.', 'NETWORK_ERROR');
  }
}
