// Google Music
// @hostname = play.google.com

(function() {
  var lastTrack = null;
  function readSlider(el) {
    if(el.attr("aria-valuemax")) {
      return {
        max: parseInt(el.attr("aria-valuemax"), 10),
        min: parseInt(el.attr("aria-valuemin"), 10),
        current: parseInt( el.attr("aria-valuenow"), 10)
      };
    } else {
      return {
        max: 0,
        min: 0,
        current: 0
      };
    }
  }
  var updateSimplifyMetadata = function(simplify, checkLast) {
    var playhead = readSlider($("#material-player-progress"));

    var title = $("#currently-playing-title").text();
    var album = $(".player-album").text();
    var artist = $("#player-artist").text();
    var albumArt = $("#playerBarArt");
    if(albumArt[0]) {
      albumArt = albumArt[0].src.replace('=s90-c-e','=s1000-c-e');
    }

    if(title && artist && album) {
      var trackID = title + ":" + artist + ":" + album;
      if(!checkLast || lastTrack !== trackID) {
        lastTrack = trackID;
        simplify.setCurrentTrack({
          author: artist,
          title: title,
          album: album,
          length: playhead.max / 1000,
          features: {
            // probably CAN be done, I just don't know how.
            disable_track_seeking: true
          }
        });
        if(albumArt) {
          simplify.setCurrentArtwork(albumArt);
        }
      }
    }
  };

  if (window.top == window) {
    window.addEventListener('load', function() {
      //inject jquery into page
      var body = document.getElementsByTagName("body")[0];
      var script = document.createElement('script');
      script.type = "text/javascript";
      script.src = "//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js";
      body.appendChild(script);
      var simplify = new Simplify();
      simplify.setCurrentPlayer('Google Music');
      setInterval(function() {
        updateSimplifyMetadata(simplify, true);
      }, 1000);

      simplify.bindToTrackPositionRequest(function() {
        var playhead = readSlider($("#material-player-progress"));
        return playhead.current / 1000;
      }).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
        $("paper-icon-button[data-id=forward]").click();
      }).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
        $("paper-icon-button[data-id=rewind]").click();
      }).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function() {
        $("paper-icon-button[data-id=play-pause]").click();
      });

      window.addEventListener('unload', function() {
        simplify.closeCurrentPlayer();
      });
    });
  }
})();
