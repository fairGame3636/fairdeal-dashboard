/**
 * Formats an ISO date string into a more readable "DD-MMM-YYYY, hh:mm A" format.
 * e.g., "2025-10-02T15:09:53.319Z" becomes "02-Oct-2025, 08:39 PM"
 */
export const formatDate = (isoString: string): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        // Replace spaces and commas for a cleaner look e.g. 02-Oct-2025, 08:39 PM
        return new Intl.DateTimeFormat('en-GB', options).format(date).replace(/ /g, ' ').replace(',', ', ');
    } catch (error) {
        console.error("Invalid date for formatting:", isoString);
        return 'Invalid Date';
    }
};

/**
 * Formats a long transaction ID (like a MongoDB ObjectId) into a shorter, more readable version.
 * e.g., "68dfe741cd33445426915ef1" becomes "TXN-6915EF1"
 */
export const formatTransId = (id: string): string => {
    if (!id || id.length < 7) return 'N/A';
    return `TXN-${id.slice(-7).toUpperCase()}`;
};

