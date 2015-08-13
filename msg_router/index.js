// message routing service
// this module is a plug-in for the generic message service and uses node modules stomp_msg_connector and stomp-rest-msg-broker
var StompRESTMsgBroker = require('stomp-rest-msg-broker');
var config = require('stomp_msg_connector').getConfig();

function supportBrokerDestination(brokerHost) {
	var supportedBrokerHosts = config["supportedBrokerHosts"];
	if (!supportedBrokerHosts) return {supported: false};
	if (typeof supportedBrokerHosts[brokerHost] === 'undefined')
		return {supported: false};
	else
		return {supported: true, additionalOptions: supportedBrokerHosts[brokerHost]}; 
}

// get the forward destination object for the brokerHost
function getForwardDestinationFromRoutingTable(brokerHost) {return (config["routingTable"] ? config["routingTable"][brokerHost] : null);}

module.exports = function(broker, message) {
	try {
		if (message.body) {
			var routedMsg = JSON.parse(message.body);
			var destinationUrl = routedMsg.destination;
			var pd = StompRESTMsgBroker.parseDestinationUrl(destinationUrl);
			var brokerHost = pd.options.hostname;
			var dest = pd.destination;
			var additionalOptions = null;
			var headers = null;
			var messageString = null;
			console.log('destination broker =' + brokerHost);
			var ret = supportBrokerDestination(brokerHost);
			if (ret.supported) {
				additionalOptions = ret.additionalOptions;
				headers = routedMsg.headers;
				messageString = routedMsg.message;
			} else {
				var ret = getForwardDestinationFromRoutingTable(brokerHost);
				if (!ret)
					throw "unable to route the message to " + brokerHost;
				else { // forward the message to the next msg router
					destinationUrl = ret.destination;
					pd = StompRESTMsgBroker.parseDestinationUrl(destinationUrl);
					brokerHost = pd.options.hostname;
					dest = pd.destination;
					additionalOptions = ret.additionalOptions;
					headers = {presistence: true};
					messageString = message.body;
				}
			}
			var broker = new StompRESTMsgBroker();
			broker.send({destination: destinationUrl, additionalOptions: additionalOptions}, headers, messageString, function(err, receipt_id) {
				if (err)
					console.error('!!! Error: ' + e.toString());
				else {
					console.error('message successfully forwarded to "' + dest + '" @ ' + brokerHost + ', receipt_id=' + receipt_id);
				}
			});
		}
		else
			throw "missing message body";
	}
	catch(e) {
		console.error('!!! Error: ' + e.toString());
	}
};