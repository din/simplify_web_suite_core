// Pocket Casts
// @hostname = play.pocketcasts.com

(function() {
  var lastTrack = null;
  function readSlider(el) {
    var current = el.find('.current_time').text();
    if (current) {
      current = current.split(':');

      return {
        max: parseInt(el.find('.seek_bar').attr('duration'), 10),
        min: 0,
        current: (current[0] * 60) + current[1]
      };
    } else {
      return {
        max: 0,
        min: 0,
        current:  0
      };
    }
  }

  var updateSimplifyMetadata = function(simplify, checkLast) {
    var playhead = readSlider($('#audio_player .player_details'));

    var title = $('#audio_player .player_episode').text();
    var artist = $('#audio_player .player_podcast_title').text();
    var albumArt = $('#audio_player .player_artwork img').attr('data-fallback-src');

    if (title && artist) {
      var trackID = title + ':' + artist;
      if (!checkLast || lastTrack !== trackID) {
        lastTrack = trackID;
        simplify.setCurrentTrack({
          author: artist,
          title: title,
          album: null,
          length: playhead.max / 1000,
          features: {
            disable_track_seeking: true
          }
        });

        if (albumArt) {
          simplify.setCurrentArtwork(albumArt);
        }
      }
    }
  };

  if (window.top == window) {
    window.addEventListener('load', function() {
      // Inject jquery into page
      var body = document.getElementsByTagName('body')[0];
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js';
      body.appendChild(script);

      var simplify = new Simplify();
      simplify.setCurrentPlayer('Pocket Casts');
      setInterval(function() {
        updateSimplifyMetadata(simplify, true);
      }, 1000);

      simplify.bindToTrackPositionRequest(function() {
        var playhead = readSlider($('#audio_player .player_details'));
        return playhead.current / 1000;
      }).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
        $('#audio_player .player_controls .skip_forward_button').click();
      }).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
        $('#audio_player .player_controls .skip_back_button').click();
      }).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function() {
        $('#audio_player .player_controls .play_pause_button').click();
      });

      window.addEventListener('unload', function() {
        simplify.closeCurrentPlayer();
      });
    });
  }
})();
