(function() {
  'use strict';
  var lastURL = null;
  var lastState = null;
  var lastSlug = null;

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
    return $('.mini-controls .player-volume-slider').data('value') || 100;
  }

  function clickSlider($el, pageX) {
    var mousedown = new $.Event('mousedown');
    var mouseup = new $.Event('mouseup');
    mousedown.pageX = pageX;
    mouseup.pageX = pageX;

    $el.trigger(mousedown).trigger(mouseup);
  }

  function onLoad() {
    var simplify = new Simplify();
    simplify.setCurrentPlayer('Plex');

    function updateSimplifyMetadata() {
      var $controls = $('.mini-controls');
      var $poster = $controls.find('.media-poster');
      var imageUrl = $poster.attr('data-image-url');
      var title = $poster.attr('data-title') || '';
      var album = $poster.attr('data-parent-title') || '';
      var artist = $poster.attr('data-grandparent-title') || '';
      var playhead = readPositionSlider();

      var features = {};

      if ($controls.find('.previous-btn').hasClass('disabled')) {
        features.disable_previous_track = true;
      }

      if ($controls.find('.next-btn').hasClass('disabled')) {
        features.disable_next_track = true;
      }

      if (!playhead.max) {
        features.disable_track_seeking = true;
      }

      var slug = [
        artist, album, title,
        playhead.max,
        features.disable_previous_track,
        features.disable_next_track,
        features.disable_track_seeking
      ].join(':');

      if (slug !== lastSlug) {
        console.debug('setting current track: %o', slug);
        lastSlug = slug;
        simplify.setCurrentTrack({
          author: artist,
          title: title,
          album: album,
          length: playhead.max,
          features: features
        });
      }

      // State.
      var state;
      if ($('.mini-player').length) {
        if ($('.mini-controls-left .play-btn').css('display') == 'none') {
          state = Simplify.PLAYBACK_STATE_PLAYING;
        } else {
          state = Simplify.PLAYBACK_STATE_PAUSED;
        }
      } else {
        state = Simplify.PLAYBACK_STATE_STOPPED;
      }

      if (state !== lastState) {
        lastState = state;
        simplify.setNewPlaybackState(state);
      }

      // Artwork.
      if (lastURL != imageUrl) {
        lastURL = imageUrl;
        if (imageUrl) {
          imageUrl = imageUrl.replace(/=160/g, '=512');
          simplify.setCurrentArtwork(imageUrl);
        } else {
          simplify.setCurrentArtwork(null);
        }
      }
    };

    var interval = setInterval(updateSimplifyMetadata, 1000);

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
      if ($('.mini-controls-left .play-btn').css('display') == 'none') {
        $('.pause-btn').click();
      } else {
        $('.mini-controls-left .play-btn').click();
      }
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
  }

  if (window.top == window) {
    window.addEventListener('load', onLoad);
  }

})();
