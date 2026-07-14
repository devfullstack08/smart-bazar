/** Smart Bazar pool balance (from GET /users/pools) */
export interface PoolBalance {
  key: string;
  balance: number;
  currency: string;
}

/** Pool eligibility status data */
export interface PoolStatusData {
  isEligible: boolean;
  message: string;
  current?: number;
  required?: number;
  unit?: string;
}

/** Bloomx pool overview item (from GET /users/bloomx-pools/overview) */
export interface BloomxPoolOverviewItem {
  incomeTypeCode: string;
  label: string;
  scheduleSummary: string;
  totalAmountThisMonth: number;
  runAsCron: boolean;
}

/** Bloomx pool eligible user (from GET /users/bloomx-pools/:code/eligible) */
export interface BloomxPoolEligibleUser {
  userId: string;
  name?: string;
  totalAmount: number;
}

/** My Bloomx pool earnings for a month (from GET /users/bloomx-pools/my-earnings) */
export interface BloomxMyEarnings {
  year: number;
  month: number;
  byPool: Record<string, number>;
}

/** Income type label from registry (admin-provided display name) */
export interface IncomeRegistryEntry {
  code: string;
  label: string;
}

// Banner (from GET /users/banners)
export interface Banner {
  _id: string;
  projectId: string;
  image: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Dashboard media (from GET /users/dashboard-media)
export interface DashboardMedia {
  _id: string;
  projectId: string;
  file: string;
  mimeType: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Offer (from GET /users/offers)
export interface Offer {
  _id: string;
  projectId: string;
  name: string;
  teamReqCount: number;
  directReqCount: number;
  selfPackage: number;
  images: string[];
  order: number;
  eligible: boolean;
  userStats?: {
    directCount: number;
    teamCount: number;
    selfPackageCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type PopupContentType = 'text' | 'image' | 'video';

export interface PopupContentItem {
  id?: string;
  type: PopupContentType;
  order?: number;
  text?: string;
  file?: string;
  mimeType?: string;
  url?: string;
  poster?: string;
}

export interface ProjectPopup {
  _id: string;
  projectId: string;
  name: string;
  title?: string;
  description?: string;
  contents: PopupContentItem[];
  order?: number;
  showOn?: 'dashboard';
  isActive: boolean;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User {
  id: string;
  fullName?: string; // Optional for backward compatibility
  name?: string; // API returns 'name'
  email: string;
  phone: string;
  country?: string;
  sponsorId?: string;
  placement: 'left' | 'right' | { position: 'left' | 'right'; parentId?: string };
  userId: string;
  rank: string;
  joinDate?: string; // Optional for backward compatibility
  joinedAt?: string; // API returns 'joinedAt'
  status: 'active' | 'inactive';
  kycStatus?: 'pending' | 'verified' | 'rejected';
  walletAddress?: string; // Primary Web3 wallet address (for deposit/withdrawal when Web3 is enabled)
}

// Registration Form
export interface RegistrationForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  sponsorId: string;
  placement: 'left' | 'right';
  country: string;
  state?: string;
  city?: string;
  acceptTerms: boolean;
}

// Login Form
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Package Types
export interface Package {
  id?: string; // Made optional to support _id from backend
  _id?: string; // MongoDB _id field (backend may return this instead of id)
  packageNumber: number;
  name: string;
  totalValue: number;
  stakingPackage: number;
  adminPackage: number;
  globalPackage: number;
  dailyROI?: number; // Legacy: percentage (e.g. 1 = 1%)
  dailyROIRate?: number; // API: decimal (e.g. 0.01 = 1%)
  cappingMultiplier: number;
  description?: string;
}

export interface UserPackage {
  id: string;
  packageId: string;
  package: Package;
  purchaseDate: string;
  status: 'active' | 'completed' | 'expired';
  totalEarned: number;
  cappingLimit: number;
  remainingCapping: number;
}

// Income Types
// Legacy Income (kept for backward compatibility)
export interface Income {
  id: string;
  userId: string;
  type: 'daily_roi' | 'direct_referral' | 'level_roi' | 'rank_bonus' | 'autopool';
  amount: number;
  status: 'pending' | 'processed' | 'failed';
  description: string;
  createdAt: string;
  processedAt?: string;
}

// Legacy IncomeSummary (kept for backward compatibility)
export interface IncomeSummary {
  totalEarnings: number;
  todayIncome: number;
  directReferral: number;
  dailyROI: number;
  levelROI: number;
  rankBonus: number;
  autopool: number;
}

// New Income Overview from /users/income/overview endpoint
export interface IncomeOverview {
  userId: string;
  /** Total earned across all income types. Shortcut — same as overview.overall.totalEarned */
  totalEarned: number;
  /** Income earned today (UTC) */
  todayIncome: number;
  /** Income earned yesterday (UTC) */
  yesterdayIncome: number;
  // wallet field removed — use GET /api/v1/users/wallet for wallet data
  overview: {
    overall: {
      totalEarned: number;
      totalPending: number;
      totalApproved: number;
      totalPaid: number;
      totalAvailable: number;
      totalRejected: number;
      totalTransactions: number;
    };
    commissions: {
      totals: {
        total: number;
        pending: number;
        approved: number;
        paid: number;
        rejected: number;
        count: number;
      };
      byType: Array<{
        type: string;
        totalAmount: number;
        count: number;
        pendingAmount: number;
        approvedAmount: number;
        paidAmount: number;
        rejectedAmount: number;
      }>;
    };
    transactions: {
      totals: {
        total: number;
        pending: number;
        processed: number;
        stopped: number;
        failed: number;
        count: number;
      };
      byType: Array<{
        type: string;
        totalAmount: number;
        count: number;
        pendingAmount: number;
        processedAmount: number;
        stoppedAmount: number;
        failedAmount: number;
      }>;
    };
  };
}

// Income Transaction from /users/income/transactions endpoint
export interface IncomeTransaction {
  id: string;
  type: 'commission' | 'transaction';
  incomeType: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Commission-specific fields
  fromUserId?: string;
  level?: number | null;
  metadata?: any;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  // Transaction-specific fields
  sourceUserId?: string | null;
  sourcePackageId?: string;
  calculationDetails?: {
    baseAmount?: number;
    percentage?: number;
    formula?: string;
  };
  cappingInfo?: {
    currentEarnings?: number;
    cappingLimit?: number;
    remainingCapping?: number;
  };
  processedAt?: string;
  stoppedBy?: string | null;
  stoppedReason?: string | null;
  isManualTrigger?: boolean;
  triggeredBy?: string | null;
}

export interface IncomeTransactionsResponse {
  transactions: IncomeTransaction[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
    totalCommissions: number;
    totalTransactions: number;
  };
}

export interface TeamStatsInvestment {
  /** Direct referrals' package total (kept for backward compat) */
  totalTeamInvestment: number;
  /** User's own package total */
  packageValue: number;
  /** Sum of all levels combined */
  totalTeamBusiness: number;
  /** Downline purchase volume on the local calendar day (team /users/team/stats). */
  todayBusiness?: number;
  /** Same as todayBusiness for the previous local calendar day. */
  yesterdayBusiness?: number;
  /** Business per level: index 0 = level 1, trimmed at last non-zero (backward compat) */
  levelWiseBusiness: number[];
  /** Rich breakdown per level: total/active/inactive business */
  levelWiseBusinessBreakdown?: { total: number; active: number; inactive: number }[];
  /** Present when income config has lineSplit */
  powerLineBusiness?: number;
  otherLinesBusiness?: number;
  /** Legacy line split contributor IDs (kept as canonical in this tenant) */
  powerLineUserIds?: string[];
  otherLineUserIds?: string[];
  lineSplit?: { powerLinePercent?: number; otherLinesPercent?: number };
}


// Team Types
export interface TeamMember {
  id: string;
  fullName: string;
  userId: string;
  joinDate: string;
  package?: Package;
  status: 'active' | 'inactive';
  teamSize: number;
  totalBusiness: number;
  placement: 'left' | 'right';
}

// Legacy TeamStats (kept for backward compatibility)
export interface TeamStats {
  directReferrals: number;
  totalTeam: number;
  activeMembers: number;
  teamBusiness: number;
  leftTeam: number;
  rightTeam: number;
}

// New comprehensive Team Stats from /users/team/stats endpoint
export interface TeamStatsData {
  userId: string;
  sponsorId?: string;
  stats: {
    totalTeamMembers: number;
    directReferrals: number;
    // leftLegCount and rightLegCount removed - uses universal auto pool
    activeMembers: number;
    inactiveMembers: number;
    recentMembers: number;
    levelWiseMembers?: number[];
    levelWiseBreakdown?: { total: number; active: number; inactive: number }[];
  };
  earnings: {
    totalFromTeam: number;
    pendingFromTeam: number;
    approvedFromTeam: number;
    paidFromTeam: number;
  };
  /** Backend may send extended fields for level ROI / power leg (same as Global Bridge). */
  investment: TeamStatsInvestment;

  directReferrals: Array<{
    userId: string;
    name: string;
    email: string;
    phone?: string;
    rank: string;
    status: 'active' | 'inactive' | 'blocked';
    placement: {
      position?: 'left' | 'right';
      parentId?: string;
    };
    joinedAt: string;
    totalEarned: number;
    /** Used by rank “directs at rank” checks */
    totalPackageValue?: number;
  }>;
}

// Genealogy Types
// Legacy GenealogyNode (kept for backward compatibility)
export interface GenealogyNode {
  id: string;
  userId: string;
  fullName: string;
  package?: Package;
  status: 'active' | 'inactive';
  joinDate: string;
  left?: GenealogyNode;
  right?: GenealogyNode;
  level: number;
}

// New Genealogy Node from /users/genealogy endpoint
export interface GenealogyTreeNode {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  rank: string;
  status: 'active' | 'inactive' | 'blocked';
  placement: {
    position?: 'left' | 'right';
    parentId?: string;
  };
  sponsorId?: string;
  joinedAt: string;
  totalEarned: number;
  /** Package / business volume at node (when API sends it) */
  totalPackageValue?: number;
  downlineCount: number;
  children: GenealogyTreeNode[];
}

export interface GenealogyData {
  userId: string;
  depth: number;
  tree: GenealogyTreeNode;
}

// Auto-Pool Matrix Types
export interface AutoPoolMatrixEntry {
  userId?: string;
  sponsorUserId?: string;
  slotStatus?: 'active' | 'completed'; // API: replaces isActive
  level: number;
  position: number;
  isActive?: boolean; // legacy
  isFilled: boolean;
  children?: Array<{
    userId: string;
    position: number;
    joinedAt: string;
    _id?: string;
  }>;
  childrenCount?: number;
  totalEarned?: number;
  mainWalletEarned?: number;
  rebirthWalletEarned?: number;
  rebirthCount?: number;
  completedAt?: string;
  createdAt?: string;
}

export interface AutoPoolIncomeDistributionLevel {
  members: number;
  incomePerMember: number;
  totalIncome: number;
}

export interface AutoPoolIncomeDistribution {
  level1: AutoPoolIncomeDistributionLevel;
  level2: AutoPoolIncomeDistributionLevel;
  total: { members: number; totalIncome: number };
}

export interface AutoPoolMatrixData {
  userId: string;
  hasMatrix: boolean;
  message?: string;
  matrixType?: string;
  config?: { width: number; depth: number }; // e.g. { width: 3, depth: 2 } for 3×2
  matrix?: {
    level1: AutoPoolMatrixEntry[];
    level2: AutoPoolMatrixEntry[];
    level3?: AutoPoolMatrixEntry[];
  } | null;
  activeEntry?: {
    slotStatus?: string;
    level: number;
    position: number;
    isFilled: boolean;
    childrenCount: number;
    maxChildren?: number;
  } | null;
  incomeDistribution?: AutoPoolIncomeDistribution;
  summary: {
    totalPositions: number;
    filledPositions: number;
    activePositions?: number;
    totalEarned: number;
    mainWalletEarned: number;
    rebirthWalletEarned: number;
    rebirthCount: number;
    closedEntries?: number;
    openEntries?: number;
  };
}

// Wallet Types
// Legacy Wallet (kept for backward compatibility)
export interface Wallet {
  mainBalance: number;
  rebirthBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
}

// Wallet state from GET /users/wallet (no transactions)
export interface WalletState {
  userId: string;
  wallet: {
    balance: number;
    availableBalance: number;
    totalDeposited?: number;
    totalWithdrawn: number;
    totalEarned: number;
  };
  summary: {
    totalCredit: number;
    totalDebit: number;
    totalDeposit?: number;
    totalIncome: number;
    totalWithdrawal: number;
    netBalance: number;
  };
  statistics: {
    byCategory: Array<{
      category: string;
      totalAmount: number;
      count: number;
      creditAmount: number;
      debitAmount: number;
      completedAmount: number;
      pendingAmount: number;
    }>;
  };
}

// Transactions response from GET /users/wallet/transactions
export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

// Filters for wallet transactions
export interface WalletTransactionsFilters {
  limit?: number;
  skip?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
}

// Legacy: combined wallet data (state + transactions). Prefer WalletState + getWalletTransactions.
export interface WalletData extends WalletState {
  transactions?: {
    list: WalletTransaction[];
    pagination: WalletTransactionsResponse['pagination'];
  };
}

// Wallet Transaction from /users/wallet endpoint
export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  category: 'income' | 'withdrawal' | 'investment' | 'fee' | 'refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  amount: number;
  method: 'bank_transfer' | 'web3' | 'upi' | 'withdrawal_request' | 'wallet_address';
  accountDetails: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    walletAddress?: string;
    email?: string;
  };
}

export interface PaymentRequest {
  id: string;
  type: 'deposit' | 'withdrawal';
  method: 'bank_transfer' | 'upi' | 'web3' | 'withdrawal_request' | 'wallet_address';
  amount: number;
  reference: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'confirmed' | 'failed';
  proofImage?: string | null;
  withdrawalDetails?: {
    bankAccount?: string;
    upiId?: string;
    walletAddress?: string;
  } | null;
  // Web3-specific fields
  transactionHash?: string;
  walletAddress?: string;
  network?: 'localhost' | 'testnet' | 'mainnet';
  chainId?: number;
  confirmedAt?: string;
  failedAt?: string;
  failureReason?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryResponse {
  requests: PaymentRequest[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

/** Web3 ABIs configuration from GET /api/v1/admin/web3/abis/:projectId */
export interface Web3ABIs {
  abis: { [contractAddress: string]: any[] };  // Contract address (lowercase) -> ABI array
  erc20Abi: any[] | null;                       // Standard ERC20 ABI
  contractAddress: string | null;               // Main contract address (decrypted)
  tokenAddress: string | null;                  // Token contract address (decrypted)
}

// Legacy Transaction (kept for backward compatibility)
export interface Transaction {
  id: string;
  type: 'income' | 'withdrawal' | 'package_purchase' | 'transfer';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: string;
  completedAt?: string;
  method?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalEarnings: number;
  todayIncome: number;
  teamSize: number;
  currentRank: string;
  activePackage?: UserPackage;
  recentIncome: Income[];
}

// Sponsor object (populated when user has a sponsor)
export interface SponsorDetail {
  _id?: string;
  userId: string;
  name: string;
  email: string;
}

// Dashboard data shape — assembled on the frontend from individual domain APIs
export interface DashboardData {
  user: {
    userId: string;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive';
    rank: string;
    sponsorId?: string | SponsorDetail | null;
    joinedAt: string;
    kyc: {
      verified: boolean;
      documentsCount: number;
    };
  };
  wallet: {
    balance: number;
    availableBalance?: number;
    totalDeposited?: number;
    totalWithdrawn: number;
    totalEarned: number;
  };
  packages: {
    active: number;
    total: number;
    activePackages: Array<{
      packageId: string;
      packageNumber: number;
      totalValue: number;
      stakingPackage?: string | number;
      totalEarned: number;
      cappingLimit: number;
      remainingCapping: number;
      purchaseDate: string;
      expiryDate?: string;
      lastROIDate?: string;
      isActive?: boolean;
      status?: 'active' | 'cap_reached' | 'expired';
    }>;
  };
  investment: {
    totalInvestment: number;
    todayInvestment?: number;
    yesterdayInvestment?: number;
    totalEarnedFromPackages: number;
    totalCappingLimit: number;
    totalRemainingCapping: number;
  };
  income: {
    totalEarned: number;
    todayIncome?: number;
    yesterdayIncome?: number;
    totalPending: number;
    totalApproved: number;
    totalPaid: number;
    byType: Array<{
      type: string;
      totalAmount: number;
      count: number;
      pendingAmount: number;
      approvedAmount: number;
      paidAmount: number;
    }>;
  };
  recentCommissions: Array<{
    ruleType: string;
    amount: number;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    fromUserId?: string | null;
    level?: number | null;
    createdAt: string;
  }>;
  network: {
    downlineCount: number;
    sponsorId?: string;
  };
}

// Capping Tracking Types
export interface CappingTrackingData {
  userId: string;
  hasActivePackage: boolean;
  message?: string;
  baseCapping: number;
  currentCapping: number;
  referralCappingTotal?: number;
  totalEarned: number;
  remainingCapping: number;
  isCappingReached: boolean;
  cappingReachedDate?: string | null;
  multiplier: {
    base: number;
    perLevel: number;
    achievedLevels: number;
    total: number;
  };
  levelAchievements: Array<{
    level: number;
    membersRequired: number;
    achieved: boolean;
    achievedDate?: string | null;
    currentMembers: number;
    multiplier: number;
    progress: number;
  }>;
  nextLevel?: {
    level: number;
    membersRequired: number;
    currentMembers: number;
    remaining: number;
  };
  earningsBreakdown?: Record<string, number>;
  /** Admin-provided display names: [{code, label}] from project income config */
  incomeRegistry?: IncomeRegistryEntry[];
  stats?: {
    directReferrals: number;
    totalAchievements: number;
    maxAchievements: number;
  };
}

// Rank Income Types
export interface RankRequirement {
  selfBusiness: number;
  directTeam: number;
  teamBusiness: number;
}

export interface RankProgressRequirement {
  required: number;
  current: number;
  remaining: number;
  progress: number;
  completed: boolean;
}

export interface RankInfo {
  rankName: string;
  rankLevel: number;
  requirements: RankRequirement;
  monthlyReward: number;
  durationMonths: number;
  isAchieved?: boolean;
}

export interface ActiveRankAchievement {
  rankName: string;
  rankLevel: number;
  monthlyReward: number;
  monthsPaid: number;
  durationMonths: number;
  totalPaid: number;
  nextPaymentDate: string;
  lastPaymentDate: string;
  achievedDate: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface RankProgress {
  nextRank: string;
  requirements: {
    selfBusiness: RankProgressRequirement;
    directTeam: RankProgressRequirement;
    teamBusiness: RankProgressRequirement;
  };
  overallProgress: number;
  allRequirementsMet: boolean;
}

export interface RankStatusData {
  enabled: boolean;
  currentStats: {
    selfBusiness: number;
    directTeam: number;
    teamBusiness: number;
  };
  currentRank: RankInfo | null;
  activeRankAchievement: ActiveRankAchievement | null;
  nextRank: RankInfo | null;
  progress: RankProgress | null;
  allRanks: RankInfo[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Response
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  timestamp: string;
}
