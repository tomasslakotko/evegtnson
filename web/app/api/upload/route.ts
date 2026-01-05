import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Generate a client token for the browser to upload the file
        // ⚠️ Authenticate and authorize users here, otherwise anyone can upload files
        if (!session.user) {
          throw new Error('Unauthorized');
        }
        
        // Allowed file types
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          tokenPayload: JSON.stringify({
            userId: session.user.id, // Optional payload
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        // ⚠️ This will not work on `localhost` website,
        // Use ngrok or similar to test the full upload flow locally

        console.log('blob uploaded', blob.url);

        try {
          // Update user profile image in database
          if (tokenPayload) {
            const { userId } = JSON.parse(tokenPayload);
            await prisma.user.update({
              where: { id: userId },
              data: { image: blob.url },
            });
          }
        } catch (error) {
          console.error('Could not update user image:', error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // The webhook will retry 5 times waiting for a status 200
    );
  }
}

