import fs from 'fs';
import path from 'path';

// Define DB paths
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

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
  images?: string[]; // array of absolute public URLs like '/uploads/file.png'
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
  imagePath: string; // '/uploads/file.png'
  issues: IssuePin[];
  remedies: string; // Markdown description of remedies
  createdAt: string;
  businessGoal?: string;
  userGoal?: string;
}

interface DatabaseSchema {
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

// Helper to initialize folders and database
function initDb() {
  if (typeof window !== 'undefined') return;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

// Read database
export function readDb(): DatabaseSchema {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    console.error('Error reading local database:', error);
    return DEFAULT_DB;
  }
}

// Write database
export function writeDb(data: DatabaseSchema) {
  initDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to local database:', error);
  }
}

// Save uploaded image to public/uploads
export async function saveUploadedFile(file: File): Promise<string> {
  initDb();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create unique filename
  const ext = path.extname(file.name) || '.png';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  
  fs.writeFileSync(filePath, buffer);
  
  // Return the public web path
  return `/uploads/${filename}`;
}
