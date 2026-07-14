'use client';

import { useState, useEffect } from 'react';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useWeb3Deposit } from '@/hooks/useWeb3Deposit';
import Web3ConfigService from '@/lib/services/web3Config.service';
import toast from 'react-hot-toast';

interface Web3DepositProps {
  projectId?: string;
  onSuccess?: () => void;
}

export default function Web3Deposit({ projectId, onSuccess }: Web3DepositProps) {
  const [amount, setAmount] = useState('');
  const [web3Enabled, setWeb3Enabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { deposit, loading: depositing, error } = useWeb3Deposit(projectId);
  const configService = new Web3ConfigService(projectId);

  useEffect(() => {
    // Check if Web3 deposit is enabled
    configService
      .getPaymentMethods()
      .then((methods) => {
        setWeb3Enabled(methods.deposit.web3?.enabled || false);
      })
      .catch((err) => {
        console.error('Failed to check Web3 status:', err);
        setWeb3Enabled(false);
      });
  }, []);

  const handleDeposit = async () => {
    if (!publicClient || !walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const result = await deposit(amount, publicClient, walletClient);
      toast.success(`Deposit successful! Transaction: ${result.transactionHash}`);
      setAmount('');
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Deposit failed';
      if (errorMessage.toLowerCase().includes('reject')) {
        toast.error('Transaction rejected');
      } else {
        toast.error(`Deposit failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!web3Enabled) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">Web3 deposit is currently disabled</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Deposit Tokens</h2>
      
      {!isConnected ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">Please connect your wallet to deposit</p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0.0"
            />
          </div>

          <button
            onClick={handleDeposit}
            disabled={loading || depositing || !amount || parseFloat(amount) <= 0}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading || depositing ? 'Processing...' : 'Deposit'}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isConnected && address && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-gray-600">Connected:</p>
              <p className="text-sm font-mono text-gray-900">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
