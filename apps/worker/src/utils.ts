export async function hashToken(token: string): Promise<string> {
    const tokenBuffer = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
