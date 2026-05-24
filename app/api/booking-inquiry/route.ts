import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { saveInquiry, updateInquiryStatus, deleteInquiry, BookingInquiry } from '@/lib/inquiries';

function generateId(): string {
  return 'inq_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Helper to authenticate admin requests
function authenticateAdmin(request: NextRequest): boolean {
  // Option 1: X-Admin-Secret
  const secret = request.headers.get('x-admin-secret') || 
                 request.headers.get('X-Admin-Secret') || 
                 request.nextUrl.searchParams.get('secret');
  const adminSecret = process.env.ADMIN_SECRET || 'luxe2026';
  if (secret && secret === adminSecret) return true;

  // Option 2: Basic Auth header (browser sends automatically when logged into admin dashboard)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    try {
      const authValue = authHeader.split(' ')[1];
      const decoded = atob(authValue);
      const [_, password] = decoded.split(':');
      const expectedPass = process.env.ADMIN_PASS || 'luxe2026';
      if (password === expectedPass) return true;
    } catch (e) {
      // Decode failed
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      name, 
      email, 
      hotelName, 
      checkIn, 
      checkOut, 
      adults = 1, 
      children = 0, 
      childAges = [], 
      roomType = 'Luxury Suite', 
      notes = '',
      programName = 'Virtuoso'
    } = data;

    // 1. Basic Fields Validation
    if (!name?.trim() || !email?.trim() || !hotelName?.trim() || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Dates Validation Rules
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneYearFromToday = new Date();
    oneYearFromToday.setFullYear(today.getFullYear() + 1);
    oneYearFromToday.setHours(23, 59, 59, 999);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'Invalid dates provided' }, { status: 400 });
    }

    // Check: Dates in the past are not allowed
    if (checkInDate < today) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past' }, { status: 400 });
    }

    // Check: Dates more than 1 year in the future are not allowed
    if (checkInDate > oneYearFromToday || checkOutDate > oneYearFromToday) {
      return NextResponse.json({ error: 'Dates cannot be more than 1 year in the future' }, { status: 400 });
    }

    // Check: Same date check-in and check-out are not allowed (minimum 1 night)
    if (checkIn === checkOut || checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out date must be at least one day after check-in' }, { status: 400 });
    }

    // 3. Guests & Children Age Validation
    if (Number(adults) < 1) {
      return NextResponse.json({ error: 'At least one adult is required' }, { status: 400 });
    }

    if (Number(children) > 0) {
      if (!Array.isArray(childAges) || childAges.length !== Number(children)) {
        return NextResponse.json({ error: 'Please provide ages for all children' }, { status: 400 });
      }
      for (const age of childAges) {
        if (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 17) {
          return NextResponse.json({ error: 'Invalid child age provided' }, { status: 400 });
        }
      }
    }

    // 4. Save Inquiry to JSON database (supports Local/GitHub)
    const inquiry: BookingInquiry = {
      id: generateId(),
      name: name.trim(),
      email: email.trim(),
      hotelName: hotelName.trim(),
      checkIn,
      checkOut,
      adults: Number(adults),
      children: Number(children),
      childAges: Number(children) > 0 ? childAges.map(Number) : [],
      roomType: roomType.trim() || 'Luxury Suite',
      notes: notes.trim(),
      programName: programName.trim(),
      date: new Date().toISOString(),
      status: 'pending'
    };

    const saveSuccess = await saveInquiry(inquiry);
    if (!saveSuccess) {
      console.warn('Inquiry saved locally but failed to commit to GitHub.');
    }

    // 5. Send Booking Inquiry Email to vince@qxtravel.io
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailFrom = process.env.EMAIL_FROM || smtpUser || 'noreply@littlebitofluxe.com';

    console.log(`Processing booking inquiry email dispatch to vince@qxtravel.io for ${hotelName}...`);

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        const childrenInfo = inquiry.children > 0 
          ? `${inquiry.children} child(ren) (Ages: ${inquiry.childAges?.join(', ') || 'N/A'})` 
          : 'None';

        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1c1c; line-height: 1.6;">
            <h2 style="color: #6d2036; border-bottom: 2px solid #6d2036; padding-bottom: 10px; font-weight: normal; letter-spacing: 1px;">
              New Luxe Booking Inquiry
            </h2>
            <p>A traveler has submitted a new booking request from the <em>Little Bit of Luxe</em> journal.</p>
            
            <table cellpadding="10" cellspacing="0" style="width: 100%; border: 1px solid #e5e5e5; margin: 20px 0;">
              <tr style="background-color: #fcfcfc;">
                <td style="width: 160px; font-weight: bold; border-bottom: 1px solid #e5e5e5;">Hotel Name</td>
                <td style="border-bottom: 1px solid #e5e5e5;">${inquiry.hotelName}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; border-bottom: 1px solid #e5e5e5;">Partner Program</td>
                <td style="border-bottom: 1px solid #e5e5e5; color: #6d2036; font-weight: bold;">${inquiry.programName}</td>
              </tr>
              <tr style="background-color: #fcfcfc;">
                <td style="font-weight: bold; border-bottom: 1px solid #e5e5e5;">Traveler Name</td>
                <td style="border-bottom: 1px solid #e5e5e5;">${inquiry.name}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; border-bottom: 1px solid #e5e5e5;">Email Address</td>
                <td style="border-bottom: 1px solid #e5e5e5;"><a href="mailto:${inquiry.email}">${inquiry.email}</a></td>
              </tr>
              <tr style="background-color: #fcfcfc;">
                <td style="font-weight: bold; border-bottom: 1px solid #e5e5e5;">Check-In</td>
                <td style="border-bottom: 1px solid #e5e5e5;">${inquiry.checkIn}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; border-bottom: 1px solid #e5e5e5;">Check-Out</td>
                <td style="border-bottom: 1px solid #e5e5e5;">${inquiry.checkOut}</td>
              </tr>
              <tr style="background-color: #fcfcfc;">
                <td style="font-weight: bold; border-bottom: 1px solid #e5e5e5;">Guests</td>
                <td style="border-bottom: 1px solid #e5e5e5;">${inquiry.adults} Adult(s)</td>
              </tr>
              <tr>
                <td style="font-weight: bold; border-bottom: 1px solid #e5e5e5;">Children</td>
                <td style="border-bottom: 1px solid #e5e5e5;">${childrenInfo}</td>
              </tr>
              <tr style="background-color: #fcfcfc;">
                <td style="font-weight: bold; border-bottom: 1px solid #e5e5e5;">Room Category</td>
                <td style="border-bottom: 1px solid #e5e5e5;">${inquiry.roomType}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; vertical-align: top;">Notes / Requests</td>
                <td>${inquiry.notes ? inquiry.notes.replace(/\n/g, '<br>') : '<em>No custom requests.</em>'}</td>
              </tr>
            </table>
            
            <p style="font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">
              This inquiry has been logged in the Little Bit of Luxe Admin Dashboard.
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: `"Little Bit of Luxe" <${emailFrom}>`,
          to: 'vince@qxtravel.io',
          subject: `[Luxe Booking] ${inquiry.hotelName} - ${inquiry.name}`,
          html: emailHtml
        });
        console.log(`Booking inquiry email sent successfully to vince@qxtravel.io for ${inquiry.id}`);
      } catch (emailErr) {
        console.error('Nodemailer failed to deliver email:', emailErr);
        // Do not crash the API request, since the inquiry is already saved to the database.
      }
    } else {
      console.warn('SMTP Credentials are not fully configured in environment. Skipped email dispatch to vince@qxtravel.io');
    }

    return NextResponse.json({ success: true, inquiry });

  } catch (error: any) {
    console.error('Failed to submit booking inquiry:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Authenticated route to update inquiry status
export async function PATCH(request: NextRequest) {
  try {
    if (!authenticateAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    if (status !== 'pending' && status !== 'replied' && status !== 'cancelled') {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const ok = await updateInquiryStatus(id, status);
    if (!ok) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update inquiry status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Authenticated route to delete inquiries
export async function DELETE(request: NextRequest) {
  try {
    if (!authenticateAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing inquiry id' }, { status: 400 });
    }

    const ok = await deleteInquiry(id);
    if (!ok) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete inquiry:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
