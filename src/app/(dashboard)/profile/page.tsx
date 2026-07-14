'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { API_URL } from '@/constants/env';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { updateUser } from '@/lib/store/slices/authSlice';
import { User as UserIcon, Mail, Phone, Calendar, Shield, Upload, CheckCircle2, XCircle, Clock, Wallet, Key, Copy, Check, Download, Eye, EyeOff, Camera, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import { userApi, authApi } from '@/lib/api/services';
import { Modal } from '@/components/ui/Modal';
import Web3ConfigService from '@/lib/services/web3Config.service';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import UserProfileImage from '@/components/ui/UserProfileImage';
import type { User } from '@/types';

interface KYCDocument {
    documentId?: string; // New field from API
    _id?: string; // Legacy field for backward compatibility
    type: string;
    url: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string | null;
    rejectionCount?: number;
    rejectionHistory?: Array<{
        reason: string;
        rejectedBy: string;
        rejectedAt: string;
    }>;
    uploadedAt?: string;
    reviewedAt?: string | null;
}

interface KYCStatus {
    userId: string;
    email: string;
    kyc: {
        verified: boolean;
        documents: KYCDocument[];
    };
}

export default function ProfilePage() {
    const { user } = useAppSelector((state) => state.auth);
    const savedWallet = ((user as { walletAddress?: string })?.walletAddress ?? '').trim();
    const primaryWalletLocked = savedWallet.length > 0;
    const dispatch = useAppDispatch();
    const [mounted, setMounted] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        walletAddress: (user as { walletAddress?: string })?.walletAddress || '',
    });
    const [web3Enabled, setWeb3Enabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
    const [loadingKYC, setLoadingKYC] = useState(false);
    const [showKYCUpload, setShowKYCUpload] = useState(false);
    const [uploadingKYC, setUploadingKYC] = useState(false);
    const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
    const profilePicInputRef = useRef<HTMLInputElement>(null);
    const [kycFormData, setKycFormData] = useState({
        type: 'aadhar',
        file: null as File | null,
    });
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showDocumentPreview, setShowDocumentPreview] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
    const [showRejectionHistory, setShowRejectionHistory] = useState<string | null>(null); // documentId
    const [updatingDocumentId, setUpdatingDocumentId] = useState<string | null>(null);
    const [updateFiles, setUpdateFiles] = useState<Record<string, File>>({}); // documentId -> File
    const [updateFilePreviews, setUpdateFilePreviews] = useState<Record<string, string>>({}); // documentId -> preview URL
    const [showVaultModal, setShowVaultModal] = useState(false);
    const [vaultPassword, setVaultPassword] = useState('');
    const [vaultLoading, setVaultLoading] = useState(false);
    const [revealedVault, setRevealedVault] = useState<{ vaultUserId: string; vaultKey: string } | null>(null);
    const [vaultCopied, setVaultCopied] = useState(false);
    const [showVaultPassword, setShowVaultPassword] = useState(false);

    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

    // Get full image URL (handle relative URLs from backend)
    const getDocumentUrl = (url: string) => {
        if (!url) return '';
        // If URL is already absolute (starts with http:// or https://), return as is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // If URL is relative, construct full URL
        // Backend serves files from /uploads/kycs/... which is accessible at the server root (not /api/v1)
        let baseUrl = API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
        // Ensure URL starts with / for proper path construction
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        const fullUrl = `${baseUrl}${cleanUrl}`;
        return fullUrl;
    };

    const handleDocumentClick = (doc: KYCDocument) => {
        setSelectedDocument(doc);
        setShowDocumentPreview(true);
    };

    // Fetch profile and KYC status on mount
    useEffect(() => {
        setMounted(true);
        fetchProfile();
        fetchKYCStatus();
    }, []);

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setFormData((prev) => ({
                ...prev,
                name: user.fullName || user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                walletAddress: (user as { walletAddress?: string })?.walletAddress || prev.walletAddress,
            }));
        }
    }, [user]);

    // Check if Web3 (deposit or withdrawal) is enabled in project config
    useEffect(() => {
        const configService = new Web3ConfigService();
        configService
            .getPaymentMethods()
            .then((methods) => {
                const depositWeb3 = methods?.deposit?.web3?.enabled ?? false;
                const withdrawalWeb3 = methods?.withdrawal?.web3?.enabled ?? false;
                const walletAddressWithdrawal = (methods?.withdrawal as any)?.walletAddressWithdrawal?.enabled ?? false;
                setWeb3Enabled(depositWeb3 || withdrawalWeb3 || walletAddressWithdrawal);
            })
            .catch(() => {
                setWeb3Enabled(false);
            });
    }, []);

    const fetchProfile = async () => {
        try {
            const profileData = await userApi.getProfile();
            dispatch(updateUser(profileData));
        } catch (error: any) {
            console.error('Failed to fetch profile:', error);
            // Don't show error toast, just log it
        }
    };

    const fetchKYCStatus = async () => {
        setLoadingKYC(true);
        try {
            const status = await userApi.getKYCStatus();
            setKycStatus(status);
        } catch (error: any) {
            console.error('Failed to fetch KYC status:', error);
            // Don't show error toast, just log it
        } finally {
            setLoadingKYC(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updatedUser = await userApi.updateProfile({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                walletAddress: formData.walletAddress,
            });
            dispatch(updateUser(updatedUser));
            toast.success('Profile updated successfully');
            setEditing(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            setUploadingProfilePic(true);
            const newProfilePicUrl = await userApi.uploadProfilePicture(file);
            if (user) {
                dispatch(updateUser({ ...user, profilePicture: newProfilePicUrl } as User));
            }
            toast.success('Profile picture updated successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload profile picture');
        } finally {
            setUploadingProfilePic(false);
            if (profilePicInputRef.current) {
                profilePicInputRef.current.value = '';
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed.');
                return;
            }

            // Validate file size (5MB max)
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setKycFormData({ ...kycFormData, file: selectedFile });

            // Create preview for images
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setFilePreview(null);
            }
        }
    };

    const handleKYCUpload = async () => {
        if (!kycFormData.type || !kycFormData.file) {
            toast.error('Please select a file and document type');
            return;
        }

        setUploadingKYC(true);
        try {
            await userApi.uploadKYC(kycFormData.file, kycFormData.type);
            toast.success('KYC document uploaded successfully!');
            setShowKYCUpload(false);
            setKycFormData({ type: 'aadhar', file: null });
            setFilePreview(null);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            // Refresh KYC status
            fetchKYCStatus();
        } catch (error: any) {
            const message = error.message || 'KYC upload failed';
            toast.error(message);
        } finally {
            setUploadingKYC(false);
        }
    };

    const handleCloseModal = () => {
        setShowKYCUpload(false);
        setKycFormData({ type: 'aadhar', file: null });
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpdateFileSelect = (e: React.ChangeEvent<HTMLInputElement>, documentId: string) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed.');
                return;
            }

            // Validate file size (5MB max)
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setUpdateFiles({ ...updateFiles, [documentId]: selectedFile });

            // Create preview for images
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setUpdateFilePreviews({ ...updateFilePreviews, [documentId]: reader.result as string });
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setUpdateFilePreviews({ ...updateFilePreviews, [documentId]: '' });
            }
        }
    };

    const handleUpdateDocument = async (documentId: string) => {
        const file = updateFiles[documentId];
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setUpdatingDocumentId(documentId);
        try {
            await userApi.updateKYCDocument(documentId, file);
            toast.success('Document updated successfully! Status changed to pending for admin review.');
            // Clear file and preview for this document
            const newFiles = { ...updateFiles };
            const newPreviews = { ...updateFilePreviews };
            delete newFiles[documentId];
            delete newPreviews[documentId];
            setUpdateFiles(newFiles);
            setUpdateFilePreviews(newPreviews);
            setUpdatingDocumentId(null);
            // Refresh KYC status
            fetchKYCStatus();
        } catch (error: any) {
            const message = error.message || 'Update failed';
            toast.error(message);
        } finally {
            setUpdatingDocumentId(null);
        }
    };

    const handleCloseVaultModal = () => {
        setShowVaultModal(false);
        setVaultPassword('');
        setRevealedVault(null);
        setVaultCopied(false);
    };

    const handleOpenChangePasswordModal = () => {
        setShowChangePasswordModal(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
    };

    const handleCloseChangePasswordModal = () => {
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setPasswordChangeLoading(false);
    };

    const handleChangePassword = async () => {
        if (!currentPassword.trim() || !newPassword.trim()) {
            toast.error('Please enter both current and new passwords.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast.error('New password and confirmation do not match.');
            return;
        }

        setPasswordChangeLoading(true);
        try {
            await userApi.changePassword(currentPassword, newPassword);
            toast.success('Password updated successfully.');
            handleCloseChangePasswordModal();
        } catch (err: any) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Failed to change password.');
        } finally {
            setPasswordChangeLoading(false);
        }
    };

    const handleRevealVaultKey = async () => {
        if (!vaultPassword.trim()) return;
        setVaultLoading(true);
        try {
            const result = await authApi.revealVaultKey(vaultPassword) as { vaultUserId: string; vaultKey: string };
            setRevealedVault({ vaultUserId: result.vaultUserId, vaultKey: result.vaultKey });
            toast.success('New Vault Key generated. Save it securely.');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Invalid password. Please try again.');
        } finally {
            setVaultLoading(false);
        }
    };

    const handleCopyVault = () => {
        if (!revealedVault) return;
        const text = `User ID: ${revealedVault.vaultUserId}\nVault Key: ${revealedVault.vaultKey}`;
        navigator.clipboard.writeText(text);
        setVaultCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setVaultCopied(false), 2000);
    };

    const handleDownloadVault = () => {
        if (!revealedVault) return;
        const blob = new Blob([`User ID: ${revealedVault.vaultUserId}\nVault Key: ${revealedVault.vaultKey}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vault-key.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Saved as .txt');
    };

    // Get document ID (support both documentId and _id)
    const getDocumentId = (doc: KYCDocument): string => {
        return doc.documentId || doc._id || '';
    };

    const getNewPasswordStrength = (pwd: string) => {
        let strength = 0;
        if (pwd.length >= 6) strength++;
        if (pwd.length >= 10) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[^A-Za-z0-9]/.test(pwd)) strength++;
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];
        return { strength, label: labels[strength], color: colors[strength] };
    };

    // Group documents by status
    const rejectedDocuments = kycStatus?.kyc.documents.filter(doc => doc.status === 'rejected') || [];
    const pendingDocuments = kycStatus?.kyc.documents.filter(doc => doc.status === 'pending') || [];
    const approvedDocuments = kycStatus?.kyc.documents.filter(doc => doc.status === 'approved') || [];

    const getDocumentStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle2 className="text-green-600 dark:text-green-400 shrink-0" size={16} />;
            case 'rejected':
                return <XCircle className="text-red-600 dark:text-red-400 shrink-0" size={16} />;
            default:
                return <Clock className="text-yellow-600 dark:text-yellow-400 shrink-0" size={16} />;
        }
    };

    const getDocumentStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
        }
    };

    const newPwdStrength = getNewPasswordStrength(newPassword);

    if (!mounted) {
        return null; // Prevent hydration mismatch on the server
    }

    return (
        <div className="space-y-2 sm:space-y-5 lg:space-y-8">
            {/* Header - Hero-style PWA compact */}
            <div className="relative overflow-hidden rounded-lg sm:rounded-2xl premium-card p-2.5 sm:p-6 md:p-8 border border-[var(--border)] bg-[var(--surface-elevated)] shadow-lg sm:shadow-xl">
                <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,229,160,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-[var(--pw-primary)]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex items-center gap-2.5 sm:gap-4">
                    <UserProfileImage
                        src={(user as any)?.profilePicture}
                        alt={user?.name ?? 'User'}
                        width={56}
                        height={56}
                        className="rounded-full border border-primary/20"
                    />
                    <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-sm font-medium mb-1 sm:mb-2">Account</span>
                        <h1 className="text-base sm:text-2xl md:text-3xl font-bold text-[var(--foreground)] leading-tight truncate" style={{ fontFamily: 'var(--font-display)' }}>My Profile</h1>
                        <p className="text-[var(--muted-foreground)] text-[11px] sm:text-sm mt-0.5 sm:mt-1">Manage your account information</p>
                    </div>
                </div>
            </div>

            {/* Profile Card - PWA compact */}
            <div className="premium-card rounded-lg sm:rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden shadow-lg">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 sm:p-8 border-b border-[var(--border)] text-white relative">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, rgba(212,175,55,0.08) 0, transparent 400px)' }}></div>
                    <div className="relative flex items-center gap-3 sm:gap-6 z-10">
                        <div className="relative group shrink-0">
                            <UserProfileImage
                                src={(user as any)?.profilePicture}
                                alt={user?.name ?? 'User'}
                                width={96}
                                height={96}
                                className="rounded-full border-2 border-white/20 shadow-lg transition-transform duration-300 group-hover:scale-105"
                            />
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm border border-white/20">
                                {uploadingProfilePic ? (
                                    <Loader2 className="animate-spin text-white mb-1" size={24} />
                                ) : (
                                    <>
                                        <Camera className="text-white mb-1" size={20} />
                                        <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    ref={profilePicInputRef}
                                    onChange={handleProfilePicUpload}
                                    disabled={uploadingProfilePic}
                                />
                            </label>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">{user?.fullName || user?.name || 'User'}</h2>
                            <p className="text-white/80 text-[10px] sm:text-sm mt-0.5 sm:mt-1 truncate">{user?.userId}</p>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
                                <span
                                    className={`px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${user?.status === 'active'
                                        ? 'bg-emerald-500/90 text-white'
                                        : 'bg-gray-500/90 text-white'
                                        }`}
                                >
                                    {user?.status}
                                </span>
                                <span className="px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-white/20 backdrop-blur-sm">
                                    {user?.rank || 'Member'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Section - PWA compact */}
                <div className="p-3 sm:p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-xl font-bold text-[var(--foreground)]">Personal Information</h3>
                        {!editing ? (
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                <button
                                    onClick={() => setEditing(true)}
                                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-zinc-950 font-bold text-[11px] sm:text-sm shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={handleOpenChangePasswordModal}
                                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-semibold text-[11px] sm:text-sm transition-all duration-200"
                                >
                                    Change Password
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setFormData({
                                            name: user?.fullName || user?.name || '',
                                            email: user?.email || '',
                                            phone: user?.phone || '',
                                            walletAddress: (user as { walletAddress?: string })?.walletAddress || '',
                                        });
                                    }}
                                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-semibold text-[11px] sm:text-sm transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-zinc-950 font-bold text-[11px] sm:text-sm shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Full Name */}
                        <div>
                            <label className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-medium text-[var(--muted-foreground)] mb-1 sm:mb-2">
                                <UserIcon size={14} />
                                Full Name
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">{user?.fullName || user?.name || 'N/A'}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-medium text-[var(--muted-foreground)] mb-1 sm:mb-2">
                                <Mail size={14} />
                                Email Address
                            </label>
                            {editing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">{user?.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-medium text-[var(--muted-foreground)] mb-1 sm:mb-2">
                                <Phone size={14} />
                                Phone Number
                            </label>
                            {editing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">{user?.phone}</p>
                            )}
                        </div>

                        {/* Wallet Address - shown only when Web3 deposit or withdrawal is enabled */}
                        {web3Enabled && (
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-medium text-[var(--muted-foreground)] mb-1 sm:mb-2">
                                    <Wallet size={14} />
                                    Primary Wallet Address
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={formData.walletAddress ?? ''}
                                        onChange={
                                            primaryWalletLocked
                                                ? undefined
                                                : (e) => setFormData({ ...formData, walletAddress: e.target.value })
                                        }
                                        readOnly={primaryWalletLocked}
                                        disabled={primaryWalletLocked}
                                        placeholder="0x..."
                                        className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm font-mono focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-90"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base font-mono break-all">
                                        {(user as { walletAddress?: string })?.walletAddress || 'Not set'}
                                    </p>
                                )}
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                    Your primary Web3 wallet for deposits and withdrawals.
                                    {primaryWalletLocked && (
                                        <>
                                            {' '}
                                            To change it,{' '}
                                            <Link href="/support" className="font-semibold text-[var(--pw-primary)] hover:underline">
                                                open a support ticket
                                            </Link>
                                            .
                                        </>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Join Date */}
                        <div>
                            <label className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-medium text-[var(--muted-foreground)] mb-1 sm:mb-2">
                                <Calendar size={14} />
                                Join Date
                            </label>
                            <p className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">
                                {user?.joinDate || user?.joinedAt ? formatDate(user.joinDate || user.joinedAt || '') : 'N/A'}
                            </p>
                        </div>

                        {/* KYC Status */}
                        <div>
                            <label className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-medium text-[var(--muted-foreground)] mb-1 sm:mb-2">
                                <Shield size={14} />
                                KYC Status
                            </label>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span
                                    className={`px-2 py-0.5 sm:px-3 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${kycStatus?.kyc.verified
                                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                        : kycStatus?.kyc.documents.some(d => d.status === 'pending')
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300'
                                        }`}
                                >
                                    {kycStatus?.kyc.verified ? 'Verified' : kycStatus?.kyc.documents.length ? 'Pending' : 'Not Started'}
                                </span>
                                <button
                                    onClick={() => setShowKYCUpload(true)}
                                    className="px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold text-[var(--pw-primary)] hover:text-[var(--pw-primary)]/80 flex items-center gap-1"
                                >
                                    <Upload size={12} />
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2FA Setup Section */}
            <div>
                <TwoFactorSetup />
            </div>

            {/* KYC Documents Section */}
            {kycStatus && kycStatus.kyc.documents.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                    {/* Overall KYC Status */}
                    <div className="premium-card rounded-2xl p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-2">KYC Status</h3>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    {kycStatus.kyc.verified ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✅ Verified</span>
                                    ) : (
                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">⏳ Pending Verification</span>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowKYCUpload(true)}
                                className="btn btn-primary px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm"
                            >
                                <Upload size={14} />
                                Upload Document
                            </button>
                        </div>
                        <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4">
                            <div className="text-center rounded-lg sm:rounded-xl p-2 sm:p-3 border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10 flex-1 min-w-0">
                                <p className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingDocuments.length}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">Pending</p>
                            </div>
                            <div className="text-center rounded-lg sm:rounded-xl p-2 sm:p-3 border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10 flex-1 min-w-0">
                                <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approvedDocuments.length}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">Approved</p>
                            </div>
                            <div className="text-center rounded-lg sm:rounded-xl p-2 sm:p-3 border border-red-200/60 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/10 flex-1 min-w-0">
                                <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{rejectedDocuments.length}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">Rejected</p>
                            </div>
                        </div>
                    </div>

                    {/* Rejected Documents */}
                    {rejectedDocuments.length > 0 && (
                        <div className="premium-card rounded-2xl p-4 sm:p-6 md:p-8 border border-[var(--border)] bg-[var(--surface-elevated)]">
                            <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-4 sm:mb-6">
                                ⚠️ Rejected Documents ({rejectedDocuments.length})
                            </h3>
                            <div className="space-y-4 sm:space-y-6">
                                {rejectedDocuments.map((doc, index) => {
                                    const docId = getDocumentId(doc);
                                    const isUpdating = updatingDocumentId === docId;
                                    return (
                                        <div
                                            key={docId || index}
                                            className="border border-red-200 dark:border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-6 bg-red-50/50 dark:bg-red-500/10"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                                                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                                                    {getDocumentStatusIcon(doc.status)}
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 dark:text-white capitalize text-sm sm:text-lg truncate">
                                                            {doc.type.replace('_', ' ')}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {doc.uploadedAt ? formatDate(doc.uploadedAt) : 'Recently uploaded'}
                                                        </p>
                                                        {doc.rejectionCount && doc.rejectionCount > 0 && (
                                                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                                                Rejected {doc.rejectionCount} time{doc.rejectionCount > 1 ? 's' : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold rounded-full shrink-0 ${getDocumentStatusColor(doc.status)}`}>
                                                    {doc.status}
                                                </span>
                                            </div>

                                            {/* Rejection Reason */}
                                            {doc.rejectionReason && (
                                                <div className="bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg p-2.5 sm:p-4 mb-3 sm:mb-4">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-red-600 dark:text-red-400 text-base sm:text-lg shrink-0">⚠️</span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-red-800 dark:text-red-300 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Rejection Reason:</p>
                                                            <p className="text-[10px] sm:text-sm text-red-700 dark:text-red-400">{doc.rejectionReason}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Rejection History */}
                                            {doc.rejectionHistory && doc.rejectionHistory.length > 0 && (
                                                <div className="mb-3 sm:mb-4">
                                                    <button
                                                        onClick={() => setShowRejectionHistory(showRejectionHistory === docId ? null : docId)}
                                                        className="text-[10px] sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 sm:gap-2"
                                                    >
                                                        {showRejectionHistory === docId ? '▼' : '▶'}
                                                        Show Rejection History ({doc.rejectionHistory.length})
                                                    </button>
                                                    {showRejectionHistory === docId && (
                                                        <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2 pl-4 sm:pl-6 border-l-2 border-gray-300 dark:border-white/20">
                                                            {doc.rejectionHistory.map((history, idx) => (
                                                                <div key={idx} className="py-1.5 sm:py-2">
                                                                    <p className="text-[10px] sm:text-sm text-gray-700 dark:text-gray-300">
                                                                        <strong>Reason:</strong> {history.reason}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                        {formatDate(history.rejectedAt)}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Update Document Section */}
                                            <div className="border-t border-gray-200 dark:border-white/10 pt-3 sm:pt-4 mt-3 sm:mt-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-2 sm:mb-3">Update Document</h4>
                                                <div className="space-y-2 sm:space-y-3">
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                                        onChange={(e) => {
                                                            handleUpdateFileSelect(e, docId);
                                                            e.target.value = '';
                                                        }}
                                                        disabled={isUpdating}
                                                        className="w-full px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-[10px] sm:text-sm focus:ring-2 focus:ring-[var(--pw-primary)] file:mr-2 sm:file:mr-4 file:py-1.5 file:px-2 sm:file:py-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-[10px] sm:file:text-sm file:font-semibold file:bg-[var(--pw-primary)]/20 file:text-[var(--pw-primary)] hover:file:bg-[var(--pw-primary)]/30 disabled:opacity-50"
                                                    />
                                                    {updateFilePreviews[docId] && (
                                                        <div className="mt-1.5 sm:mt-2">
                                                            <p className="text-[10px] sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Preview:</p>
                                                            <img
                                                                src={updateFilePreviews[docId]}
                                                                alt="Preview"
                                                                className="max-w-full h-auto max-h-36 sm:max-h-48 rounded-lg border border-gray-200 dark:border-white/10"
                                                            />
                                                        </div>
                                                    )}
                                                    {updateFiles[docId] && !updateFilePreviews[docId] && (
                                                        <div className="mt-1.5 sm:mt-2 p-2 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg sm:rounded-xl border border-gray-200/80 dark:border-white/10">
                                                            <p className="text-[10px] sm:text-sm text-gray-700 dark:text-gray-300">
                                                                <strong>Selected:</strong> {updateFiles[docId].name} ({(updateFiles[docId].size / 1024).toFixed(2)} KB)
                                                            </p>
                                                        </div>
                                                    )}
                                                    {updateFiles[docId] && (
                                                        <button
                                                            onClick={() => handleUpdateDocument(docId)}
                                                            disabled={isUpdating}
                                                            className="btn btn-primary w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold text-[10px] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isUpdating ? 'Updating...' : 'Update Document'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Document Preview Button */}
                                            <div className="mt-3 sm:mt-4">
                                                <button
                                                    onClick={() => handleDocumentClick(doc)}
                                                    className="text-[10px] sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                                >
                                                    View Document →
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Pending Documents */}
                    {pendingDocuments.length > 0 && (
                        <div className="premium-card rounded-2xl p-4 sm:p-6 md:p-8 border border-[var(--border)] bg-[var(--surface-elevated)]">
                            <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-4 sm:mb-6">
                                ⏳ Pending Review ({pendingDocuments.length})
                            </h3>
                            <div className="space-y-2 sm:space-y-4">
                                {pendingDocuments.map((doc, index) => {
                                    const docId = getDocumentId(doc);
                                    return (
                                        <div
                                            key={docId || index}
                                            onClick={() => handleDocumentClick(doc)}
                                            className="flex items-center justify-between p-2.5 sm:p-4 border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors gap-2"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                                                {getDocumentStatusIcon(doc.status)}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white capitalize text-sm sm:text-base truncate">{doc.type.replace('_', ' ')}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {doc.uploadedAt ? formatDate(doc.uploadedAt) : 'Recently uploaded'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold rounded-full shrink-0 ${getDocumentStatusColor(doc.status)}`}>
                                                {doc.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Approved Documents */}
                    {approvedDocuments.length > 0 && (
                        <div className="premium-card rounded-2xl p-4 sm:p-6 md:p-8 border border-[var(--border)] bg-[var(--surface-elevated)]">
                            <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-4 sm:mb-6">
                                ✅ Approved Documents ({approvedDocuments.length})
                            </h3>
                            <div className="space-y-2 sm:space-y-4">
                                {approvedDocuments.map((doc, index) => {
                                    const docId = getDocumentId(doc);
                                    return (
                                        <div
                                            key={docId || index}
                                            onClick={() => handleDocumentClick(doc)}
                                            className="flex items-center justify-between p-2.5 sm:p-4 border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors gap-2"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                                                {getDocumentStatusIcon(doc.status)}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white capitalize text-sm sm:text-base truncate">{doc.type.replace('_', ' ')}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {doc.uploadedAt ? formatDate(doc.uploadedAt) : 'Recently uploaded'}
                                                        {doc.reviewedAt && ` • Reviewed: ${formatDate(doc.reviewedAt)}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold rounded-full shrink-0 ${getDocumentStatusColor(doc.status)}`}>
                                                {doc.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Security - Vault Key */}
            <div className="premium-card rounded-2xl p-4 sm:p-6 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-2">Security</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    Your Vault Key is required for password recovery. Regenerating creates a new key — the old one will no longer work.
                </p>
                <button
                    onClick={() => setShowVaultModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--pw-primary)]/10 border border-[var(--pw-primary)]/30 text-[var(--pw-primary)] font-semibold text-sm hover:bg-[var(--pw-primary)]/20 transition-colors"
                >
                    <Key size={14} /> Reveal / Regenerate Vault Key
                </button>
            </div>

            {/* MLM Information */}
            <div className="premium-card rounded-2xl p-4 sm:p-6 md:p-8 border border-[var(--border)] bg-[var(--surface-elevated)]">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-4 sm:mb-6">MLM Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Sponsor ID</p>
                        <p className="text-[var(--foreground)] font-semibold text-sm sm:text-base">{user?.sponsorId ?? 'Direct'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Placement</p>
                        <span
                            className={`px-2 py-0.5 sm:px-3 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${(typeof user?.placement === 'object' ? user?.placement?.position : user?.placement) === 'left'
                                ? 'bg-[var(--pw-primary)]/20 text-[var(--pw-primary)]'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                                }`}
                        >
                            {typeof user?.placement === 'object' ? user?.placement?.position : user?.placement || 'N/A'}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Current Rank</p>
                        <p className="text-[var(--foreground)] font-semibold text-sm sm:text-base">{user?.rank || 'Member'}</p>
                    </div>
                </div>
            </div>

            {/* KYC Upload Modal */}
            <Modal
                isOpen={showKYCUpload}
                onClose={handleCloseModal}
                title="Upload KYC Document"
                size="md"
            >
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                            Document Type
                        </label>
                        <select
                            value={kycFormData.type}
                            onChange={(e) => setKycFormData({ ...kycFormData, type: e.target.value })}
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] focus:border-transparent"
                        >
                            <option value="aadhar">Aadhar Card</option>
                            <option value="pan">PAN Card</option>
                            <option value="passport">Passport</option>
                            <option value="driving_license">Driving License</option>
                            <option value="voter_id">Voter ID</option>
                            <option value="bank_statement">Bank Statement</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                            Document File
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                            onChange={handleFileSelect}
                            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--pw-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--pw-primary)]/20 file:text-[var(--pw-primary)] hover:file:bg-[var(--pw-primary)]/30"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                            Allowed: JPEG, PNG, WebP, PDF (Max 5MB)
                        </p>
                        {filePreview && (
                            <div className="mt-2 sm:mt-3">
                                <p className="text-[10px] sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Preview:</p>
                                <img
                                    src={filePreview}
                                    alt="Document preview"
                                    className="max-w-full h-auto max-h-48 sm:max-h-64 rounded-lg border border-gray-200 dark:border-white/10"
                                />
                            </div>
                        )}
                        {kycFormData.file && !filePreview && (
                            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg sm:rounded-xl border border-gray-200/80 dark:border-white/10">
                                <p className="text-[10px] sm:text-sm text-gray-700 dark:text-gray-300">
                                    <strong>Selected:</strong> {kycFormData.file.name} ({(kycFormData.file.size / 1024).toFixed(2)} KB)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <button
                        onClick={handleCloseModal}
                        className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] font-semibold text-sm text-[var(--muted-foreground)] hover:bg-[var(--surface)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleKYCUpload}
                        disabled={uploadingKYC || !kycFormData.type || !kycFormData.file}
                        className="btn btn-primary flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadingKYC ? 'Uploading...' : 'Upload Document'}
                    </button>
                </div>
            </Modal>

            {/* Document Preview Modal */}
            <Modal
                isOpen={showDocumentPreview}
                onClose={() => {
                    setShowDocumentPreview(false);
                    setSelectedDocument(null);
                }}
                title={selectedDocument ? `KYC Document - ${selectedDocument.type.replace('_', ' ').toUpperCase()}` : 'Document Preview'}
                size="lg"
            >
                {selectedDocument && (
                    <div className="space-y-3 sm:space-y-4">
                        {/* Document Info - compact */}
                        <div className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg sm:rounded-xl border border-gray-200/80 dark:border-white/10">
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Type: <span className="capitalize">{selectedDocument.type.replace('_', ' ')}</span>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Status: <span className="capitalize">{selectedDocument.status}</span>
                                </p>
                                {selectedDocument.uploadedAt && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Uploaded: {formatDate(selectedDocument.uploadedAt)}
                                    </p>
                                )}
                                {selectedDocument.reviewedAt && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Reviewed: {formatDate(selectedDocument.reviewedAt)}
                                    </p>
                                )}
                                {selectedDocument.rejectionCount && selectedDocument.rejectionCount > 0 && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                        Rejected {selectedDocument.rejectionCount} time{selectedDocument.rejectionCount > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                            <span
                                className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold rounded-full shrink-0 ${getDocumentStatusColor(selectedDocument.status)}`}
                            >
                                {selectedDocument.status}
                            </span>
                        </div>

                        {/* Rejection Reason (if rejected) */}
                        {selectedDocument.status === 'rejected' && selectedDocument.rejectionReason && (
                            <div className="bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg p-2.5 sm:p-4">
                                <div className="flex items-start gap-2">
                                    <span className="text-red-600 dark:text-red-400 text-base sm:text-lg shrink-0">⚠️</span>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-red-800 dark:text-red-300 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Rejection Reason:</p>
                                        <p className="text-[10px] sm:text-sm text-red-700 dark:text-red-400">{selectedDocument.rejectionReason}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Document Preview */}
                        <div className="flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-lg sm:rounded-xl border border-gray-200/80 dark:border-white/10 p-3 sm:p-4 min-h-[280px] sm:min-h-[400px]">
                            {selectedDocument.url ? (
                                <>
                                    <img
                                        src={getDocumentUrl(selectedDocument.url)}
                                        alt={selectedDocument.type}
                                        className="max-w-full max-h-[600px] rounded-lg shadow-lg object-contain"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            const fullUrl = getDocumentUrl(selectedDocument.url);
                                            target.style.display = 'none';
                                            const existingError = target.parentElement?.querySelector('.image-error');
                                            if (existingError) existingError.remove();
                                            const errorDiv = document.createElement('div');
                                            errorDiv.className = 'image-error text-center text-gray-500 p-8';
                                            errorDiv.innerHTML = '<p class="text-lg font-semibold mb-2 text-red-600">Failed to load image</p><p class="text-sm mb-2">Original URL: ' + selectedDocument.url + '</p><p class="text-sm mb-4">Full URL: ' + fullUrl + '</p><a href="' + fullUrl + '" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 underline">Open in new tab</a>';
                                            target.parentElement?.appendChild(errorDiv);
                                        }}
                                        onLoad={() => {
                                            // Remove any existing error message on successful load
                                            const existingError = document.querySelector('.image-error');
                                            if (existingError) {
                                                existingError.remove();
                                            }
                                        }}
                                    />
                                </>
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 p-6 sm:p-8">
                                    <p className="text-sm sm:text-lg font-semibold">No document URL available</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Change Password Modal */}
            <Modal isOpen={showChangePasswordModal} onClose={handleCloseChangePasswordModal} title="Change Password" size="md">
                <div className="space-y-4">
                    <p className="text-xs text-[var(--muted-foreground)]">
                        Update your account password. Your current password is required for security.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="premium-input w-full pr-11 text-base"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="premium-input w-full pr-11 text-base"
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {newPassword && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= newPwdStrength.strength ? newPwdStrength.color : 'bg-gray-200 dark:bg-white/10'}`} />
                                    ))}
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)]">{newPwdStrength.label}</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="premium-input w-full text-base"
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            type="button"
                            onClick={handleCloseChangePasswordModal}
                            className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] font-semibold text-sm text-[var(--muted-foreground)] hover:bg-[var(--surface)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleChangePassword}
                            disabled={passwordChangeLoading}
                            className="btn btn-primary flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                        >
                            {passwordChangeLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Vault Key Reveal/Regenerate Modal */}
            <Modal isOpen={showVaultModal} onClose={handleCloseVaultModal} title="Vault Key" size="md">
                <div className="space-y-4">
                    {!revealedVault ? (
                        <>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                Enter your current password to reveal or regenerate your Vault Key. Regenerating creates a new key — save it securely.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showVaultPassword ? 'text' : 'password'}
                                        value={vaultPassword}
                                        onChange={(e) => setVaultPassword(e.target.value)}
                                        className="premium-input w-full pr-11 text-base"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowVaultPassword(!showVaultPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {showVaultPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="rounded-xl p-3 border bg-[var(--pw-primary)]/5 border-[var(--pw-primary)]/30" style={{ fontFamily: 'ui-monospace, monospace' }}>
                                <p className="text-[10px] text-[var(--muted-foreground)] mb-1">User ID</p>
                                <p className="text-sm text-[var(--foreground)] mb-3">{revealedVault.vaultUserId}</p>
                                <p className="text-[10px] text-[var(--muted-foreground)] mb-1">Vault Key</p>
                                <p className="text-sm text-[var(--foreground)]">{revealedVault.vaultKey}</p>
                            </div>
                            <p className="text-[10px]" style={{ color: '#F59E0B' }}>
                                Save this. We cannot recover it for you. The old key no longer works.
                            </p>
                            <div className="flex gap-2">
                                <button onClick={handleCopyVault} className="btn btn-primary flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm">
                                    {vaultCopied ? <Check size={14} /> : <Copy size={14} />}
                                    {vaultCopied ? 'Copied' : 'Copy'}
                                </button>
                                <button onClick={handleDownloadVault} className="px-4 py-2 rounded-xl border border-[var(--border)] font-semibold text-sm flex-1 flex items-center justify-center gap-1.5 hover:bg-[var(--surface)]">
                                    <Download size={14} /> Save .txt
                                </button>
                            </div>
                        </>
                    )}
                    <div className="flex gap-2 mt-5">
                        {!revealedVault ? (
                            <>
                                <button onClick={handleCloseVaultModal} className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] font-semibold text-sm text-[var(--muted-foreground)] hover:bg-[var(--surface)]">Cancel</button>
                                <button onClick={handleRevealVaultKey} disabled={vaultLoading || !vaultPassword.trim()} className="btn btn-primary flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
                                    {vaultLoading ? 'Verifying...' : 'Reveal / Regenerate Key'}
                                </button>
                            </>
                        ) : (
                            <button onClick={handleCloseVaultModal} className="btn btn-primary flex-1 py-3 rounded-xl font-semibold">Done</button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
