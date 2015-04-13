/* global Simplify:false, $:false */
(function () {
  'use strict';
  var lastURL = null;
  var lastState = null;
  var lastSlug = null;
  var continueScheduling = true;

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

    window.addEventListener('beforeunload', function () {
      simplify.closeCurrentPlayer();
    });

    function setCurrentTrack($controls) {
      var $poster = $controls.find('.media-poster');
      var title = $poster.attr('data-title') || '';
      var album = $poster.attr('data-parent-title') || '';
      var artist = $poster.attr('data-grandparent-title') || '';
      var playhead = readPositionSlider();

      var $prevBtn = $controls.find('.previous-btn');
      var $nextBtn = $controls.find('.next-btn');

      // Detect features
      var features = {};

      if ($prevBtn.hasClass('disabled')) {
        features.disable_previous_track = true;
      }

      if ($nextBtn.hasClass('disabled')) {
        features.disable_next_track = true;
      }

      if (!playhead.max) {
        features.disable_track_seeking = true;
      }

      var slug = [
        title, album, artist,
        playhead.max,
        features.disable_previous_track,
        features.disable_next_track,
        features.disable_track_seeking
      ].join(':');

      if (slug !== lastSlug) {
        lastSlug = slug;
        simplify.setCurrentTrack({
          author: artist,
          title: title,
          album: album,
          length: playhead.max,
          features: features
        });
      }
    }

    function setPlaybackState($controls) {
      // State.
      var state;
      if ($controls.length) {
        var $playBtn = $controls.find('.play-btn');

        if ($playBtn.css('display') === 'none') {
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
    }

    function setArtwork($controls) {
      var $poster = $controls.find('.media-poster');
      var imageUrl = $poster.attr('data-image-url');

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
    }

    function updateSimplifyMetadata() {
      var $controls = $('.mini-controls');
      setCurrentTrack($controls);
      setPlaybackState($controls);
      setArtwork($controls);
    }

    simplify.bindToTrackPositionRequest(function () {
      var playhead = readPositionSlider();
      return playhead.current;

    }).bindToVolumeRequest(function() {
      return readVolumeSlider();

    }).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function () {
      $('.mini-controls .next-btn').click();

    }).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function () {
      $('.mini-controls .previous-btn').click();

    }).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function () {
      if ($('.mini-controls .play-btn').css('display') === 'none') {
        $('.pause-btn').click();
      } else {
        $('.mini-controls .play-btn').click();
      }

    }).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data) {
      var playhead = readPositionSlider();
      var $el = $('.mini-controls .player-seek-bar');
      var pageX = $el.offset().left + $el.width() * (data.amount / playhead.max);
      clickSlider($el, pageX);

    }).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function (data) {
      var $el = $('.mini-controls .player-volume-slider');
      var pageX = $el.offset().left + $el.width() * (data.amount / 100);
      clickSlider($el, pageX);

    }).bind(Simplify.MESSAGE_DID_SERVER_SHUTDOWN, function () {
      continueScheduling = false;

    });

    function scheduleUpdateSimplifyMetadata() {
      if (typeof $ !== 'undefined') {
        updateSimplifyMetadata();
      }

      if (continueScheduling) {
        window.setTimeout(scheduleUpdateSimplifyMetadata, 1000);
      }
    }

    scheduleUpdateSimplifyMetadata();
  }

  // Only run extension when Plex is outermost frame
  if (window.top === window) {
    window.addEventListener('load', onLoad);
  }

}());
