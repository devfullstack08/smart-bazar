export interface ICountryCode {
    code: string;
    flag: string;
    name: string;
    dialCode: string;
}

export const COUNTRY_CODES: ICountryCode[] = [
    { code: 'US', flag: '🇺🇸', name: 'United States', dialCode: '+1' },
    { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', dialCode: '+44' },
    { code: 'IN', flag: '🇮🇳', name: 'India', dialCode: '+91' },
    { code: 'CN', flag: '🇨🇳', name: 'China', dialCode: '+86' },
    { code: 'JP', flag: '🇯🇵', name: 'Japan', dialCode: '+81' },
    { code: 'DE', flag: '🇩🇪', name: 'Germany', dialCode: '+49' },
    { code: 'FR', flag: '🇫🇷', name: 'France', dialCode: '+33' },
    { code: 'AU', flag: '🇦🇺', name: 'Australia', dialCode: '+61' },
    { code: 'AE', flag: '🇦🇪', name: 'UAE', dialCode: '+971' },
    { code: 'SG', flag: '🇸🇬', name: 'Singapore', dialCode: '+65' },
    { code: 'CA', flag: '🇨🇦', name: 'Canada', dialCode: '+1' },
    { code: 'BR', flag: '🇧🇷', name: 'Brazil', dialCode: '+55' },
    { code: 'MX', flag: '🇲🇽', name: 'Mexico', dialCode: '+52' },
    { code: 'IT', flag: '🇮🇹', name: 'Italy', dialCode: '+39' },
    { code: 'ES', flag: '🇪🇸', name: 'Spain', dialCode: '+34' },
    { code: 'NL', flag: '🇳🇱', name: 'Netherlands', dialCode: '+31' },
    { code: 'SE', flag: '🇸🇪', name: 'Sweden', dialCode: '+46' },
    { code: 'CH', flag: '🇨🇭', name: 'Switzerland', dialCode: '+41' },
    { code: 'PL', flag: '🇵🇱', name: 'Poland', dialCode: '+48' },
    { code: 'BE', flag: '🇧🇪', name: 'Belgium', dialCode: '+32' },
];

export const DEFAULT_COUNTRY_CODE = '+91';
