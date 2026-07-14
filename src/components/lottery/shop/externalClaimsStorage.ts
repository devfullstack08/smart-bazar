import { safeLocalStorageGetItem, safeLocalStorageSetItem } from '@/lib/utils/browserStorage';
import { ExternalLotteryClaimRecord } from '@/lib/api/lotteryApi';

const EXTERNAL_LOTTERY_CLAIMS_KEY = 'bloomx_external_lottery_claims_v1';

export function readExternalLotteryClaims(): ExternalLotteryClaimRecord[] {
    const raw = safeLocalStorageGetItem(EXTERNAL_LOTTERY_CLAIMS_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
        return [];
    }
}

export function writeExternalLotteryClaims(records: ExternalLotteryClaimRecord[]) {
    safeLocalStorageSetItem(EXTERNAL_LOTTERY_CLAIMS_KEY, JSON.stringify(records.slice(0, 50)));
}

export function saveExternalLotteryClaim(record: ExternalLotteryClaimRecord) {
    const existing = readExternalLotteryClaims();
    const next = [
        record,
        ...existing.filter((item) => (
            item.purchaseId !== record.purchaseId &&
            item.transactionHash.toLowerCase() !== record.transactionHash.toLowerCase()
        )),
    ];
    writeExternalLotteryClaims(next);
    return next;
}
