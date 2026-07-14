import { useState, useEffect } from 'react';
import { Address, PublicClient, formatEther } from 'viem';
import Web3ContractHelper from '@/lib/utils/web3Contract';

export function useTokenBalance(
  projectId: string | undefined,
  userAddress: Address | undefined,
  publicClient: PublicClient | undefined
) {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const contractHelper = new Web3ContractHelper(projectId);

  const fetchBalance = async () => {
    if (!userAddress || !publicClient) {
      setBalance('0');
      return;
    }

    setLoading(true);
    try {
      // Get token address from payment methods
      const tokenAddress = await contractHelper.getTokenAddress() as Address;
      
      // Get ERC20 token ABI
      const erc20Abi = await contractHelper.getERC20ABI();
      
      if (!erc20Abi) {
        throw new Error('ERC20 ABI not found');
      }

      // Call balanceOf function (standard ERC20)
      const balanceWei = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [userAddress],
      });
      
      const balanceInEther = formatEther(balanceWei as bigint);
      setBalance(balanceInEther);
    } catch (error: any) {
      console.error('Error fetching token balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [userAddress, publicClient]);

  return { balance, loading, refetch: fetchBalance };
}
