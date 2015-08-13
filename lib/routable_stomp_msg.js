(function() {
	function RoutableStompMessage(destination, headers, message) {
		if (typeof destination !== 'string' || destination.length == 0) throw "no destination specified";
		if (typeof message !== 'string' || message.length == 0) throw "no message specified";
		var routableMsgObj = 
		{
			"destination": destination
			,"message": message
		};
		if (headers) routableMsgObj.headers = headers;
		return JSON.stringify(routableMsgObj);
	}
	if (typeof exports !== "undefined" && exports !== null) {	// run inside node.js
		module.exports = RoutableStompMessage;
	}
	if (typeof window !== "undefined" && window !== null) {	// run inside browser
		window.RoutableStompMessage = RoutableStompMessage;
	}
}).call(this);