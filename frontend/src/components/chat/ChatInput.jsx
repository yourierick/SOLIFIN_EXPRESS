import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import EmojiPicker from 'emoji-picker-react';

const ChatInput = ({ onSendMessage, onTyping, isDarkMode }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // Gérer l'envoi du message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if ((message.trim() || file) && !isUploading) {
      onSendMessage(message.trim(), file);
      setMessage('');
      setFile(null);
      
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Gérer la sélection de fichier
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Vérifier la taille du fichier (max 1MB)
      if (selectedFile.size > 1 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. La taille maximale est de 1MB.');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  // Gérer la notification de frappe
  const handleTyping = () => {
    // Effacer le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Envoyer la notification de frappe
    onTyping();
    
    // Définir un nouveau timeout
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Gérer les touches spéciales (Entrée pour envoyer)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Gérer la sélection d'emoji
  const onEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji;
    const cursorPosition = document.querySelector('.message-input').selectionStart;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);
    
    setMessage(textBeforeCursor + emoji + textAfterCursor);
    setShowEmojiPicker(false);
  };
  
  // Fermer le sélecteur d'emoji quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) && 
          emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <form 
      className="chat-input-container" 
      onSubmit={handleSendMessage}
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#fff',
        borderTop: `1px solid ${isDarkMode ? '#374151' : '#e9ecef'}`
      }}
    >
      {file && (
        <div 
          className="file-preview"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#f8f9fa',
            color: isDarkMode ? '#f3f4f6' : '#212529'
          }}
        >
          <div className="file-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
              {file.type.startsWith('image/') ? 
                <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M8.5,13.5L11,16.5L14.5,12L19,18H5M8.5,7.5L11,10.5L14.5,6L19,12H5"/> :
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              }
            </svg>
            <span className="file-name">{file.name}</span>
          </div>
          <button 
            type="button" 
            className="remove-file-btn"
            style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
            onClick={() => setFile(null)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
      )}
      
      <div className="input-actions">
        <button 
          type="button" 
          className="attach-btn"
          style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
          onClick={() => fileInputRef.current.click()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M13,11H8V13H13V11M13,15H8V17H13V15Z"/>
          </svg>
        </button>
        
        <button 
          ref={emojiButtonRef}
          type="button" 
          className="emoji-btn"
          style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2M8.5,8A1.5,1.5 0 0,1 10,9.5A1.5,1.5 0 0,1 8.5,8M15.5,8A1.5,1.5 0 0,1 17,9.5A1.5,1.5 0 0,1 15.5,8M12,17.23C10.25,17.23 8.71,16.5 7.81,15.42L9.23,14C9.68,14.72 10.75,15.23 12,15.23C13.25,15.23 14.32,14.72 14.77,14L16.19,15.42C15.29,16.5 13.75,17.23 12,17.23Z"/>
          </svg>
        </button>
        
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="emoji-picker-container"
            style={{
              position: 'absolute',
              bottom: '70px',
              left: '40px',
              zIndex: 1000
            }}
          >
            <EmojiPicker 
              onEmojiClick={onEmojiClick} 
              theme={isDarkMode ? 'dark' : 'light'}
              searchDisabled={false}
              skinTonesDisabled
              width={300}
              height={400}
            />
          </div>
        )}
        
        <textarea
          className="message-input"
          placeholder="Tapez votre message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#fff',
            color: isDarkMode ? '#f3f4f6' : '#212529',
            borderColor: isDarkMode ? '#4b5563' : '#ced4da'
          }}
        />
        
        <Button 
          type="submit" 
          className="send-btn"
          disabled={(!message.trim() && !file) || isUploading}
        >
          {isUploading ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Envoi en cours...</span>
            </div>
          ) : (
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              style={{ 
                display: 'inline-block',
                verticalAlign: 'middle',
                minWidth: '20px',
                minHeight: '20px'
              }}
            >
              <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" fill="currentColor"/>
            </svg>
          )}
        </Button>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </form>
  );
};

export default ChatInput;

// Ajout de styles CSS pour le sélecteur d'emojis
const styles = `
  .emoji-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 10px;
    transition: color 0.2s;
  }
  
  .emoji-btn:hover {
    color: #4f46e5 !important;
  }
  
  .emoji-picker-container {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    overflow: hidden;
  }
`;

// Injecter les styles dans le document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
