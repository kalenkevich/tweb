// Temporary class helper to support icons that not included into font.
export default function ImgIcon(iconName: string, ...classes: string[]) {
  const span = document.createElement('span');
  const img = document.createElement('img');
  const defualtOpacity = '0.7';

  img.src = `assets/svg_icons/${iconName}.svg`;
  img.classList.add(...classes);
  img.style.width = '24px';
  img.style.height = '24px';

  span.style.opacity = defualtOpacity;
  span.appendChild(img);
  span.addEventListener('mouseenter', () => {
    span.style.opacity = '1';
  });
  span.addEventListener('mouseleave', () => {
    span.style.opacity = defualtOpacity;
  });

  return span;
}
