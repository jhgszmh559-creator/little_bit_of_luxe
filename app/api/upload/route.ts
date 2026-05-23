import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
    
    // Check if Cloudinary is configured
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (cloudName && apiKey && apiSecret) {
      try {
        console.log(`Cloudinary configuration detected. Uploading ${filename} to Cloudinary...`);
        const timestamp = Math.round(new Date().getTime() / 1000);
        const signatureStr = `timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');
        
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        
        // Convert buffer to data URI to upload reliably via FormData
        const mimeType = file.type || 'image/jpeg';
        const base64Data = buffer.toString('base64');
        const fileDataUri = `data:${mimeType};base64,${base64Data}`;
        
        const bodyData = new FormData();
        bodyData.append('file', fileDataUri);
        bodyData.append('api_key', apiKey);
        bodyData.append('timestamp', timestamp.toString());
        bodyData.append('signature', signature);
        
        const res = await fetch(url, {
          method: 'POST',
          body: bodyData,
        });
        
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Cloudinary API returned status ${res.status}: ${errText}`);
        }
        
        const cldData = await res.json();
        const secureUrl = cldData.secure_url;
        
        if (!secureUrl) {
          throw new Error('Cloudinary response did not contain secure_url');
        }
        
        console.log(`Cloudinary upload successful: ${secureUrl}`);
        return NextResponse.json({ url: secureUrl });
      } catch (cloudinaryErr: any) {
        console.error('Cloudinary upload failed, falling back to local/GitHub:', cloudinaryErr.message || cloudinaryErr);
      }
    }
    
    // Fallback: Local and GitHub upload
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
    
    // Return the relative URL which resolves to /uploads/filename under Next.js public path
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
