if (window.top == window)
{
	window.addEventListener("load", function()
	{
		//Creating Simplify object 
		var simplify = new Simplify();

		//Setting up Yandex.Music description
		simplify.setCurrentPlayer("Yandex.Music");

		//Overriding method for song information retrival
		var oldGetCurrentSongInfo = Mu.Player.getCurrentEntry;
		window.lastTrackId = null;
		Mu.Player.getCurrentEntry = function()
		{
			var song = oldGetCurrentSongInfo.apply(this);

			if (window.lastTrackId != song.getTrack().id)
			{
				//New track! Sending to Simplify
				simplify.setCurrentTrack({"author" : song.getTrack().artist, 
												  "title" : song.getTrack().title, 
												  "album" : song.getTrack().album,
												  "length" : parseInt((song.getTrack().duration)/1000)});

				//Taking artwork from Yandex.Music
				simplify.setCurrentArtwork(song.getTrack().cover.match('^.*/') + "1.300x300.jpg");

				window.lastTrackId = song.getTrack().id;
			}

			return song;
		}

		//Pausing Simplify when Yandex.Music paused
		var oldPause = Mu.Player.pause;
		Mu.Player.pause = function()
		{
			var result = oldPause.apply(this);

			simplify.setPlaybackPaused();

			return result;
		}

		//Restoring playback 
		var oldPlay = Mu.Player.resume;
		Mu.Player.resume = function(argument)
		{
			var result = oldPlay.apply(this, argument);

			simplify.setPlaybackPlaying();

			return result;
		}

		//Stop Simplify after clearing Yandex.Music queue
		var oldClearAll = Mu.Songbird.clearAll;
		Mu.Songbird.clearAll = function()
		{
			var result = oldClearAll.apply(this);

			simplify.setPlaybackStopped();

			return result;
		}

		//Handling incoming events
		simplify.bindToVolumeRequest(function()
		{

			if (typeof Mu.Player.getCurrentEntry().getTrack() == "undefined" || Mu.Player.getCurrentEntry().getTrack() == null) return 0;
			return parseInt(Mu.Player.level*100);

		}).bindToTrackPositionRequest(function()
		{

			if (typeof Mu.Player.getCurrentEntry().getTrack() == "undefined" || Mu.Player.getCurrentEntry().getTrack() == null) return 0;
			return parseInt(Mu.Player.getPosition()/1000);

		}).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function()
		{

			if (typeof Mu.Player.getCurrentEntry().getTrack() == "undefined") return;
			Mu.Songbird.playPrev();
			// Emulate default action of Yandex.Music after rewinding
			simplify.setPlaybackPlaying();

		}).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function()
		{

			if (typeof Mu.Player.getCurrentEntry().getTrack() == "undefined") return;
			Mu.Songbird.playNext();
			// Emulate default action of Yandex.Music after fast forwarding
			simplify.setPlaybackPlaying();
		
		}).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data)
		{

			if (typeof Mu.Player.getCurrentEntry().getTrack() == "undefined") return;	
			if (data["state"] == Simplify.PLAYBACK_STATE_PLAYING) Mu.Player.resume();
			if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) Mu.Player.pause();
		
		}).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data)
		{

			if (data["amount"] == null || typeof Mu.Player.getCurrentEntry().getTrack() == "undefined") return;
			Mu.Player.setVolume(data["amount"]/100);

		}).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data)
		{

			if (data["amount"] == null || typeof Mu.Player.getCurrentEntry().getTrack() == "undefined") return;
			Mu.Player.setPosition(parseFloat(data["amount"])*1000);

		});

		//Subscribing to unload event to clear our player
		window.addEventListener("unload", function()
		{
			simplify.closeCurrentPlayer();
		}); 	
	});
}