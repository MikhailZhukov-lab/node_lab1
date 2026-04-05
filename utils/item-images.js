export function buildImageUrl(request, imagePath) {
  if (!imagePath) {
    return null;
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const requestHost = request.host || request.headers.host;

  return new URL(normalizedPath, `${request.protocol}://${requestHost}`).toString();
}

export function buildItemWithImageUrl(request, item) {
  if (!item) {
    return item;
  }

  return {
    ...item,
    image: buildImageUrl(request, item.image),
  };
}

export function buildItemsWithImageUrl(request, items) {
  return items.map((item) => buildItemWithImageUrl(request, item));
}
