import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useTheme } from "../../contexts/ThemeContext";
import ChatRoomList from "./ChatRoomList";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import "./ChatInterface.css";

const ChatInterface = () => {
  const {
    activeRoom,
    setActiveRoom,
    messages,
    loading,
    typingUsers,
    userStatuses,
    sendMessage,
    sendTypingNotification,
    totalUnreadCount,
    isChatExpanded,
    setIsChatExpanded,
    fetchChatRooms,
  } = useChat();

  const { isDarkMode } = useTheme();

  // Utiliser l'état partagé via le contexte au lieu de l'état local
  // Si un salon actif est déjà sélectionné, afficher directement le chat
  const [showRoomList, setShowRoomList] = useState(!activeRoom);
  const chatContainerRef = useRef(null);

  // Fonction pour basculer l'état d'expansion du chat
  const toggleChat = () => {
    const newExpandedState = !isChatExpanded;
    setIsChatExpanded(newExpandedState);

    // La synchronisation avec le service de polling est gérée dans le contexte
    // Si on ouvre le chat, récupérer les salons de chat
    if (newExpandedState) {
      fetchChatRooms();
    }
  };

  // Fonction pour basculer entre la liste des salons et les messages
  const toggleView = () => {
    if (activeRoom) {
      setShowRoomList(!showRoomList);
    } else {
      setShowRoomList(true);
    }
  };

  // Fonction pour sélectionner un salon
  const selectRoom = (room) => {
    setActiveRoom(room);
    setShowRoomList(false);
  };

  // Fonction pour revenir à la liste des salons
  const backToRoomList = () => {
    setShowRoomList(true);
  };

  // Fonction pour envoyer un message
  const handleSendMessage = async (message, file) => {
    if (activeRoom) {
      await sendMessage(activeRoom.id, message, file);
    }
  };

  // Fonction pour envoyer une notification de frappe
  const handleTyping = () => {
    if (activeRoom) {
      sendTypingNotification(activeRoom.id);
    }
  };

  // Faire défiler vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    if (chatContainerRef?.current && messages?.length > 0 && !showRoomList) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [messages, showRoomList]);

  // Récupérer les salons de chat lorsque l'interface est ouverte
  useEffect(() => {
    if (isChatExpanded) {
      fetchChatRooms();
    }
  }, [isChatExpanded, fetchChatRooms]);

  // Mettre à jour showRoomList lorsque activeRoom change
  useEffect(() => {
    if (activeRoom) {
      setShowRoomList(false);
    }
  }, [activeRoom]);

  return (
    <div
      className={`chat-interface ${isChatExpanded ? "expanded" : "collapsed"}`}
    >
      {!isChatExpanded ? (
        <div className="chat-button" onClick={toggleChat}>
          <svg width="24" height="24" viewBox="0 0 122.88 108.25" fill="currentColor">
            <path d="M51.16,93.74c13,12.49,31.27,16.27,49.59,8.46l15.37,6L111,96.13c17.08-13.68,14-32.48,1.44-45.3a44.38,44.38,0,0,1-4.88,13.92A51.45,51.45,0,0,1,93.45,80.84a62.51,62.51,0,0,1-19.73,10,71.07,71.07,0,0,1-22.56,2.92ZM74.74,36.13a6.68,6.68,0,1,1-6.68,6.68,6.68,6.68,0,0,1,6.68-6.68Zm-44.15,0a6.68,6.68,0,1,1-6.68,6.68,6.68,6.68,0,0,1,6.68-6.68Zm22.08,0A6.68,6.68,0,1,1,46,42.81a6.68,6.68,0,0,1,6.68-6.68ZM54,0H54c14.42.44,27.35,5.56,36.6,13.49,9.41,8.07,15,19,14.7,31v0c-.36,12-6.66,22.61-16.55,30.11C79,82.05,65.8,86.4,51.38,86a64.68,64.68,0,0,1-11.67-1.4,61,61,0,0,1-10-3.07L7.15,90.37l7.54-17.92A43.85,43.85,0,0,1,4,59,36.2,36.2,0,0,1,0,41.46c.36-12,6.66-22.61,16.55-30.12C26.3,4,39.53-.4,54,0ZM53.86,5.2h0C40.59,4.82,28.52,8.77,19.69,15.46,11,22,5.5,31.28,5.19,41.6A31.2,31.2,0,0,0,8.61,56.67a39.31,39.31,0,0,0,10.81,13L21,70.87,16.68,81.05l13.08-5.14,1,.42a55.59,55.59,0,0,0,10.05,3.18A59,59,0,0,0,51.52,80.8c13.22.39,25.29-3.56,34.12-10.26C94.31,64,99.83,54.73,100.15,44.4v0c.3-10.32-4.65-19.85-12.9-26.92C78.85,10.26,67.06,5.6,53.87,5.2Z"/>
          </svg>
          {totalUnreadCount > 0 && (
            <span className="unread-badge">{totalUnreadCount}</span>
          )}
        </div>
      ) : (
        <div
          className="chat-container"
          style={{
            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
            color: isDarkMode ? "#f3f4f6" : "#000000",
            boxShadow: isDarkMode
              ? "0 4px 12px rgba(0, 0, 0, 0.3)"
              : "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          <ChatHeader
            activeRoom={activeRoom}
            onClose={toggleChat}
            onBack={backToRoomList}
            showRoomList={showRoomList}
            isDarkMode={isDarkMode}
          />

          <div className="chat-content" ref={chatContainerRef}>
            {showRoomList ? (
              <ChatRoomList onSelectRoom={selectRoom} isDarkMode={isDarkMode} />
            ) : (
              <ChatMessages
                messages={messages}
                loading={loading}
                typingUsers={typingUsers}
                isDarkMode={isDarkMode}
              />
            )}
          </div>

          {!showRoomList && activeRoom && (
            <ChatInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
