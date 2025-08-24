import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, CircularProgress, Alert } from '@mui/material';
import { PlayArrow, Pause, Download, VolumeUp } from '@mui/icons-material';

const AudioPlayer = ({ audioUrl, title, genre, onDownload, width = 300, height = 60 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNativePlayer, setShowNativePlayer] = useState(false);
  
  const audioRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) {
      setError('No audio URL provided');
      setLoading(false);
      return;
    }

    console.log('🎵 AudioPlayer: Loading audio from URL:', audioUrl);

    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;
    
    // Set up audio event listeners
    audio.addEventListener('loadedmetadata', () => {
      console.log('🎵 AudioPlayer: Audio loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setLoading(false);
      setError(null);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      console.log('🎵 AudioPlayer: Audio playback ended');
      setIsPlaying(false);
      setCurrentTime(0);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('🎵 AudioPlayer: Audio error:', e);
      console.error('🎵 AudioPlayer: Error details:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
      setError('Failed to load audio file - try using native player');
      setLoading(false);
    });
    
    audio.addEventListener('canplay', () => {
      console.log('🎵 AudioPlayer: Audio can play');
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.log('🎵 AudioPlayer: Audio can play through');
    });
    
    // Set a timeout in case the audio doesn't load
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('🎵 AudioPlayer: Audio loading timeout');
        setError('Audio loading timeout - try using native player');
        setLoading(false);
      }
    }, 8000); // 8 second timeout
    
    // Try to load the audio
    try {
      audio.src = audioUrl;
      audio.load();
    } catch (err) {
      console.error('🎵 AudioPlayer: Error setting audio source:', err);
      setError('Failed to set audio source');
      setLoading(false);
    }
    
    return () => {
      clearTimeout(timeout);
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audioUrl, loading]);

  const togglePlayPause = () => {
    if (!audioRef.current) {
      console.warn('🎵 AudioPlayer: No audio element available');
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        console.log('🎵 AudioPlayer: Paused audio');
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('🎵 AudioPlayer: Started playing audio');
            })
            .catch((error) => {
              console.error('🎵 AudioPlayer: Playback error:', error);
              setError('Failed to play audio - try using native player');
            });
        }
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('🎵 AudioPlayer: Toggle play/pause error:', err);
      setError('Failed to control audio playback');
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (audioUrl) {
      try {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = title || 'audio-track';
        link.target = '_blank';
        link.click();
        console.log('🎵 AudioPlayer: Download initiated');
      } catch (err) {
        console.error('🎵 AudioPlayer: Download error:', err);
      }
    }
  };

  const showNativeAudioPlayer = () => {
    setShowNativePlayer(true);
  };

  // Format time in MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading audio...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 1.5, sm: 2 }, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: { xs: 1, sm: 2 }, 
          mb: 2 
        }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            {title}
          </Typography>
          {genre && (
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              {genre}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
          <IconButton 
            onClick={showNativeAudioPlayer}
            sx={{ 
              backgroundColor: 'primary.main', 
              color: 'white',
              '&:hover': { backgroundColor: 'primary.dark' }
            }}
          >
            <VolumeUp />
          </IconButton>
          <IconButton onClick={handleDownload} size="small">
            <Download />
          </IconButton>
        </Box>

        {showNativePlayer && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', textAlign: { xs: 'center', sm: 'left' } }}>
              Native Audio Player:
            </Typography>
            <audio controls style={{ width: '100%', maxWidth: '100%' }}>
              <source src={audioUrl} type="audio/mpeg" />
              <source src={audioUrl} type="audio/wav" />
              <source src={audioUrl} type="audio/flac" />
              Your browser does not support the audio element.
            </audio>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      alignItems: { xs: 'stretch', sm: 'center' },
      gap: { xs: 1, sm: 2 }, 
      p: { xs: 1.5, sm: 2 }, 
      border: '1px solid #e0e0e0', 
      borderRadius: 2,
      backgroundColor: '#fafafa'
    }}>
      {/* Play/Pause Button */}
      <IconButton 
        onClick={togglePlayPause}
        sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white',
          '&:hover': { backgroundColor: 'primary.dark' },
          alignSelf: { xs: 'center', sm: 'flex-start' }
        }}
      >
        {isPlaying ? <Pause /> : <PlayArrow />}
      </IconButton>

      {/* Track Info */}
      <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
        <Typography variant="subtitle2" fontWeight="bold" noWrap>
          {title}
        </Typography>
        {genre && (
          <Typography variant="caption" color="text.secondary">
            {genre}
          </Typography>
        )}
      </Box>

      {/* Progress Bar */}
      <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: width } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
            {formatTime(currentTime)}
          </Typography>
          <Box sx={{ 
            flex: 1, 
            height: 4, 
            backgroundColor: '#e0e0e0', 
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              backgroundColor: 'primary.main',
              borderRadius: 2,
              transition: 'width 0.1s ease'
            }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
            {formatTime(duration)}
          </Typography>
        </Box>
        
        {/* Simple Waveform Visualization */}
        <Box sx={{ 
          display: { xs: 'none', md: 'flex' },
          alignItems: 'flex-end', 
          gap: 1, 
          height: height - 20,
          opacity: 0.7
        }}>
          {Array.from({ length: 20 }, (_, i) => {
            const progress = duration > 0 ? (currentTime / duration) : 0;
            const isPlayed = i / 20 < progress;
            const height = Math.random() * 0.8 + 0.2; // Random height between 20% and 100%
            
            return (
              <Box
                key={i}
                sx={{
                  width: 2,
                  height: `${height * 100}%`,
                  backgroundColor: isPlayed ? 'primary.main' : '#9e9e9e',
                  borderRadius: 1,
                  transition: 'background-color 0.2s ease'
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Download Button */}
      <IconButton onClick={handleDownload} size="small" sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}>
        <Download />
      </IconButton>
    </Box>
  );
};

export default AudioPlayer;
