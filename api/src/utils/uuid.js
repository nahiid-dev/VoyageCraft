
// The crypto.randomUUID method is available in the Cloudflare Worker environment
export function generateUUID() {
    return crypto.randomUUID();
}
