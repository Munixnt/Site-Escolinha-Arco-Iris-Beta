export async function loadImageAsPng(url, { removeBlackBackground = false } = {}) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Não foi possível carregar a imagem (${response.status}).`);
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: removeBlackBackground });
    if (!context) throw new Error('Não foi possível processar a imagem.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (removeBlackBackground) {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;
      const visited = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let head = 0;
      let tail = 0;

      const addBackgroundPixel = (x, y) => {
        const index = y * width + x;
        const pixel = index * 4;
        if (
          !visited[index]
          && data[pixel] < 70
          && data[pixel + 1] < 70
          && data[pixel + 2] < 70
        ) {
          visited[index] = 1;
          queue[tail++] = index;
        }
      };

      for (let x = 0; x < width; x += 1) {
        addBackgroundPixel(x, 0);
        addBackgroundPixel(x, height - 1);
      }
      for (let y = 0; y < height; y += 1) {
        addBackgroundPixel(0, y);
        addBackgroundPixel(width - 1, y);
      }

      while (head < tail) {
        const index = queue[head++];
        const x = index % width;
        const y = Math.floor(index / width);
        data[index * 4 + 3] = 0;
        if (x > 0) addBackgroundPixel(x - 1, y);
        if (x < width - 1) addBackgroundPixel(x + 1, y);
        if (y > 0) addBackgroundPixel(x, y - 1);
        if (y < height - 1) addBackgroundPixel(x, y + 1);
      }

      context.putImageData(imageData, 0, 0);
    }

    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
