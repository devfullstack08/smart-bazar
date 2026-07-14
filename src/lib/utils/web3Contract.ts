import { Address, PublicClient, WalletClient } from 'viem';
import Web3ConfigService from '@/lib/services/web3Config.service';
import { IPaymentConfig } from '@/types/paymentConfig';

class Web3ContractHelper {
  private configService: Web3ConfigService;

  constructor(projectId?: string) {
    this.configService = new Web3ConfigService(projectId);
  }

  /**
   * Get contract ABI by address
   */
  async getContractABI(contractAddress: string): Promise<any[] | null> {
    // Normalize address to lowercase for lookup
    const normalizedAddress = contractAddress.toLowerCase();
    
    // Get ABI from cache or fetch
    const abi = await this.configService.getContractABI(contractAddress);
    
    if (!abi) {
      throw new Error(`ABI not found for contract: ${contractAddress}`);
    }

    return abi;
  }

  /**
   * Get ERC20 token ABI
   */
  async getERC20ABI(): Promise<any[] | null> {
    const erc20Abi = await this.configService.getERC20ABI();
    
    if (!erc20Abi) {
      throw new Error('ERC20 ABI not found');
    }

    return erc20Abi;
  }

  /**
   * Get deposit contract address
   */
  async getDepositContractAddress(): Promise<string> {
    const paymentMethods = await this.configService.getPaymentMethods();
    
    if (!paymentMethods.deposit.web3?.enabled) {
      throw new Error('Web3 deposit is not enabled');
    }

    return paymentMethods.deposit.web3.details.contractAddress;
  }

  /**
   * Get withdrawal contract address
   */
  async getWithdrawalContractAddress(): Promise<string> {
    const paymentMethods = await this.configService.getPaymentMethods();
    
    if (!paymentMethods.withdrawal.web3?.enabled) {
      throw new Error('Web3 withdrawal is not enabled');
    }

    return paymentMethods.withdrawal.web3.details.contractAddress;
  }

  /**
   * Get token address
   */
  async getTokenAddress(): Promise<string> {
    const paymentMethods = await this.configService.getPaymentMethods();
    
    if (!paymentMethods.deposit.web3?.enabled) {
      throw new Error('Web3 deposit is not enabled');
    }

    return paymentMethods.deposit.web3.details.tokenAddress;
  }

  /**
   * Get withdrawal configuration
   */
  async getWithdrawalConfig(): Promise<{
    minAmount: number;
    maxAmount: number;
    mode: 'manual' | 'automatic';
  }> {
    const paymentMethods = await this.configService.getPaymentMethods();
    
    if (!paymentMethods.withdrawal.web3?.enabled) {
      throw new Error('Web3 withdrawal is not enabled');
    }

    const web3 = paymentMethods.withdrawal.web3;
    return {
      minAmount: web3.minAmount,
      maxAmount: web3.maxAmount,
      mode: web3.mode,
    };
  }

  /**
   * Get deposit configuration
   */
  async getDepositConfig(): Promise<IPaymentConfig['deposit']['web3']> {
    const paymentMethods = await this.configService.getPaymentMethods();
    
    if (!paymentMethods.deposit.web3?.enabled) {
      throw new Error('Web3 deposit is not enabled');
    }

    return paymentMethods.deposit.web3;
  }
}

export default Web3ContractHelper;
