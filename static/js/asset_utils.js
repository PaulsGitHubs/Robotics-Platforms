export async function validateGlbHeader(uri) {
  // Return true if GLB header looks valid and content-length matches header (when available)
  try {
    // Try HEAD first to get content-length
    let contentLen = null;
    try {
      const head = await fetch(uri, { method: 'HEAD' });
      if (head && head.ok) {
        const cl = head.headers.get('content-length');
        if (cl) contentLen = parseInt(cl, 10);
      }
    } catch (e) {
      // HEAD may be blocked; continue with range fetch
    }

    // Fetch first 12 bytes (GLB header)
    const r = await fetch(uri, { method: 'GET', headers: { Range: 'bytes=0-11' } });
    if (!r.ok && r.status !== 200 && r.status !== 206) return false;
    const buf = await r.arrayBuffer();
    if (buf.byteLength < 12) return false;

    const dv = new DataView(buf);
    const magic = dv.getUint32(0, true); // little endian
    // 'glTF' magic is 0x46546C67 (in LE)
    if (magic !== 0x46546c67) return false;

    const version = dv.getUint32(4, true);
    const length = dv.getUint32(8, true);

    // If HEAD provided content-length, compare
    if (contentLen !== null && contentLen !== length) return false;

    // Basic sanity checks: version positive and length reasonable
    if (version <= 0 || length < 12) return false;

    return true;
  } catch (e) {
    return false;
  }
}
