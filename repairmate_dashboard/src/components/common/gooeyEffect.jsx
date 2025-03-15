export function addGooeyEffect() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "gooey-filter");
    svg.innerHTML = `
      <defs>
        <filter id="gooey-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -7" result="gooey" />
          <feComposite in="SourceGraphic" in2="gooey" operator="atop"/>
        </filter>
      </defs>
    `;
    document.body.appendChild(svg);
  }