export function svgToDataUri(svgMarkup) {
  return `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`;
}
