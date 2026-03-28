// Known brands
const brands = [
  'google',
  'facebook',
  'instagram',
  'paypal',
  'amazon',
  'microsoft',
  'netflix',
  'bank',
  'gmail',
];

// Extract domain
export const getDomain = (url) => {
  try {
    return url.replace('https://', '').replace('http://', '').split('/')[0];
  } catch {
    return '';
  }
};

// Detect brand mismatch
export const detectVisualPhishing = (url, pageText) => {

  const domain = getDomain(url);
  const text = pageText.toLowerCase();

  let detectedBrand = null;

  brands.forEach(b => {
    if (text.includes(b)) detectedBrand = b;
  });

  if (!detectedBrand) return null;

  // Brand found but not in domain → suspicious
  if (!domain.includes(detectedBrand)) {
    return {
      brand: detectedBrand,
      domain,
    };
  }

  return null;
};