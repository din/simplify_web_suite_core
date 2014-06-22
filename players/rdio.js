//Only injecting this script into the top window (no frames)

var __rdioRemote = {
	simplify: null,
	player: null,
	
	init: function() {
		if (typeof window.R.player === "undefined") return false;
		
		__rdioRemote.player = window.R.player;
		
		//Creating Simplify object 
		__rdioRemote.simplify = new Simplify();
	
		// Setting up Simplify player description 
		// This should be always done before any other actions
		__rdioRemote.simplify.setCurrentPlayer("Rdio web");
		
		// listen to track change event
		__rdioRemote.player.model.bind('change:playingTrack', function(model, newTrack, options) {
			__rdioRemote.setTrack(newTrack);
		});
	
		// listen to play state change event
		__rdioRemote.player.model.bind('change:playState', function(model, state, options) {
			if (state == 0) {
				__rdioRemote.simplify.setPlaybackPaused();
			} else if (state == 1) {
				__rdioRemote.simplify.setPlaybackPlaying();
				__rdioRemote.setTrack();
			} else {
				__rdioRemote.simplify.setPlaybackStopped();
			}
		});
		
		__rdioRemote.simplify.bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data) {
			if (!__rdioRemote.player) return;
			if ((data["state"] == Simplify.PLAYBACK_STATE_PLAYING && __rdioRemote.player.playState() != 1)
					|| (data["state"] == Simplify.PLAYBACK_STATE_PAUSED && __rdioRemote.player.playState() != 0)) {
				__rdioRemote.player.playPause();
			}
		});
		
		__rdioRemote.simplify.bindToTrackPositionRequest(function() {
			if (!__rdioRemote.player) return 0;
			return __rdioRemote.player.position();
		});
		
		__rdioRemote.simplify.bindToVolumeRequest(function() {
			if (!__rdioRemote.player) return 0;
			return __rdioRemote.player.volume() * 100;
		});
		
		__rdioRemote.simplify.bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data) {
			if (__rdioRemote.player) __rdioRemote.player.setVolume(data["amount"] / 100);
		});
		
		__rdioRemote.simplify.bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data) {
			if (data["amount"] != null && __rdioRemote.player) {
				__rdioRemote.player.seek(parseFloat(data["amount"]));			
			}
		});
		
		__rdioRemote.simplify.bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
			if (__rdioRemote.player) __rdioRemote.player.previous();
		});

		__rdioRemote.simplify.bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
			if (__rdioRemote.player) __rdioRemote.player.next();
		});
	
		return true;
	},

	setTrack: function(newTrack) {
		if (typeof newTrack === 'undefined' || !newTrack) {
			newTrack = window.R.player.playingTrack();
			if (typeof newTrack === 'undefined' || !newTrack) {
				return;
			}
		}
		if (__rdioRemote.player.playState() != 0) {
			var trackInfo = newTrack.attributes;
			__rdioRemote.simplify.setCurrentTrack({
				author: trackInfo.artist,
				title: trackInfo.name,
				album: trackInfo.album,
				length: trackInfo.duration
			});
			__rdioRemote.simplify.setCurrentArtwork(trackInfo.icon400);
		}
	}	
}

if (window.top == window) {
	//Setting up current player and listeners on page load
	window.addEventListener("load", function() {
		// wait for rdio initialization
		var initInterval = setInterval(function() {
			if (__rdioRemote.init()) {
				clearInterval(initInterval);
			}
		}, 500);

		//Subscribing to unload event to clear our player
		window.addEventListener("unload", function() {
			simplify.closeCurrentPlayer();
		}); 	
	});
}
