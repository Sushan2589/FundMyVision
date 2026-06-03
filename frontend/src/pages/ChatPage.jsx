import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import './ChatPage.css';

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvId = searchParams.get('id') ? parseInt(searchParams.get('id'), 10) : null;
  const initialTab = searchParams.get('tab') || 'dm';

  // Tab state: 'dm' or 'groups'
  const [activeTab, setActiveTab] = useState(initialTab);

  // DM state
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(initialConvId);

  // Discussion Groups state
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);

  // Shared state
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef(null);

  // Poll DM conversations
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll discussion groups
  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch DM messages when activeConvId changes
  useEffect(() => {
    if (activeTab !== 'dm' || !activeConvId) {
      if (activeTab === 'dm') setMessages([]);
      return;
    }

    fetchDMMessages(activeConvId);
    const interval = setInterval(() => {
      fetchDMMessages(activeConvId, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeConvId, activeTab]);

  // Fetch group messages when activeGroupId changes
  useEffect(() => {
    if (activeTab !== 'groups' || !activeGroupId) {
      if (activeTab === 'groups') setMessages([]);
      return;
    }

    fetchGroupMessages(activeGroupId);
    fetchGroupMembers(activeGroupId);
    const interval = setInterval(() => {
      fetchGroupMessages(activeGroupId, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeGroupId, activeTab]);

  // Scroll to bottom on message change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // ---------- DM Functions ----------

  function fetchConversations() {
    fetch('/api/chat/conversations')
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        setLoadingConvs(false);
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

  function fetchDMMessages(convId, silent = false) {
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

  function handleSendDM(e) {
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
        setConversations(prev =>
          prev.map(c => c.id === activeConvId ? { ...c, last_message: newMsg.message, last_message_time: newMsg.timestamp } : c)
        );
      })
      .catch(err => {
        console.error(err);
        setSendingMessage(false);
      });
  }

  // ---------- Group Functions ----------

  function fetchGroups() {
    fetch('/api/discussion-groups')
      .then(res => res.json())
      .then(data => {
        setGroups(data);
      })
      .catch(err => console.error(err));
  }

  function fetchGroupMessages(groupId, silent = false) {
    if (!silent) setLoadingMessages(true);

    fetch(`/api/discussion-groups/${groupId}/messages`)
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

  function fetchGroupMembers(groupId) {
    fetch(`/api/discussion-groups/${groupId}/members`)
      .then(res => res.json())
      .then(data => setGroupMembers(data))
      .catch(err => console.error(err));
  }

  function handleSendGroupMessage(e) {
    e.preventDefault();
    if (!newMessageText.trim() || !activeGroupId) return;
    setSendingMessage(true);

    fetch(`/api/discussion-groups/${activeGroupId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessageText })
    })
      .then(res => res.json())
      .then(newMsg => {
        setMessages(prev => [...prev, newMsg]);
        setNewMessageText("");
        setSendingMessage(false);
        setGroups(prev =>
          prev.map(g => g.id === activeGroupId ? { ...g, last_message: newMsg.message, last_message_time: newMsg.timestamp, last_message_sender: newMsg.sender_name } : g)
        );
      })
      .catch(err => {
        console.error(err);
        setSendingMessage(false);
      });
  }

  // ---------- Tab Switching ----------

  function handleTabChange(tab) {
    setActiveTab(tab);
    setMessages([]);
    setShowMembers(false);
    setSearchTerm("");
    if (tab === 'dm') {
      setActiveGroupId(null);
      setGroupMembers([]);
    } else {
      setActiveConvId(null);
    }
  }

  // ---------- Current selections ----------

  const activeConv = conversations.find(c => c.id === activeConvId);
  const activeGroup = groups.find(g => g.id === activeGroupId);

  // Filter conversations/groups based on search term
  const filteredConversations = conversations.filter(c =>
    c.partner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.idea_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.idea_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = activeTab === 'dm' ? handleSendDM : handleSendGroupMessage;
  const hasActiveThread = activeTab === 'dm' ? !!activeConvId : !!activeGroupId;

  return (
    <DashboardLayout role={user?.role}>
      <div className="chat-page-container">
        <div className="chat-card card">
          <div className="chat-layout">

            {/* Conversation sidebar (Left pane) */}
            <div className="chat-sidebar-pane">
              {/* Tab switcher */}
              <div className="chat-tab-switcher">
                <button
                  className={`chat-tab-btn ${activeTab === 'dm' ? 'active' : ''}`}
                  onClick={() => handleTabChange('dm')}
                >
                  <span className="chat-tab-icon">💬</span>
                  Direct
                </button>
                <button
                  className={`chat-tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
                  onClick={() => handleTabChange('groups')}
                >
                  <span className="chat-tab-icon">👥</span>
                  Groups
                </button>
              </div>

              {/* Search Bar */}
              <div className="chat-search-bar">
                <span className="chat-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder={activeTab === 'dm' ? "Search conversations..." : "Search groups..."}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="chat-search-input"
                />
                {searchTerm && (
                  <button className="chat-search-clear" onClick={() => setSearchTerm('')} type="button">
                    ✕
                  </button>
                )}
              </div>

              <div className="chat-sidebar-list">
                {activeTab === 'dm' ? (
                  /* DM Conversation List */
                  loadingConvs ? (
                    <div className="chat-loading">Loading conversations...</div>
                  ) : filteredConversations.length > 0 ? (
                    filteredConversations.map(c => {
                      const isActive = c.id === activeConvId;
                      return (
                        <div
                          key={c.id}
                          className={`chat-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            setActiveConvId(c.id);
                            setSearchParams({ id: c.id, tab: 'dm' });
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
                  ) : conversations.length > 0 ? (
                    <div className="chat-empty-sidebar">
                      No conversations match "{searchTerm}"
                    </div>
                  ) : (
                    <div className="chat-empty-sidebar">
                      No direct chats yet. Start a discussion by expressing interest or accepting pitch offers.
                    </div>
                  )
                ) : (
                  /* Discussion Group List */
                  filteredGroups.length > 0 ? (
                    filteredGroups.map(g => {
                      const isActive = g.id === activeGroupId;
                      return (
                        <div
                          key={g.id}
                          className={`chat-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            setActiveGroupId(g.id);
                            setSearchParams({ tab: 'groups', gid: g.id });
                          }}
                        >
                          <div className="chat-item-header">
                            <span className="chat-item-partner">{g.idea_title}</span>
                            <span className="chat-group-member-count">{g.member_count} members</span>
                          </div>
                          <div className="chat-item-idea">Discussion Group</div>
                          {g.last_message && (
                            <div className="chat-item-preview">
                              <strong>{g.last_message_sender}: </strong>
                              {g.last_message.length > 25 ? g.last_message.substring(0, 25) + '...' : g.last_message}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : groups.length > 0 ? (
                    <div className="chat-empty-sidebar">
                      No groups match "{searchTerm}"
                    </div>
                  ) : (
                    <div className="chat-empty-sidebar">
                      No discussion groups yet. Groups are automatically created when investors connect with your ideas.
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Message thread (Right pane) */}
            <div className="chat-thread-pane">
              {hasActiveThread ? (
                <div className="chat-thread-layout">
                  {/* Header */}
                  <div className="chat-thread-header">
                    {activeTab === 'dm' ? (
                      <div>
                        <div className="chat-header-partner">{activeConv?.partner_name}</div>
                        <div className="chat-header-idea">Campaign: {activeConv?.idea_title}</div>
                      </div>
                    ) : (
                      <div className="chat-group-header-row">
                        <div>
                          <div className="chat-header-partner">
                            <span className="chat-group-icon">👥</span>
                            {activeGroup?.idea_title}
                          </div>
                          <div className="chat-header-idea">Discussion Group · {activeGroup?.member_count} members</div>
                        </div>
                        <button
                          className="chat-members-toggle-btn"
                          onClick={() => setShowMembers(!showMembers)}
                          title="View members"
                        >
                          {showMembers ? '✕' : '👤 Members'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Members panel (group only) */}
                  {activeTab === 'groups' && showMembers && (
                    <div className="chat-members-panel">
                      <div className="chat-members-title">Group Members</div>
                      {groupMembers.map(m => (
                        <div key={m.id} className="chat-member-item">
                          <div className="chat-member-avatar">
                            {m.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="chat-member-info">
                            <span className="chat-member-name">{m.username}</span>
                            <span className={`chat-member-role-badge ${m.role}`}>{m.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

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
                                {/* Show sender name in group chats for messages from others */}
                                {activeTab === 'groups' && !isMe && (
                                  <div className="message-sender-name">
                                    {msg.sender_name}
                                    <span className={`message-sender-role ${msg.sender_role}`}>
                                      {msg.sender_role}
                                    </span>
                                  </div>
                                )}
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
                        {activeTab === 'dm'
                          ? 'No messages yet. Send a greeting to start the conversation!'
                          : 'No messages yet. Start the group discussion!'
                        }
                      </div>
                    )}
                  </div>

                  {/* Input sending bar */}
                  <form onSubmit={handleSendMessage} className="chat-thread-input-bar">
                    <input
                      type="text"
                      className="input-field chat-input"
                      placeholder={activeTab === 'dm' ? "Type a message..." : "Message the group..."}
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
                  <span style={{ fontSize: '48px', color: 'var(--color-primary)', opacity: 0.4 }}>
                    {activeTab === 'dm' ? '💬' : '👥'}
                  </span>
                  <h2>{activeTab === 'dm' ? 'Your Messages' : 'Discussion Groups'}</h2>
                  <p>
                    {activeTab === 'dm'
                      ? 'Select a partner chat from the conversation list on the left to start communicating.'
                      : 'Select a discussion group to join the conversation with all connected investors and ideators.'
                    }
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
