export async function validateGlbHeader(uri) {
  try {
    let contentLen = null;
    try {
      const head = await fetch(uri, { method: 'HEAD' });
      if (head && head.ok) {
        const cl = head.headers.get('content-length');
        if (cl) contentLen = parseInt(cl, 10);
      }
    } catch (e) {}

    const r = await fetch(uri, { method: 'GET', headers: { Range: 'bytes=0-11' } });
    if (!r.ok && r.status !== 200 && r.status !== 206) return false;
    const buf = await r.arrayBuffer();
    if (buf.byteLength < 12) return false;

    const dv = new DataView(buf);
    const magic = dv.getUint32(0, true);
    if (magic !== 0x46546c67) return false;

    const version = dv.getUint32(4, true);
    const length = dv.getUint32(8, true);

    if (contentLen !== null && contentLen !== length) return false;
    if (version <= 0 || length < 12) return false;
    return true;
  } catch (e) {
    return false;
  }
}
