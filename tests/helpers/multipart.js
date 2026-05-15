function buildMultipartBody(parts) {
  const boundary = `----codex-boundary-${Date.now()}`;
  const chunks = [];

  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));

    if (part.filename) {
      chunks.push(
        Buffer.from(
          `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\n`
        )
      );
      chunks.push(
        Buffer.from(
          `Content-Type: ${part.contentType || 'application/octet-stream'}\r\n\r\n`
        )
      );
      chunks.push(
        Buffer.isBuffer(part.value) ? part.value : Buffer.from(part.value)
      );
      chunks.push(Buffer.from('\r\n'));
      continue;
    }

    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${part.name}"\r\n\r\n${part.value}\r\n`
      )
    );
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    body: Buffer.concat(chunks),
    boundary,
  };
}

export { buildMultipartBody };
