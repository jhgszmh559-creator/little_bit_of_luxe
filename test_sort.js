const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const contentDir = path.join(process.cwd(), 'content');

function getStatus(data) {
  if (data.status === 'published' || data.status === 'draft' || data.status === 'archived') {
    return data.status;
  }
  return data.draft === true ? 'draft' : 'published';
}

function getItems(type) {
  const dirPath = path.join(contentDir, type);
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const p = path.join(dirPath, f);
      const data = matter(fs.readFileSync(p, 'utf-8')).data;
      return { type, slug: f.replace('.md',''), date: data.date, status: getStatus(data) };
    })
    .filter(item => item.status === 'published');
}

let programs = getItems('programs');
let reviews = getItems('reviews');
let news = getItems('news');

let all = [...programs, ...reviews, ...news];
all.sort((a, b) => b.date.localeCompare(a.date));
console.log(all.slice(0, 5));
