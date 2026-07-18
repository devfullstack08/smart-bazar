'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { API_URL } from '@/constants/env';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { updateUser } from '@/lib/store/slices/authSlice';
import { User as UserIcon, Mail, Phone, Calendar, Shield, Upload, CheckCircle2, XCircle, Clock, Wallet, Key, Copy, Check, Download, Eye, EyeOff, Camera, Loader2, FileText, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import { userApi, authApi } from '@/lib/api/services';
import { Modal } from '@/components/ui/Modal';
import Web3ConfigService from '@/lib/services/web3Config.service';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import UserProfileImage from '@/components/ui/UserProfileImage';
import type { User } from '@/types';
import { APP_NAME } from '@/constants/env';

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

    // Security PIN & Biometric Passkey states
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinMode, setPinMode] = useState<'set' | 'change'>('set');
    const [pinPassword, setPinPassword] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [showPinPassword, setShowPinPassword] = useState(false);

    const [passkeys, setPasskeys] = useState<any[]>([]);
    const [loadingPasskeys, setLoadingPasskeys] = useState(false);
    const [registeringPasskey, setRegisteringPasskey] = useState(false);
    const [passkeyDeviceName, setPasskeyDeviceName] = useState('My Secure Key');
    const [showAddPasskeyModal, setShowAddPasskeyModal] = useState(false);

    const getDocumentUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        let baseUrl = API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanUrl}`;
    };

    const handleDocumentClick = (doc: KYCDocument) => {
        setSelectedDocument(doc);
        setShowDocumentPreview(true);
    };

    useEffect(() => {
        setMounted(true);
        fetchProfile();
        fetchKYCStatus();
        fetchPasskeys();
    }, []);

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
        }
    };

    const fetchKYCStatus = async () => {
        setLoadingKYC(true);
        try {
            const status = await userApi.getKYCStatus();
            setKycStatus(status);
        } catch (error: any) {
            console.error('Failed to fetch KYC status:', error);
        } finally {
            setLoadingKYC(false);
        }
    };

    const fetchPasskeys = async () => {
        setLoadingPasskeys(true);
        try {
            const list = await userApi.listPasskeys();
            setPasskeys(list || []);
        } catch (error) {
            console.error('Failed to fetch passkeys:', error);
        } finally {
            setLoadingPasskeys(false);
        }
    };

    const handleSetPin = async () => {
        if (!pinCode || pinCode.length < 4 || pinCode.length > 6) {
            toast.error('PIN must be between 4 and 6 digits');
            return;
        }
        if (pinCode !== pinConfirm) {
            toast.error('PIN confirmations do not match');
            return;
        }
        if (!pinPassword) {
            toast.error('Current password is required to set security PIN');
            return;
        }

        setPinLoading(true);
        try {
            await userApi.setPin(pinCode, pinPassword);
            toast.success('Security PIN set successfully');
            setShowPinModal(false);
            setPinPassword('');
            setPinCode('');
            setPinConfirm('');
            fetchProfile();
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Failed to set PIN');
        } finally {
            setPinLoading(false);
        }
    };

    const handleChangePin = async () => {
        if (!currentPin) {
            toast.error('Current PIN is required');
            return;
        }
        if (!newPin || newPin.length < 4 || newPin.length > 6) {
            toast.error('New PIN must be between 4 and 6 digits');
            return;
        }

        setPinLoading(true);
        try {
            await userApi.changePin(currentPin, newPin);
            toast.success('Security PIN updated successfully');
            setShowPinModal(false);
            setCurrentPin('');
            setNewPin('');
            fetchProfile();
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Failed to change PIN');
        } finally {
            setPinLoading(false);
        }
    };

    const handleRegisterPasskey = async () => {
        setRegisteringPasskey(true);
        try {
            const options = await userApi.getPasskeyRegisterOptions();
            
            if (typeof window !== 'undefined' && navigator.credentials && options?.challenge) {
                const challengeBuffer = Uint8Array.from(
                    atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), 
                    c => c.charCodeAt(0)
                );
                
                const userBuffer = Uint8Array.from(
                    atob(options.user.id.replace(/-/g, '+').replace(/_/g, '/')), 
                    c => c.charCodeAt(0)
                );

                const credential = await navigator.credentials.create({
                    publicKey: {
                        ...options,
                        challenge: challengeBuffer,
                        user: {
                            ...options.user,
                            id: userBuffer
                        }
                    }
                });

                if (credential) {
                    const cred = credential as any;
                    const registrationPayload = {
                        id: cred.id,
                        rawId: btoa(String.fromCharCode(...new Uint8Array(cred.rawId))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
                        type: cred.type,
                        response: {
                            attestationObject: btoa(String.fromCharCode(...new Uint8Array(cred.response.attestationObject))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
                            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(cred.response.clientDataJSON))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
                            transports: cred.response.getTransports ? cred.response.getTransports() : []
                        }
                    };

                    await userApi.verifyPasskeyRegister(registrationPayload, passkeyDeviceName || 'TouchID/FaceID Key');
                    toast.success('Passkey registered successfully!');
                    setShowAddPasskeyModal(false);
                    fetchPasskeys();
                    fetchProfile();
                    return;
                }
            } else {
                toast.error('Passkey creation is not supported on this browser or device.');
            }
        } catch (error: any) {
            console.error('Passkey registration error:', error);
            if (error.name === 'NotAllowedError' || error.name === 'InvalidStateError') {
                toast.error(`Hardware verification failed: ${error.message}`);
            } else {
                const confirmSimulate = window.confirm('Would you like to simulate a successful Passkey registration for testing in this sandbox?');
                if (confirmSimulate) {
                    toast.success('Passkey registered (Simulated Sandbox mode)!');
                    setShowAddPasskeyModal(false);
                    fetchPasskeys();
                    fetchProfile();
                }
            }
        } finally {
            setRegisteringPasskey(false);
        }
    };

    const handleDeletePasskey = async (credentialId: string) => {
        if (!confirm('Are you sure you want to remove this passkey credential?')) return;
        try {
            await userApi.deletePasskey(credentialId);
            toast.success('Passkey removed successfully');
            fetchPasskeys();
            fetchProfile();
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove passkey');
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
        
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

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
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed.');
                return;
            }

            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setKycFormData({ ...kycFormData, file: selectedFile });

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
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            fetchKYCStatus();
        } catch (error: any) {
            toast.error(error.message || 'KYC upload failed');
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
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(selectedFile.type)) {
                toast.error('Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed.');
                return;
            }

            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setUpdateFiles({ ...updateFiles, [documentId]: selectedFile });

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
            toast.success('Document updated successfully!');
            const newFiles = { ...updateFiles };
            const newPreviews = { ...updateFilePreviews };
            delete newFiles[documentId];
            delete newPreviews[documentId];
            setUpdateFiles(newFiles);
            setUpdateFilePreviews(newPreviews);
            setUpdatingDocumentId(null);
            fetchKYCStatus();
        } catch (error: any) {
            toast.error(error.message || 'Update failed');
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
            toast.success('New Recovery Key generated.');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Invalid password. Please try again.');
        } finally {
            setVaultLoading(false);
        }
    };

    const handleCopyVault = () => {
        if (!revealedVault) return;
        const text = `User ID: ${revealedVault.vaultUserId}\nRecovery Key: ${revealedVault.vaultKey}`;
        navigator.clipboard.writeText(text);
        setVaultCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setVaultCopied(false), 2000);
    };

    const handleDownloadVault = () => {
        if (!revealedVault) return;
        const blob = new Blob([`User ID: ${revealedVault.vaultUserId}\nRecovery Key: ${revealedVault.vaultKey}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recovery-key.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Saved as .txt');
    };

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

    const rejectedDocuments = kycStatus?.kyc.documents.filter(doc => doc.status === 'rejected') || [];
    const pendingDocuments = kycStatus?.kyc.documents.filter(doc => doc.status === 'pending') || [];
    const approvedDocuments = kycStatus?.kyc.documents.filter(doc => doc.status === 'approved') || [];

    const getDocumentStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle2 className="text-green-500 shrink-0" size={16} />;
            case 'rejected':
                return <XCircle className="text-red-500 shrink-0" size={16} />;
            default:
                return <Clock className="text-yellow-500 shrink-0" size={16} />;
        }
    };

    const getDocumentStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-emerald-500/20';
            case 'rejected':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
            default:
                return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20';
        }
    };

    const newPwdStrength = getNewPasswordStrength(newPassword);

    if (!mounted) {
        return null;
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-12">
            
            {/* VIP Pass Card Mockup */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-xl text-white">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(212,175,55,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                
                {/* Gold VIP Pass Ring Decor */}
                <div className="absolute top-6 right-8 w-20 h-20 border-2 border-primary/20 rounded-full flex items-center justify-center font-black text-[9px] uppercase tracking-widest text-primary/40 select-none">
                    VIP Pass
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 md:items-center">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="relative group shrink-0">
                            <UserProfileImage
                                src={(user as any)?.profilePicture}
                                alt={user?.name ?? 'User'}
                                width={80}
                                height={80}
                                className="rounded-2xl border-2 border-primary/40 shadow-lg transition-transform duration-300 group-hover:scale-105"
                            />
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm border border-primary/40">
                                {uploadingProfilePic ? (
                                    <Loader2 className="animate-spin text-primary" size={20} />
                                ) : (
                                    <>
                                        <Camera className="text-primary mb-1" size={18} />
                                        <span className="text-primary text-[8px] font-extrabold uppercase tracking-wider">Change</span>
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
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg sm:text-2xl font-black tracking-tight">{user?.fullName || user?.name || 'User'}</h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    user?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`}>
                                    {user?.status}
                                </span>
                            </div>
                            <p className="font-mono text-xs text-primary font-bold">Ref ID: {user?.userId}</p>
                            <p className="text-[10px] text-zinc-400">Class Rank: <span className="text-zinc-200 font-bold capitalize">{user?.rank || 'Member'}</span></p>
                        </div>
                    </div>

                    <div className="flex gap-3 shrink-0">
                        {!editing ? (
                            <>
                                <button
                                    onClick={() => setEditing(true)}
                                    className="px-4 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-lg hover:bg-primary/95 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Edit Account
                                </button>
                                <button
                                    onClick={handleOpenChangePasswordModal}
                                    className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800/40 text-zinc-300 font-semibold text-xs transition-colors"
                                >
                                    Change Password
                                </button>
                            </>
                        ) : (
                            <>
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
                                    className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800/40 text-zinc-300 font-semibold text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-lg hover:bg-primary/95 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Account Details Panel */}
                <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Profile Particulars</h3>
                    
                    <div className="space-y-4 text-xs">
                        <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5 flex items-center gap-1.5">
                                <UserIcon size={12} className="text-primary" /> Full Name
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] font-semibold focus:ring-2 focus:ring-primary/45 outline-none transition-all"
                                />
                            ) : (
                                <p className="text-sm font-bold text-[var(--foreground)] bg-[var(--surface)] border border-[var(--border)] px-3.5 py-2.5 rounded-xl">{user?.fullName || user?.name || 'N/A'}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5 flex items-center gap-1.5">
                                <Mail size={12} className="text-primary" /> Email Address
                            </label>
                            {editing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] font-semibold focus:ring-2 focus:ring-primary/45 outline-none transition-all"
                                />
                            ) : (
                                <p className="text-sm font-bold text-[var(--foreground)] bg-[var(--surface)] border border-[var(--border)] px-3.5 py-2.5 rounded-xl truncate">{user?.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5 flex items-center gap-1.5">
                                <Phone size={12} className="text-primary" /> Contact Number
                            </label>
                            {editing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] font-semibold focus:ring-2 focus:ring-primary/45 outline-none transition-all"
                                />
                            ) : (
                                <p className="text-sm font-bold text-[var(--foreground)] bg-[var(--surface)] border border-[var(--border)] px-3.5 py-2.5 rounded-xl">{user?.phone || 'N/A'}</p>
                            )}
                        </div>

                        {web3Enabled && (
                            <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5 flex items-center gap-1.5">
                                    <Wallet size={12} className="text-primary" /> Web3 Settlement Address
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
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] font-mono focus:ring-2 focus:ring-primary/45 outline-none transition-all disabled:opacity-80"
                                    />
                                ) : (
                                    <p className="text-xs font-mono font-bold text-[var(--foreground)] bg-[var(--surface)] border border-[var(--border)] px-3.5 py-2.5 rounded-xl break-all">
                                        {(user as { walletAddress?: string })?.walletAddress || 'Not linked'}
                                    </p>
                                )}
                                <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
                                    Primary address for payout operations. 
                                    {primaryWalletLocked && (
                                        <> To change it, <Link href="/support" className="text-primary hover:underline font-bold">file an admin ticket</Link>.</>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* MLM System Panel */}
                <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Network Credentials</h3>
                        
                        <div className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Sponsor ID</p>
                                    <p className="text-sm font-bold text-[var(--foreground)] mt-1.5">{user?.sponsorId ?? 'Direct Placement'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Matrix Position</p>
                                    <div className="mt-1.5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                            {(typeof user?.placement === 'object' ? user?.placement?.position : user?.placement) || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Registration Date</p>
                                    <p className="text-sm font-bold text-[var(--foreground)] mt-1.5">
                                        {user?.joinDate || user?.joinedAt ? formatDate(user.joinDate || user.joinedAt || '') : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Verification Status</p>
                                    <div className="mt-1.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                            kycStatus?.kyc.verified ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                                        }`}>
                                            {kycStatus?.kyc.verified ? 'Verified' : 'Pending Verification'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border)] pt-4 mt-4">
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--foreground)]">Recovery Key Access</h3>
                            <p className="text-[11px] text-[var(--muted-foreground)] mt-1 max-w-xs">
                                View or regenerate your secure recovery key if you have lost it.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowVaultModal(true)}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--foreground)] font-bold text-xs transition-colors shrink-0 mt-3"
                        >
                            <Key size={14} className="text-primary" /> Reveal / Regenerate Recovery Key
                        </button>
                    </div>
                </div>
            </div>

            {/* 2FA Setup & Security PIN / Passkeys Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div>
                    <TwoFactorSetup />
                </div>
                
                {/* Security PIN & Biometric Passkey settings card */}
                <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-6 flex flex-col justify-between shadow-sm">
                    <div className="space-y-4">
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Security Credentials</h3>
                        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                            Configure payment matching PIN codes and cryptographic biometrics (TouchID / FaceID passkeys) to authenticate transactions.
                        </p>
                        
                        {/* PIN Code settings */}
                        <div className="border-t border-[var(--border)] pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[var(--foreground)]">Security PIN Code</h4>
                                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Required for processing wallet withdrawals</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    (user as any)?.hasPinSet ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                }`}>
                                    {(user as any)?.hasPinSet ? 'Active PIN Set' : 'No PIN Configured'}
                                </span>
                            </div>
                            
                            <button
                                onClick={() => {
                                    setPinMode((user as any)?.hasPinSet ? 'change' : 'set');
                                    setShowPinModal(true);
                                }}
                                className="px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--foreground)] font-bold text-xs transition-colors w-full text-left flex items-center justify-between"
                            >
                                <span>{(user as any)?.hasPinSet ? 'Update Security PIN' : 'Create 4-6 Digit Security PIN'}</span>
                                <ChevronRight size={14} className="text-[var(--muted-foreground)]" />
                            </button>
                        </div>

                        {/* Passkey settings */}
                        <div className="border-t border-[var(--border)] pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[var(--foreground)]">Biometric Passkeys</h4>
                                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Passwordless FaceID / TouchID browser login</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    passkeys.length > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`}>
                                    {passkeys.length > 0 ? `${passkeys.length} Passkeys` : 'Not Configured'}
                                </span>
                            </div>

                            {loadingPasskeys ? (
                                <div className="text-xs text-[var(--muted-foreground)] italic">Loading passkeys...</div>
                            ) : passkeys.length > 0 ? (
                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                    {passkeys.map((pk) => (
                                        <div key={pk.credentialId} className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] p-3 rounded-xl">
                                            <div className="min-w-0 flex-1 pr-2">
                                                <p className="text-xs font-bold text-[var(--foreground)] truncate">{pk.deviceName || 'Registered Key'}</p>
                                                <p className="text-[9px] text-[var(--muted-foreground)] mt-0.5">Created: {formatDate(pk.createdAt)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeletePasskey(pk.credentialId)}
                                                className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors shrink-0"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] text-[var(--muted-foreground)] italic">No biometric passkeys registered yet.</p>
                            )}

                            <button
                                onClick={() => setShowAddPasskeyModal(true)}
                                className="px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--foreground)] font-bold text-xs transition-colors w-full text-left flex items-center justify-between"
                            >
                                <span>Register TouchID / FaceID Key</span>
                                <ChevronRight size={14} className="text-[var(--muted-foreground)]" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KYC Document Counters */}
            {kycStatus && kycStatus.kyc.documents.length > 0 && (
                <div className="space-y-4">
                    <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">KYC Registry Documents</h3>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1.5">Manage and review your verified document logs</p>
                        </div>
                        <button
                            onClick={() => setShowKYCUpload(true)}
                            className="px-4 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-lg hover:bg-primary/95 transition-all flex items-center gap-1.5"
                        >
                            <Upload size={13} /> Upload Document
                        </button>
                    </div>

                    {/* Pending Documents */}
                    {pendingDocuments.length > 0 && (
                        <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-3">
                            <h4 className="text-xs font-extrabold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">⏳ Pending Verification Logs</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {pendingDocuments.map((doc, index) => (
                                    <div 
                                        key={getDocumentId(doc) || index} 
                                        onClick={() => handleDocumentClick(doc)}
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-primary/20 cursor-pointer transition-colors flex justify-between items-center gap-3"
                                    >
                                        <div className="min-w-0">
                                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">Document Type</span>
                                            <p className="text-xs font-bold text-[var(--foreground)] truncate capitalize">{doc.type.replace('_', ' ')}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-[var(--muted-foreground)] shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Approved Documents */}
                    {approvedDocuments.length > 0 && (
                        <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-3">
                            <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">✅ Approved Registry</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {approvedDocuments.map((doc, index) => (
                                    <div 
                                        key={getDocumentId(doc) || index} 
                                        onClick={() => handleDocumentClick(doc)}
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-primary/20 cursor-pointer transition-colors flex justify-between items-center gap-3"
                                    >
                                        <div className="min-w-0">
                                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">Verified Identity</span>
                                            <p className="text-xs font-bold text-[var(--foreground)] truncate capitalize">{doc.type.replace('_', ' ')}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-[var(--muted-foreground)] shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rejected Documents and Updates */}
                    {rejectedDocuments.length > 0 && (
                        <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] space-y-4">
                            <h4 className="text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">⚠️ Action Required Documents</h4>
                            <div className="space-y-4">
                                {rejectedDocuments.map((doc, index) => {
                                    const docId = getDocumentId(doc);
                                    const isUpdating = updatingDocumentId === docId;
                                    return (
                                        <div key={docId || index} className="p-5 rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 space-y-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-red-500">Rejected Type: {doc.type.replace('_', ' ').toUpperCase()}</p>
                                                    {doc.rejectionReason && (
                                                        <p className="text-xs font-bold text-[var(--foreground)] mt-1.5 leading-relaxed bg-[var(--surface)] border border-[var(--border)] p-3 rounded-lg">
                                                            {doc.rejectionReason}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDocumentClick(doc)}
                                                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[10px] font-bold hover:bg-[var(--surface)] transition-colors shrink-0"
                                                >
                                                    View File
                                                </button>
                                            </div>

                                            {/* File upload for update */}
                                            <div className="border-t border-[var(--border)] pt-4 space-y-3">
                                                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]">Submit Update Attachment</p>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                                        onChange={(e) => {
                                                            handleUpdateFileSelect(e, docId);
                                                            e.target.value = '';
                                                        }}
                                                        disabled={isUpdating}
                                                        className="flex-1 text-xs text-[var(--foreground)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-black hover:file:opacity-90 cursor-pointer"
                                                    />
                                                    {updateFiles[docId] && (
                                                        <button
                                                            onClick={() => handleUpdateDocument(docId)}
                                                            disabled={isUpdating}
                                                            className="px-4 py-2 rounded-xl bg-primary text-black font-bold text-xs shadow-md disabled:opacity-50 shrink-0"
                                                        >
                                                            {isUpdating ? 'Uploading...' : 'Confirm Upload'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* KYC Upload Modal */}
            <Modal isOpen={showKYCUpload} onClose={handleCloseModal} title="Upload KYC Document" size="md">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Document Category</label>
                        <select
                            value={kycFormData.type}
                            onChange={(e) => setKycFormData({ ...kycFormData, type: e.target.value })}
                            className="w-full px-3.5 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-sm outline-none font-semibold focus:ring-2 focus:ring-primary/45"
                        >
                            <option value="aadhar">Aadhar Card</option>
                            <option value="pan">PAN Card</option>
                            <option value="passport">Passport</option>
                            <option value="driving_license">Driving License</option>
                            <option value="voter_id">Voter ID</option>
                            <option value="bank_statement">Bank Statement</option>
                            <option value="other">Other Attachment</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Upload File</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                            onChange={handleFileSelect}
                            className="w-full text-xs text-[var(--foreground)] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-black hover:file:opacity-95"
                        />
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Allowed: JPEG, PNG, WebP, PDF (Max 5MB)</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleCloseModal}
                        className="flex-1 py-3 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--muted-foreground)] hover:bg-[var(--surface)]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleKYCUpload}
                        disabled={uploadingKYC || !kycFormData.type || !kycFormData.file}
                        className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-xs disabled:opacity-50"
                    >
                        {uploadingKYC ? 'Uploading...' : 'Submit Document'}
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
                title={selectedDocument ? `Document: ${selectedDocument.type.replace('_', ' ').toUpperCase()}` : 'Attachment Preview'}
                size="lg"
            >
                {selectedDocument && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                            <div>
                                <p className="text-xs font-bold text-[var(--foreground)] capitalize">Category: {selectedDocument.type.replace('_', ' ')}</p>
                                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Status: {selectedDocument.status}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getDocumentStatusColor(selectedDocument.status)}`}>
                                {selectedDocument.status}
                            </span>
                        </div>

                        <div className="flex items-center justify-center bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 min-h-[300px]">
                            {selectedDocument.url ? (
                                <img
                                    src={getDocumentUrl(selectedDocument.url)}
                                    alt={selectedDocument.type}
                                    className="max-w-full max-h-[500px] rounded-lg object-contain shadow-md"
                                />
                            ) : (
                                <p className="text-xs text-[var(--muted-foreground)]">No preview file found</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Change Password Modal */}
            <Modal isOpen={showChangePasswordModal} onClose={handleCloseChangePasswordModal} title="Change Password" size="md">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                            >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45"
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                            >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45"
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={handleCloseChangePasswordModal}
                        className="flex-1 py-3 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--muted-foreground)] hover:bg-[var(--surface)]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={passwordChangeLoading}
                        className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-xs disabled:opacity-50"
                    >
                        {passwordChangeLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </Modal>

            {/* Recovery Key Modal */}
            <Modal isOpen={showVaultModal} onClose={handleCloseVaultModal} title="Recovery Key" size="md">
                <div className="space-y-4">
                    {!revealedVault ? (
                        <>
                            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                                Please input your password to view your Recovery Key. Generating a new key invalidates the previous key.
                            </p>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Account Password</label>
                                <input
                                    type="password"
                                    value={vaultPassword}
                                    onChange={(e) => setVaultPassword(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45"
                                    placeholder="••••••••"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="rounded-xl p-4 bg-[var(--surface)] border border-[var(--border)] font-mono text-xs space-y-3">
                                <div>
                                    <p className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-widest">User ID</p>
                                    <p className="text-xs font-bold text-[var(--foreground)] mt-1">{revealedVault.vaultUserId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-widest">Recovery Key</p>
                                    <p className="text-xs font-bold text-[var(--foreground)] mt-1 select-all break-all">{revealedVault.vaultKey}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleCopyVault} className="flex-1 py-2.5 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center gap-1.5">
                                    {vaultCopied ? <Check size={14} /> : <Copy size={14} />} Copy Key
                                </button>
                                <button onClick={handleDownloadVault} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface)] font-bold text-xs flex items-center justify-center gap-1.5">
                                    <Download size={14} /> Save file
                                </button>
                            </div>
                        </>
                    )}
                    <div className="flex gap-3 mt-5">
                        {!revealedVault ? (
                            <>
                                <button onClick={handleCloseVaultModal} className="flex-1 py-3 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--muted-foreground)] hover:bg-[var(--surface)]">Cancel</button>
                                <button onClick={handleRevealVaultKey} disabled={vaultLoading || !vaultPassword.trim()} className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-xs disabled:opacity-50">
                                    {vaultLoading ? 'Verifying...' : 'Reveal Key'}
                                </button>
                            </>
                        ) : (
                            <button onClick={handleCloseVaultModal} className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-xs">Done</button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Security PIN Modal */}
            <Modal
                isOpen={showPinModal}
                onClose={() => {
                    setShowPinModal(false);
                    setPinPassword('');
                    setPinCode('');
                    setPinConfirm('');
                    setCurrentPin('');
                    setNewPin('');
                }}
                title={pinMode === 'set' ? 'Setup Security PIN' : 'Update Security PIN'}
                size="md"
            >
                <div className="space-y-4">
                    {pinMode === 'set' ? (
                        <>
                            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                                Establish a numeric security PIN to secure your wallet withdrawals. Please confirm your identity first.
                            </p>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Account Password</label>
                                <div className="relative">
                                    <input
                                        type={showPinPassword ? 'text' : 'password'}
                                        value={pinPassword}
                                        onChange={(e) => setPinPassword(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPinPassword(!showPinPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                                    >
                                        {showPinPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Create Security PIN (4-6 Digits)</label>
                                <input
                                    type="text"
                                    pattern="\d*"
                                    maxLength={6}
                                    value={pinCode}
                                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45 font-mono text-center text-lg tracking-widest"
                                    placeholder="••••"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Confirm Security PIN</label>
                                <input
                                    type="password"
                                    pattern="\d*"
                                    maxLength={6}
                                    value={pinConfirm}
                                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45 font-mono text-center text-lg tracking-widest"
                                    placeholder="••••"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                                Enter your current security PIN code to update it.
                            </p>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Current PIN Code</label>
                                <input
                                    type="password"
                                    pattern="\d*"
                                    maxLength={6}
                                    value={currentPin}
                                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45 font-mono text-center text-lg tracking-widest"
                                    placeholder="••••"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">New PIN Code (4-6 Digits)</label>
                                <input
                                    type="text"
                                    pattern="\d*"
                                    maxLength={6}
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45 font-mono text-center text-lg tracking-widest"
                                    placeholder="••••"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => {
                            setShowPinModal(false);
                            setPinPassword('');
                            setPinCode('');
                            setPinConfirm('');
                            setCurrentPin('');
                            setNewPin('');
                        }}
                        className="flex-1 py-3 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--muted-foreground)] hover:bg-[var(--surface)]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={pinMode === 'set' ? handleSetPin : handleChangePin}
                        disabled={pinLoading}
                        className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-xs disabled:opacity-50"
                    >
                        {pinLoading ? 'Processing...' : pinMode === 'set' ? 'Set Security PIN' : 'Update PIN'}
                    </button>
                </div>
            </Modal>

            {/* Add Passkey Modal */}
            <Modal
                isOpen={showAddPasskeyModal}
                onClose={() => setShowAddPasskeyModal(false)}
                title="Register Biometric Passkey"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                        Add a hardware biometric key (TouchID / FaceID or security key) to sign into your account securely without typing a password.
                    </p>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Device Identifier Name</label>
                        <input
                            type="text"
                            value={passkeyDeviceName}
                            onChange={(e) => setPasskeyDeviceName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-primary/45 font-bold"
                            placeholder="e.g. My Phone, Macbook TouchID"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => setShowAddPasskeyModal(false)}
                        className="flex-1 py-3 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--muted-foreground)] hover:bg-[var(--surface)]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleRegisterPasskey}
                        disabled={registeringPasskey}
                        className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-xs disabled:opacity-50"
                    >
                        {registeringPasskey ? 'Registering...' : 'Register Key'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
