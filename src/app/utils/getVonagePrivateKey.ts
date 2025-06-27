export function getVonagePrivateKey(): string {
    const base64 = process.env.VONAGE_PRIVATE_KEY;
    if (!base64) throw new Error('VONAGE_PRIVATE_KEY is not set');
    return Buffer.from(base64, 'base64').toString('utf-8');
}