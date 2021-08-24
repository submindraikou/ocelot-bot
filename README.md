# Ocelot Bot

GroupMe bot developed for use in my dorm GroupMe. This bot can be hosted on Heroku and with a KVStore.io key you can have a small amount of storage to keep track of things between saves.

This is the public version that I only update occasionally whenever a new feature is added and bug free. Feel free to use the issues tab to ask any questions you have and I'll try my best to explain!

Based off of [Cool Guy Bot](https://github.com/groupme/bot-tutorial-nodejs).

## Installation

In order to set up an ocelot bot for your chat you must set up a [Heroku](https://heroku.com) account and a [KVStore.io](https//kvstore.io) account.
Both of these are free and allow us to host our bot and store a tiny bit of data!

#### Creating the Bot on Heroku

Navigate to [Heroku's App Dashboard](https://dashboard.heroku.com/apps) and click New -> Create new app.
On the app creation page select a name for your bot, for this example I'll use the name example-ocelot.
After creating a new application go to Settings and scroll down to Domains. You should see a message such as:

Your app can be found at https://example-ocelot.herokuapp.com/

This URL will be used later on the GroupMe bot setup.

#### Creating the Bot on GroupMe

Once you have started a Heroku app you can navigate to [GroupMe's Bot Page](https://dev.groupme.com/bots). Click "Create Bot" and fill out the form. 
- Choose the group that the bot will interact with
- Choose a username for the bot
- Use the callback URL provided by Heroku (https://example-ocelot.herokuapp.com/, with example-ocelot replaced with your Heroku application name)
- Optionally choose an avatar image for the bot

Once you submit the form a new bot should be created and you should be brought back to the GroupMe bots page.
On this page your bot should have a Bot ID and a Group ID.

Finally, you will need your GroupMe Token which can be accessed on any GroupMe developer page in the top right (click on Access Token

#### Setting up KVStore.io

Navigate to [KVStore.io](https://kvstore.io) and set up an account. Once logged in, your dashboard should display your KVStore.io API key (or it may be obfuscated).

#### Finishing Heroku Application setup

At this point, you should have written down or otherwise accesable:

* KVStore.io API key
* GroupMe Token
* GroupMe Bot ID
* GroupMe Group ID

Keep in mind, these are sensitive pieces of information and should not be shared with anyone!

Navigate to your application on Heroku and go to Settings. Scroll down to Config Vars and click "Reveal Config Vars", then input the following settings:

* BOT_ID: your Bot ID
* GROUP_ID: your GroupMe Group ID
* KVSTORE_KEY: your KVStore.io API Key
* TOKEN: your GroupMe Token

Next go to Deploy, and scroll down to Deployment Method. I prefer using GitHub, but you can try using the other code hosting methods.
After clicking "Connect to GitHub" and linking up your account you can select the repository with the correct code and link it with your Heroku application.
You can manually deploy updates using the "Deploy Branch" button, or automatically update your bot every time you update the code in your repository with "Enable Automatic Deploys".

For more information on Heroku-GitHub integration see [their docs](https://devcenter.heroku.com/articles/github-integration#enabling-github-integration).
If you would like to try using Git instead you can check our their [article here](https://devcenter.heroku.com/articles/git).

Congratulations! Once you save those variables and linked your bot to a repository it should be fully functional, you can @everyone or try commands such as !help.
 
## Settings

Additional, optional settings that can be set on the bot using config vars on Heroku. If they aren't set they are disabled by default.

PORT: <number>
- Set a custom port for your bot, defaults to 5000 if not set.

JAS: enabled
- Allows for users to use a command to @ specific users (in this case officers of an organization).
- To enable this feature the variable must be set to "enabled"

## Adding More Commands

#### Simple Commands

Adding more commands is relatively simple, even if you don't know Javascript or have no experience coding.
First navigate to index.js and find the [line begins the switch statement](https://github.com/submindraikou/ocelot-bot/blob/4760d80d6911d5a7091d507d1a0d1bce28ce24fc/index.js#L65).
These commands are triggered when a user types !anything with the word after the ! being taken as a command. 
To add another command, simply add another case. For example to add a !joke command:

    case 'joke':
					tools.say('Why did the chicken cross the road? To get to the other side!');
					break;

case 'joke':
- Here, "case 'joke':" lets the bot know that if anyone types the phrase between the apostrophies, joke, then it will run the code inside this case code block.

tools.say('Why did the chicken cross the road? To get to the other side!');
- This bot sends messages to the Group using tools.say, which you can learn more about by taking a look in the tools.js file.
- Anything inside this function will be sent to the group, and if you want to include apostrophies in the message make sure to escape them using \
- For example: 'This is a string that contains an apostrophe \' that everyone can see!'

break;
- This ends the code block for this command.

If you are new to programming or Javascript and want to understand there are tons of resources available online!
Some references that I visit often are:
* [Javascript by W3 Schools](https://www.w3schools.com/js/)
* [Javascript Docs by Mozilla](https://developer.mozilla.org/en-US/)
* [Javascript Docs by Microsoft](https://docs.microsoft.com/en-us/javascript/)
* [NodeJS Docs](https://nodejs.org/en/docs/)

#### Responding to phrases

Responding to phrases uses RegEx, which requires a bit more programming knowledge. You can find the [example commands here](https://github.com/submindraikou/ocelot-bot/blob/4760d80d6911d5a7091d507d1a0d1bce28ce24fc/index.js#L232).
If you are new to RegEx, or need a bit of help checking your formatting I use:
* [Mozilla introduction to RegEx](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
* [Online RegEx Testing Tool](https://regexr.com/)
