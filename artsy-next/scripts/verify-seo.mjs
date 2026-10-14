async function check() {
  const pages = ['/creators/f0000000-0000-0000-0000-000000000001', '/services/wedding'];
  for (const p of pages) {
    const res = await fetch('https://artsyproduction.com' + p);
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]*)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'NONE';
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/);
    const desc = descMatch ? descMatch[1] : 'NONE';
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/);
    const canonical = canonicalMatch ? canonicalMatch[1] : 'NONE';
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/);
    const robots = robotsMatch ? robotsMatch[1] : 'NONE';
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const cleanH1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : 'NONE';
    const ldJsonMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g) || [];
    
    console.log('=== PAGE: ' + p + ' ===');
    console.log('Title (' + title.length + ' chars): ' + title);
    console.log('Description (' + desc.length + ' chars): ' + desc);
    console.log('Canonical: ' + canonical);
    console.log('Robots: ' + robots);
    console.log('H1: ' + cleanH1);
    console.log('JSON-LD count: ' + ldJsonMatches.length);
    if (ldJsonMatches.length > 0) {
      ldJsonMatches.forEach((s, idx) => {
        const jsonText = s.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        try {
          const parsed = JSON.parse(jsonText);
          const type = parsed['@type'] || (Array.isArray(parsed['@graph']) ? parsed['@graph'].map(g => g['@type']).join(', ') : 'unknown');
          console.log(`  JSON-LD #${idx+1} @type:`, type);
        } catch (e) {
          console.log(`  JSON-LD #${idx+1} raw:`, jsonText.substring(0, 100));
        }
      });
    }
  }
}
check();
