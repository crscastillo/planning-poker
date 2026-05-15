import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const BUCKET_NAME = 'sessions';

    // Test 1: Check if bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to list buckets',
        details: bucketError.message,
        hint: 'Make sure your Supabase credentials are correct',
      });
    }

    const sessionsBucket = buckets?.find(b => b.name === BUCKET_NAME);
    if (!sessionsBucket) {
      return res.status(500).json({
        success: false,
        error: 'Bucket not found',
        details: `The '${BUCKET_NAME}' bucket does not exist`,
        hint: 'Create a public bucket named "sessions" in Supabase Storage',
      });
    }

    // Test 2: Try to upload a test file
    const testId = 'test-' + Date.now();
    const testData = {
      id: testId,
      name: 'Test Session',
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000,
      items: [],
      currentItemId: null,
      users: [],
    };

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`${testId}.json`, JSON.stringify(testData), {
        contentType: 'application/json',
      });

    if (uploadError) {
      return res.status(500).json({
        success: false,
        error: 'Upload failed',
        details: uploadError.message,
        hint: 'Make sure the bucket has proper upload policies (see SUPABASE_STORAGE_SETUP.md)',
      });
    }

    // Test 3: Try to download the file
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(`${testId}.json`);

    if (downloadError) {
      // Clean up
      await supabase.storage.from(BUCKET_NAME).remove([`${testId}.json`]);
      return res.status(500).json({
        success: false,
        error: 'Download failed',
        details: downloadError.message,
      });
    }

    // Test 4: Clean up test file
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`${testId}.json`]);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        error: 'Delete failed (but upload/download worked)',
        details: deleteError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase Storage is configured correctly!',
      bucket: 'OK',
      upload: 'OK',
      download: 'OK',
      delete: 'OK',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
