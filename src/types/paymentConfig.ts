export type TNetwork = 'testnet' | 'mainnet' | 'localhost';
export type TCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KRW' | 'CNY' | 'HKD' | 'AUD' | 'CAD' | 'CHF' | 'SEK' | 'NOK' | 'NZD' | 'MXN' | 'BRL' | 'RUB' | 'ZAR' | 'TRY' | 'INR';
export type TMode = 'manual' | 'automatic';
export type TContractType = 'v2' | 'bloomx';
export interface IBankTransferDetails {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    branchName: string;
}
export interface IUPIDetails {
    upiId: string;
    payeeName: string;
    currency: TCurrency;
    qrCodeImage: string;
}
export interface IWeb3Details {
    contractAddress: string;
    tokenAddress: string;
}
/** Smart Bazar (dual-token) config – when contractType is bloomx */
export interface IWeb3DualTokenDetails {
    customTokenAddress?: string;
    customTokenSymbol?: string;
}

export interface IWeb3Config {
    network: TNetwork;
    contractAddress: string;
    tokenAddress: string;
    contractType?: TContractType;
    details?: IWeb3DualTokenDetails;
    ownerAddress: string;
    rpcUrl: string;
    blockExplorerUrl?: string;
    chainId: number;
    autoPayoutEnabled: boolean;
    autoPayoutSchedule: { enabled: boolean; time: string };
    // Generic ABI storage – keyed by contract address (or 'bloomx'); admin stores correct ABI per project
    abis?: {
        [key: string]: any[];
    };
    // Standard ERC20 ABI (optional, can use default)
    erc20Abi?: any[] | null;
}
export interface IPaymentConfig {
    deposit: {
        bankTransfer: { enabled: boolean; details: IBankTransferDetails };
        upi: { enabled: boolean; details: IUPIDetails };
        web3: { enabled: boolean; details: IWeb3Details };
        depositAddress?: {
            enabled: boolean;
            details: {
                address: string;
            }
        };
    };
    withdrawal: {
        bankTransfer: { enabled: boolean; details: IBankTransferDetails; minAmount: number; maxAmount: number };
        upi: { enabled: boolean; details: IUPIDetails; minAmount: number; maxAmount: number };
        web3: { enabled: boolean; details: IWeb3Details; mode: TMode; minAmount: number; maxAmount: number };
        withdrawalRequest?: {
            enabled: boolean;
            minAmount: number;
            maxAmount: number;
            details: {
                withdrawalFee: number;
                description: string;
            };
        };
        walletAddressWithdrawal?: {
            enabled: boolean;
            minAmount: number;
            maxAmount: number;
            details: {
                withdrawalFee: number;
                description: string;
            };
        };
    };
    web3: IWeb3Config;
}