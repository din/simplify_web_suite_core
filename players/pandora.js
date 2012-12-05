//'Hackish' Pandora support
//If you can do it better, feel free to send us a pull request

if (window.top == window)
{
	window.addEventListener("load", function()
	{
		//Creating Simplify object 
		var simplify = new Simplify();

		//Setting up Simplify player description 
		//This should be always done before any other actions
		simplify.setCurrentPlayer("Pandora Radio");

		//Extracting track information
		var extractTrackInformation = function()
		{
			var elapsedTime = $(".progress .elapsedTime").text().split(":");
			var remainingTime = $(".progress .remainingTime").text().replace("-", "").split(":");
			var trackLength = (parseInt(elapsedTime[0])*60 + parseInt(elapsedTime[1])) +
									(parseInt(remainingTime[0])*60 + parseInt(remainingTime[1]));

			var track = {"author" : $.trim( $("#playerBar:first a.playerBarArtist:first").text() ),
					  		 "title"  : $.trim( $("#playerBar:first a.playerBarSong:first").text() ),
					  		 "album"  : $.trim( $("#playerBar:first a.playerBarAlbum:first").text() ),
					  		 "length" : trackLength};

			track["id"] = track["author"] + track["title"] + track["album"];

			return track;
		} 

		//This should be somehow fixed/updated/whatever
		//Hackish method to extract current track playing in Pandora
		//Checking for Pandora tracks every a few seconds
		//Storing previous track information to not to be confused further
		window.lastTrackId = null;
		setInterval(function()
		{
			var track = extractTrackInformation();

			if (track["author"].length == 0 
				|| track["title"].length == 0 
				|| track["album"].length == 0
				|| track["length"] == 0)
			{
				return;
			}

			if (window.lastTrackId != track["id"])
			{
				simplify.setCurrentTrack(track);
				simplify.setCurrentArtwork();

				window.lastTrackId = track["id"];
			}

		}, 4000);

		//Handling incoming events
		simplify.bindToVolumeRequest(function()
		{

			return ((parseInt($(".volumePosition .volumeKnob").css("left")) - 20)/82)*100;

		}).bindToTrackPositionRequest(function()
		{

			var elapsedTime = $(".progress .elapsedTime").text().split(":");
			return (parseInt(elapsedTime[0])*60 + parseInt(elapsedTime[1]));

		}).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function()
		{

			//Cannot selected previous track in Pandora

		}).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function()
		{

			//Skipping to the next track
			$(".skipButton").click();
		
		}).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data)
		{

			if ($(".playButton").is(":visible") == false && data["state"] == Simplify.PLAYBACK_STATE_PAUSED)
			{
				$(".pauseButton").click();
				return;
			}

			if ($(".playButton").is(":visible") == true && data["state"] == Simplify.PLAYBACK_STATE_PLAYING)
			{
				$(".playButton").click();
				return;
			}
			
		}).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data)
		{
			$(".volumeBackground").show();
			$(".volumeBar").trigger(new jQuery.Event("click", {pageX : $(".volumeControl").offset().left + 40 + 90*data["amount"]/100,
																				pageY : $(".volumeControl").offset().top + 15}));
			$(".volumeBackground").hide();

		}).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data)
		{

			//Cannot seek tracks in Pandora

		});

		//Subscribing to unload event to clear our player
		window.addEventListener("unload", function()
		{
			simplify.closeCurrentPlayer();
		}); 	
	});
}