
/**
 * Extracts a user-friendly error message from an error object.
 * Handles Axios errors, Error objects, and strings.
 * 
 * @param error - The error object to process
 * @param defaultMessage - Fallback message if no specific error can be found
 * @returns A string containing the error message
 */
export function getErrorMessage(error: any, defaultMessage: string = 'An unexpected error occurred'): string {
    if (!error) return defaultMessage;

    // Handle Axios Error (response from backend)
    if (error.response?.data) {
        const data = error.response.data;

        // check for "error" field (as seen in user's example)
        if (typeof data.error === 'string') return data.error;

        // check for "message" field
        if (typeof data.message === 'string') return data.message;

        // check if data itself is a string message
        if (typeof data === 'string') return data;
    }

    // Handle standard Error object
    if (error instanceof Error) {
        return error.message;
    }

    // Handle string error
    if (typeof error === 'string') {
        return error;
    }

    // Handle object with message property (generic catch-all)
    if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }

    return defaultMessage;
}
