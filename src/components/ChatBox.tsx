import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Reply } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useEncryption } from '@/utils/crypto';

interface ChatBoxProps {
  socket: Socket | null;
  roomName: string;
  username: string;
  roomPassword?: string; // Add roomPassword prop
  encryptionEnabled?: boolean;
<<<<<<< HEAD
  fullHeight?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ socket, roomName, username, roomPassword = '', encryptionEnabled, fullHeight = false }) => {
=======
}

const ChatBox: React.FC<ChatBoxProps> = ({ socket, roomName, username, roomPassword = '', encryptionEnabled }) => {
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { encrypt, decrypt } = useEncryption(roomPassword);

  // Decrypt incoming messages
  const processIncomingMessages = async (msgs: ChatMessage[]) => {
      const decrypted = await Promise.all(msgs.map(async (msg) => {
          if (msg.encrypted && msg.iv) {
              try {
                  const decryptedText = await decrypt(msg.text, msg.iv);
                  return { ...msg, text: decryptedText };
              } catch (e) {
                  return { ...msg, text: '[Decryption Error]' };
              }
          }
          return msg;
      }));
      return decrypted;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('chat:sync', async (history: ChatMessage[]) => {
      const decryptedHistory = await processIncomingMessages(history);
      setMessages(decryptedHistory);
    });

    socket.on('chat:message', async (message: ChatMessage) => {
      const [decryptedMsg] = await processIncomingMessages([message]);
      setMessages((prev) => [...prev, decryptedMsg]);
    });

    return () => {
      socket.off('chat:sync');
      socket.off('chat:message');
    };
  }, [socket, roomPassword]); // Re-run if password changes

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    // Encrypt message before sending
    let encryptedText = newMessage;
    let iv = undefined;
    let isEncrypted = false;

    if (roomPassword && encryptionEnabled) {
        const result = await encrypt(newMessage);
        encryptedText = result.data;
        iv = result.iv;
        isEncrypted = true;
    }

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: username,
      text: encryptedText,
      timestamp: Date.now(),
      encrypted: isEncrypted,
      iv: iv,
      replyTo: replyTo ? {
        id: replyTo.id,
        sender: replyTo.sender,
        text: replyTo.text // Note: Reply preview might be plain text locally, but should be handled carefully
      } : undefined
    };

    socket.emit('chat:send', { roomName, message });
    setNewMessage('');
    setReplyTo(null);
  };

  const handleReply = (msg: ChatMessage) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  };

  return (
<<<<<<< HEAD
    <div className={`flex flex-col bg-[rgb(var(--hack-surface))]/80 border border-[rgb(var(--hack-border))] rounded-sm overflow-hidden mt-4 backdrop-blur-md animate-fade-in shadow-2xl ${fullHeight ? 'flex-1 h-full mt-0' : 'h-64'}`}>
=======
    <div className="flex flex-col h-64 bg-[rgb(var(--hack-surface))]/80 border border-[rgb(var(--hack-border))] rounded-sm overflow-hidden mt-4 backdrop-blur-md animate-fade-in shadow-2xl">
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
      <div className="bg-[rgb(var(--hack-text))]/5 border-b border-[rgb(var(--hack-border))] p-3 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--hack-accent))] animate-pulse shadow-[0_0_8px_rgba(var(--hack-accent),0.6)]"></div>
            <span className="text-[10px] font-mono text-[rgb(var(--hack-primary))] uppercase tracking-[3px] font-bold">
                SECURE CHANNEL {roomPassword ? '🔒' : ''}
            </span>
        </div>
        <div className="text-[9px] text-[rgb(var(--hack-text))]/40 font-mono tracking-widest">{messages.length} MSGS</div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.sender === username;
            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className={`text-[9px] font-mono tracking-[2px] ${isMe ? 'text-[rgb(var(--hack-primary))]' : 'text-[rgb(var(--hack-accent))]'}`}>
                    {isMe ? 'YOU' : msg.sender.toUpperCase()}
                  </span>
                  <span className="text-[8px] text-[rgb(var(--hack-text))]/40 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                <div className="relative max-w-[90%]">
                    <div 
                    className={`px-3.5 py-2 rounded-sm text-sm break-words border ${
                        isMe 
                        ? 'bg-[rgb(var(--hack-primary))]/10 text-[rgb(var(--hack-text))] border-[rgb(var(--hack-primary))]/20' 
                        : 'bg-[rgb(var(--hack-text))]/5 text-[rgb(var(--hack-text))]/80 border-[rgb(var(--hack-border))]'
                    }`}
                    >
                    {msg.replyTo && (
                        <div className={`text-[10px] mb-2 p-2 rounded-sm border-l-2 bg-black/20 ${
                        isMe 
                            ? 'border-[rgb(var(--hack-primary))]/50 text-[rgb(var(--hack-text))]/50' 
                            : 'border-[rgb(var(--hack-accent))]/50 text-[rgb(var(--hack-text))]/50'
                        }`}>
                        <div className="font-bold opacity-75 text-[9px] mb-0.5 flex items-center gap-1 uppercase tracking-wider">
                            <Reply size={8} /> {msg.replyTo.sender}
                        </div>
                        <div className="truncate italic opacity-80">{msg.replyTo.text}</div>
                        </div>
                    )}
                    {msg.text}
                    </div>
                    
                    <button 
                        onClick={() => handleReply(msg)}
                        className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-sm hover:bg-[rgb(var(--hack-text))]/10 text-[rgb(var(--hack-text))]/40 hover:text-[rgb(var(--hack-text))] ${isMe ? '-left-8' : '-right-8'}`}
                        title="Reply"
                    >
                        <Reply size={12} />
                    </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-[rgb(var(--hack-border))] bg-[rgb(var(--hack-surface))]/50 flex flex-col gap-2">
        {replyTo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between bg-[rgb(var(--hack-primary))]/10 border-l-2 border-[rgb(var(--hack-primary))] p-2 rounded-sm text-[10px] mb-1"
          >
            <div className="flex flex-col overflow-hidden pl-1">
              <span className="text-[rgb(var(--hack-primary))] font-bold text-[9px] flex items-center gap-1 uppercase tracking-wider">
                <Reply size={10} /> Replying to {replyTo.sender}
              </span>
              <span className="text-[rgb(var(--hack-text))]/40 truncate mt-0.5">{replyTo.text}</span>
            </div>
            <button 
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-[rgb(var(--hack-text))]/40 hover:text-[rgb(var(--hack-text))] transition-colors p-1"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={replyTo ? `Reply to ${replyTo.sender}...` : "TRANSMIT MESSAGE..."}
                className="w-full bg-[rgb(var(--hack-text))]/5 border border-[rgb(var(--hack-border))] rounded-sm px-4 py-2 text-sm text-[rgb(var(--hack-text))] focus:outline-none focus:border-[rgb(var(--hack-primary))]/50 focus:bg-[rgb(var(--hack-text))]/10 transition-all font-mono placeholder-[rgb(var(--hack-text))]/30 tracking-wide"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2.5 bg-gradient-to-r from-[rgb(var(--hack-primary))] to-[rgb(var(--hack-secondary))] text-white rounded-sm hover:shadow-[0_0_15px_rgba(var(--hack-primary),0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
