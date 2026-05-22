import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveBinaryToGithub } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename using timestamp and original extension
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalExt = path.extname(file.name) || '.jpg';
    const filename = `${uniqueId}${originalExt}`;
    
    const relPath = `public/uploads/${filename}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // 1. Write the file locally for immediate display
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
    } catch (localWriteErr: any) {
      console.warn('Failed to write uploaded file locally (read-only filesystem):', localWriteErr.message);
    }

    // 2. Commit the file to GitHub so it is permanently hosted and works in production deployments
    try {
      await saveBinaryToGithub(relPath, buffer, `Upload image: ${filename}`);
    } catch (githubErr: any) {
      console.error('Failed to save image to GitHub:', githubErr.message || githubErr);
    }
    
    // Return the relative URL which resolved to /uploads/filename under Next.js public path
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
