//Implements a proxy server to connect to a specified web-socket 

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
			console.log("Connected to the proxy client.")
			_this.setupSocket(message.data);
		}
		else if (message.name == "SIMPLIFY_PROXY_NEW_MESSAGE")
		{
			_this.socket.send(message.data);
		}
		else
		{
			console.error("Invalid message received: " + message.name + ".");
		}
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
		console.error("WebSocket proxy client has been closed.");
		_this.port.postMessage({ name : "SIMPLIFY_PROXY_CLOSE", data : event });
		delete _this;
	}

	this.socket.onerror = function(err)
	{
		console.error("WebSocket proxy client has been closed because of an error (" + err + ").");
		_this.port.postMessage({ name : "SIMPLIFY_PROXY_ERROR", data : err });
		delete _this;
	}

	this.socket.onmessage = function(event)
	{
		_this.port.postMessage({ name : "SIMPLIFY_PROXY_MESSAGE", data : event });
	}
}

//Listening to all the incoming messages here
chrome.runtime.onConnectExternal.addListener(function(port)
{
	if (port.name == "SimplifyProxyClient")
	{
		new ChromeProxyServer(port);
	}
});