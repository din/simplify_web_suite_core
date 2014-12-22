// Code for Simplify Web Suite Core to register SoundCloud
// https://github.com/mmth/simplify_web_suite_core

(function() {
	var SC_DEBUG_LOG = 0;
	var debug_log = function() {
		if (SC_DEBUG_LOG) console.debug(arguments);
	};

	var audioManager;

	var updateSimplifyMetadata = function(simplify) {
		var author,
			title = null,
			progress = 0,
			absoluteUrl = null,
			artworkUrl = null;

		// Get the track name from the player
		var trackParts = document.getElementsByClassName('playbackTitle__link')[0].innerHTML;

		if (trackParts != "") {
			// To make this work on all pages we grab all images and then look for the
			// one with an aria-label that matches the trackParts Get all artworks on.
			// FIXME This breaks if a song is changed and the artwork is not on the
			// page!
			
			// Get all artwork on the page
			var artworks = document.getElementsByClassName("sc-artwork");
			for (var i = 0; i < artworks.length; i++) {
				artwork = artworks[i];
				var ariaLabel = artwork.getAttribute('aria-label');
				if (ariaLabel != null && ariaLabel.indexOf(trackParts) != -1)
				{
					artworkUrl = artwork.style.backgroundImage.slice(4, -1);
					break;
				}
			}

			// Get the track progress
			var progressDiv = document.getElementsByClassName('playbackTitle__progress')[0];
			progress = parseInt(progressDiv.getAttribute('aria-valuemax')) / 1000;

			// Get URI, TODO again may not be efficient
			var headContent = document.getElementsByTagName('head')[0];
			var links = headContent.getElementsByTagName('link');
			for (var i = 0; i < links.length; i++) {
				link = links[i];
				var rel = link.getAttribute('rel');
				if (rel != null && rel.indexOf('canonical') != -1)
				{
					absoluteUrl = link.getAttribute('href');
					break;
				}
			}
		}

		// Split the track to get the name and title, TODO this will break if
		// someone has a dash in their name or title!
		var titleParts = trackParts.split(' - ');
		if (titleParts.length > 1) {
		  author = titleParts[0];
		  title = titleParts[1];
		} else {
		  author = 'Unknown';
		  title = 'Unknown';
		}
		debug_log('author: ', author, 'title: ', title, 'length', progress, 'uri', absoluteUrl, 'artwork: ', artworkUrl);
		simplify.setCurrentTrack({
		  	author: author,
		  	title: title,
		  	length: progress,
		  	uri: absoluteUrl,
			"features" : {
				"disable_track_seeking" : true,         //Disables seeking of current track
			}
		});

		// Process the artwork, if it is small then convert it to large
		if (artworkUrl) {
			// Check for tiny
			artworkUrl = artworkUrl.replace('-tiny.', '-t500x500.');
			// Check for 50
			artworkUrl = artworkUrl.replace('-t50x50.', '-t500x500.');
			// Check for 200
			artworkUrl = artworkUrl.replace('-t200x200.', '-t500x500.');
		} else {
			artworkUrl = "";
		}
		debug_log(artworkUrl);
		simplify.setCurrentArtwork(artworkUrl);	
	};

	var setupSimplifyBindings = function(simplify) {
		// Requests
		simplify.bindToVolumeRequest(function() {
			var volumeSlider = document.getElementsByClassName('volume__range')[0];
			var volume = parseInt(volumeSlider.getAttribute('value'));
			if (isNan(volume)) {
				return 100;
			} else {
				debug_log('Current volume', volume * 100);
				return volume * 100;
			}
		}).bindToTrackPositionRequest(function() {
			var playbackProgress = document.getElementsByClassName('playbackTitle__progress')[0];
			var progress = parseInt(playbackProgress.getAttribute('aria-valuenow'));
			if (isNan(progress)) {
				return 0;
			} else {
				debug_log('Current progress', progress * 100);
				return progress / 1000;
			}
		});
	
		// Actions by User
		simplify.bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data) {
			var playerControls = document.getElementsByClassName('playControls__playPauseSkip')[0];
			var playPauseButton = playerControls.getElementsByTagName("button")[1];
			if (data.state == Simplify.PLAYBACK_STATE_PLAYING) {
				if (playPauseButton.className.indexOf('playing') == -1)
					playPauseButton.click();
			}
			if (data.state == Simplify.PLAYBACK_STATE_PAUSED ||
				data.state == Simplify.PLAYBACK_STATE_STOPPED) {
				if (playPauseButton.className.indexOf('playing') != -1)
					playPauseButton.click();
		  	}
		}).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
			var playerControls = document.getElementsByClassName('playControls__playPauseSkip')[0];
			var previousButton = playerControls.getElementsByTagName("button")[0];
			previousButton.click();
		}).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
			var playerControls = document.getElementsByClassName('playControls__playPauseSkip')[0];
			var nextButton = playerControls.getElementsByTagName("button")[2];
			nextButton.click();
		}).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data) {
			var normalizedVolume = data.amount / 100;
			audioManager.setVolume(normalizedVolume);

			// TODO Update the volume element
		}).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data) {
			// TODO Not sure where to find the function required to do this
			// one, cant seem to get a seek function that works. Must require a
			// different element/object over audioManager.
		});
	};

	if (window.top == window) {
		window.addEventListener('load', function() {
	
			var simplify = new Simplify();
			simplify.setCurrentPlayer('SoundCloud');
	 
			setupSimplifyBindings(simplify);
			updateSimplifyMetadata(simplify);

			window.webpackJsonp([], {0: function(e, t, n) {
				// Loop, how do we know this is enough!?
				for (var i = 0; i < 900; i++) {
					try {
						var element = n(i);
						// Get the object that contains the function required to change the volume
						if (typeof element["setVolume"] == "function") {
							audioManager = element;
							break;
						}
					} catch(e) { }
				}
			}});

			player = document.getElementsByClassName('playControls');
			if (player != undefined)
			{
				var playerControls = document.getElementsByClassName('playControls__playPauseSkip')[0];
				var playPauseButton = playerControls.getElementsByTagName("button")[1];
	
				// Add listeners to the only two elements we ever need to monitor
				playPauseButton.addEventListener("DOMSubtreeModified", function() {
					// Determine state
					if (playPauseButton.className.indexOf('playing') == -1)
						simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PAUSED);
					else
						simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PLAYING);
				});
				document.getElementsByClassName('playbackTitle__link')[0].addEventListener("DOMSubtreeModified", function() {
					updateSimplifyMetadata(simplify);	
				});
			}
			
			window.addEventListener('unload', function() {
				simplify.closeCurrentPlayer();
			});
		});
	}
})();
