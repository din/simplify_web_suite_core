if (window.top == window)
{
	window.addEventListener("load", function()
	{
		//Creating Simplify object 
		var simplify = new Simplify();

		//Setting up Yandex.Music description
		simplify.setCurrentPlayer("Yandex.Music");

		interval = setInterval(function() {
            var YaPlayer = Mu.pages.player;
            if (YaPlayer) {
                clearInterval(interval);
                YaPlayer.states.on('setState:playing', function() {
                    simplify.setPlaybackPlaying();
                });
                YaPlayer.states.on('setState:paused', function() {
                    simplify.setPlaybackPaused();
                });
                YaPlayer.states.on('sendPlayInfo', function() {
                    if (window.lastTrackId == YaPlayer.currentTrackData.id) {
                		// console.log('Compared lastTrackId, equals');
                		simplify.setPlaybackPaused();
                	}
                	else {
                		// console.log('Compared lastTrackId, not equals');
                		updateSimplifyMetadata(simplify);
                	}
                });
            }
        }, 500);

        window.lastTrackId = null;

        updateSimplifyMetadata = function(simplify) {
            var song = Mu.pages.player.currentTrackData;
            if (Mu.pages.player.states._waiting === "undefined")
            {
            	console.log("Waiting for activation");
              setTimeout(function()
              {
                updateSimplifyMetadata(simplify);
              }, 500);
              return;
            }

            if (window.lastTrackId != song.id) {
                simplify.setCurrentTrack({"author" : song.artists[0].name, 
												  "title" : song.title, 
												  "album" : song.albums[0].title,
												  "length" : parseInt(Mu.pages.player.getDuration())});

				//Taking artwork from Yandex.Music
				simplify.setCurrentArtwork('http://'+song.albums[0].coverUri.match('^.*/')+'m460x460');

				window.lastTrackId = song.id;
				// console.log("Just updated lastTrackId");
            }

            return song;
        };

		//Pausing Simplify when Yandex.Music paused
		var oldPause = Mu.pages.player.pause;
		Mu.pages.player.pause = function()
		{
			var result = oldPause.apply(this);

			simplify.setPlaybackPaused();

			return result;
		}

		//Restoring playback 
		var oldPlay = Mu.pages.player.resume;
		Mu.pages.player.resume = function(argument)
		{
			var result = oldPlay.apply(this, argument);

			simplify.setPlaybackPlaying();

			return result;
		}

		// Stop Simplify after clearing Yandex.Music queue
		var oldStop = Mu.pages.player.stop;
		Mu.pages.player.stop = function()
		{
			var result = oldStop.apply(this);
			if (Mu.pages.player.flow.getNavigation().next !== true) {
				// console.log("Player has been stopped");
				simplify.setPlaybackStopped();
			}

			return result;
		}

		//Handling incoming events
		simplify.bindToVolumeRequest(function()
		{

			if (typeof Mu.pages.player.currentTrackData == "undefined") return 0;
			return parseInt(Mu.pages.player.getVolume()*100);

		}).bindToTrackPositionRequest(function()
		{

			if (typeof Mu.pages.player.currentTrackData == "undefined") return 0;
			return parseInt(Mu.pages.player.getPosition());

		}).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function()
		{

			if (typeof Mu.pages.player.currentTrackData == "undefined") return;
			Mu.pages.player.flow.prev();
			// Emulate default action of Yandex.Music after rewinding
			simplify.setPlaybackPlaying();

		}).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function()
		{

			if (typeof Mu.pages.player.currentTrackData == "undefined") return;
			Mu.pages.player.flow.next();
			// Emulate default action of Yandex.Music after fast forwarding
			simplify.setPlaybackPlaying();
		
		}).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data)
		{

			if (typeof Mu.pages.player.currentTrackData == "undefined") return;	
			if (data["state"] == Simplify.PLAYBACK_STATE_PLAYING) Mu.pages.player.resume();
			if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) Mu.pages.player.pause();
		
		}).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data)
		{

			if (data["amount"] == null || typeof Mu.pages.player.currentTrackData == "undefined") return;
			Mu.pages.player.setVolume(data["amount"]/100);

		}).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data)
		{

			if (data["amount"] == null || typeof Mu.pages.player.currentTrackData == "undefined") return;
			Mu.pages.player.setPosition(parseFloat(data["amount"]));

		});

		//Subscribing to unload event to clear our player
		window.addEventListener("unload", function()
		{
			simplify.closeCurrentPlayer();
		}); 	
	});
}