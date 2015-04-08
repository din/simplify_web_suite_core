(function() {
  'use strict';
  var lastURL = null;

  function readPositionSlider() {
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

  function readVolumeSlider() {
    return $('.mini-controls .player-volume-slider').data('value');

  function clickSlider($el, pageX) {
    var mousedown = new $.Event('mousedown');
    var mouseup = new $.Event('mouseup');
    mousedown.pageX = pageX;
    mouseup.pageX = pageX;

    $el.trigger(mousedown).trigger(mouseup);
  }

  var updateSimplifyMetadata = function(simplify) {
    var artist = $('.media-title .grandparent-title').text();
    var title = $('.media-title .item-title').text().replace('[GN MATCH]', '');
    var playhead = readPositionSlider();

    var features = {
      disable_previous_track: $('.previous-btn').hasClass('disabled'),
      disable_next_track: $('.next-btn').hasClass('disabled')
    };

    if (!playhead.max) {
      features.disable_track_seeking = true;
    }

    if (artist && title) {
      simplify.setCurrentTrack({
        author: artist,
        title: title,
        album: '',
        length: playhead.max,
        features: features
      });
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
    } else {
      simplify.setCurrentArtwork(null);
    }
  };

  if (window.top == window) {
    window.addEventListener('load', function() {
      var simplify = new Simplify();
      simplify.setCurrentPlayer('Plex');

      var interval = setInterval(function() {
        updateSimplifyMetadata(simplify, true);
      }, 1000);

      simplify.bindToTrackPositionRequest(function() {
        var playhead = readPositionSlider();
        return playhead.current;

      }).bindToVolumeRequest(function() {
        return readVolumeSlider();
      }).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
        $('.mini-controls-left .next-btn').click();
      }).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
        $('.mini-controls-left .previous-btn').click();
      }).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function() {
        if ($('.mini-controls-left .play-btn').css('display') == 'none')
          $('.pause-btn').click();
        else
          $('.mini-controls-left .play-btn').click();
      }).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data) {
        var playhead = readPositionSlider();
        var $el = $('.mini-controls .player-seek-bar');
        var pageX = $el.offset().left + $el.width() * (data.amount / playhead.max);
        clickSlider($el, pageX);
      }).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data) {
        var $el = $('.mini-controls .player-volume-slider');
        var pageX = $el.offset().left + $el.width() * (data.amount / 100);
        clickSlider($el, pageX);
      }).bind(Simplify.MESSAGE_DID_SERVER_SHUTDOWN, function() {
        clearInterval(interval);
      });

      window.addEventListener('unload', function() {
        simplify.closeCurrentPlayer();
      });
    });
  }
})();
