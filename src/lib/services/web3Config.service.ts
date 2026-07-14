import { PROJECT_ID } from '@/constants/env';
import apiClient from '@/lib/api/axios';
import { IPaymentConfig } from '@/types/paymentConfig';

class Web3ConfigService {
  private projectId: string;
  private paymentMethodsCache: IPaymentConfig | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastFetchTime: number = 0;

  constructor(projectId?: string) {
    this.projectId = projectId ?? PROJECT_ID;
  }

  /**
   * Get payment methods configuration (includes web3 config, ABIs, chainId, rpcUrl - all from API)
   */
  async getPaymentMethods(): Promise<IPaymentConfig> {
    const now = Date.now();

    if (this.paymentMethodsCache && (now - this.lastFetchTime) < this.cacheExpiry) {
      return this.paymentMethodsCache;
    }

    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: IPaymentConfig;
      }>('/users/payment/methods');

      if (response.data.success) {
        this.paymentMethodsCache = response.data.data;
        this.lastFetchTime = now;
        return this.paymentMethodsCache;
      }

      throw new Error('Failed to fetch payment methods');
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Get contract ABI by address (from payment methods web3.abis)
   */
  async getContractABI(contractAddress: string): Promise<any[] | null> {
    const paymentMethods = await this.getPaymentMethods();
    const web3 = paymentMethods?.web3;
    if (!web3?.abis || !contractAddress) return null;
    const key = contractAddress.toLowerCase();
    return web3.abis[key] ?? null;
  }

  /**
   * Get ERC20 ABI (from payment methods web3.erc20Abi)
   */
  async getERC20ABI(): Promise<any[] | null> {
    const paymentMethods = await this.getPaymentMethods();
    const erc20Abi = paymentMethods?.web3?.erc20Abi;
    if (!erc20Abi || !Array.isArray(erc20Abi) || erc20Abi.length === 0) return null;
    return erc20Abi;
  }

  clearCache(): void {
    this.paymentMethodsCache = null;
    this.lastFetchTime = 0;
  }
}

export default Web3ConfigService;
