// Code for Simplify Web Suite Core to register SoundCloud
// https://github.com/mmth/simplify_web_suite_core
// @hostname = soundcloud.com

(function() {
  var SC_DEBUG_LOG = 0;
  var debug_log = function() {
    if (SC_DEBUG_LOG) console.debug(arguments);
  };

  var playManager, eventBus, libAudio;
  var previousTrackId = null;

  var currentSound = function() { return playManager.getCurrentSound(); };

  var updateSimplifyMetadata = function(simplify) {

    var author,
      title = null,
      artworkUrl;

    sound = currentSound();
    if (!sound) return;
    soundAttributes = sound.attributes;

    if (soundAttributes["id"] == previousTrackId) return;

    var titleParts = soundAttributes.title.split(' - ');
    if (titleParts.length > 1) {
      author = titleParts[0];
      title = titleParts[1];
    } else {
      author = soundAttributes.user.username;
      title = soundAttributes.title;
    }
    debug_log('author: ', author, 'title: ', title);
    simplify.setCurrentTrack({
      author: author,
      title: title,
      album: soundAttributes.label_name,
      length: soundAttributes.duration / 1000,
      uri: soundAttributes.permalink_url,
    });

    if (soundAttributes.artwork_url) {
      artworkUrl = soundAttributes.artwork_url.replace(
        /-large\./, '-t500x500.'
      );
      simplify.setCurrentArtwork(artworkUrl);
    }

    previousTrackId = soundAttributes["id"];
  };

  var setupSimplifyBindings = function(simplify) {
    // Requests
    simplify.bindToVolumeRequest(function() {
      return libAudio.getSettings().volume * 100;
    }).bindToTrackPositionRequest(function() {
      return currentSound().currentTime() / 1000;
    });

    // Actions by User
    simplify.bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data) {
      if (data.state == Simplify.PLAYBACK_STATE_PLAYING) {
        playManager.playCurrent();
      }
      if (data.state == Simplify.PLAYBACK_STATE_PAUSED ||
          data.state == Simplify.PLAYBACK_STATE_STOPPED) {
        playManager.pauseCurrent();
      }
    }).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
      playManager.playPrev();
    }).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
      playManager.playNext();
    }).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data) {
      normalizedVolume = data.amount / 100;
      eventBus.trigger('broadcast:volume:set', normalizedVolume);
      libAudio.setSettings({volume: normalizedVolume});
      // TODO cause a refresh of the volume widget
    }).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data) {
      currentSound().seek(data.amount * 1000);
    });
  };

  if (window.top == window) {
    window.addEventListener('load', function() {

      webpackJsonp([], {0: function(a, b, require) 
      { 
      
		var modules = require.c;

      	for (var moduleid in modules)
      	{
      		var el = require(moduleid);

      		if (typeof el["playCurrent"] == "function")
			{
				playManager = el;
			}
			else if (typeof el["getSettings"] == "function")
			{
				libAudio = el;
			}
			else if (typeof el["trigger"] == "function" 
			       && typeof el["bind"] == "function"
			       && typeof el["listenToOnce"] == "function" &&
			       typeof el["$"] != "function" &&
			       typeof el["broadcast"] == "function")
			{
				eventBus = el;
			}
      	}     

        var simplify = new Simplify();
        simplify.setCurrentPlayer('SoundCloud');
 	
        setupSimplifyBindings(simplify);
        updateSimplifyMetadata(simplify);

        window.addEventListener('unload', function() {
          simplify.closeCurrentPlayer();
        });

        eventBus.on('audio:play', function(sound) {
        
          updateSimplifyMetadata(simplify);
          simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PLAYING);
        });

        eventBus.on('audio:pause', function() {
          updateSimplifyMetadata(simplify);
          simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PAUSED);
        });

      }});

    
    });
  }
})();
