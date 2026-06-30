// Parallax image loader — fetches SAS URLs from the images-broker Azure Function
(function () {
  const BROKER_URL = 'https://images-broker-a0gbdfc0g3fqa8d2.israelcentral-01.azurewebsites.net/api/storage/blob-sas';
  const CONTAINER = 'parallax';

  const parallaxImages = [
    { elementId: 'parallax1', blobName: 'linus-nylund-Q5QspluNZmM-unsplash.jpg' },
    { elementId: 'parallax2', blobName: 'john-salzarulo-wtjrpjZABcQ-unsplash.jpg' },
    { elementId: 'parallax3', blobName: 'andrew-neel-1-29wyvvLJA-unsplash.jpg' },
  ];

  async function loadParallaxImage(elementId, blobName) {
    try {
      const response = await fetch(`${BROKER_URL}?name=${encodeURIComponent(blobName)}&container=${CONTAINER}`);
      if (!response.ok) throw new Error(`Broker returned ${response.status}`);
      const data = await response.json();
      const el = document.getElementById(elementId);
      if (el) {
        el.style.backgroundImage = `url('${data.downloadUrl}')`;
      }
    } catch (err) {
      console.warn(`Failed to load parallax image for ${elementId}:`, err);
    }
  }

  parallaxImages.forEach(({ elementId, blobName }) => {
    loadParallaxImage(elementId, blobName);
  });
})();
