import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Button,
  Fade,
  Grow,
  Zoom,
  Divider,
  useMediaQuery,
  useTheme as useMuiTheme,
  Avatar,
  Chip,
  Stack,
} from "@mui/material";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../contexts/ThemeContext";

// Design System Tokens
const DESIGN_SYSTEM = {
  spacing: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6,
  },
  borderRadius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "32px",
  },
  shadows: {
    glass: "0 8px 32px rgba(0, 0, 0, 0.1)",
    glow: "0 0 20px rgba(74, 222, 128, 0.6)",
    elevated: "0 16px 48px rgba(0, 0, 0, 0.15)",
  },
  transitions: {
    fast: "0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    smooth: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// Theme Configuration
const createTheme = (isDark) => ({
  name: isDark ? "dark" : "light",
  colors: {
    primary: isDark ? "#4ade80" : "#16a34a",
    secondary: isDark ? "#22c55e" : "#15803d",
    background: {
      primary: isDark 
        ? "linear-gradient(145deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 50%, rgba(17, 24, 39, 0.95) 100%)"
        : "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 50%, rgba(255, 255, 255, 0.95) 100%)",
      secondary: isDark 
        ? "linear-gradient(145deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)"
        : "linear-gradient(145deg, rgba(74, 222, 128, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)",
      glass: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
      overlay: isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.15)",
    },
    text: {
      primary: isDark ? "#ffffff" : "#1e293b",
      secondary: isDark ? "#4ade80" : "#16a34a",
      muted: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
    },
    border: {
      primary: isDark ? "rgba(74, 222, 128, 0.2)" : "rgba(74, 222, 128, 0.3)",
      secondary: isDark ? "rgba(74, 222, 128, 0.3)" : "rgba(74, 222, 128, 0.4)",
    },
  },
  effects: {
    blur: "blur(20px) saturate(180%)",
    glow: isDark ? "0 0 20px rgba(74, 222, 128, 0.6)" : "0 0 20px rgba(74, 222, 128, 0.8)",
  },
});

// Responsive Hook
const useResponsive = () => {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down("md"));
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("lg"));

  return useMemo(() => ({
    isMobile,
    isTablet,
    isDesktop,
    spacing: {
      container: isMobile ? DESIGN_SYSTEM.spacing.sm : DESIGN_SYSTEM.spacing.lg,
      content: isMobile ? DESIGN_SYSTEM.spacing.xs : DESIGN_SYSTEM.spacing.md,
    },
    sizing: {
      avatar: isMobile ? 48 : 64,
      button: { 
        height: isMobile ? 40 : 48, 
        minWidth: isMobile ? 40 : 100 
      },
      chip: { height: isMobile ? 28 : 32 },
    },
    typography: {
      title: isMobile ? "1.1rem" : "1.4rem",
      body: isMobile ? "0.9rem" : "1rem",
      caption: isMobile ? "0.75rem" : "0.8rem",
    },
  }), [isMobile, isTablet, isDesktop]);
};

// Animation Components
const AnimatedIcon = ({ children, delay = 0, animation = "pulse" }) => {
  const animations = {
    pulse: {
      "@keyframes pulse": {
        "0%, 100%": { transform: "scale(1)", opacity: 1 },
        "50%": { transform: "scale(1.05)", opacity: 0.8 },
      },
      animation: "pulse 2s ease-in-out infinite",
    },
    bell: {
      "@keyframes bellRing": {
        "0%, 100%": { transform: "rotate(0deg) scale(1)" },
        "10%": { transform: "rotate(8deg) scale(1.05)" },
        "20%": { transform: "rotate(-8deg) scale(1.05)" },
        "30%": { transform: "rotate(4deg) scale(1.02)" },
        "40%": { transform: "rotate(-4deg) scale(1.02)" },
        "50%": { transform: "rotate(0deg) scale(1)" },
      },
      animation: "bellRing 3s ease-in-out infinite",
    },
    sparkle: {
      "@keyframes sparkle": {
        "0%, 100%": { opacity: 0.4, transform: "scale(0.8)" },
        "50%": { opacity: 1, transform: "scale(1.2)" },
      },
      animation: "sparkle 2s ease-in-out infinite",
    },
    float: {
      "@keyframes float": {
        "0%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
        "50%": { transform: "translate(-50%, -55%) scale(1.05)" },
      },
      animation: "float 6s ease-in-out infinite",
    },
  };

  return (
    <Box sx={{ 
      ...animations[animation], 
      animationDelay: `${delay}ms` 
    }}>
      {children}
    </Box>
  );
};

// Message Type Icons
const MessageIcon = ({ type, theme, sizing }) => {
  const icons = {
    image: {
      component: PhotoIcon,
      color: "#3b82f6",
      bg: theme.colors.background.secondary,
    },
    video: {
      component: FilmIcon,
      color: "#ec4899",
      bg: theme.colors.background.secondary,
    },
    text: {
      component: DocumentTextIcon,
      color: "#8b5cf6",
      bg: theme.colors.background.secondary,
    },
  };

  const { component: Icon, color, bg } = icons[type] || icons.text;

  return (
    <Avatar
      sx={{
        background: bg,
        backdropFilter: "blur(10px)",
        width: sizing.avatar,
        height: sizing.avatar,
        boxShadow: DESIGN_SYSTEM.shadows.glass,
      }}
    >
      <Icon 
        className={sizing.avatar === 48 ? "h-6 w-6" : "h-8 w-8"} 
        style={{ color }} 
      />
    </Avatar>
  );
};

// Message Content Renderer
const MessageRenderer = ({ message, theme, responsive, fadeIn, animateIcon }) => {
  const renderMedia = () => {
    switch (message.type) {
      case "image":
        return (
          <Box sx={{ 
            width: "100%", 
            display: "flex", 
            justifyContent: "center", 
            position: "relative",
            overflow: "hidden",
            borderRadius: DESIGN_SYSTEM.borderRadius.lg,
            boxShadow: DESIGN_SYSTEM.shadows.glass,
            transition: DESIGN_SYSTEM.transitions.smooth,
            "&:hover": { transform: "scale(1.02)" },
            maxHeight: responsive.isMobile ? "30vh" : "40vh",
          }}>
            <img
              src={message.media_url}
              alt={message.title}
              style={{
                width: "100%",
                maxHeight: responsive.isMobile ? "300px" : "450px",
                objectFit: "contain",
              }}
            />
          </Box>
        );

      case "video":
        return (
          <Box sx={{ 
            width: "100%", 
            display: "flex", 
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            borderRadius: DESIGN_SYSTEM.borderRadius.lg,
            boxShadow: DESIGN_SYSTEM.shadows.glass,
            maxHeight: responsive.isMobile ? "30vh" : "40vh",
          }}>
            <video
              controls
              style={{
                width: "100%",
                maxHeight: responsive.isMobile ? "300px" : "450px",
              }}
            >
              <source src={message.media_url} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ textAlign: "center", mb: DESIGN_SYSTEM.spacing.lg }}>
      {renderMedia()}

      <Fade in={fadeIn} timeout={800} style={{ transitionDelay: "300ms" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, justifyContent: "center" }}>
          <Typography
            variant="body1"
            sx={{
              px: responsive.spacing.content,
              py: responsive.spacing.container,
              borderRadius: DESIGN_SYSTEM.borderRadius.lg,
              maxWidth: "100%",
              lineHeight: 1.6,
              color: theme.colors.text.primary,
              fontSize: responsive.typography.body,
              flex: 1,
            }}
          >
            {message.description}
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
};

// Navigation Component
const Navigation = ({ 
  currentIndex, 
  totalMessages, 
  onPrevious, 
  onNext, 
  onClose, 
  theme, 
  responsive 
}) => {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalMessages - 1;
  const isLast = currentIndex === totalMessages - 1;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        px: responsive.spacing.content,
        py: responsive.isMobile ? 0.5 : 1,
        background: theme.colors.background.secondary,
        borderRadius: responsive.isMobile ? DESIGN_SYSTEM.borderRadius.sm : DESIGN_SYSTEM.borderRadius.md,
        backdropFilter: "blur(10px)",
        boxShadow: DESIGN_SYSTEM.shadows.glass,
      }}
    >
      <Button
        startIcon={<ChevronLeftIcon className="h-3 w-3" />}
        onClick={onPrevious}
        disabled={!hasPrevious}
        sx={{
          color: hasPrevious ? theme.colors.text.secondary : theme.colors.text.muted,
          background: hasPrevious ? theme.colors.background.secondary : "transparent",
          backdropFilter: hasPrevious ? "blur(8px)" : "none",
          borderRadius: DESIGN_SYSTEM.borderRadius.sm,
          px: responsive.isMobile ? 1 : 1.5,
          py: 0.5,
          textTransform: "none",
          fontWeight: 600,
          fontSize: responsive.isMobile ? "0.7rem" : "0.75rem",
          minWidth: responsive.isMobile ? 28 : 70,
          height: responsive.isMobile ? 28 : 36,
          boxShadow: hasPrevious ? DESIGN_SYSTEM.shadows.glass : "none",
          transition: DESIGN_SYSTEM.transitions.smooth,
          "&:hover:not(.Mui-disabled)": {
            background: theme.colors.background.secondary,
            transform: "translateY(-1px)",
            boxShadow: theme.effects.glow,
          },
          "&.Mui-disabled": {
            opacity: 0.5,
            cursor: "not-allowed",
          },
        }}
      >
        {!responsive.isMobile && "Précédent"}
      </Button>
      
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.3 }}>
        <Typography
          variant="body2"
          sx={{
            px: responsive.isMobile ? 1 : 1.5,
            py: 0.3,
            borderRadius: "12px",
            background: theme.colors.background.secondary,
            color: theme.colors.text.secondary,
            fontWeight: 700,
            fontSize: responsive.isMobile ? "0.65rem" : "0.7rem",
            backdropFilter: "blur(8px)",
            boxShadow: DESIGN_SYSTEM.shadows.glass,
            minWidth: responsive.isMobile ? "45px" : "60px",
            textAlign: "center",
          }}
        >
          {currentIndex + 1} / {totalMessages}
        </Typography>
        
        {responsive.isMobile && (
          <Box sx={{ display: "flex", gap: 0.2 }}>
            {Array.from({ length: totalMessages }, (_, index) => (
              <Box
                key={index}
                sx={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: index === currentIndex 
                    ? theme.colors.text.secondary 
                    : theme.colors.text.muted,
                  transition: DESIGN_SYSTEM.transitions.smooth,
                  boxShadow: index === currentIndex ? theme.effects.glow : "none",
                }}
              />
            ))}
          </Box>
        )}
      </Box>
      
      <Button
        endIcon={hasNext ? <ChevronRightIcon className="h-3 w-3" /> : null}
        onClick={onNext}
        variant={hasNext ? "text" : "contained"}
        sx={{
          color: hasNext ? theme.colors.text.secondary : theme.colors.text.primary,
          background: hasNext 
            ? theme.colors.background.secondary 
            : theme.colors.primary,
          backdropFilter: hasNext ? "blur(8px)" : "none",
          borderRadius: DESIGN_SYSTEM.borderRadius.sm,
          px: responsive.isMobile ? 1 : 1.5,
          py: 0.5,
          textTransform: "none",
          fontWeight: 600,
          fontSize: responsive.isMobile ? "0.7rem" : "0.75rem",
          minWidth: responsive.isMobile ? 28 : 70,
          height: responsive.isMobile ? 28 : 36,
          boxShadow: hasNext ? DESIGN_SYSTEM.shadows.glass : theme.effects.glow,
          transition: DESIGN_SYSTEM.transitions.smooth,
          "&:hover": {
            background: hasNext 
              ? theme.colors.background.secondary 
              : theme.colors.secondary,
            transform: "translateY(-1px)",
            boxShadow: theme.effects.glow,
          },
        }}
      >
        {hasNext ? (responsive.isMobile ? "" : "Suivant") : "Fermer"}
      </Button>
    </Box>
  );
};

// Header Component
const Header = ({ message, onClose, theme, responsive, currentIndex, messagesLength }) => (
  <DialogTitle
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: 0,
      py: responsive.isMobile ? 1.5 : 2,
      px: responsive.spacing.content,
      backgroundColor: "transparent",
      position: "relative",
      zIndex: 1,
      textAlign: "center",
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        position: "relative",
      }}
    >
      <AnimatedIcon animation="bell">
        <Avatar
          sx={{
            background: theme.colors.background.secondary,
            backdropFilter: "blur(10px)",
            width: responsive.isMobile ? 36 : 48,
            height: responsive.isMobile ? 36 : 48,
            boxShadow: theme.effects.glow,
            mb: 1,
          }}
        >
          <BellIcon 
            className={responsive.sizing.avatar === 48 ? "h-5 w-5" : "h-6 w-6"} 
            style={{ color: theme.colors.text.secondary }} 
          />
        </Avatar>
      </AnimatedIcon>
      
      {!responsive.isMobile && (
        <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
          {[0, 0.3, 0.6].map((delay, index) => (
            <AnimatedIcon key={index} delay={delay * 1000} animation="sparkle">
              <SparklesIcon 
                className="h-3 w-3" 
                style={{ color: theme.colors.text.secondary }} 
              />
            </AnimatedIcon>
          ))}
        </Stack>
      )}
      
      <Typography
        variant={responsive.isMobile ? "subtitle1" : "h6"}
        component="div"
        sx={{
          fontWeight: 600,
          fontSize: responsive.isMobile ? "1rem" : "1.2rem",
          color: theme.colors.text.primary,
          mb: 1,
          textAlign: "center",
          textShadow: theme.name === "dark" 
            ? "0 1px 2px rgba(0, 0, 0, 0.4)" 
            : "0 1px 1px rgba(0, 0, 0, 0.1)",
          letterSpacing: "-0.01em",
        }}
      >
        {message.title}
      </Typography>
      
      <Fade in={true} timeout={600}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Chip
            icon={<CalendarDaysIcon className="h-3 w-3" />}
            label={new Date(message.created_at).toLocaleDateString()}
            size="small"
            sx={{
              background: theme.colors.background.secondary,
              color: theme.colors.text.secondary,
              fontSize: responsive.isMobile ? "0.7rem" : "0.75rem",
              fontWeight: 600,
              height: responsive.isMobile ? 24 : 28,
              borderRadius: "12px",
              backdropFilter: "blur(8px)",
              "& .MuiChip-icon": { 
                color: theme.colors.text.secondary,
                fontSize: "0.7rem"
              },
            }}
          />
          <Chip
            icon={<CheckCircleIcon className="h-3 w-3" />}
            label={`${currentIndex + 1}/${messagesLength}`}
            size="small"
            sx={{
              background: theme.colors.background.secondary,
              color: theme.colors.text.secondary,
              fontSize: responsive.isMobile ? "0.7rem" : "0.75rem",
              fontWeight: 600,
              height: responsive.isMobile ? 24 : 28,
              borderRadius: "12px",
              backdropFilter: "blur(8px)",
              "& .MuiChip-icon": { 
                color: theme.colors.text.secondary,
                fontSize: "0.7rem"
              },
            }}
          />
        </Box>
      </Fade>
    </Box>
    
    <IconButton
      edge="end"
      onClick={onClose}
      aria-label="close"
      sx={{
        position: "absolute",
        top: responsive.isMobile ? 8 : 12,
        right: responsive.isMobile ? 8 : 12,
        color: theme.colors.text.primary,
        width: responsive.isMobile ? 32 : 40,
        height: responsive.isMobile ? 32 : 40,
        borderRadius: "10px",
      }}
    >
      <XMarkIcon className={responsive.sizing.button.height === 32 ? "h-4 w-4" : "h-5 w-5"} />
    </IconButton>
  </DialogTitle>
);

// Main Component
const BroadcastMessageModal = ({
  open,
  onClose,
  messages = [],
  onMessageSeen,
}) => {
  const { isDarkMode } = useTheme();
  const responsive = useResponsive();
  const theme = useMemo(() => createTheme(isDarkMode), [isDarkMode]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const [animateIcon, setAnimateIcon] = useState(false);

  // Optimized styles with useMemo
  const modalStyles = useMemo(() => ({
    paper: {
      background: theme.colors.background.primary,
      backdropFilter: theme.effects.blur,
      WebkitBackdropFilter: theme.effects.blur,
      color: theme.colors.text.primary,
      borderRadius: responsive.isMobile ? DESIGN_SYSTEM.borderRadius.xl : DESIGN_SYSTEM.borderRadius.xxl,
      boxShadow: DESIGN_SYSTEM.shadows.elevated,
      overflow: "hidden",
      maxHeight: responsive.isMobile ? "95vh" : "90vh",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      border: isDarkMode ? "2px solid transparent" : `2px solid ${theme.colors.border.primary}`,
      backgroundClip: "padding-box, border-box",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "120px",
        background: isDarkMode
          ? "radial-gradient(ellipse at top center, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0) 60%)"
          : "radial-gradient(ellipse at top center, rgba(74, 222, 128, 0.25) 0%, rgba(74, 222, 128, 0) 60%)",
        zIndex: 0,
        pointerEvents: "none",
      },
      "&::after": {
        content: '""',
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "300px",
        height: "300px",
        background: isDarkMode
          ? "radial-gradient(circle, rgba(74, 222, 128, 0.05) 0%, rgba(74, 222, 128, 0) 70%)"
          : "radial-gradient(circle, rgba(74, 222, 128, 0.08) 0%, rgba(74, 222, 128, 0) 70%)",
        borderRadius: "50%",
        zIndex: 0,
        pointerEvents: "none",
      },
    },
    backdrop: {
      backdropFilter: "blur(12px) saturate(150%)",
      WebkitBackdropFilter: "blur(12px) saturate(150%)",
      backgroundColor: theme.colors.background.overlay,
    },
    content: {
      pt: 0,
      pb: responsive.spacing.container,
      px: responsive.spacing.content,
      maxHeight: responsive.isMobile ? "70vh" : "65vh",
      overflow: "auto",
      scrollbarWidth: "thin",
      "&::-webkit-scrollbar": {
        width: "6px",
        backgroundColor: "transparent",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: theme.colors.border.primary,
        borderRadius: "6px",
        "&:hover": {
          backgroundColor: theme.colors.border.secondary,
        },
      },
      overflowX: "hidden",
      position: "relative",
      zIndex: 1,
    },
    divider: {
      my: responsive.spacing.container,
      borderColor: theme.colors.border.primary,
      opacity: 0.8,
      borderWidth: "2px",
      borderRadius: "2px",
    },
  }), [theme, responsive, isDarkMode]);

  // Optimized handlers with useCallback
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setFadeIn(false);
      setAnimateIcon(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setFadeIn(true);
      }, 300);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < messages.length - 1) {
      setFadeIn(false);
      setAnimateIcon(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setFadeIn(true);
      }, 300);
    } else {
      onClose();
    }
  }, [currentIndex, messages.length, onClose]);

  // Icon animation effect
  useEffect(() => {
    if (fadeIn) {
      const timer = setTimeout(() => setAnimateIcon(true), 200);
      return () => clearTimeout(timer);
    } else {
      setAnimateIcon(false);
    }
  }, [fadeIn]);

  // Message update effect
  useEffect(() => {
    if (messages && messages.length > 0 && currentIndex < messages.length) {
      setCurrentMessage(messages[currentIndex]);

      // Mark message as seen
      if (onMessageSeen && messages[currentIndex]) {
        onMessageSeen(messages[currentIndex].id);
      }
    } else {
      setCurrentMessage(null);
    }
  }, [currentIndex, messages, onMessageSeen]);

  // Early return if no message
  if (!currentMessage || messages.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={responsive.isMobile ? "sm" : "md"}
      fullWidth
      TransitionComponent={Grow}
      transitionDuration={400}
      PaperProps={{ sx: modalStyles.paper }}
      sx={{ "& .MuiBackdrop-root": modalStyles.backdrop }}
    >
      <Header 
        message={currentMessage} 
        onClose={onClose} 
        theme={theme}
        responsive={responsive}
        currentIndex={currentIndex}
        messagesLength={messages.length}
      />
      
      <DialogContent sx={modalStyles.content}>
        <MessageRenderer 
          message={currentMessage}
          theme={theme}
          responsive={responsive}
          fadeIn={fadeIn}
          animateIcon={animateIcon}
        />
      </DialogContent>

      {/* Footer Sticky avec les contrôles de navigation */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          background: theme.colors.background.primary,
          backdropFilter: theme.effects.blur,
          WebkitBackdropFilter: theme.effects.blur,
          borderTop: `1px solid ${theme.colors.border.primary}`,
          px: responsive.spacing.content,
          py: responsive.isMobile ? 0.5 : 1,
          zIndex: 10,
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Navigation
          currentIndex={currentIndex}
          totalMessages={messages.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onClose={onClose}
          theme={theme}
          responsive={responsive}
        />
      </Box>
    </Dialog>
  );
};

export default BroadcastMessageModal;
