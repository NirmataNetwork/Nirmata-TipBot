const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildPresences 
    ]
});
var config = require('./bot_config');
const backend = require('./backend');
var Big = require('big.js');

client.login(config.bot_token);

var coin_name = config.coin_name;
var owner_id_1 = config.owner_id_1;
var owner_id_2 = config.owner_id_2;
var custom_message_limit = config.custom_message_length_limit;
var withdraw_min_amount = config.withdraw_min_amount;
var wait_time_for_withdraw_confirm = config.wait_time_for_withdraw_confirm;
var withdraw_tx_fees = config.withdraw_tx_fees;
var log1 = config.log_1;
var isBotListening = true;

backend.Initialize();

client.on('ready', function () {
	if (log1) console.log("Nirmata TipBot ready and loaded correctly! Hello, admin");
	client.user.setActivity('.help');
});

function getCustomMessageFromTipCommand(arguments) {
	if (arguments.length > 4) {
		var custom_message = "";
		for (var i = 4; i < arguments.length; i++) {
			custom_message += " " + arguments[i]; // concatenate message from arguments
		}
		return custom_message.substring(0, custom_message_limit + 1);
	} else { return ""; }
}

function isCallingBot(msg) {
	if (msg[0] == ".") {
		return true;
	} else { return false; }
}

async function checkCommand(msg) {
	if (isCallingBot(msg.content) == true) {
		var arguments = msg.content.replace(/\s+/g,'.').trim().split('.');  
		var command = arguments[1];
		if (isBotListening == false && (msg.author.id == owner_id_1 || msg.author.id == owner_id_2)) {
			if (command == "startlistening") {
				isBotListening = true;
				msg.channel.send({content:"Bot returned to life again"});
			}
		}
		if (isBotListening == false) { return; }
		switch (command) {
			case 'walletinfo':
				if (msg.author.id == owner_id_1 || msg.author.id == owner_id_2) {
					backend.getWalletInfo(function (walletmessage) {
						msg.author.send({ content: walletmessage });
					});
				}
				break;
			case 'stoplistening':
				backend.isAdmin(msg.author.id, function (result) {
					if (result == true) {
						isBotListening = false;
						msg.author.send({ content: "You switched listening of the bot off. The bot will not respond to anyone except owner now" });
					}
				});
				break;
            case 'joinreward':
				if (msg.author.id == owner_id_1 || msg.author.id == owner_id_2){
                    var user = arguments[2];
                    var amount = 5;
                    var custom_message = "";
                    if (user == null) { msg.reply({ content: "Oops! Invalid syntax 1" }); return; }
                    if (amount == null) { msg.reply({ content: "Oops! Invalid syntax 2" }); return; }
                    try { user = msg.mentions.users.first().username; } catch (error) { msg.reply({ content: "Oops! Invalid syntax 3" }); return; } /// check to avoid bot crash
                    try { custom_message = getCustomMessageFromTipCommand(arguments); } catch (err) { msg.reply({ content: "Oops! Something happened" }); return; }
                    var tiptarget = msg.mentions.users.first().id;
                    var myname = msg.author.username;
                    if (tiptarget != null) {
						backend.getBalance(msg.author.id, msg, function (data) {
							if (!data) {
								msg.reply({ content: "Failed to retrieve your balance." });
								return;
							}
                            backend.TipSomebody(msg, msg.author.id, tiptarget, user, myname, amount, function (success, message) {
                                    if (success == true) {
                                            msg.channel.send({content:"<@" + tiptarget + "> has been tipped " + backend.formatDisplayBalance(amount) + " " + coin_name + " :moneybag: by <@" + msg.author.id + "> Thank you for join our community, here's your join reward. Have a nice stay. :beer: "});
                                                    msg.author.send({content:"Current balance is " + backend.formatDisplayBalance(data.balance) + " " + coin_name + "!" + "\n <@" + tiptarget + "> has been succesfully tipped " + backend.formatDisplayBalance(amount) + " " + coin_name + "!" + custom_message + "\n Left balance " + backend.formatDisplayBalance((data.balance)-amount) + " " + coin_name + "!"});
                                    } else { msg.channel.send({content:message}); }
                                })});
                    } else {
                            msg.reply({ content: "User \"" + user + "\" not found :( . Check if the name is correct" });
                    }}
                    break;
			case 'adminhelp':
				backend.isAdmin(msg.author.id, function (result) {
					if (result == true) {
						msg.author.send({ content:
							"__**🔧 Hello! Welcome to the ADMIN HELP SECTION.**__\n\n" +
							"**Admin Commands List:**\n" +
							"• `.userinfo <userid>` - 📄 Show user info\n" +
							"• `.addadmin <userid>` - ➕ Add an admin\n" +
							"• `.removeadmin <userid>` - ➖ Remove an admin\n" +
							"• `.switchtipsend <userid> <allow/disallow>` - 🚫 Enable/Disable tipping for a user\n" +
							"• `.switchtipreceive <userid> <allow/disallow>` - 🚫 Enable/Disable receiving tips for a user\n" +
							"• `.stoplistening` - 🛑 Stop the bot from listening to commands\n" +
							"• `.startlistening` - 🎧 Start bot listening to commands\n" +
							"• `.walletinfo` - 💼 Display bot wallet info\n" +
							"• `.block` - 🏗️ Display blockchain height\n" +
							"• `.joinreward` - 🎁 Tip user for joining Discord\n\n" +
							"_Ensure to use these commands responsibly._"
						});
					}
				});
				break;
			case 'about':
				msg.channel.send({content:
					"__**🤖 Hello! This is Nirmata TIP Bot version 1.0**__\n" +
					"Created by Nirmata Network."
				});
				break;
			case 'network':
				console.log('** Network info message sent');
				msg.channel.send({content:"Whoops! Please try again later. Current network height: " + (Daemon.height) + " 😄"});
				break;
			case 'help':
				msg.channel.send({content:
					"__**📌 Hello! Welcome to the Nirmata TipBot Help Section!**__\n\n" +
					"**Commands List:**\n" +
					"• `.about` - 🤖 About the bot\n" +
					"• `.deposit` - 💳 Deposit NiR\n" +
					"• `.withdraw <walletaddress> <amount>` - 💸 Withdraw NiR to your wallet\n" +
					"    - Withdraw fee: " + withdraw_tx_fees + " " + coin_name + "\n" +
					"    - Minimum withdraw amount: " + withdraw_min_amount + " " + coin_name + "\n" +
					"• `.tip <user> <amount> [Optional: message]` - 💬 Tip a user\n" +
					"• `.beer <user>` - 🍺 Give a user a beer (costs 5 NiR)\n" +
					"• `.block` - 🏗️ Show blockchain height\n" +
					"• `.balance` - 💰 Check your balance\n\n" +
					"• `.distribute <amount>` - 🔄 Distribute specified amount of NiR equally among all online users\n\n" +
					"_⚠️ IMPORTANT: We are not responsible for any system abuse. Please do not deposit or leave large amounts in the tip bot wallet._"
				});
				break;
    		case 'test':
            	backend.get_height(function (heightmessage) {
              		msg.channel.send({content:heightmessage});
            	});
          		break;
			case 'balance':
				backend.getBalance(msg.author.id, msg, function (data) {
					if (!data) {
						msg.reply({ content: "Failed to retrieve your balance." });
						return;
					}
					msg.author.send({ content: "Hey! Your balance is " + backend.formatDisplayBalance(data.balance) + " " + coin_name + "!" });
				});
				break;
  			case 'deposit':
				backend.getBalance(msg.author.id, msg, function (data) {
					if (!data) {
						msg.reply({ content: "Failed to retrieve your balance." });
						return;
					}
					msg.author.send({ content: "Hey! For deposit into the tip bot, use address: " + data.useraddress });
				});
				break;
			case 'tip':
					var user = arguments[2];
					var amount = arguments[3];
					var custom_message = "";
				
					if (!user || !msg.mentions.users.size) {
						msg.reply({ content: "Oops! There is no such user!" });
						return;
					}
				
					if (!amount) {
						msg.reply({ content: "Oops! The amount is not specified or incorrectly specified." });
						return;
					}
				
					try {
						// Проверяем, что amount можно преобразовать в число
						amount = Big(amount);
					} catch (error) {
						msg.reply({ content: "Oops! Invalid syntax: Amount should be a number." });
						return;
					}
				
					user = msg.mentions.users.first().username; // Теперь безопасно получаем username
					var tiptarget = msg.mentions.users.first().id;
					var myname = msg.author.username;
				
					if (tiptarget) {
						backend.getBalance(msg.author.id, msg, function (data) {
							if (!data) {
								msg.reply({ content: "Failed to retrieve your balance." });
								return;
							}
							backend.TipSomebody(msg, msg.author.id, tiptarget, user, myname, amount.toString(), function (success, message) {
								if (success) {
									msg.channel.send({content:"<@" + tiptarget + "> has been tipped " + backend.formatDisplayBalance(amount) + " " + coin_name + " :moneybag: by <@" + msg.author.id + "> " + custom_message});
									msg.author.send({content:"Current balance is " + backend.formatDisplayBalance(data.balance) + " " + coin_name + "!" + "\n <@" + tiptarget + "> has been successfully tipped " + backend.formatDisplayBalance(amount) + " " + coin_name + "!" + custom_message + "\n Left balance " + backend.formatDisplayBalance((data.balance)-amount) + " " + coin_name + "!"});
								} else {
									msg.channel.send({content:message});
								}
							});
						});
					} else {
						msg.reply({ content: "User \"" + user + "\" not found :( . Check if the name is correct" });
					}
					break;
			case 'beer':
					var user = arguments[2];
					var amount = 5;
					var custom_message = "";
					if (user == null) { msg.reply({ content: "Oops! Invalid syntax" }); return; }
					if (amount == null) { msg.reply({ content: "Oops! Invalid syntax" }); return; }
					try { user = msg.mentions.users.first().username; } catch (error) { msg.reply({ content: "Oops! Invalid syntax" }); return; } /// check to avoid bot crash
					try { custom_message = getCustomMessageFromTipCommand(arguments); } catch (err) { msg.reply({ content: "Oops! Something happened" }); return; }
					var tiptarget = msg.mentions.users.first().id;
					var myname = msg.author.username;
					if (tiptarget != null) {
						backend.getBalance(msg.author.id, msg, function (data) {
							if (!data) {
								msg.reply({ content: "Failed to retrieve your balance." });
								return;
							}
						backend.TipSomebody(msg, msg.author.id, tiptarget, user, myname, amount, function (success, message) {
							if (success == true) {
								msg.channel.send({content:"<@" + tiptarget + "> has been tipped " + backend.formatDisplayBalance(amount) + " " + coin_name + " :moneybag: by <@" + msg.author.id + "> to have a good one. :beer: "});
								msg.author.send({content:"Current balance is " + backend.formatDisplayBalance(data.balance) + " " + coin_name + "!" + "\n <@" + tiptarget + "> has been succesfully tipped " + backend.formatDisplayBalance(amount) + " " + coin_name + "!" + custom_message + "\n Left balance " + backend.formatDisplayBalance((data.balance)-amount) + " " + coin_name + "!"});
							} else { msg.channel.send({content:message}); }

						})});
					} else {
						msg.reply({ content: "User \"" + user + "\" not found :( . Check if the name is correct" });
					}
					break;
			case 'block':
				backend.getBlockInfo(function (walletmessage) {
					msg.channel.send({content:walletmessage});
				});
				break;
			case 'withdraw':
					try {
						if (Big(arguments[3]).lt(Big(withdraw_min_amount))) {
							msg.author.send({ content: "Withdrawal error: Withdrawal amount is below minimum withdrawal amount" });
							return;
						}
					} catch (error) {
						msg.author.send({ content: "Syntax error" });
						return;
					}
					backend.withDraw(msg.author.id, arguments[2], arguments[3], function (success, txhash) {
						if (success) {
							msg.author.send({ content: "Your withdrawal request was successfully executed and your funds are on the way :money_with_wings:. TxHash is https://explorer.nirmata-network.com/transaction/" + txhash });
						} else {
							msg.author.send({ content: "An error has occurred :scream:, error code is: " + txhash });
						}
					});
					break;
			case 'addadmin':
				var user = arguments[2];
				if (user != null && (msg.author.id == owner_id_1 || msg.author.id == owner_id_2)) {
					backend.addAdmin(msg.author.id, user, function (callbackmsg) {
						msg.reply({ content: callbackmsg });
					});
				} else {
					msg.reply({ content: "You did not mention a user, or you are not an owner. Only owners can add admins" });
				}
				break;
			case 'removeadmin':
				var user = arguments[2];
				if (user != null && (msg.author.id == owner_id_1 || msg.author.id == owner_id_2)) {
					backend.removeAdmin(msg.author.id, user, function (callbackmsg) {
						msg.reply({ content: callbackmsg });
					});
				} else {
					msg.reply({ content: "You did not mention a user, or you are not an owner. Only owners can remove admins" });
				}
				break;
			case 'userinfo':
				var user = arguments[2];
				if (user == null) { msg.reply({ content: "Oops! Invalid syntax" }); return; }
				backend.isAdmin(msg.author.id, function (condition) {
					if (condition == true) {
						backend.showUserInfo(msg.author.id, user, function (success, data) {
							if (success == true) {
								msg.author.send({ content: "User " + data.userid + " info: \n Balance: " + data.balance + " " + coin_name + " \n Last blockchain deposit check height: " + data.lastdepositbh + " \n PaymentID: " + data.paymentid + " \n Can receive tips: " + (data.canreceivetip == 0 ? "false" : "true") + ". \n Can make tip: " + (data.cantip == 0 ? "false" : "true") });
							} else {
								msg.author.send({ content: "Error occured. Check User ID" });
							}
						});
					}
				});
				break;
			case 'switchtipsend':
				var user = arguments[2];
				var decision = arguments[3];
				if (user == null) { msg.reply({ content: "Invalid syntax" }); return; } if (decision == null) { msg.reply({ content: "Invalid syntax" }); return; }
				backend.isAdmin(msg.author.id, function (condition) {
					if (condition == true) {
						backend.switchTipSend(msg.author.id, user, decision, function (result) {
							msg.author.send({ content: result });
						});
					}
				});
				break;
			case 'switchtipreceive':
				var user = arguments[2];
				var decision = arguments[3];
				backend.isAdmin(msg.author.id, function (condition) {
					if (condition == true) {
						backend.switchTipReceive(msg.author.id, user, decision, function (result) {
							msg.author.send({ content: result });
						});
					}
				});
				break;
			case 'distribute':
					if (!msg.guild) {
						msg.reply({ content: "This command can only be used in a server." });
						return;
					}
					const totalCoins = parseFloat(arguments[2]);
					if (isNaN(totalCoins) || totalCoins <= 0) {
						msg.reply({ content: "Specify the correct number of coins to distribute." });
						return;
					}
					msg.guild.members.fetch({ time: 120000 }).then(members => {
						const onlineMembers = members.filter(member =>
							member.presence && member.presence.status === 'online' && !member.user.bot
						);
						if (onlineMembers.size === 0) {
							msg.reply({ content: "There are no online users on the server." });
							return;
						}
						const coinsPerUser = totalCoins / onlineMembers.size;
						onlineMembers.forEach(member => {
							const tiptarget = member.id;
							const myname = msg.author.username;
							backend.getBalance(msg.author.id, msg, function (data) {
								if (!data) {
									msg.reply({ content: "Failed to retrieve your balance." });
									return;
								}
								backend.TipSomebody(msg, msg.author.id, tiptarget, member.user.username, myname, coinsPerUser, function (success, message) {
									if (success) {
										msg.channel.send({content:`<@${tiptarget}> has been tipped ${backend.formatDisplayBalance(coinsPerUser)} ${coin_name} :moneybag: by <@${msg.author.id}>`});
										msg.author.send({content:`Current balance is ${backend.formatDisplayBalance(data.balance - coinsPerUser)} ${coin_name}!\n<@${tiptarget}> has been successfully tipped ${backend.formatDisplayBalance(coinsPerUser)} ${coin_name}!`})
											.catch(error => {
												console.error("Failed to send DM to author:", error);
											});
										member.user.send({content:`You have received ${backend.formatDisplayBalance(coinsPerUser)} ${coin_name} in tips from ${msg.author.username}!`})
											.catch(error => {
												console.error("Failed to send DM to recipient:", error);
												msg.channel.send({content:`Failed to send a DM to <@${member.id}>. They might have DMs disabled or have blocked the bot.`});
											});
									} else {
										msg.channel.send({content:message});
									}
								});
							});
						});
						msg.channel.send({content:`Each online user has received ${coinsPerUser.toFixed(2)} coins.`});
					}).catch(error => {
						console.error("Failed to fetch members:", error);
						msg.reply({ content: "Failed to execute the command due to an internal error." });
					});
					break;
				case 'membercount':
					if (!msg.guild) {msg.reply("This command can only be used on the server.");return;}
					try {
						const members = await msg.guild.members.fetch();
						const totalMembers = members.size;
						const onlineMembers = members.filter(member => member.presence?.status === 'online').size;
						msg.channel.send(`The total number of participants on the server: ${totalMembers}\nNumber of participants in the network: ${onlineMembers}`);
					} catch (error) {
						console.error("Error while fetching data:", error);
						msg.reply("An error occurred while executing the command.");
					}
					break;
		}
	}
}



client.on('messageCreate', msg => checkCommand(msg));
