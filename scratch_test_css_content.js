const http = require('http');

http.get('http://localhost:3000/_next/static/css/app/layout.css', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('CSS Length:', data.length);
    const classes = ['lbl-display', 'bg-paper', 'text-midnight', 'flex', 'nav__inner', 'container'];
    classes.forEach(cls => {
      const idx = data.indexOf(cls);
      console.log(`Contains "${cls}":`, idx !== -1, idx !== -1 ? `(found at index ${idx})` : '');
    });
  });
}).on('error', (err) => {
  console.error('Error fetching CSS:', err);
});
