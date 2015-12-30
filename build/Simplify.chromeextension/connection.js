//Implements a proxy server to connect to a specified web-socket 

var connections = [];

var ChromeProxyServer = function(port)
{
	//Storing our port
	this.port = port;
	this.socket = null;

	//Storing reference to self here
	var _this = this;

	//Handling incoming messages
	port.onMessage.addListener(function(message)
	{
		if (message.name == "SIMPLIFY_PROXY_INIT")
		{
			console.info("Connected to the proxy client.")
			_this.setupSocket(message.data);
		}
		else if (message.name == "SIMPLIFY_PROXY_NEW_MESSAGE")
		{
			_this.socket.send(message.data);
		}
		else if (message.name == "SIMPLIFY_PROXY_CLOSE")
		{
			_this.socket.onclose = function()
			{
				delete _this.socket;
				_this.socket = null;
				console.info("WebSocket proxy client has been closed by the client.");
			}

			_this.socket.close(4000, "Closed by the client.");
		}
		else
		{
			console.info("Invalid message received: " + message.name + ".");
		}
	});

	port.onDisconnect.addListener(function()
	{
		console.info("Proxy client disconnected.");

		if (_this.socket != null && _this.socket.readyState == WebSocket.OPEN)
		{
			_this.socket.close(4000, "Closed by the client.");
		}

		var removeIdx = -1;
		for (var i = 0; i < connections.length; i++)
		{
			if (connections[i] === _this)
			{
				removeIdx = i;
				break;
			}
		}

		connections.splice(removeIdx, 1);
		delete _this;
	});

}

ChromeProxyServer.prototype.setupSocket = function(endpoint)
{
	var _this = this;

	this.socket = new WebSocket(endpoint);

	this.socket.onopen = function(event)
	{
		_this.port.postMessage({ name : "SIMPLIFY_PROXY_OPEN", data : event });
	}

	this.socket.onclose = function(event)
	{
		console.info("WebSocket proxy client has been closed.");
		_this.port.postMessage({ name : "SIMPLIFY_PROXY_CLOSE", data : event });
	}

	this.socket.onerror = function(err)
	{
		console.info("WebSocket proxy client has been closed because of an error (" + err + ").");
		_this.port.postMessage({ name : "SIMPLIFY_PROXY_ERROR", data : err });
	}

	this.socket.onmessage = function(event)
	{
		_this.port.postMessage({ name : "SIMPLIFY_PROXY_MESSAGE", data : event.data });
	}
}

//Listening to all the incoming messages here
chrome.runtime.onConnectExternal.addListener(function(port)
{
	if (port.name == "SimplifyProxyClient")
	{
		connections.push(new ChromeProxyServer(port));
		console.info("Connection pool has %s connections now.", connections.length)
	}
});
