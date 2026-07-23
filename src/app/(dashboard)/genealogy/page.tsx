'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { GenealogyTreeNode } from '@/types';
import { teamApi } from '@/lib/api/services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { User, ArrowLeft, ArrowRight, Users, UserCheck, UserX, LayoutGrid, Table, Package, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/cn';

interface TreeNodeProps {
    node: GenealogyTreeNode | null;
    onNodeClick: (node: GenealogyTreeNode) => void;
    level: number;
}

/** Empty slot shown when a binary position (left/right) has no member yet */
function EmptySlot() {
    return (
        <div className="flex flex-col items-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-amber-400/40 flex flex-col items-center justify-center bg-amber-500/5">
                <UserX size={20} className="text-amber-400/50" />
            </div>
            <p className="text-xs text-amber-500/60 mt-1 font-semibold">Open</p>
        </div>
    );
}

function TreeNode({ node, onNodeClick, level }: TreeNodeProps) {
    if (!node) return <EmptySlot />;

    const isActive = node.status === 'active';
    const hasPlacement = node.placement?.position === 'left' || node.placement?.position === 'right';
    const placementIcon = node.placement?.position === 'left' ? <ArrowLeft size={11} /> : node.placement?.position === 'right' ? <ArrowRight size={11} /> : null;

    return (
        <div className="flex flex-col items-center relative group">
            {/* Level Badge Pill */}
            <span className="mb-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-500 tracking-wider">
                L{level}
            </span>

            <button
                onClick={() => onNodeClick(node)}
                type="button"
                className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-[0.98] shadow-md sm:shadow-lg touch-manipulation relative ${
                    isActive
                        ? 'bg-[var(--pw-primary)] text-gray-900 border-2 border-white/30 shadow-[0_4px_20px_rgba(245,158,11,0.25)]'
                        : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-white/10'
                }`}
            >
                <div className="w-7 h-7 sm:w-9 sm:h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-0.5">
                    {isActive ? <UserCheck size={16} className="sm:w-5 sm:h-5" /> : <User size={16} className="sm:w-5 sm:h-5" />}
                </div>
                <p className="text-xs font-black truncate w-12 sm:w-16 text-center px-0.5">
                    {(node.name || 'User').split(' ')[0]}
                </p>
            </button>

            <p className="text-[11px] font-mono font-semibold text-[var(--foreground)] mt-1 truncate max-w-[64px] sm:max-w-[80px]">{node.userId}</p>

            {hasPlacement && (
                <span
                    className={`inline-flex items-center gap-0.5 mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        node.placement?.position === 'left'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                    }`}
                >
                    {placementIcon}
                    {node.placement?.position}
                </span>
            )}

            <p className="text-[10px] text-[var(--pw-primary)] font-bold mt-0.5">{node.rank}</p>

            {(node.totalPackageValue ?? 0) > 0 && (
                <p className="text-[10px] font-bold text-amber-500 mt-0.5">{formatCurrency(node.totalPackageValue!)}</p>
            )}

            {node.downlineCount > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5 bg-black/10 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                    <Users size={10} className="text-[var(--muted-foreground)] shrink-0" />
                    <span className="text-[10px] font-bold text-[var(--muted-foreground)]">{node.downlineCount}</span>
                </div>
            )}
        </div>
    );
}

/** Flatten tree by level: level 0 = root, level 1 = direct referrals, level 2 = their children, etc. */
function getNodesAtLevel(root: GenealogyTreeNode, targetLevel: number): GenealogyTreeNode[] {
    if (targetLevel < 1) return [];
    const result: GenealogyTreeNode[] = [];
    function collect(node: GenealogyTreeNode, currentLevel: number) {
        if (currentLevel === targetLevel) {
            result.push(node);
            return;
        }
        for (const child of node.children) {
            collect(child, currentLevel + 1);
        }
    }
    collect(root, 0);
    return result;
}

/**
 * Binary tree renderer with level-proportional branch spacing.
 */
function renderTree(node: GenealogyTreeNode | null, onNodeClick: (n: GenealogyTreeNode) => void, level: number): React.ReactNode {
    if (!node) return null;

    const children = node.children ?? [];
    const isBinary = children.some((c) => c.placement?.position === 'left' || c.placement?.position === 'right');

    if (!isBinary) {
        return (
            <div key={node.userId} className="flex flex-col items-center shrink-0">
                <div className="flex justify-center mb-2 sm:mb-4">
                    <TreeNode node={node} onNodeClick={onNodeClick} level={level} />
                </div>
                {children.length > 0 && (
                    <div className="flex flex-row flex-wrap gap-3 sm:gap-6 mt-2 justify-center items-start">
                        {children.map((child) => (
                            <div key={child.userId} className="flex flex-col items-center shrink-0">
                                {renderTree(child, onNodeClick, level + 1)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const leftChild = children.find((c) => c.placement?.position === 'left') ?? null;
    const rightChild = children.find((c) => c.placement?.position === 'right') ?? null;
    const hasAnyChild = leftChild !== null || rightChild !== null;

    // Proportional horizontal branch padding based on level depth
    const paddingByLevel: Record<number, string> = {
        0: 'px-4 sm:px-8 md:px-12 lg:px-16',
        1: 'px-2 sm:px-4 md:px-6 lg:px-8',
        2: 'px-1 sm:px-2 md:px-3',
        3: 'px-0.5 sm:px-1',
    };
    const branchPadding = paddingByLevel[Math.min(level, 3)] || 'px-0.5';

    return (
        <div key={node.userId} className="flex flex-col items-center shrink-0">
            {/* Current node */}
            <TreeNode node={node} onNodeClick={onNodeClick} level={level} />

            {hasAnyChild && (
                <>
                    {/* Vertical line down from parent */}
                    <div className="w-0.5 h-4 sm:h-6 bg-amber-400/80" />

                    {/* Horizontal connector bar + child branches */}
                    <div className="flex border-t-2 border-amber-400/80">
                        {/* LEFT branch */}
                        <div className={`flex flex-col items-center ${branchPadding}`}>
                            <div className="w-0.5 h-4 sm:h-6 bg-amber-400/80" />
                            {leftChild
                                ? renderTree(leftChild, onNodeClick, level + 1)
                                : <EmptySlot />}
                        </div>

                        {/* RIGHT branch */}
                        <div className={`flex flex-col items-center ${branchPadding}`}>
                            <div className="w-0.5 h-4 sm:h-6 bg-amber-400/80" />
                            {rightChild
                                ? renderTree(rightChild, onNodeClick, level + 1)
                                : <EmptySlot />}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function GenealogyPage() {
    const MAX_DEPTH = 200;
    const [genealogyData, setGenealogyData] = useState<{ tree: GenealogyTreeNode; depth: number } | null>(null);
    const [selectedNode, setSelectedNode] = useState<GenealogyTreeNode | null>(null);
    const [loading, setLoading] = useState(true);
    /** Max members to list at the selected level (table). If fewer exist, all are shown. */
    const [memberLimit, setMemberLimit] = useState(30);
    const [selectedLevel, setSelectedLevel] = useState(1);
    const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
    const [viewFromQuery, setViewFromQuery] = useState<'table' | 'tree' | null>(null);
    const [queryInitialized, setQueryInitialized] = useState(false);

    const sanitize = (v: number, fallback: number) => {
        if (!Number.isFinite(v)) return fallback;
        return Math.min(MAX_DEPTH, Math.max(1, Math.floor(v)));
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);

        const rawDepth = params.get('depth');
        const parsedDepth = Number(rawDepth);
        if (Number.isFinite(parsedDepth) && parsedDepth >= 1) {
            setMemberLimit(sanitize(parsedDepth, 30));
        }

        const rawLevel = params.get('level');
        const parsedLevel = Number(rawLevel);
        if (Number.isFinite(parsedLevel) && parsedLevel >= 1) {
            setSelectedLevel(sanitize(parsedLevel, 1));
        }

        const rawView = params.get('view');
        if (rawView === 'table' || rawView === 'tree') {
            setViewFromQuery(rawView);
        } else {
            setViewFromQuery(null);
        }

        setQueryInitialized(true);
    }, []);

    useEffect(() => {
        if (!viewFromQuery) return;
        setViewMode(viewFromQuery);
    }, [viewFromQuery]);

    const [focusedPath, setFocusedPath] = useState<{ userId: string; name: string }[]>([]);
    const focusedRootUserId = focusedPath.length > 0 ? focusedPath[focusedPath.length - 1].userId : null;
    const [zoomScale, setZoomScale] = useState(1.0);
    const treeContainerRef = useRef<HTMLDivElement | null>(null);

    // Mac Trackpad Pinch-to-Zoom handler (two fingers pinch / spread)
    useEffect(() => {
        const elem = treeContainerRef.current;
        if (!elem) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const zoomFactor = e.deltaY > 0 ? -0.06 : 0.06;
                setZoomScale((prev) => Math.min(1.8, Math.max(0.35, Number((prev + zoomFactor).toFixed(2)))));
            }
        };

        elem.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            elem.removeEventListener('wheel', handleWheel);
        };
    }, []);

    /** Generations to load from API (5 generations for tree mode to show 4 full downline levels, or selectedLevel for table mode). */
    const genealogyLoadDepth = useMemo(
        () => (viewMode === 'tree' ? 5 : Math.min(MAX_DEPTH, Math.max(1, selectedLevel))),
        [selectedLevel, viewMode],
    );

    const fetchGenealogyData = useCallback(async () => {
        try {
            const data = await teamApi.getGenealogy(genealogyLoadDepth, focusedRootUserId || undefined);
            setGenealogyData({ tree: data.tree, depth: data.depth });
        } catch (error) {
            console.error('Failed to fetch genealogy data:', error);
        } finally {
            setLoading(false);
        }
    }, [genealogyLoadDepth, focusedRootUserId]);

    useEffect(() => {
        if (!queryInitialized) return;
        fetchGenealogyData();
    }, [fetchGenealogyData, queryInitialized]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!queryInitialized) return;
        const url = new URL(window.location.href);
        const currentLevel = Number(url.searchParams.get('level'));
        const currentView = url.searchParams.get('view');
        const currentDepth = Number(url.searchParams.get('depth'));
        if (currentLevel === selectedLevel && currentView === viewMode && currentDepth === memberLimit) return;
        url.searchParams.set('depth', String(memberLimit));
        url.searchParams.set('level', String(selectedLevel));
        url.searchParams.set('view', viewMode);
        window.history.replaceState(
            {},
            '',
            `${url.pathname}?${url.searchParams.toString()}${url.hash}`,
        );
    }, [memberLimit, selectedLevel, viewMode, queryInitialized]);

    const membersAtLevel = useMemo(() => {
        if (!genealogyData?.tree) return [];
        return getNodesAtLevel(genealogyData.tree, selectedLevel);
    }, [genealogyData, selectedLevel]);

    const levelMembers = useMemo(
        () => membersAtLevel.slice(0, memberLimit),
        [membersAtLevel, memberLimit]
    );

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header — dashboard-style */}
            <div className="relative overflow-hidden rounded-2xl premium-card p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pw-primary)]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] shrink-0">
                            <Users size={24} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Team Genealogy</h1>
                            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">View your complete team tree structure</p>
                        </div>
                    </div>
                    <div className="w-full min-w-0 overflow-hidden sm:max-w-[min(100%,42rem)] sm:shrink">
                        <div
                            className="flex touch-pan-x flex-nowrap items-center justify-start gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] sm:justify-end sm:gap-3"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                        <div className="flex shrink-0 items-center gap-2">
                            <label className="whitespace-nowrap text-xs font-medium text-[var(--muted-foreground)] sm:text-sm" title="At the chosen level, how many members to list (if your team has fewer, all are shown)">
                                Depth:
                            </label>
                            <input
                                value={memberLimit}
                                type="number"
                                min={1}
                                max={MAX_DEPTH}
                                onChange={(e) => setMemberLimit(sanitize(Number(e.target.value), memberLimit))}
                                className="w-[5.5rem] shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-[var(--foreground)] focus:border-transparent focus:ring-2 focus:ring-[var(--pw-primary)] min-h-[40px] touch-manipulation sm:w-[6.5rem] sm:px-3 sm:py-2.5"
                            />
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <label className="whitespace-nowrap text-xs font-medium text-[var(--muted-foreground)] sm:text-sm" title="Which generation to view (1 = directs, 2 = their referrals, …)">
                                Level:
                            </label>
                            <input
                                value={selectedLevel}
                                type="number"
                                min={1}
                                max={MAX_DEPTH}
                                onChange={(e) => setSelectedLevel(sanitize(Number(e.target.value), selectedLevel))}
                                className="min-w-[7rem] shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-[var(--foreground)] focus:border-transparent focus:ring-2 focus:ring-[var(--pw-primary)] min-h-[40px] touch-manipulation sm:min-w-[8rem] sm:px-3 sm:py-2.5"
                            />
                        </div>
                        <div className="flex shrink-0 rounded-xl border border-[var(--border)] overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors min-h-[40px] touch-manipulation ${viewMode === 'table'
                                    ? 'bg-[var(--pw-primary)] text-gray-900'
                                    : 'bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)]'
                                }`}
                                title="Table view"
                            >
                                <Table size={14} className="shrink-0" /> Table
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('tree')}
                                className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors min-h-[40px] touch-manipulation border-l border-[var(--border)] ${viewMode === 'tree'
                                    ? 'bg-[var(--pw-primary)] text-gray-900'
                                    : 'bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)]'
                                }`}
                                title="Tree view"
                            >
                                <LayoutGrid size={14} className="shrink-0" /> Tree
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Level-wise Team Table / Tree View */}
            <div className="premium-card rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[var(--border)]">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                        {viewMode === 'table'
                            ? (() => {
                                const total = membersAtLevel.length;
                                if (total === 0) return `Level ${selectedLevel} Team (0 members)`;
                                if (total > levelMembers.length) {
                                    return `Level ${selectedLevel} Team (showing ${levelMembers.length} of ${total})`;
                                }
                                return `Level ${selectedLevel} Team (${total} member${total === 1 ? '' : 's'})`;
                            })()
                            : 'Genealogy Tree'}
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                        {viewMode === 'table' ? 'Select a level above to view team members at that level' : 'Click on a member to view details'}
                    </p>
                    {viewMode === 'table' && levelMembers.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                <Package size={12} />
                                Total business:{' '}
                                {formatCurrency(levelMembers.reduce((s, m) => s + (m.totalPackageValue ?? 0), 0))}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                <Users size={12} />
                                Active: {levelMembers.filter((m) => m.status === 'active').length}
                            </span>
                        </div>
                    )}
                </div>
                {!genealogyData ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base py-8 sm:py-12">No genealogy data available</p>
                ) : viewMode === 'tree' ? (
                    <div className="relative overflow-hidden flex flex-col bg-[var(--surface-elevated)]">
                        {/* Zoom Controls & Legend Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 pt-4 pb-3 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm z-20">
                            {/* LEFT Badge */}
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-black uppercase tracking-widest shadow-md shrink-0">
                                <ArrowLeft size={13} />
                                Left
                            </div>

                            {/* Interactive Zoom Toolbar */}
                            <div className="flex items-center gap-1 sm:gap-2 bg-[var(--surface-elevated)] border border-[var(--border)] p-1 rounded-xl shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setZoomScale((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/10 transition-colors"
                                    title="Zoom Out (-)"
                                >
                                    <ZoomOut size={15} />
                                </button>

                                <span className="px-2 text-xs font-mono font-bold text-[var(--pw-primary)] min-w-[42px] text-center">
                                    {Math.round(zoomScale * 100)}%
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setZoomScale((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
                                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/10 transition-colors"
                                    title="Zoom In (+)"
                                >
                                    <ZoomIn size={15} />
                                </button>

                                <div className="h-4 w-px bg-[var(--border)] mx-0.5" />

                                <button
                                    type="button"
                                    onClick={() => setZoomScale(0.6)}
                                    className={`px-2 py-1 text-[10px] font-extrabold rounded-md transition-colors ${zoomScale === 0.6 ? 'bg-[var(--pw-primary)] text-gray-900' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                                    title="Full Tree Overview"
                                >
                                    Fit
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setZoomScale(1.0)}
                                    className={`px-2 py-1 text-[10px] font-extrabold rounded-md transition-colors ${zoomScale === 1.0 ? 'bg-[var(--pw-primary)] text-gray-900' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                                    title="100% Reset"
                                >
                                    100%
                                </button>
                            </div>

                            {/* RIGHT Badge */}
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-black uppercase tracking-widest shadow-md shrink-0">
                                Right
                                <ArrowRight size={13} />
                            </div>
                        </div>

                        {/* Tree Navigation Breadcrumbs */}
                        {focusedPath.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 border-b border-[var(--border)]/50 bg-amber-500/5 z-20">
                                <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] overflow-x-auto">
                                    <button
                                        type="button"
                                        onClick={() => setFocusedPath([])}
                                        className="font-semibold hover:text-[var(--pw-primary)] transition-colors"
                                    >
                                        My Root
                                    </button>
                                    {focusedPath.map((item, idx) => (
                                        <span key={item.userId} className="flex items-center gap-1.5">
                                            <span className="opacity-40">/</span>
                                            <button
                                                type="button"
                                                onClick={() => setFocusedPath(focusedPath.slice(0, idx + 1))}
                                                className={`font-semibold ${idx === focusedPath.length - 1 ? 'text-[var(--pw-primary)] font-bold' : 'hover:text-[var(--pw-primary)]'} transition-colors`}
                                            >
                                                {item.name} ({item.userId})
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFocusedPath([])}
                                    className="px-2.5 py-1 text-[11px] font-bold text-[var(--pw-primary)] bg-[var(--pw-primary)]/10 hover:bg-[var(--pw-primary)]/20 rounded-lg transition-colors shrink-0"
                                >
                                    Reset to My Tree
                                </button>
                            </div>
                        )}

                        {/* Scalable Zoomable Tree View Canvas */}
                        <div
                            ref={treeContainerRef}
                            className="overflow-auto max-h-[75vh] min-h-[500px] p-6 sm:p-10 touch-pan-x touch-pan-y cursor-grab active:cursor-grabbing relative select-none"
                        >
                            <div
                                style={{
                                    transform: `scale(${zoomScale})`,
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.12s ease-out',
                                }}
                                className="inline-block min-w-full text-center"
                            >
                                <div className="inline-flex justify-center items-start pt-2 pb-16">
                                    {renderTree(genealogyData.tree, setSelectedNode, 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : membersAtLevel.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base py-8 sm:py-12">No members at Level {selectedLevel}</p>
                ) : (
                    <div className="overflow-x-auto min-w-0">
                        <table className="w-full min-w-[560px] sm:min-w-0">
                            <thead className="bg-gray-50 dark:bg-white/5">
                                <tr>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-tight">Name</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-tight hidden sm:table-cell">User ID</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-tight hidden md:table-cell">Email</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-tight">Placement</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-tight">Rank</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-tight">Status</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-tight hidden sm:table-cell">Joined</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-tight">Downline</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-tight">Package</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-tight">Earned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                {levelMembers.map((member) => (
                                    <tr
                                        key={member.userId}
                                        onClick={() => setSelectedNode(member)}
                                        className="hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--pw-primary)]/20 text-[var(--pw-primary)] flex items-center justify-center text-sm sm:text-base font-bold shrink-0">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-[var(--foreground)] truncate">{member.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                                            <span className="text-sm text-[var(--muted-foreground)] font-mono truncate block max-w-[80px] sm:max-w-none">{member.userId}</span>
                                        </td>
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden md:table-cell">
                                            <span className="text-sm text-[var(--muted-foreground)] truncate block max-w-[120px] lg:max-w-none">{member.email}</span>
                                        </td>
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:px-2 sm:py-1 sm:text-xs ${
                                                    member.placement?.position === 'left'
                                                        ? 'bg-[var(--pw-primary)]/20 text-[var(--pw-primary)]'
                                                        : member.placement?.position === 'right'
                                                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                                                          : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-400'
                                                }`}
                                            >
                                                {member.placement?.position === 'left' ? (
                                                    <ArrowLeft size={12} className="shrink-0" />
                                                ) : member.placement?.position === 'right' ? (
                                                    <ArrowRight size={12} className="shrink-0" />
                                                ) : null}
                                                {member.placement?.position ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <span className="px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-[var(--pw-primary)]/20 text-[var(--pw-primary)]">{member.rank}</span>
                                        </td>
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 inline-flex text-[9px] sm:text-xs leading-5 font-semibold rounded-full ${
                                                member.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                member.status === 'blocked' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' :
                                                'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-400'
                                            }`}>{member.status}</span>
                                        </td>
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                                            <span className="text-sm text-[var(--muted-foreground)]">{formatDate(member.joinedAt)}</span>
                                        </td>
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-0.5 text-sm text-[var(--muted-foreground)]">
                                                <Users size={12} className="shrink-0" />{member.downlineCount}
                                            </span>
                                        </td>
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                {formatCurrency(member.totalPackageValue ?? 0)}
                                            </span>
                                        </td>
                                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(member.totalEarned)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Selected Member Details - PWA compact */}
            {selectedNode && (
                <div className="premium-card rounded-2xl p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                        <div className="icon-container icon-container-sm shrink-0">
                            <User size={16} className="text-white" />
                        </div>
                        Member Details
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                        {[
                            { label: 'Name', value: selectedNode.name },
                            { label: 'User ID', value: selectedNode.userId, mono: true },
                            { label: 'Email', value: selectedNode.email },
                            { label: 'Phone', value: selectedNode.phone || 'N/A' },
                            { label: 'Rank', value: selectedNode.rank, highlight: 'indigo' },
                            { label: 'Status', value: selectedNode.status, badge: true, badgeClass: selectedNode.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : selectedNode.status === 'blocked' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-400' },
                            {
                                label: 'Placement',
                                value: selectedNode.placement?.position,
                                badge: true,
                                badgeClass:
                                    selectedNode.placement?.position === 'left'
                                        ? 'bg-[var(--pw-primary)]/20 text-[var(--pw-primary)]'
                                        : selectedNode.placement?.position === 'right'
                                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                                          : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-400',
                            },
                            { label: 'Sponsor ID', value: selectedNode.sponsorId || 'N/A' },
                            { label: 'Joined At', value: formatDate(selectedNode.joinedAt) },
                            {
                                label: 'Package value',
                                value: formatCurrency(selectedNode.totalPackageValue ?? 0),
                                highlight: 'amber',
                            },
                            { label: 'Total Earned', value: formatCurrency(selectedNode.totalEarned), highlight: 'emerald' },
                            { label: 'Downline Count', value: selectedNode.downlineCount },
                            { label: 'Direct Referrals', value: selectedNode.children.length },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl p-3 sm:p-4 border border-[var(--border)] bg-[var(--surface)] min-w-0">
                                <p className="text-sm text-[var(--muted-foreground)] mb-1">{item.label}</p>
                                {item.badge ? (
                                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 inline-flex items-center text-xs font-semibold rounded-full ${item.badgeClass}`}>
                                        {item.label === 'Placement' ? (
                                            selectedNode.placement?.position === 'left' ? (
                                                <>
                                                    <ArrowLeft size={12} className="mr-1 shrink-0" />
                                                    Left
                                                </>
                                            ) : selectedNode.placement?.position === 'right' ? (
                                                <>
                                                    <ArrowRight size={12} className="mr-1 shrink-0" />
                                                    Right
                                                </>
                                            ) : (
                                                '—'
                                            )
                                        ) : (
                                            item.value
                                        )}
                                    </span>
                                ) : (
                                    <p className={`font-semibold text-[var(--foreground)] text-sm truncate ${item.mono ? 'font-mono' : ''} ${item.highlight === 'indigo' ? 'text-[var(--pw-primary)]' : item.highlight === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : item.highlight === 'amber' ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                        {item.label === 'Downline Count' && <Users size={14} className="inline mr-1 shrink-0" />}
                                        {item.value}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Action Bar inside Member Details */}
                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-[var(--muted-foreground)]">
                            User ID: <span className="font-mono font-bold text-[var(--foreground)]">{selectedNode.userId}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('tree');
                                setFocusedPath((prev) => {
                                    if (prev.some((p) => p.userId === selectedNode.userId)) return prev;
                                    return [...prev, { userId: selectedNode.userId, name: selectedNode.name }];
                                });
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-900 bg-[var(--pw-primary)] hover:bg-[var(--pw-primary)]/90 rounded-xl transition-all shadow-md active:scale-[0.98]"
                        >
                            <LayoutGrid size={14} />
                            Focus / Expand Tree From Here
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
