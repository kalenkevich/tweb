const a = document.createElement('a');
document.body.appendChild(a);
a.style.display = 'none';

export function saveBlobAsFile(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}
