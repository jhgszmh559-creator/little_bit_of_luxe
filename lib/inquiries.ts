import fs from 'fs';
import path from 'path';
import { saveContentToGithub } from './github';

export interface BookingInquiry {
  id: string;
  name: string;
  email: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childAges?: number[];
  roomType: string;
  notes: string;
  programName: string;
  date: string;
  status: 'pending' | 'replied' | 'cancelled';
}

const relPath = 'content/booking-inquiries.json';
const localPath = path.join(process.cwd(), relPath);

export async function getInquiries(): Promise<BookingInquiry[]> {
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (token) {
    try {
      const repo = 'jhgszmh559-creator/little_bit_of_luxe';
      const url = `https://api.github.com/repos/${repo}/contents/${relPath}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'NextJS-App',
        },
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return JSON.parse(content) as BookingInquiry[];
      } else if (res.status === 404) {
        return [];
      }
    } catch (err) {
      console.error('Error fetching inquiries from GitHub:', err);
    }
  }

  // Fallback to local file
  if (fs.existsSync(localPath)) {
    try {
      const content = fs.readFileSync(localPath, 'utf-8');
      return JSON.parse(content) as BookingInquiry[];
    } catch (err) {
      console.error('Error reading local inquiries:', err);
    }
  }

  return [];
}

export async function saveInquiry(inquiry: BookingInquiry): Promise<boolean> {
  const inquiries = await getInquiries();
  inquiries.unshift(inquiry); // Add new inquiries at the top
  const jsonStr = JSON.stringify(inquiries, null, 2);

  // Always write locally for local development
  try {
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localPath, jsonStr);
  } catch (localErr) {
    console.warn('Failed to write inquiry locally:', localErr);
  }

  // Commit to GitHub
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (token) {
    try {
      await saveContentToGithub(relPath, jsonStr, `Add booking inquiry from ${inquiry.name}`);
      return true;
    } catch (githubErr) {
      console.error('Failed to commit inquiry to GitHub:', githubErr);
      return false;
    }
  }

  return true;
}

export async function updateInquiryStatus(id: string, status: 'pending' | 'replied' | 'cancelled'): Promise<boolean> {
  const inquiries = await getInquiries();
  const index = inquiries.findIndex(inq => inq.id === id);
  if (index === -1) return false;

  inquiries[index].status = status;
  const jsonStr = JSON.stringify(inquiries, null, 2);

  // Write locally
  try {
    fs.writeFileSync(localPath, jsonStr);
  } catch (localErr) {
    console.warn('Failed to write updated inquiry locally:', localErr);
  }

  // Commit to GitHub
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (token) {
    try {
      await saveContentToGithub(relPath, jsonStr, `Update booking inquiry status: ${id} to ${status}`);
      return true;
    } catch (githubErr) {
      console.error('Failed to commit updated inquiry status to GitHub:', githubErr);
      return false;
    }
  }

  return true;
}

export async function deleteInquiry(id: string): Promise<boolean> {
  const inquiries = await getInquiries();
  const filtered = inquiries.filter(inq => inq.id !== id);
  if (filtered.length === inquiries.length) return false;

  const jsonStr = JSON.stringify(filtered, null, 2);

  // Write locally
  try {
    fs.writeFileSync(localPath, jsonStr);
  } catch (localErr) {
    console.warn('Failed to write deleted inquiry list locally:', localErr);
  }

  // Commit to GitHub
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (token) {
    try {
      await saveContentToGithub(relPath, jsonStr, `Delete booking inquiry: ${id}`);
      return true;
    } catch (githubErr) {
      console.error('Failed to commit deleted inquiry list to GitHub:', githubErr);
      return false;
    }
  }

  return true;
}
