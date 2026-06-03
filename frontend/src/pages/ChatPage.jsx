import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import './ChatPage.css';

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvId = searchParams.get('id') ? parseInt(searchParams.get('id'), 10) : null;

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(initialConvId);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  // Poll intervals
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages and poll when activeConvId changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    fetchMessages(activeConvId);
    const interval = setInterval(() => {
      fetchMessages(activeConvId, true); // true to fetch silently without loading spinner
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConvId]);

  // Scroll to bottom on message change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function fetchConversations() {
    fetch('/api/chat/conversations')
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        setLoadingConvs(false);
        // If there is an initial conversation query param, check if it exists
        if (initialConvId && activeConvId === null) {
          const match = data.find(c => c.id === initialConvId);
          if (match) {
            setActiveConvId(initialConvId);
          }
        }
      })
      .catch(err => {
        console.error(err);
        setLoadingConvs(false);
      });
  }

  function fetchMessages(convId, silent = false) {
    if (!silent) setLoadingMessages(true);

    fetch(`/api/chat/conversations/${convId}/messages`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        if (!silent) setLoadingMessages(false);
      })
      .catch(err => {
        console.error(err);
        if (!silent) setLoadingMessages(false);
      });
  }

  function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConvId) return;
    setSendingMessage(true);

    fetch(`/api/chat/conversations/${activeConvId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessageText })
    })
      .then(res => res.json())
      .then(newMsg => {
        setMessages(prev => [...prev, newMsg]);
        setNewMessageText("");
        setSendingMessage(false);
        // Update last message in the local conversation list
        setConversations(prev => 
          prev.map(c => c.id === activeConvId ? { ...c, last_message: newMsg.message, last_message_time: newMsg.timestamp } : c)
        );
      })
      .catch(err => {
        console.error(err);
        setSendingMessage(false);
      });
  }

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <DashboardLayout role={user?.role}>
      <div className="chat-page-container">
        <div className="chat-card card">
          <div className="chat-layout">
            
            {/* Conversation sidebar (Left pane) */}
            <div className="chat-sidebar-pane">
              <div className="chat-sidebar-header">
                <h2>Conversations</h2>
              </div>
              
              <div className="chat-sidebar-list">
                {loadingConvs ? (
                  <div className="chat-loading">Loading conversations...</div>
                ) : conversations.length > 0 ? (
                  conversations.map(c => {
                    const isActive = c.id === activeConvId;
                    return (
                      <div
                        key={c.id}
                        className={`chat-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setActiveConvId(c.id);
                          setSearchParams({ id: c.id });
                        }}
                      >
                        <div className="chat-item-header">
                          <span className="chat-item-partner">{c.partner_name}</span>
                          <span className="badge badge-role" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {c.partner_role}
                          </span>
                        </div>
                        <div className="chat-item-idea">{c.idea_title}</div>
                        {c.last_message && (
                          <div className="chat-item-preview">
                            {c.last_message.length > 35 ? c.last_message.substring(0, 35) + '...' : c.last_message}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="chat-empty-sidebar">
                    No active chats yet. Start a discussion by expressing interest or accepting pitch offers.
                  </div>
                )}
              </div>
            </div>

            {/* Message thread (Right pane) */}
            <div className="chat-thread-pane">
              {activeConvId ? (
                <div className="chat-thread-layout">
                  {/* Header */}
                  <div className="chat-thread-header">
                    <div>
                      <div className="chat-header-partner">{activeConv?.partner_name}</div>
                      <div className="chat-header-idea">Campaign: {activeConv?.idea_title}</div>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="chat-thread-messages">
                    {loadingMessages ? (
                      <div className="chat-loading">Loading message history...</div>
                    ) : messages.length > 0 ? (
                      <div className="message-list">
                        {messages.map(msg => {
                          const isMe = msg.sender_id === user.id;
                          return (
                            <div key={msg.id} className={`message-wrapper ${isMe ? 'message-me' : 'message-them'}`}>
                              <div className="message-bubble">
                                <div className="message-text">{msg.message}</div>
                                <div className="message-time">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="chat-empty-thread">
                        No messages yet. Send a greeting to start the conversation!
                      </div>
                    )}
                  </div>

                  {/* Input sending bar */}
                  <form onSubmit={handleSendMessage} className="chat-thread-input-bar">
                    <input
                      type="text"
                      className="input-field chat-input"
                      placeholder="Type a message..."
                      value={newMessageText}
                      onChange={e => setNewMessageText(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={sendingMessage || !newMessageText.trim()}>
                      {sendingMessage ? '...' : 'Send'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="chat-empty-thread-welcome">
                  <span style={{ fontSize: '48px', color: 'var(--color-primary)', opacity: 0.4 }}>💬</span>
                  <h2>Your Messages</h2>
                  <p>Select a partner chat from the conversation list on the left to start communicating.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
