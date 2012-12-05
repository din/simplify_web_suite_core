//Only injecting this script into the top window (no frames)

if (window.top == window)
{
	//Setting up current player and listeners on page load
	window.addEventListener("load", function()
	{
		//Creating Simplify object 
		var simplify = new Simplify();

		//Setting up Simplify player description 
		//This should be always done before any other actions
		simplify.setCurrentPlayer("Deezer");

		//Overriding method for song information retrival
		var oldGetCurrentSongInfo = dzPlayer.getCurrentSongInfo;
		window.lastTrackId = null;
		dzPlayer.getCurrentSongInfo = function()
		{
			var song = oldGetCurrentSongInfo.apply(this);
			
			//Checking what's coming on here
			if (window.lastTrackId != song["SNG_ID"])
			{
				//New track! Sending to Simplify
				simplify.setCurrentTrack({"author" : song["ART_NAME"], 
												  "title" : song["SNG_TITLE"], 
												  "album" : song["ALB_TITLE"],
												  "length" : parseInt(song["DURATION"])});

				//Taking artwork from Deezer itself
				simplify.setCurrentArtwork("http://api.deezer.com/2.0/album/" + song["ALB_ID"] + "/image?size=big");

				//What is this? What is that?
				window.lastTrackId = song["SNG_ID"];
			}

			return song;
		}

		//Pausing Simplify when Deezer paused
		var oldPause = dzPlayer.pause;
		dzPlayer.pause = function()
		{
			var result = oldPause.apply(this);

			simplify.setPlaybackPaused();

			return result;
		}

		//Restoring playback 
		var oldPlay = dzPlayer.play;
		dzPlayer.play = function(argument)
		{
			var result = oldPlay.apply(this, argument);

			simplify.setPlaybackPlaying();

			return result;
		}

		//Handling incoming events
		simplify.bindToVolumeRequest(function()
		{

			if (typeof dzPlayer == "undefined") return 0;
			return dzPlayer.volume*100;

		}).bindToTrackPositionRequest(function()
		{

			if (typeof dzPlayer == "undefined") return 0;
			return parseInt(dzPlayer.position);

		}).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function()
		{

			if (typeof dzPlayer == "undefined") return;
			dzPlayer.prevSong();

		}).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function()
		{

			if (typeof dzPlayer == "undefined") return;
			dzPlayer.nextSong();
		
		}).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data)
		{

			if (typeof dzPlayer == "undefined") return;	
			if (data["state"] == Simplify.PLAYBACK_STATE_PLAYING) dzPlayer.play();
			if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) dzPlayer.pause();
		
		}).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data)
		{

			if (data["amount"] == null || typeof dzPlayer == "undefined") return;
			dzPlayer.setVolume(data["amount"]/100);

		}).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data)
		{

			if (data["amount"] == null || typeof dzPlayer == "undefined") return;
			dzPlayer.seek(parseFloat(data["amount"])/dzPlayer.duration);

		});

		//Subscribing to unload event to clear our player
		window.addEventListener("unload", function()
		{
			simplify.closeCurrentPlayer();
		}); 	
	});
}