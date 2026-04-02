import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Styles pour le point de statut en ligne
const styles = {
  statusDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981', // Vert pour en ligne
    marginRight: '5px',
    verticalAlign: 'middle'
  }
};

const ChatHeader = ({ activeRoom, onClose, onBack, showRoomList, isDarkMode }) => {
  const { deleteRoom, userStatuses } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Déterminer si l'utilisateur est en ligne et récupérer son dernier statut
  const otherUserId = activeRoom?.other_user?.id;
  const userStatus = otherUserId ? userStatuses[otherUserId] : null;
  const isOnline = userStatus?.is_online || false;
  const lastSeen = userStatus?.last_seen ? new Date(userStatus.last_seen) : null;
  
  // Gérer la suppression d'une conversation
  const handleDeleteRoom = () => {
    if (activeRoom) {
      deleteRoom(activeRoom.id);
      setShowMenu(false);
      onBack();
    }
  };
  
  // Gérer le clic en dehors du menu pour le fermer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    // Ajouter l'écouteur d'événement lorsque le menu est ouvert
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  return (
    <div 
      className="chat-header"
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#f8f9fa',
        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e9ecef'}`
      }}
    >
      {!showRoomList && activeRoom ? (
        <>
          <button 
            className="back-button" 
            onClick={onBack}
            style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11H13V4L11,4V11H4L4,13H11V20H13V13H20V11Z" transform="rotate(45 12 12)"/>
            </svg>
          </button>
          
          <div className="room-info">
            <h4 
              className="room-name"
              style={{ color: isDarkMode ? '#f3f4f6' : '#212529' }}
            >
              {activeRoom.other_user ? activeRoom.other_user.name : 'Conversation privée'}
            </h4>
            <div 
              className="room-status"
              style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
            >
              {isOnline ? (
                <span className="online-status online">
                  <span style={styles.statusDot}></span> En ligne
                </span>
              ) : lastSeen ? (
                <span className="online-status offline">
                  Vu {formatDistanceToNow(lastSeen, { addSuffix: true, locale: fr })}
                </span>
              ) : (
                <span className="online-status offline">
                  Hors ligne
                </span>
              )}
            </div>
          </div>
          
          <div className="d-flex">
            <button 
              className="close-button me-2" 
              onClick={onClose}
              style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
            </button>
            
            <div className="custom-dropdown" ref={menuRef}>
              <button 
                className="menu-button" 
                onClick={() => setShowMenu(!showMenu)}
                style={{ 
                  color: isDarkMode ? '#9ca3af' : '#6c757d',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
                </svg>
              </button>
              
              {showMenu && (
                <div 
                  className="custom-menu"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '40px',
                    backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e9ecef'}`,
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    minWidth: '200px'
                  }}
                >
                  <button 
                    onClick={handleDeleteRoom}
                    className="menu-item"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 15px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: isDarkMode ? '#fc8181' : '#dc3545',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <h4 
            className="chat-title"
            style={{ color: isDarkMode ? '#f3f4f6' : '#212529' }}
          >
            Messages
          </h4>
          <button 
            className="close-button" 
            onClick={onClose}
            style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default ChatHeader;
