export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.substring(2).toLowerCase(), value);
      } else if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        for (const [dKey, dVal] of Object.entries(value)) {
          el.dataset[dKey] = dVal;
        }
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key === 'innerHTML') {
        el.innerHTML = value; // Only use when strictly necessary and safe!
      } else {
        if (value !== null && value !== undefined) {
          el.setAttribute(key, value);
        }
      }
    }
  }
  
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else if (Array.isArray(child)) {
      child.forEach(c => {
        if (c instanceof Node) el.appendChild(c);
        else if (typeof c === 'string' || typeof c === 'number') el.appendChild(document.createTextNode(c));
      });
    }
  }
  
  return el;
}
