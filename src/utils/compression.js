export function toBase64Url(u8) {
    let s = '';
    for (const element of u8) s += String.fromCodePoint(element);
    return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

export function fromBase64Url(b64url) {
    let b64 = b64url.replaceAll('-', '+').replaceAll('_', '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.codePointAt(i);
    return u8;
}

export async function gzipBase64UrlBC(obj) {
    const str = JSON.stringify(obj);
    const stream = new Blob([str]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    const response = new Response(compressedStream);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return toBase64Url(uint8Array);
}

export async function ungzipBase64UrlBC(token) {
    const u8 = fromBase64Url(token);
    const stream = new Blob([u8]).stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    const response = new Response(decompressedStream);
    return await response.text();
}
