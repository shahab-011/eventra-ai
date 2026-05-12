import fs from 'fs/promises';
import path from 'path';

function addOnClick(match, attrs, inner, url) {
  if (attrs.includes('onClick')) return match;
  // if it already has cursor-pointer, no need to add style
  const style = attrs.includes('cursor-pointer') ? '' : ' style={{cursor: "pointer"}}';
  return `<div${attrs} onClick={() => window.location.href="${url}"}${style}>${inner}</div>`;
}

function addSpanClick(match, attrs, inner, url) {
    if (attrs.includes('onClick')) return match;
    const style = attrs.includes('cursor-pointer') ? '' : ' style={{cursor: "pointer"}}';
    return `<span${attrs} onClick={() => window.location.href="${url}"}${style}>${inner}</span>`;
}

function addButtonClick(match, attrs, inner, url) {
    if (attrs.includes('onClick')) return match;
    return `<button${attrs} onClick={() => window.location.href="${url}"}>${inner}</button>`;
}

async function main() {
  const dir = './src/pages';
  const files = await fs.readdir(dir);

  for (const file of files) {
    if (!file.endsWith('.jsx')) continue;
    
    let content = await fs.readFile(path.join(dir, file), 'utf8');

    // 1. Top nav links
    content = content.replace(/href="#"([^>]*)>Features<\/a>/g, 'href="/featuresoverview"$1>Features</a>');
    content = content.replace(/href="#"([^>]*)>Pricing<\/a>/g, 'href="/pricing"$1>Pricing</a>');
    content = content.replace(/href="#"([^>]*)>About<\/a>/g, 'href="/aboutus"$1>About</a>');
    content = content.replace(/href="#"([^>]*)>Login<\/a>/g, 'href="/login"$1>Login</a>');

    // 2. Buttons
    content = content.replace(/<button([^>]*)>Get Started<\/button>/g, (m, a) => addButtonClick(m, a, 'Get Started', '/businesssignup'));
    content = content.replace(/<button([^>]*)>Book a Demo<\/button>/g, (m, a) => addButtonClick(m, a, 'Book a Demo', '/contactbookdemo'));
    content = content.replace(/<button([^>]*)>Create Event<\/button>/g, (m, a) => addButtonClick(m, a, 'Create Event', '/createevent'));
    content = content.replace(/<button([^>]*)>Login<\/button>/g, (m, a) => addButtonClick(m, a, 'Login', '/login'));
    
    // 3. Sidebar divs
    content = content.replace(/<div([^>]*)>(\s*<span[^>]*>dashboard<\/span>\s*<span[^>]*>Dashboard<\/span>\s*)<\/div>/gi, (m, a, i) => addOnClick(m, a, i, '/dashboard'));
    content = content.replace(/<div([^>]*)>(\s*<span[^>]*>event<\/span>\s*<span[^>]*>Events<\/span>\s*)<\/div>/gi, (m, a, i) => addOnClick(m, a, i, '/eventhub'));
    content = content.replace(/<div([^>]*)>(\s*<span[^>]*>smart_toy<\/span>\s*<span[^>]*>AI Tools<\/span>\s*)<\/div>/gi, (m, a, i) => addOnClick(m, a, i, '/aiphotoediting'));
    content = content.replace(/<div([^>]*)>(\s*<span[^>]*>group<\/span>\s*<span[^>]*>Guest Lists<\/span>\s*)<\/div>/gi, (m, a, i) => addOnClick(m, a, i, '/guestmanagement'));
    content = content.replace(/<div([^>]*)>(\s*<span[^>]*>settings<\/span>\s*<span[^>]*>Settings<\/span>\s*)<\/div>/gi, (m, a, i) => addOnClick(m, a, i, '/whatsappbotconfig'));

    // 4. Logos
    content = content.replace(/<div className="font-display text-h3 font-extrabold text-primary">Samaroh<\/div>/g, '<div className="font-display text-h3 font-extrabold text-primary cursor-pointer" onClick={() => window.location.href="/homepage"}>Samaroh</div>');
    content = content.replace(/<div className="font-display text-label-md font-bold text-primary">Samaroh AI<\/div>/g, '<div className="font-display text-label-md font-bold text-primary cursor-pointer" onClick={() => window.location.href="/dashboard"}>Samaroh AI</div>');

    // 5. Mobile footer
    content = content.replace(/<span([^>]*)>smart_toy<\/span>/g, (m, a) => addSpanClick(m, a, 'smart_toy', '/aiphotoediting'));
    content = content.replace(/<span([^>]*)>event<\/span>/g, (m, a) => addSpanClick(m, a, 'event', '/eventhub'));
    content = content.replace(/<span([^>]*)>group<\/span>/g, (m, a) => addSpanClick(m, a, 'group', '/guestmanagement'));
    content = content.replace(/<span([^>]*)>settings<\/span>/g, (m, a) => addSpanClick(m, a, 'settings', '/whatsappbotconfig'));

    // Other links
    content = content.replace(/<span className="material-symbols-outlined text-primary cursor-pointer hover:scale-110 transition-transform">content_copy<\/span>/g, '<span className="material-symbols-outlined text-primary cursor-pointer hover:scale-110 transition-transform" onClick={() => alert("Copied to clipboard!")}>content_copy</span>');

    await fs.writeFile(path.join(dir, file), content);
  }
  console.log('Added links to all pages.');
}

main().catch(console.error);
