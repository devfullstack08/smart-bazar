export function cn(...inputs: string[]) {
    return inputs.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currencyCode?: string): string {
    const cur = currencyCode || 
              (typeof window !== 'undefined' ? (window as any).__projectCurrency : null) || 
              (typeof window !== 'undefined' ? localStorage.getItem('project_currency') : null) || 
              'USD';
    
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: cur.toUpperCase(),
        }).format(amount);
    } catch (e) {
        return `${cur.toUpperCase()} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
