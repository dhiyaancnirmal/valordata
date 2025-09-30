// Web Worker for texture decoding
// Offloads image decoding from main thread

self.onmessage = async function (e) {
    const { type, data } = e.data;

    if (type === 'decode') {
        try {
            const { url, id } = data;

            // Fetch the image
            const response = await fetch(url);
            const blob = await response.blob();

            // Decode using createImageBitmap (GPU-accelerated)
            const imageBitmap = await createImageBitmap(blob);

            // Transfer bitmap back to main thread (zero-copy)
            self.postMessage({
                type: 'decoded',
                id: id,
                bitmap: imageBitmap
            }, [imageBitmap]);

        } catch (error) {
            self.postMessage({
                type: 'error',
                id: data.id,
                error: error.message
            });
        }
    }
};


