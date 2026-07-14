import { useState } from 'react';
import { Address, PublicClient, WalletClient, maxUint256, parseEther } from 'viem';
import Web3ContractHelper from '@/lib/utils/web3Contract';

export function useTokenApproval(projectId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contractHelper = new Web3ContractHelper(projectId);

  const approve = async (
    amount: string | 'unlimited',
    spenderAddress: Address,
    publicClient: PublicClient,
    walletClient: WalletClient
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Get token address
      const tokenAddress = await contractHelper.getTokenAddress() as Address;
      
      // Get ERC20 ABI
      const erc20Abi = await contractHelper.getERC20ABI();
      
      if (!erc20Abi) {
        throw new Error('ERC20 ABI not found');
      }

      // Get user address
      const [account] = await walletClient.getAddresses();
      if (!account) {
        throw new Error('No account connected');
      }

      // Approve unlimited spending (or specific amount)
      const approvalAmount = amount === 'unlimited' ? maxUint256 : parseEther(amount);
      
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, approvalAmount],
        account,
        // walletClient is already bound to a chain; explicit undefined satisfies viem typings
        chain: undefined,
      });
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        return {
          success: true,
          transactionHash: receipt.transactionHash,
        };
      } else {
        throw new Error('Approval transaction failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Approval failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { approve, loading, error };
}
