import { useState, useEffect } from 'react';
import { Address, PublicClient, formatEther } from 'viem';
import Web3ContractHelper from '@/lib/utils/web3Contract';

export function useUserDeposit(
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
      const contractAddress = await contractHelper.getDepositContractAddress() as Address;
      const abi = await contractHelper.getContractABI(contractAddress);
      
      if (!abi) {
        throw new Error('Contract ABI not found');
      }

      // Call getUserDeposit function (from ABI)
      const depositAmount = await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: 'getUserDeposit',
        args: [userAddress],
      });
      
      const balanceInEther = formatEther(depositAmount as bigint);
      setBalance(balanceInEther);
    } catch (error: any) {
      console.error('Error fetching deposit balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Optionally set up polling
    const interval = setInterval(fetchBalance, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [userAddress, publicClient]);

  return { balance, loading, refetch: fetchBalance };
}
