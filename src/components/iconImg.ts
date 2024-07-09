// Temporary class helper to support icons that not included into font.
export default function ImgIcon(iconName: string, ...classes: string[]) {
  const span = document.createElement('span');
  span.classList.add('img-icon');
  const img = document.createElement('img');

  img.src = `assets/svg_icons/${iconName}.svg`;
  img.classList.add(...classes);
  span.appendChild(img);

  return span;
}
