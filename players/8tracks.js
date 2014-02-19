// 8tracks.com

(function() {

  var ET_DEBUG_LOG = false;
  if (ET_DEBUG_LOG) {
    // Restore the console variable for debugging since 8tracks kills it.
    delete window.console;
  }

  var log = function() {
    if (ET_DEBUG_LOG) console.debug(arguments);
  };

  var trax, mixPlayer, trackPlayer;

  var updateSimplifyMetadata = function(simplify) {
    var author, title, url, album, duration;
    var track = App.Trax.mixPlayer && App.Trax.mixPlayer.track;
    var mix = App.Trax.mix;
    var trackPlayer = App.Trax.mixPlayer && App.Trax.mixPlayer.trackPlayer;

    if (track) {
      artist  = track.get('performer');
      url = track.get('url');
      title = track.get('name');
      album = track.get('release_name');
      duration =
        trackPlayer.soundManagerPlayer.smSound.durationEstimate / 1000 || 9999;
    } else if (mix) {
      artist = mix.get('user').login;
      url = 'http://8tracks.com' + mix.get('web_path');
      title = mix.get('name');
      album = mix.get('genres')[0];
      duration = mix.get('duration') / 1000;
    };
    var trackInfo = {
      author: artist,
      title: title,
      album: album,
      length: duration,
      uri: url
    };

    log('Setting track info', trackInfo);
    simplify.setCurrentTrack(trackInfo);
    artworkUrl = mix.get('cover_urls').sq500
    simplify.setCurrentArtwork(artworkUrl);
  };

  var setupSimplifyBindings = function(simplify) {
    // Requests
    simplify.bindToVolumeRequest(function() {
      return App.Trax.mixPlayer.trackPlayer.globalVolume;
    }).bindToTrackPositionRequest(function() {
      return App.Trax.mixPlayer.trackPlayer.currentPositionInMs / 1000;
    });

    // Actions by User
    simplify.bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data) {
      if (data.state == Simplify.PLAYBACK_STATE_PLAYING) {
        App.Trax.play_page();
      }
      if (data.state == Simplify.PLAYBACK_STATE_PAUSED ||
          data.state == Simplify.PLAYBACK_STATE_STOPPED) {
        App.Trax.pausePlayback();
      }
    }).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
      // 3000 ms is the lowest value 8tracks will accept.
      App.Trax.mixPlayer.trackPlayer.seekTo(3000);
    }).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
      App.Trax.mixPlayer.next();
    }).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data) {
      App.Trax.mixPlayer.setVolume(data.amount);
    }).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data) {
      App.Trax.mixPlayer.trackPlayer.seekTo(data.amount * 1000)
    });
  };

  if (window.top == window) {
    window.addEventListener('load', function() {
      require(['global_trax'], function(trax) {
        var simplify = new Simplify();
        simplify.setCurrentPlayer('8tracks');

        setupSimplifyBindings(simplify);
        updateSimplifyMetadata(simplify);
        // FIXME Start paused, this isn't working.
        simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PAUSED);

        window.addEventListener('unload', function() {
          simplify.closeCurrentPlayer();
        });

        interval = setInterval(function() {
          var mixPlayer = App.Trax.mixPlayer
          if (mixPlayer) {
            clearInterval(interval);
            mixPlayer.on('play', function() {
              log('play');
              simplify.setPlaybackPlaying()
            });
            mixPlayer.on('pause', function() {
              log('paused');
              updateSimplifyMetadata(simplify);
              simplify.setPlaybackPaused();
            });
            mixPlayer.on('doneLoading', function() {
              log('done loading')
              updateSimplifyMetadata(simplify);
            });
            mixPlayer.trackPlayer.on('seconds:1', function() {
              log('1 second')
              updateSimplifyMetadata(simplify);
            });
          }
        }, 500);
      });
    });
  }
})();
