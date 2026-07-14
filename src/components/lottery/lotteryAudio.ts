/**
 * Tiny zero-dependency audio engine for lottery cues.
 * Uses Web Audio oscillators only — no asset downloads.
 */
export function createLotteryAudioEngine() {
    let audioContext: AudioContext | null = null;

    const ensureContext = () => {
        if (typeof window === 'undefined') return null;
        const AudioCtor =
            window.AudioContext ||
            (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtor) return null;
        if (!audioContext) {
            audioContext = new AudioCtor();
        }
        if (audioContext.state === 'suspended') {
            void audioContext.resume();
        }
        return audioContext;
    };

    const playTone = (frequency: number, duration: number, type: OscillatorType, volume: number, delayMs = 0) => {
        const context = ensureContext();
        if (!context) return;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const startAt = context.currentTime + delayMs / 1000;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startAt);
        gainNode.gain.setValueAtTime(0.0001, startAt);
        gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration / 1000);
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + duration / 1000 + 0.02);
    };

    return {
        playSpinStart() {
            playTone(220, 480, 'sawtooth', 0.022);
            playTone(330, 620, 'triangle', 0.018, 120);
            playTone(440, 820, 'sine', 0.014, 260);
        },
        playReveal(rank: number) {
            const base = rank === 1 ? 660 : rank === 2 ? 560 : 480;
            playTone(base, 240, 'triangle', 0.028);
            playTone(base * 1.25, 320, 'sine', 0.02, 120);
            playTone(base * 1.5, 420, 'square', 0.016, 240);
        },
    };
}

export type LotteryAudioEngine = ReturnType<typeof createLotteryAudioEngine>;
