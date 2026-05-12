import fs from 'fs/promises';
import path from 'path';

async function main() {
  const jsonPath = 'C:/Users/Shahab Alam/.gemini/antigravity/brain/3e1d8135-b24e-4868-bd20-ed10cb5618ba/.system_generated/steps/21/output.txt';
  const content = await fs.readFile(jsonPath, 'utf8');
  
  // Clean up if there are any lines before JSON (e.g. from the mcp response)
  const jsonStr = content.substring(content.indexOf('{'));
  const data = JSON.parse(jsonStr);

  await fs.mkdir('./src/pages', { recursive: true });

  const routes = [];

  for (const screen of data.screens) {
    const title = screen.title.replace(' - Samaroh AI', '').trim();
    const componentName = title.replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `${componentName}.jsx`;
    const downloadUrl = screen.htmlCode.downloadUrl;
    
    console.log(`Downloading ${title}...`);
    const response = await fetch(downloadUrl);
    const html = await response.text();
    
    // Extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyContent = bodyMatch ? bodyMatch[1] : html;
    
    // Convert HTML to JSX
    bodyContent = bodyContent
      .replace(/class=/g, 'className=')
      .replace(/for=/g, 'htmlFor=')
      .replace(/tabindex=/g, 'tabIndex=')
      .replace(/<!--[\s\S]*?-->/g, '') // remove comments
      .replace(/<img([^>]*?)\/?>/g, '<img$1 />') // self close img
      .replace(/<input([^>]*?)\/?>/g, '<input$1 />') // self close input
      .replace(/<br\s*\/?>/g, '<br />') // self close br
      .replace(/<hr([^>]*?)\/?>/g, '<hr$1 />'); // self close hr

    const jsxCode = `import React from 'react';

export default function ${componentName}() {
  return (
    <>
      ${bodyContent}
    </>
  );
}
`;

    await fs.writeFile(path.join('./src/pages', fileName), jsxCode);
    console.log(`Created src/pages/${fileName}`);
    
    routes.push({
        path: `/${componentName.toLowerCase()}`,
        componentName
    });
  }
  
  // Generate App.jsx
  const appJsx = `import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
${routes.map(r => `import ${r.componentName} from './pages/${r.componentName}';`).join('\n')}

export default function App() {
  return (
    <BrowserRouter>
      <nav className="fixed bottom-0 left-0 p-4 bg-surface-container/80 backdrop-blur z-[9999] text-xs flex gap-2 flex-wrap">
        ${routes.map(r => `<Link to="${r.path}" className="text-primary hover:underline">${r.componentName}</Link>`).join('\n        ')}
      </nav>
      <Routes>
        ${routes.map(r => `<Route path="${r.path}" element={<${r.componentName} />} />`).join('\n        ')}
        <Route path="/" element={<${routes.find(r => r.componentName === 'Homepage')?.componentName || routes[0].componentName} />} />
      </Routes>
    </BrowserRouter>
  );
}
`;
  await fs.writeFile('./src/App.jsx', appJsx);
  console.log('Created src/App.jsx');
}

main().catch(console.error);
