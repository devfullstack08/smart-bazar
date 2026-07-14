'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { GenealogyTreeNode } from '@/types';
import { teamApi } from '@/lib/api/services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { User, ArrowLeft, ArrowRight, Users, UserCheck, UserX, LayoutGrid, Table, Package } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/cn';

interface TreeNodeProps {
    node: GenealogyTreeNode | null;
    onNodeClick: (node: GenealogyTreeNode) => void;
    level: number;
}

function TreeNode({ node, onNodeClick, level: _level }: TreeNodeProps) {
    if (!node) {
        return (
            <div className="flex flex-col items-center">
                <div className="w-14 h-14 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg sm:rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5">
                    <UserX className="text-gray-400 dark:text-gray-500" size={24} />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 sm:mt-2">Empty</p>
            </div>
        );
    }

    const isActive = node.status === 'active';
    const hasPlacement = node.placement?.position === 'left' || node.placement?.position === 'right';
    const placementIcon = node.placement?.position === 'left' ? <ArrowLeft size={12} /> : node.placement?.position === 'right' ? <ArrowRight size={12} /> : null;

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={() => onNodeClick(node)}
                type="button"
                className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-[0.98] shadow-md sm:shadow-lg touch-manipulation ${isActive
                    ? 'bg-[var(--pw-primary)] text-gray-900 border-2 border-white/20'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-white/10'
                }`}
            >
                <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-0.5">
                    {isActive ? <UserCheck size={16} className="sm:w-5 sm:h-5" /> : <User size={16} className="sm:w-5 sm:h-5" />}
                </div>
                <p className="text-xs font-semibold truncate w-12 sm:w-16 md:w-20 text-center px-0.5">
                    {(node.name || 'User').split(' ')[0]}
                </p>
            </button>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5 font-mono truncate max-w-[64px] sm:max-w-[72px] md:max-w-none">{node.userId}</p>
            {hasPlacement && (
                <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 text-gray-600 dark:text-gray-400">
                    {placementIcon}
                    <span className="text-xs">{node.placement?.position}</span>
                </div>
            )}
            <p className="text-xs text-[var(--pw-primary)] font-semibold mt-0.5">{node.rank}</p>
            {(node.totalPackageValue ?? 0) > 0 && (
                <p className="text-[10px] font-semibold text-amber-500 mt-0.5">{formatCurrency(node.totalPackageValue!)}</p>
            )}
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{formatCurrency(node.totalEarned)}</p>
            {node.downlineCount > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
                    <Users size={10} className="text-gray-500 dark:text-gray-400 shrink-0" />
                    <span className="text-xs text-[var(--muted-foreground)]">{node.downlineCount}</span>
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

/** Recursive tree render - supports multi-child (all children) and binary (left/right placement) trees */
function renderTree(node: GenealogyTreeNode | null, onNodeClick: (n: GenealogyTreeNode) => void, level: number): React.ReactNode {
    if (!node) return null;
    const children = node.children ?? [];
    const hasPlacement = children.some((c) => c.placement?.position === 'left' || c.placement?.position === 'right');
    const childNodes: GenealogyTreeNode[] = hasPlacement
        ? [
            children.find((c) => c.placement?.position === 'left') ?? null,
            children.find((c) => c.placement?.position === 'right') ?? null,
        ].filter(Boolean) as GenealogyTreeNode[]
        : children;

    return (
        <div key={node.userId} className="flex flex-col items-center shrink-0">
            <div className="flex justify-center mb-2 sm:mb-4">
                <TreeNode node={node} onNodeClick={onNodeClick} level={level} />
            </div>
            {childNodes.length > 0 && (
                <div className="flex flex-row flex-wrap gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10 mt-2 sm:mt-4 justify-center items-start">
                    {childNodes.map((child) => (
                        <div key={child.userId} className="flex flex-col items-center shrink-0">
                            {renderTree(child, onNodeClick, level + 1)}
                        </div>
                    ))}
                </div>
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

    /** Generations to load from API (must be ≥ selected level). */
    const genealogyLoadDepth = useMemo(
        () => Math.min(MAX_DEPTH, Math.max(1, selectedLevel)),
        [selectedLevel],
    );

    const fetchGenealogyData = useCallback(async () => {
        try {
            const data = await teamApi.getGenealogy(genealogyLoadDepth);
            setGenealogyData({ tree: data.tree, depth: data.depth });
        } catch (error) {
            console.error('Failed to fetch genealogy data:', error);
        } finally {
            setLoading(false);
        }
    }, [genealogyLoadDepth]);

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
                        {viewMode === 'table' ? 'Select a level above to view team members at that level' : 'Click on a node to view member details'}
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
                    <div className="p-2.5 sm:p-6 overflow-auto max-h-[70vh] min-w-0">
                        <div className="flex justify-center items-start">
                            {renderTree(genealogyData.tree, setSelectedNode, 0)}
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

            {/* Selected Node Details - PWA compact */}
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
                </div>
            )}
        </div>
    );
}
