
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const mediaType = formData.get('mediaType') as string || 'image';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('story').upload(filePath, file);
    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from('story').getPublicUrl(filePath);

    const { data: statusData, error: insertError } = await supabase
        .from('statuses')
        .insert({
            user_id: user.id,
            media_url: urlData.publicUrl,
            media_type: mediaType,
            caption: caption,
        })
        .select()
        .single();

    if (insertError) {
        await supabase.storage.from('story').remove([filePath]);
        throw insertError;
    }

    return NextResponse.json(statusData);
  } catch (error: any) {
    console.error('Error creating status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
