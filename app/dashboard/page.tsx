'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, MessageSquare, Image as ImageIcon, Sparkles, Send, 
  LogOut, FolderPlus, Loader2, AlertCircle, AlertTriangle, 
  Lightbulb, User, Maximize2, Minimize2, X, ArrowRight,
  ChevronDown, Pin, Trash, MoreVertical, Edit
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  pinned?: boolean;
}

interface Chat {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  pinned?: boolean;
}

interface Message {
  id: string;
  chatId: string;
  sender: 'user' | 'assistant';
  text: string;
  images?: string[];
  timestamp: string;
  hasCritique?: boolean;
}

interface IssuePin {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: 'accessibility' | 'heuristic' | 'psychology';
  x: number;
  y: number;
}

interface Critique {
  id: string;
  messageId: string;
  chatId: string;
  imagePath: string;
  issues: IssuePin[];
  remedies: string;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // App states
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // Tree view and edit states
  const [expandedProjects, setExpandedProjects] = useState<{ [projectId: string]: boolean }>({});
  const [projectChats, setProjectChats] = useState<{ [projectId: string]: Chat[] }>({});
  const [isEditingChatName, setIsEditingChatName] = useState(false);
  const [editedChatName, setEditedChatName] = useState('');
  const [openMenu, setOpenMenu] = useState<{ type: 'project' | 'chat'; id: string } | null>(null);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  // Critique data storage indexed by messageId
  const [critiques, setCritiques] = useState<{ [messageId: string]: Critique }>({});
  
  // Creation Modals & Inputs
  const [showProjModal, setShowProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  // Interactive Upload & Input Panel States
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [pendingImagePaths, setPendingImagePaths] = useState<string[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState('');
  const [previousProjectGoals, setPreviousProjectGoals] = useState<{ businessGoal: string; userGoal: string } | null>(null);
  
  // Tracking screenshot upload history during session
  const [lastUploadedImage, setLastUploadedImage] = useState<string | null>(null);
  
  // Pre-analysis and Goal configuration popover states
  const [goalWizardStep, setGoalWizardStep] = useState<0 | 1 | 2 | 3>(0); // 0 = closed, 1-3 = wizard steps
  const [preAnalysisLoading, setPreAnalysisLoading] = useState(false);
  const [detectedScreenType, setDetectedScreenType] = useState('');
  const [suggestedBizGoals, setSuggestedBizGoals] = useState<string[]>([]);
  const [suggestedUserGoals, setSuggestedUserGoals] = useState<string[]>([]);
  const [selectedBizGoal, setSelectedBizGoal] = useState('');
  const [selectedUserGoal, setSelectedUserGoal] = useState('');
  const [customBizGoal, setCustomBizGoal] = useState('');
  const [customUserGoal, setCustomUserGoal] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [bizGoalDefined, setBizGoalDefined] = useState(false);
  const [userGoalDefined, setUserGoalDefined] = useState(false);

  
  // Running Critique States
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [critiqueError, setCritiqueError] = useState('');
  const [demoNotice, setDemoNotice] = useState(false);

  // Pin Canvas & Zoom States
  const [selectedPin, setSelectedPin] = useState<IssuePin | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'accessibility' | 'heuristic' | 'psychology'>('all');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user details
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/auth');
        } else {
          setCurrentUser(data.user);
          fetchProjects();
        }
      });
  }, [router]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Click-away listener to close 3-dots menus and logout menu
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMenu(null);
      setShowLogoutMenu(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Fetch projects and pre-load all of their chats for tree view
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
        
        // Fetch chats for each project to populate the tree view
        const chatsMap: { [projectId: string]: Chat[] } = {};
        for (const p of data.projects) {
          try {
            const chatRes = await fetch(`/api/chats?projectId=${p.id}`);
            const chatData = await chatRes.json();
            if (chatData.chats) {
              chatsMap[p.id] = chatData.chats;
            }
          } catch (cErr) {
            console.error('Failed to fetch chats for project', p.id, cErr);
          }
        }
        setProjectChats(chatsMap);

        if (data.projects.length > 0 && !activeProjectId) {
          setActiveProjectId(data.projects[0].id);
          setExpandedProjects({ [data.projects[0].id]: true });
          setChats(chatsMap[data.projects[0].id] || []);
        } else if (activeProjectId) {
          setExpandedProjects(prev => ({ ...prev, [activeProjectId]: true }));
          setChats(chatsMap[activeProjectId] || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch chats whenever active project changes
  useEffect(() => {
    if (!activeProjectId) {
      setChats([]);
      setActiveChatId(null);
      return;
    }
    fetchChats(activeProjectId);
    setExpandedProjects(prev => ({ ...prev, [activeProjectId]: true }));
  }, [activeProjectId]);

  const fetchChats = async (projId: string) => {
    try {
      const res = await fetch(`/api/chats?projectId=${projId}`);
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
        // Sync to projectChats map
        setProjectChats(prev => ({ ...prev, [projId]: data.chats }));
        if (data.chats.length > 0) {
          // If activeChatId does not belong to the selected project, select the first chat
          const hasCurrentChat = (data.chats as Chat[]).some(c => c.id === activeChatId);
          if (!hasCurrentChat) {
            setActiveChatId(data.chats[0].id);
          }
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch messages and critique whenever active sub-chat changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeChatId);
    setSelectedPin(null);
    setLastUploadedImage(null);
    setGoalWizardStep(0);
    setPreAnalysisLoading(false);
    setDetectedScreenType('');
    setSuggestedBizGoals([]);
    setSuggestedUserGoals([]);
    setSelectedBizGoal('');
    setSelectedUserGoal('');
    setCustomBizGoal('');
    setCustomUserGoal('');
    setCustomNotes('');
    setBizGoalDefined(false);
    setUserGoalDefined(false);
  }, [activeChatId]);

  const fetchMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        
        // Fetch all critiques for this chat session
        const critRes = await fetch(`/api/critique?chatId=${chatId}`);
        const critData = await critRes.json();
        if (critData.critiques) {
          const critMap: { [messageId: string]: Critique } = {};
          critData.critiques.forEach((c: Critique) => {
            critMap[c.messageId] = c;
          });
          setCritiques(critMap);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  const handleConfirmLogout = async () => {
    setShowLogoutMenu(false);
    if (window.confirm("Are you sure you want to log out of Smart Critique?")) {
      await handleLogout();
    }
  };

  // Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjName, description: newProjDesc })
      });
      const data = await res.json();
      if (data.success) {
        fetchProjects();
        setActiveProjectId(data.project.id);
        setShowProjModal(false);
        setNewProjName('');
        setNewProjDesc('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper function to fetch chats for a specific project
  const fetchChatsForProject = async (projId: string, makeActiveChats = false) => {
    try {
      const res = await fetch(`/api/chats?projectId=${projId}`);
      const data = await res.json();
      if (data.chats) {
        setProjectChats(prev => ({ ...prev, [projId]: data.chats }));
        if (makeActiveChats || projId === activeProjectId) {
          setChats(data.chats);
        }
        return data.chats;
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  // Toggle Project Expand/Collapse in Tree
  const toggleProjectExpand = async (projId: string) => {
    const isExpanded = !!expandedProjects[projId];
    setExpandedProjects(prev => ({ ...prev, [projId]: !isExpanded }));
    
    if (!isExpanded && !projectChats[projId]) {
      await fetchChatsForProject(projId);
    }
  };

  // Toggle Pin status for a Project
  const handleTogglePinProject = async (projectId: string, currentPinned: boolean) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, pinned: !currentPinned })
      });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => 
          prev.map(p => p.id === projectId ? { ...p, pinned: !currentPinned } : p)
        );
      }
    } catch (err) {
      console.error('Failed to pin/unpin project', err);
    }
  };

  // Toggle Pin status for a Chat
  const handleTogglePinChat = async (chatId: string, projectId: string, currentPinned: boolean) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, pinned: !currentPinned })
      });
      const data = await res.json();
      if (data.success) {
        setProjectChats(prev => {
          const projectList = prev[projectId] || [];
          const updated = projectList.map(c => c.id === chatId ? { ...c, pinned: !currentPinned } : c);
          return { ...prev, [projectId]: updated };
        });
        if (projectId === activeProjectId) {
          setChats(prev => 
            prev.map(c => c.id === chatId ? { ...c, pinned: !currentPinned } : c)
          );
        }
      }
    } catch (err) {
      console.error('Failed to pin/unpin chat', err);
    }
  };

  // Delete Project and cascade
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will delete all sub-chats and design critiques inside it.')) return;
    try {
      const res = await fetch(`/api/projects?projectId=${projectId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setProjectChats(prev => {
          const copy = { ...prev };
          delete copy[projectId];
          return copy;
        });
        
        if (activeProjectId === projectId) {
          const remaining = projects.filter(p => p.id !== projectId);
          if (remaining.length > 0) {
            setActiveProjectId(remaining[0].id);
          } else {
            setActiveProjectId(null);
            setActiveChatId(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  // Delete Chat and cascade
  const handleDeleteChat = async (chatId: string, projectId: string) => {
    if (!confirm('Are you sure you want to delete this chat session and its design critique history?')) return;
    try {
      const res = await fetch(`/api/chats?chatId=${chatId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setProjectChats(prev => {
          const projectList = prev[projectId] || [];
          const updated = projectList.filter(c => c.id !== chatId);
          return { ...prev, [projectId]: updated };
        });
        
        if (projectId === activeProjectId) {
          setChats(prev => prev.filter(c => c.id !== chatId));
        }

        if (activeChatId === chatId) {
          const remaining = (projectChats[projectId] || []).filter(c => c.id !== chatId);
          if (remaining.length > 0) {
            setActiveChatId(remaining[0].id);
          } else {
            setActiveChatId(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  // Create Chat automatically named "Untitled Chat" without popup
  const handleCreateChatAuto = async (projectId: string) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: 'Untitled Chat' })
      });
      const data = await res.json();
      if (data.success) {
        setExpandedProjects(prev => ({ ...prev, [projectId]: true }));
        await fetchChatsForProject(projectId, true);
        setActiveProjectId(projectId);
        setActiveChatId(data.chat.id);
      }
    } catch (err) {
      console.error('Failed to create chat automatically:', err);
    }
  };

  // Rename chat automatically from "Untitled Chat" when user starts typing/uploads
  const renameChatIfNeeded = async (chatId: string, currentName: string, proposedName: string) => {
    if (currentName !== 'Untitled Chat') return;
    
    let finalName = proposedName.trim();
    if (finalName.length > 35) {
      finalName = finalName.substring(0, 32) + '...';
    }
    if (!finalName) return;

    try {
      const res = await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, name: finalName })
      });
      const data = await res.json();
      if (data.success) {
        setProjectChats(prev => {
          const updatedMap = { ...prev };
          for (const pid in updatedMap) {
            updatedMap[pid] = updatedMap[pid].map(c => 
              c.id === chatId ? { ...c, name: finalName } : c
            );
          }
          return updatedMap;
        });
        
        setChats(prev => 
          prev.map(c => c.id === chatId ? { ...c, name: finalName } : c)
        );
      }
    } catch (err) {
      console.error('Failed to rename chat automatically:', err);
    }
  };

  // Save chat name edit on double click submit
  const handleSaveChatName = async () => {
    setIsEditingChatName(false);
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || !editedChatName.trim() || editedChatName.trim() === chat.name) return;

    const newName = editedChatName.trim();

    try {
      const res = await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeChatId, name: newName })
      });
      const data = await res.json();
      if (data.success) {
        setProjectChats(prev => {
          const updated = { ...prev };
          if (chat.projectId in updated) {
            updated[chat.projectId] = updated[chat.projectId].map(c => 
              c.id === activeChatId ? { ...c, name: newName } : c
            );
          }
          return updated;
        });

        setChats(prev => 
          prev.map(c => c.id === activeChatId ? { ...c, name: newName } : c)
        );
      }
    } catch (err) {
      console.error('Failed to save chat name', err);
    }
  };

  const handleSaveProjectName = async (projId: string) => {
    setEditingProjectId(null);
    if (!editingProjectName.trim()) return;
    
    const newName = editingProjectName.trim();
    
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projId, name: newName })
      });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => 
          prev.map(p => p.id === projId ? { ...p, name: newName } : p)
        );
      }
    } catch (err) {
      console.error('Failed to save project name inline', err);
    }
  };

  const handleSaveChatNameInline = async (chatId: string, projectId: string) => {
    setEditingChatId(null);
    if (!editingChatName.trim()) return;
    
    const newName = editingChatName.trim();
    
    try {
      const res = await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, name: newName })
      });
      const data = await res.json();
      if (data.success) {
        setProjectChats(prev => {
          const updated = { ...prev };
          if (projectId in updated) {
            updated[projectId] = updated[projectId].map(c => 
              c.id === chatId ? { ...c, name: newName } : c
            );
          }
          return updated;
        });

        setChats(prev => 
          prev.map(c => c.id === chatId ? { ...c, name: newName } : c)
        );
      }
    } catch (err) {
      console.error('Failed to save chat name inline', err);
    }
  };

  // Pinned lists sorting helper
  const sortPinned = <T extends { pinned?: boolean; name: string }>(list: T[]): T[] => {
    return [...list].sort((a, b) => {
      const aPinned = !!a.pinned;
      const bPinned = !!b.pinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  // Drag and Drop Upload Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const filesToUpload = files.slice(0, 5); // max of 5
      uploadPendingFiles(filesToUpload);
    }
  };

  const uploadPendingFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadError('');
    
    const paths: string[] = [];
    try {
      await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.error) {
          setUploadError(data.error);
        } else {
          paths.push(data.filePath);
        }
      }));

      if (paths.length > 0) {
        setPendingImagePaths(prev => {
          const combined = [...prev, ...paths];
          return combined.slice(0, 5); // limit to max of 5
        });

        // Pre-fetch previous goals for this project to prompt inside the modal
        if (activeProjectId) {
          try {
            const prevRes = await fetch(`/api/critique?projectId=${activeProjectId}&last=true`);
            const prevData = await prevRes.json();
            if (prevData.critique && prevData.critique.businessGoal && prevData.critique.userGoal) {
              setPreviousProjectGoals({
                businessGoal: prevData.critique.businessGoal,
                userGoal: prevData.critique.userGoal
              });
            } else {
              setPreviousProjectGoals(null);
            }
          } catch (prevErr) {
            console.error('Failed to pre-fetch previous goals:', prevErr);
            setPreviousProjectGoals(null);
          }
        }
      }
    } catch (err) {
      setUploadError('Failed to upload images.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Submit message (Text, Image, or both) from Chat Input
  const handleSendMessage = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!activeChatId) return;

    if (!chatInput.trim() && pendingImagePaths.length === 0) return;

    const userText = chatInput.trim() || `Uploaded design screenshot(s) for analysis.`;
    const imagesToSend = [...pendingImagePaths];

    // Clear the input box and attachment preview immediately
    setChatInput('');
    setPendingImagePaths([]);

    try {
      // Append user message to chat stream
      const msgRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChatId,
          sender: 'user',
          text: userText,
          images: imagesToSend.length > 0 ? imagesToSend : undefined
        })
      });
      const msgData = await msgRes.json();
      if (msgData.success) {
        setMessages(prev => [...prev, msgData.message]);
      }

      // Rename chat if it is currently "Untitled Chat"
      const currentChat = chats.find(c => c.id === activeChatId);
      if (currentChat && currentChat.name === 'Untitled Chat') {
        await renameChatIfNeeded(activeChatId, currentChat.name, userText);
      }

      if (imagesToSend.length > 0) {
        setLastUploadedImage(imagesToSend[0]);
        
        // Reset states but keep wizard closed during pre-analysis loading
        setGoalWizardStep(0); 
        setPreAnalysisLoading(true);
        setDetectedScreenType('');
        setSuggestedBizGoals([]);
        setSuggestedUserGoals([]);
        setSelectedBizGoal('');
        setSelectedUserGoal('');
        setCustomBizGoal('');
        setCustomUserGoal('');
        setCustomNotes('');
        setBizGoalDefined(false);
        setUserGoalDefined(false);

        // Save a temporary assistant scanning message in the database
        const scanningRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChatId,
            sender: 'assistant',
            text: `Analyzing screenshot(s) to detect screen type and context... ⏳`
          })
        });
        const scanningData = await scanningRes.json();
        let loadingMsgId = '';
        if (scanningData.success) {
          setMessages(prev => [...prev, scanningData.message]);
          loadingMsgId = scanningData.message.id;
        }

        // Call the pre-analysis API asynchronously (on the first uploaded screenshot)
        try {
          const preRes = await fetch('/api/pre-analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagePath: imagesToSend[0], userDescription: userText })
          });
          const preData = await preRes.json();
          
          if (preData.success) {
            setDetectedScreenType(preData.screenType);
            setSuggestedBizGoals(preData.suggestedBusinessGoals);
            setSuggestedUserGoals(preData.suggestedUserGoals);
            
            // Rename chat if it is currently "Untitled Chat"
            if (activeChatId) {
              const chatToRename = chats.find(c => c.id === activeChatId);
              if (chatToRename && chatToRename.name === 'Untitled Chat') {
                await renameChatIfNeeded(activeChatId, chatToRename.name, preData.screenType);
              }
            }

            // Handle pre-defined business goals
            if (preData.businessGoalDefined && preData.extractedBusinessGoal) {
              setBizGoalDefined(true);
              setSelectedBizGoal(preData.extractedBusinessGoal);
              setCustomBizGoal(preData.extractedBusinessGoal);
            } else if (preData.suggestedBusinessGoals?.length > 0) {
              setSelectedBizGoal(preData.suggestedBusinessGoals[0]);
            }

            // Handle pre-defined user goals
            if (preData.userGoalDefined && preData.extractedUserGoal) {
              setUserGoalDefined(true);
              setSelectedUserGoal(preData.extractedUserGoal);
              setCustomUserGoal(preData.extractedUserGoal);
            } else if (preData.suggestedUserGoals?.length > 0) {
              setSelectedUserGoal(preData.suggestedUserGoals[0]);
            }

            // Save the pre-analysis intro message to the database
            const introMsgRes = await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chatId: activeChatId,
                sender: 'assistant',
                text: `I've received your mockup screen(s)! 🎨 Based on my analysis, this looks like a **${preData.screenType}** flow.\n\nI will be asking a few questions to understand your goals before running the full diagnosis.`
              })
            });
            const introMsgData = await introMsgRes.json();
            
            if (introMsgData.success) {
              // Replace temporary scanning bubble with intro message in local state
              setMessages(prev => {
                const list = prev.filter(m => m.id !== loadingMsgId);
                return [...list, introMsgData.message];
              });
            }

            // Check if user requested to use same business/user goals in text description
            const useSameGoalsRequested = 
              userText.toLowerCase().includes('same goals') ||
              userText.toLowerCase().includes('same business and user goals') ||
              userText.toLowerCase().includes('use previous goals') ||
              userText.toLowerCase().includes('same as previous') ||
              userText.toLowerCase().includes('use same goals') ||
              userText.toLowerCase().includes('use the same goals') ||
              userText.toLowerCase().includes('use same user and business goals') ||
              userText.toLowerCase().includes('use the same user and business goals');

            if (useSameGoalsRequested && activeProjectId) {
              try {
                const prevGoalsRes = await fetch(`/api/critique?projectId=${activeProjectId}&last=true`);
                const prevGoalsData = await prevGoalsRes.json();
                if (prevGoalsData.critique && prevGoalsData.critique.businessGoal && prevGoalsData.critique.userGoal) {
                  // Direct audit without showing modal wizard!
                  runInlineCritique(
                    introMsgData.message.id, 
                    imagesToSend, 
                    prevGoalsData.critique.businessGoal, 
                    prevGoalsData.critique.userGoal, 
                    ''
                  );
                  return;
                }
              } catch (prevErr) {
                console.error('Failed to run audit directly with same goals:', prevErr);
              }
            }

            // Route starting step dynamically based on what was pre-defined
            if (preData.businessGoalDefined && preData.userGoalDefined) {
              setGoalWizardStep(3); // Skip straight to style guide rules
            } else if (preData.businessGoalDefined) {
              setGoalWizardStep(2); // Skip Step 1 (business goal), go to user goals
            } else {
              setGoalWizardStep(1); // Standard flow starts at step 1
            }
          }
        } catch (preErr) {
          console.error('Pre-analysis failed:', preErr);
          // If error, remove scanning bubble and open generic step 1 wizard
          if (loadingMsgId) {
            setMessages(prev => prev.filter(m => m.id !== loadingMsgId));
          }
          setDetectedScreenType('Product Screenshot');
          setSuggestedBizGoals(['Improve checkout conversion', 'Reduce form abandonment', 'Promote premium upgrades']);
          setSuggestedUserGoals(['Pay securely with minimal friction', 'Verify order summary details', 'Add items easily']);
          setSelectedBizGoal('Improve checkout conversion');
          setSelectedUserGoal('Pay securely with minimal friction');
          setGoalWizardStep(1);
        } finally {
          setPreAnalysisLoading(false);
        }
      } else {
        // Text-only message
        triggerGenericAIResponse();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Handle Wizard Submit Step
  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (goalWizardStep === 1) {
      // If user goal is already defined, skip step 2 and go directly to step 3
      if (userGoalDefined) {
        setGoalWizardStep(3);
      } else {
        setGoalWizardStep(2);
      }
    } else if (goalWizardStep === 2) {
      setGoalWizardStep(3);
    } else if (goalWizardStep === 3) {
      setGoalWizardStep(0); // Close Wizard Modal

      const finalBizGoal = selectedBizGoal || customBizGoal || 'Improve conversion';
      const finalUserGoal = selectedUserGoal || customUserGoal || 'Complete screen action';

      // Trigger Gemini API critique inline
      if (lastUploadedImage) {
        // Find latest user message to link critique
        const latestUserImgMsg = [...messages].reverse().find(m => m.sender === 'user' && m.images && m.images.length > 0);
        const linkMsgId = latestUserImgMsg ? latestUserImgMsg.id : `msg-${Date.now()}`;
        const imagePathsToCritique = latestUserImgMsg?.images || [lastUploadedImage];
        runInlineCritique(linkMsgId, imagePathsToCritique, finalBizGoal, finalUserGoal, customNotes);
      }
    }
  };

  // Skip Current Wizard Step
  const handleWizardSkip = () => {
    if (goalWizardStep === 1) {
      setSelectedBizGoal(suggestedBizGoals[0] || 'Improve checkout flow');
      setCustomBizGoal('');
      // If user goal is already defined, skip step 2 and go directly to step 3
      if (userGoalDefined) {
        setGoalWizardStep(3);
      } else {
        setGoalWizardStep(2);
      }
    } else if (goalWizardStep === 2) {
      setSelectedUserGoal(suggestedUserGoals[0] || 'Complete screen action');
      setCustomUserGoal('');
      setGoalWizardStep(3);
    } else if (goalWizardStep === 3) {
      setCustomNotes('');
      setGoalWizardStep(0); // Close Modal

      const finalBizGoal = selectedBizGoal || customBizGoal || suggestedBizGoals[0] || 'Improve checkout flow';
      const finalUserGoal = selectedUserGoal || customUserGoal || suggestedUserGoals[0] || 'Complete screen action';

      if (lastUploadedImage) {
        const latestUserImgMsg = [...messages].reverse().find(m => m.sender === 'user' && m.images && m.images.length > 0);
        const linkMsgId = latestUserImgMsg ? latestUserImgMsg.id : `msg-${Date.now()}`;
        const imagePathsToCritique = latestUserImgMsg?.images || [lastUploadedImage];
        runInlineCritique(linkMsgId, imagePathsToCritique, finalBizGoal, finalUserGoal, '');
      }
    }
  };

  // Trigger Gemini API Critique Inline
  const runInlineCritique = async (
    messageId: string, 
    imagePaths: string[], 
    bizGoal: string, 
    uGoal: string, 
    notes: string
  ) => {
    setIsCritiquing(true);
    setCritiqueError('');
    setDemoNotice(false);

    try {
      // Append temporary helper processing bubble
      const processingMsgRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChatId,
          sender: 'assistant',
          text: `Analyzing ${imagePaths.length} screenshot(s) based on your goals... Evaluating accessibility compliance (WCAG), usability heuristics, and psychological principles. Please wait... ⏳`
        })
      });
      const processingMsgData = await processingMsgRes.json();
      if (processingMsgData.success) {
        setMessages(prev => [...prev, processingMsgData.message]);
      }

      const res = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          chatId: activeChatId,
          imagePaths,
          businessGoal: bizGoal,
          userGoal: uGoal,
          customNotes: notes
        })
      });
      const data = await res.json();
      
      if (data.error) {
        setCritiqueError(data.error);
        
        const errorMsgRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChatId,
            sender: 'assistant',
            text: `⚠️ Critique failed: ${data.error}`
          })
        });
        const errorMsgData = await errorMsgRes.json();
        if (errorMsgData.success) {
          setMessages(prev => [...prev, errorMsgData.message]);
        }
      } else {
        // Store critiques
        setDemoNotice(!!data.demoMode);

        // Save AI critique completion indicator to the messages table
        const aiMsgRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChatId,
            sender: 'assistant',
            text: `Analysis complete! Below is the interactive critique report for your screenshot(s):`,
            hasCritique: true
          })
        });
        const aiMsgData = await aiMsgRes.json();
        if (aiMsgData.success) {
          // Remove the temporary loading bubble and append the critique message
          setMessages(prev => {
            const listWithoutTemp = prev.filter(m => !m.text.includes('Analyzing screenshot') && !m.text.includes('Analyzing ') && !m.text.includes('Evaluating accessibility'));
            return [...listWithoutTemp, aiMsgData.message];
          });
          
          setCritiques(prev => ({
            ...prev,
            [aiMsgData.message.id]: data.critiques || []
          }));
        }
      }
    } catch (err) {
      setCritiqueError('Failed to run design critique.');
    } finally {
      setIsCritiquing(false);
    }
  };

  const triggerGenericAIResponse = () => {
    setTimeout(async () => {
      const aiMsgRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChatId,
          sender: 'assistant',
          text: `I'm ready to review your mockups! You can upload a new screenshot at any time by clicking the image icon below.`
        })
      });
      const aiMsgData = await aiMsgRes.json();
      if (aiMsgData.success) {
        setMessages(prev => [...prev, aiMsgData.message]);
      }
    }, 800);
  };

  // Categorized Pin Filters
  const getFilteredPins = (crit: Critique) => {
    return crit.issues.filter(p => categoryFilter === 'all' || p.category === categoryFilter);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-surface-page)] text-[var(--color-text-primary)]">
      
      {/* Sidebar (Light Theme White Panel) */}
      <aside className="w-64 border-r border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] flex flex-col shrink-0">
        
        {/* Brand */}
        <div className="p-4 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-[var(--radius-md)] bg-[var(--color-brand-500)] flex items-center justify-center text-white shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-500)] leading-none">Smart Critique</h2>
              <span className="text-[9px] text-[var(--color-text-tertiary)] font-mono">Critique System</span>
            </div>
          </div>
        </div>

        {/* Project and Sub-chats Tree Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Projects & Chats</span>
            <button 
              onClick={() => setShowProjModal(true)} 
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)] p-1 hover:bg-[var(--color-gray-100)] rounded transition cursor-pointer"
              title="New Project"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {projects.length === 0 ? (
              <div className="text-[10px] text-[var(--color-text-tertiary)]/50 text-center py-8">
                No projects. Click folders icon to create.
              </div>
            ) : (
              sortPinned(projects).map(p => {
                const isExpanded = !!expandedProjects[p.id];
                const isActiveProject = activeProjectId === p.id;
                const pChats = projectChats[p.id] || [];

                return (
                  <div key={p.id} className="space-y-1">
                    
                    {/* Project Row */}
                    <div className={`group flex items-center justify-between rounded-[var(--radius-md)] p-2 transition text-xs relative ${
                      isActiveProject 
                        ? 'bg-[var(--color-gray-100)] text-[var(--color-text-primary)] font-semibold shadow-2xs' 
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)]/50'
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {/* Expand/Collapse Chevron Button */}
                        <button
                          onClick={() => toggleProjectExpand(p.id)}
                          className="p-1 rounded hover:bg-[var(--color-gray-200)] text-zinc-500 hover:text-[var(--color-text-primary)] cursor-pointer shrink-0 transition"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transform transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                        </button>
                        
                        {/* Pin icon if pinned */}
                        {p.pinned && (
                          <Pin className="h-3 w-3 text-amber-500 shrink-0" fill="currentColor" />
                        )}

                        {editingProjectId === p.id ? (
                          <input
                            type="text"
                            value={editingProjectName}
                            onChange={(e) => setEditingProjectName(e.target.value)}
                            onBlur={() => handleSaveProjectName(p.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveProjectName(p.id);
                              if (e.key === 'Escape') setEditingProjectId(null);
                            }}
                            className="bg-white border border-[var(--color-brand-500)] text-xs text-[var(--color-text-primary)] rounded px-1.5 py-0.5 focus:outline-none w-36 font-semibold"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span 
                            onClick={() => {
                              setActiveProjectId(p.id);
                              // Ensure it's expanded
                              setExpandedProjects(prev => ({ ...prev, [p.id]: true }));
                              fetchChatsForProject(p.id, true);
                            }}
                            className="truncate font-semibold cursor-pointer flex-1"
                            title={p.name}
                          >
                            {p.name}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 transition relative">
                        {/* Outlined Plus Icon */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateChatAuto(p.id);
                          }}
                          className="p-1 rounded border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-200)] hover:text-[var(--color-text-primary)] cursor-pointer transition shrink-0 bg-white"
                          title="New Chat Session"
                        >
                          <Plus className="h-3 w-3" />
                        </button>

                        {/* 3-dots Menu Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu?.type === 'project' && openMenu.id === p.id ? null : { type: 'project', id: p.id });
                          }}
                          className={`p-1 rounded hover:bg-[var(--color-gray-200)] cursor-pointer transition text-zinc-500 hover:text-[var(--color-text-primary)] shrink-0 ${
                            openMenu?.type === 'project' && openMenu.id === p.id ? 'bg-[var(--color-gray-200)] text-[var(--color-text-primary)]' : ''
                          }`}
                          title="More options"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenu?.type === 'project' && openMenu.id === p.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--color-border-default)] rounded-[var(--radius-md)] shadow-lg z-45 py-1 w-28 text-left text-xs text-[var(--color-text-primary)] animate-fade-in">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProjectId(p.id);
                                  setEditingProjectName(p.name);
                                  setOpenMenu(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-gray-100)] flex items-center gap-1.5 cursor-pointer font-medium"
                            >
                              <Edit className="h-3.5 w-3.5 text-zinc-500" />
                              Rename
                            </button>
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePinProject(p.id, !!p.pinned);
                                  setOpenMenu(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-gray-100)] flex items-center gap-1.5 cursor-pointer font-medium border-t border-[var(--color-border-default)]/40"
                            >
                              <Pin className="h-3.5 w-3.5 text-zinc-500" />
                              {p.pinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(p.id);
                                  setOpenMenu(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-[var(--color-text-danger)] flex items-center gap-1.5 cursor-pointer font-bold border-t border-[var(--color-border-default)]/40"
                            >
                              <Trash className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Sub-chats (indented list) */}
                    {isExpanded && (
                      <div className="pl-4.5 border-l border-[var(--color-border-default)] space-y-1">
                        {pChats.length === 0 ? (
                          <div className="text-[10px] text-[var(--color-text-tertiary)]/50 py-1 pl-4">
                            No sub-chats
                          </div>
                        ) : (
                          sortPinned(pChats).map(c => {
                            const isActiveChat = activeChatId === c.id;
                            return (
                              <div
                                key={c.id}
                                className={`group/chat flex items-center justify-between rounded-[var(--radius-md)] py-1 px-1.5 transition text-[11px] relative ${
                                  isActiveChat 
                                    ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)] font-semibold' 
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-sunken)]/50'
                                }`}
                              >
                                {isActiveChat && (
                                  <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[var(--color-brand-500)] rounded-r" />
                                )}
                                
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <MessageSquare className="h-3 w-3 shrink-0 text-zinc-550 group-hover/chat:text-[var(--color-brand-600)]" />
                                  
                                  {c.pinned && (
                                    <Pin className="h-2.5 w-2.5 text-amber-500 shrink-0" fill="currentColor" />
                                  )}

                                  {editingChatId === c.id ? (
                                    <input
                                      type="text"
                                      value={editingChatName}
                                      onChange={(e) => setEditingChatName(e.target.value)}
                                      onBlur={() => handleSaveChatNameInline(c.id, p.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveChatNameInline(c.id, p.id);
                                        if (e.key === 'Escape') setEditingChatId(null);
                                      }}
                                      className="bg-white border border-[var(--color-brand-500)] text-[10px] text-[var(--color-text-primary)] rounded px-1.5 py-0.5 focus:outline-none w-28"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span
                                      onClick={() => {
                                        setActiveProjectId(p.id);
                                        setActiveChatId(c.id);
                                      }}
                                      className="truncate cursor-pointer flex-1"
                                      title={c.name}
                                    >
                                      {c.name}
                                    </span>
                                  )}
                                </div>

                                {/* Action buttons for Chat */}
                                <div className={`flex items-center gap-0.5 shrink-0 transition relative ${
                                  openMenu?.type === 'chat' && openMenu.id === c.id 
                                    ? 'opacity-100' 
                                    : 'opacity-0 group-hover/chat:opacity-100'
                                }`}>
                                  {/* 3-dots Menu */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenu(openMenu?.type === 'chat' && openMenu.id === c.id ? null : { type: 'chat', id: c.id });
                                    }}
                                    className={`p-1 rounded hover:bg-[var(--color-gray-200)] cursor-pointer transition text-zinc-500 hover:text-[var(--color-text-primary)] shrink-0 ${
                                      openMenu?.type === 'chat' && openMenu.id === c.id ? 'bg-[var(--color-gray-200)] text-[var(--color-text-primary)]' : ''
                                    }`}
                                    title="More options"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {openMenu?.type === 'chat' && openMenu.id === c.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--color-border-default)] rounded-[var(--radius-md)] shadow-lg z-45 py-1 w-28 text-left text-xs text-[var(--color-text-primary)] animate-fade-in">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingChatId(c.id);
                                          setEditingChatName(c.name);
                                          setOpenMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-gray-100)] flex items-center gap-1.5 cursor-pointer font-medium"
                                      >
                                        <Edit className="h-3.5 w-3.5 text-zinc-500" />
                                        Rename
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTogglePinChat(c.id, p.id, !!c.pinned);
                                          setOpenMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-gray-100)] flex items-center gap-1.5 cursor-pointer font-medium border-t border-[var(--color-border-default)]/40"
                                      >
                                        <Pin className="h-3.5 w-3.5 text-zinc-500" />
                                        {c.pinned ? 'Unpin' : 'Pin'}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteChat(c.id, p.id);
                                          setOpenMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-[var(--color-text-danger)] flex items-center gap-1.5 cursor-pointer font-bold border-t border-[var(--color-border-default)]/40"
                                      >
                                        <Trash className="h-3.5 w-3.5" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>

                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Profile Card & Logout */}
        <div className="p-3 border-t border-[var(--color-border-default)] bg-[var(--color-surface-sunken)]/30 flex items-center justify-between relative">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center text-[var(--color-brand-500)] shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] truncate">{currentUser?.name || 'User'}</h4>
              <p className="text-[9px] text-[var(--color-text-tertiary)] truncate leading-none">{currentUser?.email}</p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowLogoutMenu(prev => !prev);
              }}
              className="text-[var(--color-text-secondary)] hover:text-red-500 p-2 hover:bg-[var(--color-gray-100)] rounded-[var(--radius-md)] transition cursor-pointer"
              title="Log Out options"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Logout Dropdown Popover */}
            {showLogoutMenu && (
              <div className="absolute right-0 bottom-full mb-1 bg-white border border-[var(--color-border-default)] rounded-[var(--radius-md)] shadow-lg z-45 py-1 w-24 text-left text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmLogout();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-[var(--color-text-danger)] flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace: Centered Single Column Conversational Feed */}
      {activeChatId ? (
        <main className="flex-1 flex flex-col bg-[var(--color-surface-page)] overflow-hidden relative">
          
          {/* Header */}
          <div className="p-4 border-b border-[var(--color-border-default)] flex items-center justify-between bg-[var(--color-surface-card)] shrink-0 shadow-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
              
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-tertiary)] font-normal">
                  {projects.find(p => p.id === activeProjectId)?.name || 'Project'}
                </span>
                <span className="text-zinc-400">/</span>
                {isEditingChatName ? (
                  <input
                    type="text"
                    value={editedChatName}
                    onChange={(e) => setEditedChatName(e.target.value)}
                    onBlur={handleSaveChatName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveChatName();
                      if (e.key === 'Escape') setIsEditingChatName(false);
                    }}
                    className="bg-[var(--color-surface-sunken)] border border-[var(--color-brand-500)] text-xs font-bold text-[var(--color-text-primary)] rounded-[var(--radius-md)] px-2 py-0.5 focus:outline-none w-48"
                    autoFocus
                  />
                ) : (
                  <span 
                    onDoubleClick={() => {
                      const chat = chats.find(c => c.id === activeChatId);
                      if (chat) {
                        setEditedChatName(chat.name);
                        setIsEditingChatName(true);
                      }
                    }}
                    className="text-[var(--color-text-primary)] cursor-pointer select-none hover:text-[var(--color-brand-600)] transition group/header flex items-center gap-1"
                    title="Double click to rename chat"
                  >
                    {chats.find(c => c.id === activeChatId)?.name || 'Untitled Chat'}
                    <span className="text-[8px] text-[var(--color-text-tertiary)] font-normal opacity-0 group-hover/header:opacity-100 transition pl-1">(Double-click to rename)</span>
                  </span>
                )}
              </div>
              
            </div>
          </div>

          {/* DEMO MODE WARNING BANNER */}
          {demoNotice && (
            <div className="bg-[var(--color-feedback-warning-bg)] border-b border-[var(--color-border-warning)] px-4 py-2 flex items-center gap-2 text-[var(--color-text-warning)] text-[10px] shrink-0">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span><strong>Demo Sandbox Mode:</strong> Pre-generated analysis shown because no <code>GEMINI_API_KEY</code> is configured in <code>.env.local</code>.</span>
            </div>
          )}

          {/* Zoomed Image View Overlay */}
          {zoomedImage && (
            <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-center items-center p-8">
              <div className="absolute top-4 right-4 z-55">
                <button 
                  onClick={() => setZoomedImage(null)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-[var(--radius-lg)] text-xs cursor-pointer hover:bg-zinc-800"
                >
                  Close Preview
                </button>
              </div>
              <img src={zoomedImage} alt="Zoomed audit screenshot" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            </div>
          )}

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-6">
              
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-[var(--color-surface-card)] border border-[var(--color-border-default)] rounded-[var(--radius-2xl)] shadow-xs">
                  <div className="h-12 w-12 rounded-[var(--radius-xl)] bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center text-[var(--color-brand-500)] mb-3">
                    <ImageIcon className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Design Critique Feed</h3>
                  <p className="text-xs text-[var(--color-text-tertiary)] max-w-[320px] mt-1 leading-relaxed">
                    Upload a product screenshot using the image icon to trigger the inline audit workspace.
                  </p>
                </div>
              )}

              {messages.map((m) => {
                const critique = critiques[m.id];
                
                return (
                  <div 
                    key={m.id}
                    className={`flex gap-4 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-[var(--color-gray-100)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
                      </div>
                    )}
                    
                    <div className="space-y-1.5 max-w-[90%]">
                      {/* Standard text bubble */}
                      <div className={`p-4 rounded-[var(--radius-2xl)] text-xs leading-relaxed whitespace-pre-wrap shadow-xs border ${
                        m.sender === 'user' 
                          ? 'bg-[var(--color-gray-100)] border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-tr-none' 
                          : 'bg-[var(--color-surface-card)] border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-tl-none'
                      }`}>
                        {m.text}
                        
                        {/* Inline Images rendering */}
                        {m.images && m.images.map((img, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setZoomedImage(img)}
                            className="mt-3.5 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border-default)] max-h-48 cursor-pointer relative group"
                          >
                            <img src={img} alt="Uploaded source" className="object-cover w-full h-full" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-1 rounded">Click to expand</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* INLINE CRITIQUE CUSTOM COMPONENT BLOCK */}
                      {m.hasCritique && critique && (
                        <div className="mt-4 border border-[var(--color-border-default)] rounded-[var(--radius-2xl)] bg-[var(--color-surface-card)] shadow-md overflow-hidden">
                          
                          {/* Image with Pins */}
                          <div className="p-6 border-b border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] flex items-center justify-center relative">
                            <div className="relative border border-[var(--color-border-default)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm max-w-full max-h-[350px] bg-white">
                              <img src={critique.imagePath} alt="Audited screen" className="max-w-full max-h-[350px] object-contain" />
                              
                              {/* Pins absolute mapped */}
                              {getFilteredPins(critique).map((pin) => (
                                <button
                                  key={pin.id}
                                  onClick={() => setSelectedPin(pin)}
                                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 h-5.5 w-5.5 rounded-full border flex items-center justify-center font-bold text-[9px] shadow-md transition cursor-pointer hover:scale-125 ${
                                    selectedPin?.id === pin.id ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white' : ''
                                  } ${
                                    pin.category === 'accessibility' 
                                      ? 'bg-[var(--color-red-500)] border-red-300 text-white animate-pulse' 
                                      : pin.category === 'heuristic'
                                      ? 'bg-[var(--color-brand-500)] border-brand-300 text-white'
                                      : 'bg-[var(--color-amber-500)] border-amber-300 text-white'
                                  }`}
                                >
                                  !
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Category Filters inside bubble */}
                          <div className="px-4 py-2.5 border-b border-[var(--color-border-default)] flex gap-2 select-none overflow-x-auto shrink-0 bg-[var(--color-surface-card)]">
                            <button
                              onClick={() => setCategoryFilter('all')}
                              className={`text-[9px] px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                                categoryFilter === 'all' 
                                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-text-brand)] font-semibold' 
                                  : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)]'
                              }`}
                            >
                              All
                            </button>
                            <button
                              onClick={() => setCategoryFilter('accessibility')}
                              className={`text-[9px] px-2.5 py-0.5 rounded-full border transition flex items-center gap-1 cursor-pointer ${
                                categoryFilter === 'accessibility' 
                                  ? 'border-[var(--color-border-error)] bg-[var(--color-feedback-error-bg)] text-[var(--color-text-danger)] font-semibold' 
                                  : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)]'
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-red-500)]" />
                              Accessibility
                            </button>
                            <button
                              onClick={() => setCategoryFilter('heuristic')}
                              className={`text-[9px] px-2.5 py-0.5 rounded-full border transition flex items-center gap-1 cursor-pointer ${
                                categoryFilter === 'heuristic' 
                                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-text-brand)] font-semibold' 
                                  : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)]'
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)]" />
                              Heuristics
                            </button>
                            <button
                              onClick={() => setCategoryFilter('psychology')}
                              className={`text-[9px] px-2.5 py-0.5 rounded-full border transition flex items-center gap-1 cursor-pointer ${
                                categoryFilter === 'psychology' 
                                  ? 'border-[var(--color-border-warning)] bg-[var(--color-feedback-warning-bg)] text-[var(--color-text-warning)] font-semibold' 
                                  : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)]'
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-amber-500)]" />
                              Psychology
                            </button>
                          </div>

                          {/* Selected Pin info details */}
                          {selectedPin ? (
                            <div className="p-4 bg-[var(--color-surface-sunken)] border-b border-[var(--color-border-default)] animate-fade-in">
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                                    selectedPin.severity === 'high' 
                                      ? 'bg-[var(--color-feedback-error-bg)] text-[var(--color-text-danger)] border border-[var(--color-border-error)]' 
                                      : selectedPin.severity === 'medium'
                                      ? 'bg-[var(--color-feedback-warning-bg)] text-[var(--color-text-warning)] border border-[var(--color-border-warning)]'
                                      : 'bg-[var(--color-gray-150)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)]'
                                  }`}>
                                    {selectedPin.severity} Severity
                                  </span>
                                  <h4 className="text-[11px] font-bold mt-1 text-[var(--color-text-primary)]">{selectedPin.title}</h4>
                                </div>
                                <button 
                                  onClick={() => setSelectedPin(null)} 
                                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] text-[10px] cursor-pointer hover:underline"
                                >
                                  Clear Pin
                                </button>
                              </div>
                              <p className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">{selectedPin.description}</p>
                            </div>
                          ) : (
                            <div className="p-3 bg-[var(--color-brand-50)] border-b border-[var(--color-brand-100)] text-[var(--color-text-secondary)] text-[10px] flex items-center gap-1.5">
                              <Lightbulb className="h-3.5 w-3.5 text-[var(--color-brand-500)] shrink-0" />
                              <span>Click any **! pin** on the screenshot to inspect the design violation.</span>
                            </div>
                          )}

                          {/* Remedies list */}
                          <div className="p-4 space-y-2.5">
                            <h4 className="text-xs font-bold text-[var(--color-text-brand)] border-b border-[var(--color-border-default)] pb-1.5 flex items-center gap-1.5">
                              <Lightbulb className="h-4 w-4" />
                              Actionable Solutions & Remedies
                            </h4>
                            <div className="text-[11px] text-[var(--color-text-secondary)] space-y-3 leading-relaxed">
                              {critique.remedies.split('\n').map((line, idx) => {
                                if (line.startsWith('####')) {
                                  return <h5 key={idx} className="text-xs font-bold text-[var(--color-text-primary)] mt-3 leading-tight">{line.replace('####', '')}</h5>;
                                }
                                if (line.startsWith('###')) {
                                  return <h4 key={idx} className="text-xs font-extrabold text-[var(--color-text-brand)] mt-4 border-b border-[var(--color-border-subtle)] pb-1 leading-normal">{line.replace('###', '')}</h4>;
                                }
                                if (line.startsWith('* ') || line.startsWith('- ')) {
                                  return <li key={idx} className="ml-4 list-disc text-[var(--color-text-secondary)] pl-0.5">{line.substring(2)}</li>;
                                }
                                if (line.trim() === '') return null;
                                return <p key={idx}>{line}</p>;
                              })}
                            </div>
                          </div>

                        </div>
                      )}

                      <span className={`text-[9px] text-[var(--color-text-tertiary)] block ${m.sender === 'user' ? 'text-right pr-1' : 'text-left pl-1'}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {m.sender === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] text-[var(--color-brand-500)] flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isCritiquing && (
                <div className="flex gap-4 items-center p-4 bg-[var(--color-surface-card)] border border-[var(--color-border-default)] rounded-[var(--radius-xl)] shadow-xs w-fit">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand-500)]" />
                  <span className="text-xs text-[var(--color-text-secondary)]">Gemini is auditing visual heuristics and WCAG guidelines...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Form / Chat Input Area (Option A Input Box layout with Context Popover Wizard) */}
          <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-surface-card)] shrink-0 flex justify-center relative">
            <div className="w-full max-w-3xl relative">
              
              {/* INTERACTIVE FLOATING POPOVER WIZARD (Directly near the Input Bar) */}
              {goalWizardStep > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-3 z-30 p-5 bg-[var(--color-surface-card)] border-2 border-[var(--color-brand-500)] rounded-[var(--radius-2xl)] shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-200">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-[var(--color-brand-50)] flex items-center justify-center text-[var(--color-brand-600)] shrink-0">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-500)] leading-none">
                          AI Pre-Analysis · {
                            goalWizardStep === 1 
                              ? 'Step 1: Business Goals' 
                              : goalWizardStep === 2 
                              ? 'Step 2: User Goals' 
                              : 'Step 3: Style Guidelines'
                          }
                        </span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)] mt-1">
                          {detectedScreenType || 'Product Screenshot'}
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setGoalWizardStep(0)}
                      className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-[var(--color-gray-100)] cursor-pointer"
                      title="Cancel configuration"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleWizardSubmit} className="space-y-4">
                    {/* Quick Apply Previous Goals */}
                    {previousProjectGoals && goalWizardStep < 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBizGoal(previousProjectGoals.businessGoal);
                          setSelectedUserGoal(previousProjectGoals.userGoal);
                          setCustomBizGoal(previousProjectGoals.businessGoal);
                          setCustomUserGoal(previousProjectGoals.userGoal);
                          setGoalWizardStep(3); // Jump straight to style guide rules (Step 3)
                        }}
                        className="w-full mb-1 p-2.5 bg-[var(--color-brand-50)] hover:bg-[var(--color-brand-100)] border border-[var(--color-brand-200)]/80 text-[var(--color-brand-700)] text-left rounded-[var(--radius-lg)] text-[10px] font-bold flex items-center justify-between cursor-pointer transition shadow-2xs group"
                      >
                        <span className="truncate flex items-center gap-1.5 min-w-0">
                          <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand-500)] shrink-0 animate-pulse" />
                          <span>Use same goals as previous chats</span>
                        </span>
                        <span className="text-[9px] underline group-hover:text-[var(--color-brand-800)] shrink-0">Apply previous goals</span>
                      </button>
                    )}

                    {/* STEP 1: BUSINESS GOAL */}
                    {goalWizardStep === 1 && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                            What is the business goal of this screen?
                          </h4>
                          <p className="text-[10px] text-[var(--color-text-tertiary)]">
                            Choose one of the AI-suggested business goals or type your own custom goal.
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {suggestedBizGoals.map((g, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedBizGoal(g);
                                setCustomBizGoal('');
                              }}
                              className={`text-left text-[10px] p-2.5 rounded-[var(--radius-lg)] border transition flex items-start gap-2 cursor-pointer leading-normal ${
                                selectedBizGoal === g && !customBizGoal
                                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-text-brand)] font-semibold shadow-xs'
                                  : 'border-[var(--color-border-default)] hover:bg-[var(--color-gray-100)] bg-white text-[var(--color-text-secondary)]'
                              }`}
                            >
                              <div className={`h-3 w-3 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                                selectedBizGoal === g && !customBizGoal ? 'border-[var(--color-brand-500)]' : 'border-zinc-300'
                              }`}>
                                {selectedBizGoal === g && !customBizGoal && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)]" />}
                              </div>
                              <span>{g}</span>
                            </button>
                          ))}
                        </div>

                        <div className="space-y-1 pt-1">
                          <label className="block text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Or enter custom business goal:
                          </label>
                          <input
                            type="text"
                            value={customBizGoal}
                            onChange={(e) => {
                              setCustomBizGoal(e.target.value);
                              setSelectedBizGoal(e.target.value);
                            }}
                            placeholder="e.g. increase free trial conversions..."
                            className="w-full py-2 px-3 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] focus:bg-white text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-brand-500)]/10 h-10"
                            autoFocus
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 2: USER GOAL */}
                    {goalWizardStep === 2 && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                            What is the user's primary goal on this screen?
                          </h4>
                          <p className="text-[10px] text-[var(--color-text-tertiary)]">
                            Choose one of the AI-suggested user goals or type your own custom goal.
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {suggestedUserGoals.map((g, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedUserGoal(g);
                                setCustomUserGoal('');
                              }}
                              className={`text-left text-[10px] p-2.5 rounded-[var(--radius-lg)] border transition flex items-start gap-2 cursor-pointer leading-normal ${
                                selectedUserGoal === g && !customUserGoal
                                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-text-brand)] font-semibold shadow-xs'
                                  : 'border-[var(--color-border-default)] hover:bg-[var(--color-gray-100)] bg-white text-[var(--color-text-secondary)]'
                              }`}
                            >
                              <div className={`h-3 w-3 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                                selectedUserGoal === g && !customUserGoal ? 'border-[var(--color-brand-500)]' : 'border-zinc-300'
                              }`}>
                                {selectedUserGoal === g && !customUserGoal && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)]" />}
                              </div>
                              <span>{g}</span>
                            </button>
                          ))}
                        </div>

                        <div className="space-y-1 pt-1">
                          <label className="block text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Or enter custom user goal:
                          </label>
                          <input
                            type="text"
                            value={customUserGoal}
                            onChange={(e) => {
                              setCustomUserGoal(e.target.value);
                              setSelectedUserGoal(e.target.value);
                            }}
                            placeholder="e.g. pay with saved card..."
                            className="w-full py-2 px-3 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] focus:bg-white text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-brand-500)]/10 h-10"
                            autoFocus
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 3: DESIGN SYSTEM RULES */}
                    {goalWizardStep === 3 && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                            Are there any style guide or design rules to enforce?
                          </h4>
                          <p className="text-[10px] text-[var(--color-text-tertiary)]">
                            Specify any font sizing, padding rules, target heights, or spacing grids to check.
                          </p>
                        </div>
                        
                        <div className="space-y-1 pt-1">
                          <input
                            type="text"
                            value={customNotes}
                            onChange={(e) => setCustomNotes(e.target.value)}
                            placeholder="e.g., brand color #004A99, font Inter, buttons must be 44px height..."
                            className="w-full py-2 px-3 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] focus:bg-white text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-brand-500)]/10 h-10"
                            autoFocus
                          />
                        </div>
                      </div>
                    )}

                    {/* Buttons Footer */}
                    <div className="flex gap-2 justify-end border-t border-[var(--color-border-default)] pt-3.5">
                      <button
                        type="button"
                        onClick={() => setGoalWizardStep(0)}
                        className="px-4 py-2 border border-[var(--color-border-default)] hover:bg-[var(--color-gray-150)] text-[var(--color-text-secondary)] rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleWizardSkip}
                        className="px-4 py-2 border border-[var(--color-border-default)] hover:bg-[var(--color-gray-150)] text-[var(--color-text-secondary)] rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer"
                        title="Skip this question and use defaults"
                      >
                        Skip
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] text-white rounded-[var(--radius-lg)] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
                      >
                        {goalWizardStep === 3 ? 'Run Audit' : 'Next'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* PENDING IMAGE PREVIEW BAR */}
              {pendingImagePaths.length > 0 && (
                <div className="mb-2.5 p-2 bg-[var(--color-surface-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] space-y-2 animate-fade-in shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-1.5">
                    <p className="text-[10px] font-bold text-[var(--color-text-primary)]">Screenshots attached ({pendingImagePaths.length}/5)</p>
                    <button
                      type="button"
                      onClick={() => setPendingImagePaths([])}
                      className="text-[9px] font-semibold text-red-500 hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pendingImagePaths.map((path, idx) => (
                      <div key={idx} className="relative group/preview h-12 w-12 border border-[var(--color-border-default)] rounded-md overflow-hidden shrink-0 bg-white">
                        <img 
                          src={path} 
                          alt={`Pending screenshot ${idx + 1}`} 
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPendingImagePaths(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full cursor-pointer transition flex items-center justify-center"
                          title="Remove image"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[8px] text-[var(--color-text-tertiary)] uppercase font-mono tracking-wider pt-0.5">Ready to audit · Click send to start</p>
                </div>
              )}

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isCritiquing || goalWizardStep > 0}
                  className="p-3 border border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] rounded-[var(--radius-lg)] hover:bg-[var(--color-gray-100)] hover:border-[var(--color-border-strong)] transition flex items-center justify-center shrink-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] h-11 w-11 cursor-pointer"
                  title="Upload design screenshot"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </button>
                <textarea 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={goalWizardStep > 0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={
                    goalWizardStep > 0 
                      ? "Please complete the wizard popup above to proceed..." 
                      : "Type a message or upload screenshot..."
                  }
                  rows={1}
                  className="flex-1 py-3 px-4 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] focus:bg-white text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] text-xs focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition resize-none min-h-[44px] max-h-[120px] overflow-y-auto leading-normal py-2.5"
                />
                <button
                  type="submit"
                  disabled={isCritiquing || goalWizardStep > 0}
                  className="p-3 bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] active:bg-[var(--color-action-primary-pressed)] rounded-[var(--radius-lg)] text-[var(--color-text-inverse)] transition shrink-0 h-11 w-11 flex items-center justify-center cursor-pointer active:translate-y-[0.5px] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {uploadError && (
                <p className="text-[10px] text-[var(--color-text-danger)] mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {uploadError}
                </p>
              )}
            </div>
          </div>

        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center bg-[var(--color-surface-page)] text-center p-8">
          <div className="h-16 w-16 rounded-[var(--radius-2xl)] bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center text-[var(--color-brand-500)] mb-5 shadow-sm animate-pulse">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-text-brand)]">
            Welcome, {currentUser?.name || 'Venu'}
          </h2>
          <div className="mt-4 max-w-md space-y-2 bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-5 rounded-[var(--radius-xl)] shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              Review your designs as quickly as possible
            </h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              Skip extra meetings and design rationales. Run instant audits covering AI heuristics, psychology principles, and WCAG 2.1 accessibility.
            </p>
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-6 border-t border-[var(--color-border-default)] pt-4 w-full max-w-xs leading-normal">
            Select an existing sub-chat from the sidebar or click the <strong className="text-[var(--color-brand-500)] font-bold">+</strong> icon on a project to create a new session.
          </p>
          {projects.length === 0 && (
            <button 
              onClick={() => setShowProjModal(true)}
              className="mt-6 px-5 py-3 rounded-[var(--radius-lg)] bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] active:bg-[var(--color-action-primary-pressed)] text-[var(--color-text-inverse)] text-xs font-bold transition flex items-center gap-2 active:translate-y-[0.5px] cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" /> Create Your First Project
            </button>
          )}
        </main>
      )}

      {/* MODAL 1: CREATE PROJECT */}
      {showProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-[var(--color-surface-card)] border border-[var(--color-border-default)] rounded-[var(--radius-2xl)] space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">Project Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. E-Commerce Checkout Optimization"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-[var(--color-gray-100)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-3 text-xs text-[var(--color-text-primary)] focus:bg-[var(--color-gray-50)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 focus:outline-none transition h-11"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Goals, target constraints, or brand rules..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-[var(--color-gray-100)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-3 text-xs text-[var(--color-text-primary)] focus:bg-[var(--color-gray-50)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 focus:outline-none transition resize-none"
                />
              </div>
              <div className="flex gap-2.5 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowProjModal(false)}
                  className="px-4 py-2.5 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] rounded-[var(--radius-lg)] text-xs font-bold text-[var(--color-text-inverse)] transition active:translate-y-[0.5px] cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat creation modal removed - automatically handles Untitled Chat sessions now */}

    </div>
  );
}
