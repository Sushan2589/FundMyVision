import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import './ideator/IdeatorPages.css';
import './investor/InvestorPages.css';

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        loadMessages(activeConv.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeConv]);

  async function loadConversations() {
    try {
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      setConversations(data);
      if (data.length > 0 && !activeConv) {
        setActiveConv(data[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId) {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch {
      // ignore
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chat/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data]);
        setNewMessage('');
        loadConversations();
      }
    } catch {
      // ignore
    }
    setSending(false);
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const role = user?.role || 'investor';

  return (
    <DashboardLayout role={role}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">Chat with {role === 'investor' ? 'ideators' : 'investors'} about ideas</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">💬</div>
          <h3>No conversations yet</h3>
          <p>
            {role === 'investor'
              ? 'Express interest in an idea and get accepted to start chatting with ideators.'
              : 'Accept investor interests on your ideas to start conversations.'}
          </p>
        </div>
      ) : (
        <div className="chat-container">
          {/* Conversation List */}
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">Conversations</div>
            <div className="chat-conversation-list">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`chat-conversation-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                  onClick={() => setActiveConv(conv)}
                >
                  <div className="chat-conv-title">{conv.idea_title}</div>
                  <div className="chat-conv-user">{conv.other_user}</div>
                  {conv.last_message && (
                    <div className="chat-conv-preview">{conv.last_message}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="chat-main">
            {activeConv ? (
              <>
                <div className="chat-main-header">
                  <h3>{activeConv.idea_title}</h3>
                  <p>Chatting with {activeConv.other_user}</p>
                </div>

                <div className="chat-messages">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`chat-message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                    >
                      {msg.sender_id !== user?.id && (
                        <div className="chat-message-sender">{msg.sender_name}</div>
                      )}
                      <div>{msg.message}</div>
                      <div className="chat-message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  ))}
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
                    {sending ? '...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-empty-state">
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
