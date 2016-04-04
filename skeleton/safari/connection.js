//Implements a proxy server to connect to a specified web-socket 

var connections = {};

var SafariProxyConnection = function(identifier, event, endpoint)
{
	var _this = this;

	this.identifier = identifier;
	this.socket = new WebSocket(endpoint);
	this.event = event;

	this.socket.onopen = function(event)
	{
		_this.postMessage("SIMPLIFY_PROXY_OPEN", event);
	}

	this.socket.onclose = function(event)
	{
		console.info("WebSocket proxy client has been closed.");
		_this.postMessage("SIMPLIFY_PROXY_CLOSE", event);
	}

	this.socket.onerror = function(err)
	{
		console.info("WebSocket proxy client has been closed because of an error (" + err + ").");
		_this.postMessage("SIMPLIFY_PROXY_ERROR", err);
	}

	this.socket.onmessage = function(event)
	{
		_this.postMessage("SIMPLIFY_PROXY_MESSAGE", event);
	}
}

SafariProxyConnection.prototype.postMessage = function(name, data) 
{
	this.event.target.page.dispatchMessage(name, data);
}

//Listening to when the injected script wants to create a server
safari.application.addEventListener("message", function(event)
{
	console.info("Received global message: " + event.name + " = " + messageData);

	var messageName = event.name;
	var messageData = event.message;

	if (messageName === "SIMPLIFY_PROXY_INIT")
	{
		var identifier = Math.random().toString(36).substring(12);

		var connection = new SafariProxyConnection(identifier, event, messageData);
		connections[identifier] = connection;

		connection.postMessage("SIMPLIFY_PROXY_READY", identifier);
	}
	else if (messageName == "SIMPLIFY_PROXY_NEW_MESSAGE")
	{
		var connection = connections[messageData["identifier"]];
		if (connection == nil) return;

		connection.socket.send(messageData["data"]);
	} 
	else if (message.name == "SIMPLIFY_PROXY_CLOSE")
	{
		var connection = connections[messageData["identifier"]];
		if (connection == nil) return;

		delete connections[connection.identifier];

		connection.socket.onclose = function()
		{
			delete connection.socket;
			connection.socket = null;
			console.info("WebSocket proxy client has been closed by the client.");
		}

		connection.socket.close(4000, "Closed by the client.");
	}
	else
	{
		console.info("Invalid message received: " + messageName + ".");
	}

}, false);