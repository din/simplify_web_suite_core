(function() {
  'use strict';
  var lastURL = null;
  
  function readSlider() {
    if ($('.seek-bar-container').length && $('.player-slider-progress').length) {
      var time = $('.seek-bar-container .player-position').text().split(':');
      time = parseInt(time[0], 10)*60 + parseInt(time[1], 10);
      
      var duration = $('.seek-bar-container .player-duration').text().split(':');
      duration = parseInt(duration[0], 10)*60 + parseInt(duration[1], 10);
      
      var position = parseFloat($('.player-slider-progress')[0].style.width);
      position = duration*position/100.0;
      
      return { max: duration, min: 0, current: position };
    } else {
      return { max: 0, min: 0, current: 0 };
    }
  }
  var updateSimplifyMetadata = function(simplify, checkLast) {
    var artist = $('.media-title .grandparent-title').text();
    var title = $('.media-title .item-title').text().replace('[GN MATCH]', '');
    var playhead = readSlider();
    
    if (artist && title) {
      simplify.setCurrentTrack({ 
        author: artist, 
        title: title, 
        album: '', length: playhead.max, 
        features: {
          disable_track_seeking: true,
          disable_previous_track: $('.previous-btn').hasClass('disabled'),
          disable_next_track: $('.next-btn').hasClass('disabled')
      }});
    }

    // State.
    if ($('.mini-player').length) {
      if ($('.mini-controls-left .play-btn').css('display') == 'none') {
        simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PLAYING);
      } else {
        simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PAUSED);
      }
    } else {
      simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_STOPPED);
    }
    
    // Artwork.
    var url = $('.mini-controls-left .media-poster').attr('data-image-url');
    if (url) {
      url = url.replace(/=160/g, "=512");
      if (lastURL != url) {
        simplify.setCurrentArtwork(url);
        lastURL = url;
      }
    }
  };

  if (window.top == window) {
    window.addEventListener('load', function() {
      var simplify = new Simplify();
      simplify.setCurrentPlayer('Plex');

      setInterval(function() {
        updateSimplifyMetadata(simplify, true);
      }, 1000);

      simplify.bindToTrackPositionRequest(function() {
        var playhead = readSlider();
        return playhead.current;

      }).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
        $('.mini-controls-left .next-btn').click();
      }).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
        $('.mini-controls-left .previous-btn').click();
      }).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function() {
        if ($('.mini-controls-left .play-btn').css('display') == 'none')
          $('.pause-btn').click();
        else
          $('.mini-controls-left .play-btn').click();
      })

      window.addEventListener('unload', function() {
        simplify.closeCurrentPlayer();
      });
    });
  }
})();
