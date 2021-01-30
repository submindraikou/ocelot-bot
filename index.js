// Setup the bot as a Node.js server
const http = require('http');
const director = require('director');

// Misc.
const tools = require('./tools.js');

// KVStore Data
var db = {
	data: {
		'listings': {},
		'admins': [],
		'banned': []
	}
};

// Hardcoded admins in case the database cannot be reached
var default_admins = ['73780450'];
// Get data from database on bot startup
var master_keys = ['listings', 'admins', 'banned'];
for (var i = 0; i < master_keys.length; i++) {
	tools.KVStore('GET', master_keys[i], db);
}

// GroupMe info
var group_info = {
	raw: '',
	members: {}
}

// Update GroupMe information
tools.updateInfo(group_info);

// Responding to text chat
function parse() {

	// Split the message into parts
	var message = JSON.parse(this.req.chunks[0]);
	// Log the message for debugging purposes
	console.log('[Chat] Message: ' + JSON.stringify(message));

	if (message.text) {

		// Commands should start with a ~
		if (message.text[0] === '~') {

			// Make sure the user isn't banned
			if (db.data['banned'].includes(message.sender_id)) return;

			// Get the command the user typed
			var command = [];
			// Some commands don't have a space to split
			var index = message.text.indexOf(' ') > -1 ? message.text.indexOf(' ') : message.text.length;
			var command = [
				message.text.substr(0, index),
				message.text.substr(index + 1)
			];
			// Trim the ~ from the command
			command[0] = command[0].substring(1);

			// Do something based on the command
			switch (command[0]) {

				// Allow users to sell things
				case 's':
				case 'sell':
					// If the user asks for help
					if (command[1] === 'help') {
						tools.say('List of commands: https://pastebin.com/raw/m9zpUnc9');
						break;
					}

					// Create the listing
					try {
						if (!command[1]) throw 'not enough parameters';
						var info = command[1].split(',');
						info[0] = info[0].trim(); // TODO: We should probably not allow users to create listings with multiple newlines...

						// Get amount and price if the user included it
						var amount, price;
						if (info[1]) {
							var temp = info[1].trim().split(' ');
							if (temp[0]) amount = temp[0];
							if (temp[1]) price = temp[1][0] === '$' ? temp[1] : '$' + temp[1];
						}

						// Store the data in the db object only if there is no conflicting id
						if (!db.data['listings'][info[0]]) {
							db.data['listings'][info[0]] = {
								'u': message.sender_id
							};
							// Amount and price are optional
							if (amount) db.data['listings'][info[0]]['a'] = amount;
							if (price) db.data['listings'][info[0]]['p'] = price;
						} else {
							// If the id is already in use then alert the user
							throw 'this ID is already in use';
						}
						// Give the user confirmation that their listing has been created
						var confirmation_message = 'Successfully created a listing for [' + info[0] + ']';
						if (amount) confirmation_message = 'Successfully created a listing for ' + amount + ' of [' + info[0] + ']';
						if (price) confirmation_message += ' for ' + price;
						confirmation_message += '.';
						tools.say(confirmation_message);
						// Update the database
						tools.KVStore('PUT', 'listings', db.data['listings']);
					} catch (e) {
						// Catch thrown errors
						tools.say('There was an error creating your listing: ' + e + '. Please refer to the list of commands: https://pastebin.com/raw/m9zpUnc9');
					}
					break;

				// List everything being sold
				case 'l':
				case 'list':
					var listing_message = 'The items available:\n';
					// List of listings
					var list_keys = Object.keys(db.data['listings']);
					// Create a list to say in chat
					for (var i = 0; i < list_keys.length; i++) {
						listing_message += list_keys[i];
						if (db.data['listings'][list_keys[i]].a) listing_message += ' (' + db.data['listings'][list_keys[i]].a + ' available)';
						if (db.data['listings'][list_keys[i]].p) listing_message += ' (' + db.data['listings'][list_keys[i]].p + ')';
						listing_message += '\n';
					}
					listing_message += 'To contact a user selling one of these items type ~buy <item listing>';
					tools.say(listing_message);
					break;

				// Contact the original seller
				case 'b':
				case 'buy': 
					// Alert the original poster that someone is interested in their item.
					if (db.data['listings'][command[1]]) {
						var mention = [];
						mention.push(db.data['listings'][command[1]]['u']);
						var loc = [];
						// Just in case the user left the chat or the member cannot be found
						try {
							loc.push([8, group_info.members[mention[0]].length]);
							tools.say('Tagging ' + group_info.members[mention[0]], mention, loc);
						} catch (e) {
							tools.say('There was an error trying to alert the seller. Maybe they left the chat?');
							console.log('[Group Info] Error: ' + e);
						}
					}
					// If the item was not found
					else tools.say('Item not found. Please use ~buy <item listing> or use ~list to view everything again');
					break;
				case 'help':
					tools.say('List of commands: https://pastebin.com/raw/m9zpUnc9');
					break;

				// Admin Commands
				// Purge an item from the listing
				case 'purge':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {

						// Purge entry from the listings and update the database
						tools.say('Purging ' + command[1] + ' from the listings.');
						delete db.data['listings'][command[1]];
						tools.KVStore('PUT', 'listings', db.data['listings']);
					}
					break;

				// Promote a user to be an admin
				case 'addmin':
				case 'promote':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						// Search for a user's user ID
						var ID;
						for (var i = 0; i < Object.keys(group_info.members).length; i++) {
							if (group_info.members[Object.keys(group_info.members)[i]] === command[1]) {
								ID = Object.keys(group_info.members)[i];
								break;
							}
						}
						// If the ID was found then promote that user
						if (ID) {
							tools.say('Promoting ' + command[1] + ' to an admin.');
							db.data['admins'].push(ID);
							tools.KVStore('PUT', 'admins', db.data['admins']);
						} else tools.say(command[1] + ' not found!');
					}
					break;

				// Demote a user from being an admin
				case 'admin\'t':
				case 'demote':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						// Search for a user's user ID
						var ID;
						for (var i = 0; i < Object.keys(group_info.members).length; i++) {
							if (group_info.members[Object.keys(group_info.members)[i]] === command[1]) {
								ID = Object.keys(group_info.members)[i];
								break;
							}
						}
						// If the ID was found then demote that user
						if (db.data['admins'].includes(ID) && ID) {
							tools.say('Demoting ' + command[1] + '.');
							var index = db.data['admins'].indexOf(ID);
							db.data['admins'].splice(index, 1);
							tools.KVStore('PUT', 'admins', db.data['admins']);
						} else tools.say(command[1] + ' couldn\'t be demoted! Maybe they weren\'t an admin?');
					}
					break;

				// Ban a user from using bot commands
				case 'ban':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						// Search for a user's user ID
						var ID;
						for (var i = 0; i < Object.keys(group_info.members).length; i++) {
							if (group_info.members[Object.keys(group_info.members)[i]] === command[1]) {
								ID = Object.keys(group_info.members)[i];
								break;
							}
						}
						// If the ID was found then ban that user
						if (ID) {
							tools.say('Banning ' + command[1] + ' from using bot commands.');
							db.data['banned'].push(ID);
							tools.KVStore('PUT', 'banned', db.data['banned']);
						} else tools.say(command[1] + ' not found!');
					}
					break;

				// Unban a user and allow them to use bot commands
				case 'unban':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						// Search for a user's user ID
						var ID;
						for (var i = 0; i < Object.keys(group_info.members).length; i++) {
							if (group_info.members[Object.keys(group_info.members)[i]] === command[1]) {
								ID = Object.keys(group_info.members)[i];
								break;
							}
						}
						// If the ID was found then unban that user
						if (db.data['banned'].includes(ID) && ID) {
							tools.say('Unbanning ' + command[1] + '.');
							var index = db.data['banned'].indexOf(ID);
							db.data['banned'].splice(index, 1);
							tools.KVStore('PUT', 'banned', db.data['banned']);
						} else tools.say(command[1] + ' couldn\'t be unbanned! Maybe they weren\'t banned?');
					}
					break;

				// DEBUGGING
				case 'reload':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						tools.say('Reloading member list and KVStore data...');
						tools.updateInfo(group_info);
						tools.KVStore('GET', 'listings', db);
						tools.KVStore('GET', 'admins', db);
						tools.KVStore('GET', 'banned', db);
					}
					break;

				// DEBUGGING
				case 'list_members':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						tools.say(JSON.stringify(group_info.members));
					}
					break;

				// If a command wasn't found then show the list of commands
				default:
					tools.say('Command not recognized. For a list of commands type ~help');
					console.log('[Commands] Unrecognized command: ' + command[0]);
					console.log('[Commands] The full message: ' + JSON.stringify(command));
			}
		}
	}
}

// On request recieved
var router = new director.http.Router({
	'/' : {
		post: parse,
		get: ping
	}
});

// Server to listen for requests
var server = http.createServer( (req, res) => {
	req.chunks = [];
	req.on('data', (chunk) => {
		req.chunks.push(chunk.toString());
	});

	router.dispatch(req, res, (err) => {
		res.writeHead(err.status, {"Content-Type": "text/plain"});
		res.end(err.message);
	});
});

// Port
var port = Number(process.env.PORT || 5000);
server.listen(port);

function ping() {
	this.res.writeHead(200);
	this.res.end("Ocelot bot");
}
