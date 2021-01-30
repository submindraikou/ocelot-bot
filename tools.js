// Constants
const HTTPS = require('https');
const botID = process.env.BOT_ID; // GroupMe Bot ID, required for posting messages to the chat
const groupID = process.env.GROUP_ID; // GroupMe Group ID, required for getting group info like members
const token = process.env.TOKEN; // GroupMe Authentication key, required for accessing GroupMe API's to get group info
const kvstoreio_key = process.env.KVSTORE_KEY; // KVStore.io Key, required for a small amount of free online storage

// Send requests. Callback and headers are optional.
function send(options, body, callback, headers) {

	var req = HTTPS.request(options, (res) => {
		if (res.statusCode === 202) {
			// No need to do anything
		} else if (res.statusCode === 200) {
			// Reading the body of a response
			res.on('data', (chunk) => {
				if (callback) callback(chunk);
			});
		} else {
			// Log any potential errors
			console.log('[Send] Rejecting bad status code ' + res.statusCode);
			console.log('[Send] Error message: ' + res.statusMessage);
		}
	});

	// Headers
	var headers = headers || [];
	for (var i = 0; i < headers.length; i++) {
		req.setHeader(headers[i][0], headers[i][1]);
	}

	// Error logging
	req.on('error', (err) => {
		console.log('[Send] Error posting message '  + JSON.stringify(err));
	});
	req.on('timeout', (err) => {
		console.log('[Send] Timeout posting message '  + JSON.stringify(err));
	});

	req.end(JSON.stringify(body));

}

// KVStore Storage
exports.KVStore = (type, key, db) => {

	// Headers
	var headers = [];
	headers.push(['kvstoreio_api_key', kvstoreio_key]);

	// Options
	var options = {
		hostname: 'api.kvstore.io',
		path: '/v3/bots/post',
		method: type
	};

	// Body
	var body = {};

	// POST PUT GET
	switch (type) {

		// Create collection
		case 'POST':
			// Header
			headers.push(['Content-Type', 'application/json']);
			// Options
			options.path = '/collections';
			// Body
			body =  {'collection' : 'bot_data'};
			// Log
			console.log('[KVStore.io] Sending POST (create) request');
			break;

		// Store data
		case 'PUT':
			// Header
			headers.push(['Content-Type', 'text/plain']);
			// Options
			options.path = '/collections/bot_data/items/' + key;
			// Body
			body = db;
			// Log
			console.log('[KVStore.io] Sending PUT (store) request');
			break;

		// Retrieve data
		case 'GET':
			// Options
			options.path = '/collections/bot_data/items/' + key;
			// Log
			console.log('[KVStore.io] Sending GET (get) request');
			break;

		// Requests should be POST PUT or GET
		default:
			console.log('[KVStore.io] An invalid KVStore type was used. One of POST, PUT, or GET must be used');
	}

	// Send the request
	send(options, body, (chunk) => {

		console.log('[KVStore.io] KVStore response recieved to ' + type + ' request.');

		if (type === 'GET') {
				// If we used a GET request then store the recieved data
				console.log('[KVStore.io] Recieved data: ' + chunk);
				db.data[key] = JSON.parse(JSON.parse(chunk).value);
			}
	}, headers);

}

exports.updateInfo = (gi) => {

	// Options
	var options = {
		hostname: 'api.groupme.com',
		path: '/v3/groups/' + groupID + '?token=' + token,
		method: 'GET'
	};

	// Clear the raw info and re populate from GroupMe
	gi.raw = '';
	send(options, {}, (chunk) => {
		gi.raw += chunk.toString();
	});

	// Wait 3 seconds before parsing to make sure we caught all the data.
	// This isn't ideal but it works...
	// TODO: Run this function on a close event instead of a timer of 3 seconds
	setTimeout(() => {
		var members = JSON.parse(gi.raw).response.members;
		for (var i = 0; i < members.length; i++) {
			gi.members[members[i].user_id] = members[i].nickname;
		}
		console.log('[Info Updater] Members list has been updated!');
	}, 3000);
}


// Post messages to chat
// mentions = ['73780450'];
// location = [[0, 1]];
exports.say = (message, mentions, loc) => {

	// Options
	var options = {
		hostname: 'api.groupme.com',
		path: '/v3/bots/post',
		method: 'POST'
	};

	// Body
	var body = {
		'bot_id' : botID,
		'text' : message
	};

	// Mentions
	// GroupMe mentions require 3 parts in it's attachments
	// -> a type set to mentions
	// -> an array of user ids ['user1', 'user2', 'user3']
	// -> an array of which parts of the text to bold [[0,1], [2,5], [1,3]]
	// Each mentioned user id corresponds to the location of the same index
	if (mentions) body['attachments'] = [{'loci': loc, 'type': 'mentions', 'user_ids': mentions}];

	// Log that we sent the message.
	console.log('[Chat] Sending [' + message + '] to the chat room');

	send(options, body);

}
