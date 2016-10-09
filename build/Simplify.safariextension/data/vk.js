// Vkontakte
// @hostname = vk.com

if (window.top == window) {
  //Setting up current player and listeners on page load
  var setupSimpify = function()
  {
    if (typeof getAudioPlayer !== "function") {
      console.log("Waiting for audio player to be available...");
      setTimeout(setupSimpify, 3000);
      return;
    }

    var player = getAudioPlayer();
    var current_track;

    //Creating Simplify object
    var simplify = new Simplify();

    //Setting up Simplify player description
    //This should be always done before any other actions
    simplify.setCurrentPlayer("VK");

    listenForPlayerEvents();

    function listenForPlayerEvents() {
      player.on(player, "start", handlePlay);
      player.on(player, "pause", handlePause);
      player.on(player, "start_load", handleUpdate);
    }

    function handlePlay() {
      simplify.setPlaybackPlaying();
    }

    function handlePause() {
      simplify.setPlaybackPaused();
    }

    function handleUpdate(song, eventData) {
      current_track = {
        "author"  : song[4],
        "title"   : song[3],
        "album"   : " ",
        "length"  : parseInt(song[5]),
        "uri"     : "https://vk.com/audio?q=" + song[4] + " - " + song[3],
        "id"      : song[0]
      };
      simplify.setCurrentTrack(current_track);
      simplify.setCurrentArtwork(null);
    }

    //Handling basic events from Simplify server
    simplify.bindToVolumeRequest(function() {
      if (typeof getAudioPlayer == "undefined") {
        return 0
      };
      return player.getVolume()*100;
    })
    .bindToTrackPositionRequest(function() {
      if (typeof getAudioPlayer == "undefined" || getAudioPlayer == null) return 0;
      return parseInt(player.getCurrentProgress() * current_track.length);
    })
    .bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
      if (typeof getAudioPlayer == "undefined") return;
      player.playPrev();
    })
    .bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
      if (typeof getAudioPlayer == "undefined") return;
      player.playNext();
    })
    .bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data) {
      if (data["state"] == null || typeof getAudioPlayer == "undefined") return;
      if (data["state"] == Simplify.PLAYBACK_STATE_PLAYING) player.play();
      if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) player.pause();
    })
    .bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data) {
      if (data["amount"] == null || typeof getAudioPlayer == "undefined") return;
      player.setVolume(data["amount"]/100);
    })
    .bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data) {
      if (data["amount"] == null || typeof getAudioPlayer == "undefined") return;
      player.seek(parseFloat(data["amount"] / current_track.length))
    });

    //Subscribing to unload event to clear our player
    window.addEventListener("unload", function()
    {
      simplify.closeCurrentPlayer();
    });
  };
  window.addEventListener("load", setupSimpify);
}
