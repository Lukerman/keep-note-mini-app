import { createClient } from '@supabase/supabase-js';
import { Note } from '../types';
import { config } from '../config';

export const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// Helper to map DB columns (snake_case) to App types (camelCase)
const mapFromDB = (record: any): Note => ({
  id: record.id,
  title: record.title,
  content: record.content,
  color: record.color,
  isPinned: record.is_pinned,
  isArchived: record.is_archived,
  isTrashed: record.is_trashed,
  labels: record.labels || [],
  orderIndex: record.order_index,
  // Supabase/Postgres returns dates as ISO strings
  createdAt: record.created_at ? new Date(record.created_at).getTime() : Date.now(),
  updatedAt: record.updated_at ? new Date(record.updated_at).getTime() : Date.now(),
});

// Helper to map App types to DB columns
const mapToDB = (note: Note, userId: number) => ({
  id: note.id,
  user_id: userId,
  title: note.title,
  content: note.content,
  color: note.color,
  is_pinned: note.isPinned,
  is_archived: note.isArchived,
  is_trashed: note.isTrashed,
  labels: note.labels,
  order_index: note.orderIndex,
  // Postgres timestamptz requires ISO string
  created_at: new Date(note.createdAt).toISOString(),
  updated_at: new Date(note.updatedAt).toISOString(),
});

export const fetchNotesFromSupabase = async (userId: number): Promise<Note[]> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Fetch Error:', JSON.stringify(error, null, 2));
      return [];
    }
    return (data || []).map(mapFromDB);
  } catch (err) {
    console.error('Unexpected Error fetching notes:', err);
    return [];
  }
};

export const createNoteInSupabase = async (note: Note, userId: number) => {
  try {
    const { error } = await supabase
      .from('notes')
      .insert([mapToDB(note, userId)]);

    if (error) console.error('Supabase Create Error:', JSON.stringify(error, null, 2));
  } catch (err) {
    console.error('Unexpected Error creating note:', err);
  }
};

export const updateNoteInSupabase = async (id: string, updates: Partial<Note>) => {
  try {
    // Convert updates to snake_case and handle timestamps
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
    if (updates.isTrashed !== undefined) dbUpdates.is_trashed = updates.isTrashed;
    if (updates.labels !== undefined) dbUpdates.labels = updates.labels;
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = new Date(updates.updatedAt).toISOString();

    const { error } = await supabase
      .from('notes')
      .update(dbUpdates)
      .eq('id', id);

    if (error) console.error('Supabase Update Error:', JSON.stringify(error, null, 2));
  } catch (err) {
    console.error('Unexpected Error updating note:', err);
  }
};

export const deleteNoteFromSupabase = async (id: string) => {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) console.error('Supabase Delete Error:', JSON.stringify(error, null, 2));
  } catch (err) {
    console.error('Unexpected Error deleting note:', err);
  }
};

export const updateNotesOrder = async (updates: { id: string, orderIndex: number }[]) => {
  try {
    // Perform bulk upsert for order_index
    const { error } = await supabase
      .from('notes')
      .upsert(updates.map(u => ({ id: u.id, order_index: u.orderIndex, updated_at: new Date().toISOString() })), { onConflict: 'id', ignoreDuplicates: false });

    if (error) console.error('Supabase Order Update Error:', JSON.stringify(error, null, 2));
  } catch (err) {
    console.error('Unexpected Error updating notes order:', err);
  }
};