// Required tools
const tools = require('./tools.js');

// KVStore Data
var db = {
	data: {
		'admins': [],
		'banned': []
	}
};

// Hardcoded admins in case the database cannot be reached
var default_admins = ['73780450'];
// Get data from database on bot startup
var master_keys = ['admins', 'banned'];
for (var i = 0; i < master_keys.length; i++) {
	tools.KVStore('GET', master_keys[i], db);
}

// Settings
const JAS = process.env.JAS === 'enabled' ? true : false;

// GroupMe info
var group_info = {
	raw: '',
	members: {},
	muted: 0,
	updated: false
}

// Update GroupMe information
tools.updateInfo(group_info);

// Responding to text chat
function parse(req) {

	// Split the message into parts
	var message = JSON.parse(req.chunks[0]);
	// Log the message for debugging purposes
	console.log('[Chat] Message: ' + JSON.stringify(message));

	if (message.text && message.sender_type === 'user') {

		// Commands that start with a !
		if (message.text[0] === '!') {

			// Make sure the user isn't banned
			if (db.data['banned'].includes(message.sender_id) && !default_admins.includes(message.sender_id)) return;

			// Get the command the user typed
			var command = [];
			// Some commands don't have a space to split
			var index = message.text.indexOf(' ') > -1 ? message.text.indexOf(' ') : message.text.length;
			var command = [
				message.text.substr(0, index),
				message.text.substr(index + 1)
			];
			// Trim the ! from the command and make the command lowercase so we don't have to handle as many variations
			command[0] = command[0].substring(1).toLowerCase();

			// Do something based on the command
			switch (command[0]) {

				// Display a FAQ
				case 'faq':
					tools.say('Here is a helpful document with info about the SAs and JAs, and some frequently asked questions! Make sure to use your TAMU email to view the document: <link removed>');
					break;

				// Display move-in information
				case 'movein':
					tools.say('Reslife move-in info: https://reslife.tamu.edu/movein/');
					break;

				// Display the code for the bot
				case 'code':
				case 'git':
				case 'github':
					tools.say('List of commands: https://github.com/submindraikou/ocelot-bot');
					break;

				// Display how many users have the chat muted
				case 'muted':
				case 'mute':
					// Recursive function in case the member list hasn't been updated yet
					function muted(attempts) {
						if (group_info.updated) {
							// Display total amount and percentage of muted users
							var percentage = (group_info.muted / Object.keys(group_info.members).length) * 10000;
							percentage = Math.round(percentage) / 100;
							tools.say(group_info.muted + ' users (' + percentage + '%) have this chat muted.');
						} else {
							// Recurse after 2 seconds
							setTimeout(() => {
								if (attempts > 10) { // 10 attempts = ~20 seconds
									console.log('[Chat]: Member list didn\'t update in 20 seconds! Please check your token and make sure it is correct.');
									tools.say('Sorry! There was an error connecting to the server and updating the member list.');
								} else {
									console.log('[Chat]: Waiting 2 seconds before attempting to let everyone know about mutes.');
									muted(attempts);
								}
							}, 2000);
						}
					}

					// Call the function
					muted();
					break;

				// Display an image of a schedule
				case 'howdyschedule':
				case 'howdyweek':
				case 'howdy':
				case 'schedule':
					tools.say('Here\'s the Howdy Week Schedule! ', [{'type': 'image', 'url': 'https://i.groupme.com/1493x2250.jpeg.575520d71e404739a50d91018bef2c43.large'}]);
					break;

				// Display a pastebin of available commands
				case 'help':
					tools.say('List of commands: https://pastebin.com/raw/m9zpUnc9');
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
				// List the IDs of admins
				case 'list_admins':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						tools.say('Admin list: ' + db.data['admins']);
					}
					break;

				// DEBUGGING
				// List the IDs of members
				case 'list_members':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						tools.say(JSON.stringify(group_info.members));
					}
					break;

				// DEBUGGING
				// Reload KVStore and GroupMe member data
				case 'reload':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						tools.say('Reloading member list and KVStore data...');
						// If an admin uses !reload true it will display debug info
						if (command[1] === 'true') tools.updateInfo(group_info, true);
						else tools.updateInfo(group_info);
						tools.KVStore('GET', 'admins', db);
						tools.KVStore('GET', 'banned', db);
					}
					break;

				// EMERGENCY STOP
				// Sometimes we make mistakes and bot's will start spamming for one reason or another.
				// This will emergency stop the bot by exiting. Use wisely!
				case 'kill':
				case 'stop':
					if (db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id)) {
						process.exit();
					}
					break;

				// If a command wasn't found then show the list of commands
				default:
					tools.say('Command not recognized. For a list of commands type ~help');
					console.log('[Commands] Unrecognized command: ' + command[0]);
					console.log('[Commands] The full message: ' + JSON.stringify(command));
			}

		}
		
		// Commands that don't start with !

		// A recursive function to @everyone in a group
		function atEveryone(attempts) {
			// Update how many attempts we've made
			attempts++;
			// If the member list is updated then @ everyone
			if (group_info.updated) {
				// GroupMe mentions are an attachment to a message that contans two parts:
				// * An array of user IDs to mention.
				// * An array of arrays that each contain a start and end point to bold.
				// This @everyone command will go through each user in a group and add them to a message in order to alert them.
				var mention = [];
				var loc = [];
				var phrase = 'Howdy y\'all. Read this please!';
				for (var j = 0; j < Object.keys(group_info.members).length; j++) {
					if (mention.length >= 47) {
						// Maximum number of users a single message can mention is 47.
						// Once we reach this number of users send a message and start over.
						tools.say(phrase, [{'loci': loc, 'type': 'mentions', 'user_ids': mention}]);
						mention = [];
						loc = [];
					}
					mention.push(Object.keys(group_info.members)[j]);
					loc.push([0, phrase.length]);
				}
				tools.say(phrase, [{'loci': loc, 'type': 'mentions', 'user_ids': mention}]);
			// Otherwise wait 2 seconds then call the function again
			} else {
				setTimeout(() => {
					if (attempts > 10) { // 10 attempts = ~20 seconds
						console.log('[Chat]: Member list didn\'t update in 20 seconds! Please check your token and make sure it is correct.');
						tools.say('Sorry! There was an error connecting to the server and updating the member list.');
					} else {
						console.log('[Chat]: Waiting 2 seconds before attempting to @ everyone again.');
						atEveryone(attempts);
					}
				}, 2000);
			}
		}

		// @everyone or @all or @y'all
		if (message.text.search(/@everyone|@all|@y'all|@everybody/) > -1) {
			if ((db.data['admins'].includes(message.sender_id) || default_admins.includes(message.sender_id))) {
				atEveryone(0);
			}
		}

		// @JAs
		// A simple @ certain users command.
		if (message.text.search(/@JAs/i) > -1 && atJAs) {
			// In order: Thomas, Yutika, Prisha, Kristen
			var mention = [73780450, 38409954, 44501522, 49609197];
			var loc = [[10, 14], [10, 14], [10, 14], [10, 14]];
			var phrase = 'Summoning @PKYT.';
			tools.say(phrase, [{'loci': loc, 'type': 'mentions', 'user_ids': mention}]);
		}

		// A simple response when someone asks where a location is
		// This specific regex searches for someone using "where" or "what" along with the word "Tweener" (i.e. "Where's tweener?", "what is tweener?", etc.)
		// and responds with a simple message to let the user know where the location is.
		if (message.text.search(/(?=.*tweener)((?=.*where+)|(?=.*what+)).+/i) > -1 || message.text.toLowerCase() === 'tweener?') {
			tools.say('Howdy! Tweener is the outside area between Lechner and McFadden.');
		}

	}

	// React to certain system messages, such as users joining and leaving
	if (message.text && message.sender_type === 'system') {

		// A user has left, say goodbye!
		if (message.text.search(/removed|left/) > -1) {
			tools.say('Ciaowdy!');
		}

		// A welcome message for joining users
		if (message.text.search(/added|joined/) > -1) {
			// Welcome message
			var message_text = '';

			// 20% chance to say Meowdy instead of Howdy
			if (Math.random() > 0.8) {
				message_text = 'Meowdy';
			} else {
				message_text = 'Howdy';
			}

			// If the system message is of the format: <name> has joined the group.
			// We can get the username by removing the ending portion.
			// Technically we can do something like this for the other cases (i.e. "<name> has added <name> into the group" messages).
			// But I didn't feel like writing that in here...
			if (message.text.includes(' has joined the group')) {
				var name = message.text.split(' has joined the group');
				message_text += ' ' + name[0];
			}

			// If the system message is of the format: <name> has rejoined the group.
			if (message.text.includes(' has rejoined the group')) {
				var name = message.text.split(' has rejoined the group');
				message_text += ' ' + name[0];
			}

			// Send a welcome message
			// TODO: Make the welcome message a variable that can be changed from a Heroku dashboard.
			tools.say(message_text + ', welcome to the LechFadden 2021-2022 GroupMe! Tell us your major and a fun fact about you! Thanks and Gig \'Em!');
		}
	}
}

// Set up the bot as a server to recieve messages
require('http').createServer( (req, res) => {

	// Store the data recieved
	req.chunks = [];
	req.on('data', (chunk) => {
		req.chunks.push(chunk.toString());
	});

	// Once we get an end event we can safely parse the data
	req.addListener('end', () => {
		if (req.method === 'POST') parse(req);
	});

	// We can do other things here but we don't really need to
	// TODO: Maybe we could add a cool webpage? Or even just display the current version so we can easily tell if we've updated...
	switch (req.method) {
		case 'GET':
			// This is what people see when they go to <your bot name>.herokuapp.com
			res.writeHead(200);
			res.end("Ocelot bot");
			break;
		case 'POST':
			// We don't really do anything here, the messages get responded to once all the data is recieved on our end
			break;
		default:
			// We don't need to do anything here either
			break;
	}

}).listen(Number(process.env.PORT || 5000));
