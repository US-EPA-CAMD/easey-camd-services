export const combineEmailAddresses = (primaryEmail: string, additionalEmails: string): string[] => {
    const emails: string[] = [];

    // Add primary email if valid
    if (primaryEmail && primaryEmail.trim() !== '') {
        emails.push(primaryEmail.trim());
    }

    if (additionalEmails && additionalEmails.trim() !== '') {
        // Split on comma or semicolon
        const splitEmails = additionalEmails
            .split(/[,;]+/)
            .map(e => e.trim())
            .filter(e => e !== '');

        emails.push(...splitEmails);
    }

    // Remove duplicates (case-insensitive)
    const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))];

    return uniqueEmails;
}