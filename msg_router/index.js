// message routing service
// this module is a plug-in for the generic message service and uses node modules stomp_msg_connector and stomp-rest-msg-broker
var StompRESTMsgBroker = require('stomp-rest-msg-broker');
var config = require('stomp_msg_connector').getConfig();

function supportBrokerDestination(brokerHost) {
	var brokerAliases = config["brokerAliases"];
	var brokerHostsAdditionalOptions = config["brokerHostsAdditionalOptions"];
	if (!brokerAliases) return {supported: false};
	var hostname = brokerAliases[brokerHost];
	if (typeof hostname === 'undefined')
		return {supported: false};
	else {
		var ret = {supported: true, params: {}};
		ret.params.hostname = hostname;
		ret.params.additionalOptions = (brokerHostsAdditionalOptions ? (brokerHostsAdditionalOptions[hostname] ? brokerHostsAdditionalOptions[hostname] : null) : null);
		return ret;
	}
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
			console.log('destination broker=' + brokerHost);
			var ret = supportBrokerDestination(brokerHost);
			if (ret.supported) {
				var translatedHostname = ret.params.hostname;	// translated host name
				if (typeof translatedHostname === 'string' && translatedHostname.length > 0 && translatedHostname !== brokerHost) {
					pd.options.hostname = translatedHostname;
					destinationUrl = StompRESTMsgBroker.makeDestinationUrl(pd.protocol, pd.options);
				}
				brokerHost = pd.options.hostname;
				additionalOptions = ret.params.additionalOptions;
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