import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Schema interfaces
export interface User {
  email: string;
  name?: string;
  persona?: string;
  otpCode?: string;
  onboarded: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  email: string; // Linked to user email
  createdAt: string;
  pinned?: boolean;
}

export interface Chat {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  pinned?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  sender: 'user' | 'assistant';
  text: string;
  images?: string[]; // array of absolute URLs
  timestamp: string;
  hasCritique?: boolean;
}

export interface IssuePin {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: 'accessibility' | 'heuristic' | 'psychology';
  x: number; // percentage width (0-100)
  y: number; // percentage height (0-100)
}

export interface Critique {
  id: string;
  messageId: string; // user message id containing the images
  chatId: string;
  imagePath: string; // public cloud URL
  issues: IssuePin[];
  remedies: string; // Markdown description of remedies
  createdAt: string;
  businessGoal?: string;
  userGoal?: string;
}

export interface DatabaseSchema {
  users: User[];
  projects: Project[];
  chats: Chat[];
  messages: Message[];
  critiques: Critique[];
}

const DEFAULT_DB: DatabaseSchema = {
  users: [],
  projects: [],
  chats: [],
  messages: [],
  critiques: [],
};

let cachedDb: DatabaseSchema | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 4000; // 4 seconds cache TTL
let pendingFetch: Promise<DatabaseSchema> | null = null;

// Read database from Supabase with in-memory caching and query deduplication
export async function readDb(): Promise<DatabaseSchema> {
  const now = Date.now();
  
  if (cachedDb && (now - lastFetchTime < CACHE_TTL)) {
    return cachedDb;
  }

  if (pendingFetch) {
    return pendingFetch;
  }

  pendingFetch = (async () => {
    try {
      const [usersRes, projectsRes, chatsRes, messagesRes, critiquesRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('chats').select('*'),
        supabase.from('messages').select('*'),
        supabase.from('critiques').select('*')
      ]);

      if (usersRes.error) console.error('Error fetching users:', usersRes.error);
      if (projectsRes.error) console.error('Error fetching projects:', projectsRes.error);
      if (chatsRes.error) console.error('Error fetching chats:', chatsRes.error);
      if (messagesRes.error) console.error('Error fetching messages:', messagesRes.error);
      if (critiquesRes.error) console.error('Error fetching critiques:', critiquesRes.error);

      const db: DatabaseSchema = {
        users: usersRes.data || [],
        projects: projectsRes.data || [],
        chats: chatsRes.data || [],
        messages: messagesRes.data || [],
        critiques: critiquesRes.data || []
      };

      cachedDb = db;
      lastFetchTime = Date.now();
      return db;
    } catch (error) {
      console.error('Error in readDb:', error);
      return DEFAULT_DB;
    } finally {
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}

// Write/Sync database to Supabase
export async function writeDb(db: DatabaseSchema): Promise<void> {
  const oldDb = cachedDb;
  
  // Update cache immediately to prevent read-after-write lag
  cachedDb = db;
  lastFetchTime = Date.now();

  try {
    // Helper to check if array is unchanged
    const isUnchanged = (key: keyof DatabaseSchema) => {
      if (!oldDb) return false;
      return JSON.stringify(oldDb[key]) === JSON.stringify(db[key]);
    };

    // 1. Sync Users
    if (!isUnchanged('users')) {
      const { data: curUsers } = await supabase.from('users').select('email');
      const curEmails = curUsers?.map(u => u.email) || [];
      const activeEmails = db.users.map(u => u.email);
      const usersToDelete = curEmails.filter(e => !activeEmails.includes(e));
      if (usersToDelete.length > 0) {
        await supabase.from('users').delete().in('email', usersToDelete);
      }
      if (db.users.length > 0) {
        await supabase.from('users').upsert(db.users);
      }
    }

    // 2. Sync Projects (Cascade deletes chats, messages, critiques)
    if (!isUnchanged('projects')) {
      const { data: curProjects } = await supabase.from('projects').select('id');
      const curProjIds = curProjects?.map(p => p.id) || [];
      const activeProjIds = db.projects.map(p => p.id);
      const projToDelete = curProjIds.filter(id => !activeProjIds.includes(id));
      if (projToDelete.length > 0) {
        await supabase.from('projects').delete().in('id', projToDelete);
      }
      if (db.projects.length > 0) {
        await supabase.from('projects').upsert(db.projects);
      }
    }

    // 3. Sync Chats (Cascade deletes messages, critiques)
    if (!isUnchanged('chats')) {
      const { data: curChats } = await supabase.from('chats').select('id');
      const curChatIds = curChats?.map(c => c.id) || [];
      const activeChatIds = db.chats.map(c => c.id);
      const chatsToDelete = curChatIds.filter(id => !activeChatIds.includes(id));
      if (chatsToDelete.length > 0) {
        await supabase.from('chats').delete().in('id', chatsToDelete);
      }
      if (db.chats.length > 0) {
        await supabase.from('chats').upsert(db.chats);
      }
    }

    // 4. Sync Messages (Cascade deletes critiques)
    if (!isUnchanged('messages')) {
      const { data: curMessages } = await supabase.from('messages').select('id');
      const curMsgIds = curMessages?.map(m => m.id) || [];
      const activeMsgIds = db.messages.map(m => m.id);
      const msgToDelete = curMsgIds.filter(id => !activeMsgIds.includes(id));
      if (msgToDelete.length > 0) {
        await supabase.from('messages').delete().in('id', msgToDelete);
      }
      if (db.messages.length > 0) {
        await supabase.from('messages').upsert(db.messages);
      }
    }

    // 5. Sync Critiques
    if (!isUnchanged('critiques')) {
      const { data: curCritiques } = await supabase.from('critiques').select('id');
      const curCritIds = curCritiques?.map(c => c.id) || [];
      const activeCritIds = db.critiques.map(c => c.id);
      const critToDelete = curCritIds.filter(id => !activeCritIds.includes(id));
      if (critToDelete.length > 0) {
        await supabase.from('critiques').delete().in('id', critToDelete);
      }
      if (db.critiques.length > 0) {
        await supabase.from('critiques').upsert(db.critiques);
      }
    }
  } catch (error) {
    console.error('Error in writeDb sync:', error);
  }
}

// Upload file to Supabase Storage screenshots bucket and return public URL
export async function saveUploadedFile(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { error } = await supabase.storage
      .from('screenshots')
      .upload(filename, buffer, {
        contentType: file.type || 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file to Supabase storage:', error);
    throw new Error('Failed to save file to Supabase storage');
  }
}

// Helper to fetch/read image files as Buffer and MimeType (supports relative local and remote URLs)
export async function getImageBufferAndMime(imagePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const mimeType = imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    const res = await fetch(imagePath);
    if (!res.ok) {
      throw new Error(`Failed to fetch remote image: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), mimeType };
  } else {
    // Clean up leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const absoluteImagePath = path.join(process.cwd(), 'public', cleanPath);
    if (!fs.existsSync(absoluteImagePath)) {
      throw new Error(`Image not found at path: ${absoluteImagePath}`);
    }
    return { buffer: fs.readFileSync(absoluteImagePath), mimeType };
  }
}
