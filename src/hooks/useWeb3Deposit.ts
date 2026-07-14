import { useState } from 'react';
import { Address, PublicClient, WalletClient, formatEther, parseEther } from 'viem';
import Web3ContractHelper from '@/lib/utils/web3Contract';
import { paymentApi } from '@/lib/api/services';
import { localhost } from '@/constants/networks';

export function useWeb3Deposit(projectId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contractHelper = new Web3ContractHelper(projectId);

  const deposit = async (
    amount: string,
    publicClient: PublicClient,
    walletClient: WalletClient,
    network?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get contract address from payment methods
      const contractAddress = await contractHelper.getDepositContractAddress() as Address;
      
      // 2. Get contract ABI
      const abi = await contractHelper.getContractABI(contractAddress);
      
      if (!abi) {
        throw new Error('Contract ABI not found');
      }

      // 3. Convert amount to wei
      const amountInWei = parseEther(amount);

      // 4. Get user address
      const [account] = await walletClient.getAddresses();
      if (!account) {
        throw new Error('No account connected');
      }

      // 5. Call deposit function
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'deposit',
        args: [amountInWei],
        account,
        chain: localhost,
      });
      
      // 6. Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        // 7. Create deposit record in backend
        try {
          await paymentApi.createWeb3Deposit({
            method: 'web3',
            amount: parseFloat(amount),
            web3Details: {
              transactionHash: receipt.transactionHash,
              walletAddress: account,
              // Network + chainId as understood by backend
              network: (network as 'localhost' | 'testnet' | 'mainnet') || 'testnet',
              chainId: publicClient.chain?.id ?? 0,
              status: 'confirmed',
            },
          });
        } catch (backendError) {
          // Backend notification is optional, don't fail the whole operation
          console.warn('Failed to notify backend of deposit:', backendError);
        }

        return {
          success: true,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Deposit failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deposit, loading, error };
}
