'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabaseClient';

export default function PageImage({ pageKey }) {
  const supabase = createClient();
  const [img, setImg] = useState(null);

  useEffect(() => {
    supabase.from('page_images').select('*').eq('page_key', pageKey)
      .order('created_at', { ascending: false }).limit(1).single()
      .then(({ data }) => setImg(data || null));
  }, [pageKey]);

  if (!img) return null;
  return <img src={img.url} alt={img.caption || ''} className="illustration" />;
}
