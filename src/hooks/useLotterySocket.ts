import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/constants/env';
import { LotteryEntry, LotteryFairnessProof, LotteryPoolUpdatePayload, LotteryWinner } from '@/lib/api/lotteryApi';
import { safeLocalStorageGetItem } from '@/lib/utils/browserStorage';
import { STORAGE_KEYS } from '@/constants';

interface UseLotterySocketProps {
    lotteryId?: string;
    onParticipantJoined?: (data: { entry: LotteryEntry; totalCount: number }) => void;
    onDrawStart?: () => void;
    onWinners?: (data: { winners: LotteryWinner[]; fairnessProof?: LotteryFairnessProof | null }) => void;
    onDrawFailed?: (data: { message: string }) => void;
    onPoolUpdated?: (data: LotteryPoolUpdatePayload) => void;
}

export function useLotterySocket({ lotteryId, onParticipantJoined, onDrawStart, onWinners, onDrawFailed, onPoolUpdated }: UseLotterySocketProps) {
    const socketRef = useRef<Socket | null>(null);
    const participantJoinedRef = useRef(onParticipantJoined);
    const drawStartRef = useRef(onDrawStart);
    const winnersRef = useRef(onWinners);
    const drawFailedRef = useRef(onDrawFailed);
    const poolUpdatedRef = useRef(onPoolUpdated);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        participantJoinedRef.current = onParticipantJoined;
    }, [onParticipantJoined]);

    useEffect(() => {
        drawStartRef.current = onDrawStart;
    }, [onDrawStart]);

    useEffect(() => {
        winnersRef.current = onWinners;
    }, [onWinners]);

    useEffect(() => {
        drawFailedRef.current = onDrawFailed;
    }, [onDrawFailed]);

    useEffect(() => {
        poolUpdatedRef.current = onPoolUpdated;
    }, [onPoolUpdated]);

    useEffect(() => {
        if (!lotteryId || !WS_URL) return;

        const token = safeLocalStorageGetItem(STORAGE_KEYS.ACCESS_TOKEN) || safeLocalStorageGetItem(STORAGE_KEYS.TOKEN);
        const socket = io(WS_URL, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            auth: token ? { token } : undefined,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('lottery:subscribe', { lotteryId });
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('lottery:participant-joined', (data) => {
            participantJoinedRef.current?.(data);
        });

        socket.on('lottery:draw-start', () => {
            drawStartRef.current?.();
        });

        socket.on('lottery:winners', (data) => {
            winnersRef.current?.(data);
        });

        socket.on('lottery:draw-failed', (data) => {
            drawFailedRef.current?.(data);
        });

        socket.on('lottery:pool-updated', (data) => {
            poolUpdatedRef.current?.(data);
        });

        return () => {
            socket.emit('lottery:unsubscribe', { lotteryId });
            socket.off('connect');
            socket.off('disconnect');
            socket.off('lottery:participant-joined');
            socket.off('lottery:draw-start');
            socket.off('lottery:winners');
            socket.off('lottery:draw-failed');
            socket.off('lottery:pool-updated');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [lotteryId]);

    return {
        isConnected,
    };
}
