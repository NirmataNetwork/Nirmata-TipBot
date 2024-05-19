const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
var config = require('./bot_config');
const backend = require('./backend');

client.login(config.bot_token);

backend.Initialize();

var owner_id_1 = config.owner_id_1;
var owner_id_2 = config.owner_id_2;
var custom_message_limit = config.custom_message_length_limit; // 100 characters
var log1 = config.log_1;
var isBotListening = false;

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

function checkCommand(msg) {
	if (!msg.guild) { // Проверяем, что сообщение из сервера
        console.log("The command was not sent on the server.");
        return;
    }
	if (isCallingBot(msg.content) == true) {
		var arguments = msg.content.replace(/\s+/g,'.').trim().split('.');  // removes additional spaces
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
                            backend.TipSomebody(msg, msg.author.id, tiptarget, user, myname, amount, function (success, message) {
                                    if (success == true) {
                                            msg.channel.send({content:"<@" + tiptarget + "> has been tipped " + formatDisplayBalance(amount) + " " + coin_name + " :moneybag: by " + msg.author + " Thank you for join our community, here's your join reward. Have a nice stay. :beer: "});
                                                    msg.author.send({content:"Current balance is " + formatDisplayBalance(data.balance) + " " + coin_name + "!" + "\n <@" + tiptarget + "> has been succesfully tipped " + formatDisplayBalance(amount) + " " + coin_name + "!" + custom_message + "\n Left balance " + formatDisplayBalance((data.balance)-amount) + " " + coin_name + "!"});
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
					msg.author.send({ content: "Hey! Your balance is " + formatDisplayBalance(data.balance) + " " + coin_name + "!" });
				});
				break;
  			case 'deposit':
				backend.getBalance(msg.author.id, msg, function (data) {
					msg.author.send({ content: "Hey! For deposit into the tip bot, use address: " + data.useraddress });
				});
				break;
			case 'tip':
				var user = arguments[2];
				var amount = arguments[3];
				var custom_message = "";
				console.log(Big(amount))
				try {
					Big(amount);
				} catch (error) { msg.reply({ content: "Oops! Invalid syntax" }); return; }
				if (user == null) { msg.reply({ content: "Oops! There is no such user!" }); return; }
				if (amount == null) { msg.reply({ content: "Oops! The amount is not specified or incorrectly specified." }); return; }
				try { user = msg.mentions.users.first().username; } catch (error) { msg.reply({ content: "Oops! Invalid syntax" }); return; } /// check to avoid bot crash
				try { custom_message = getCustomMessageFromTipCommand(arguments); } catch (err) { msg.reply({ content: "Oops! Something happened" }); return; }
				var tiptarget = msg.mentions.users.first().id;
				var myname = msg.author.username;
				if (tiptarget != null) {
					backend.getBalance(msg.author.id, msg, function (data) {
					backend.TipSomebody(msg, msg.author.id,  tiptarget, user, myname, amount, function (success, message) {
						if (success == true) {
							msg.channel.send({content:"<@" + tiptarget + "> has been tipped " + backend.formatDisplayBalance(amount) + " " + coin_name + " :moneybag: by " + msg.author + custom_message});
							msg.author.send({content:"Current balance is " + backend.formatDisplayBalance(data.balance) + " " + coin_name + "!" + "\n <@" + tiptarget + "> has been succesfully tipped " + backend.formatDisplayBalance(amount) + " " + coin_name + "!" + custom_message + "\n Left balance " + backend.formatDisplayBalance((data.balance)-amount) + " " + coin_name + "!"});
						} else { msg.channel.send({content:message}); }

					})});
				} else {
					msg.reply("User \"" + user + "\" not found :( . Check if the name is correct");
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
						backend.TipSomebody(msg, msg.author.id, tiptarget, user, myname, amount, function (success, message) {
							if (success == true) {
								msg.channel.send({content:"<@" + tiptarget + "> has been tipped " + formatDisplayBalance(amount) + " " + coin_name + " :moneybag: by " + msg.author + " to have a good one. :beer: "});
									msg.author.send({content:"Current balance is " + formatDisplayBalance(data.balance) + " " + coin_name + "!" + "\n <@" + tiptarget + "> has been succesfully tipped " + formatDisplayBalance(amount) + " " + coin_name + "!" + custom_message + "\n Left balance " + formatDisplayBalance((data.balance)-amount) + " " + coin_name + "!"});
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
						msg.author.send({ content: "Withdrawal error : Withdrawal amount is below minimum withdrawal amount" }); return;
					}
				} catch (error) { msg.author.send({ content: "Syntax error" }); return; }
				msg.author.send({ content: "You are going to withdraw " + arguments[3] + " " + coin_name + ". The blockchain transaction fee deducted from your withdrawal amount is " + withdraw_tx_fees + " . Type \"yes\" to confirm, or \"no\" to cance; the request "}).then(() => {
					msg.channel.awaitMessages(response => response.guild === null && response.author.id == msg.author.id && (response.content === 'yes' || response.content === "no"), {
						max: 1,
						time: wait_time_for_withdraw_confirm,
						errors: ['time'],
					})
						.then((collected) => {
							if (collected.first().content == "yes") {
								backend.withDraw(msg.author.id, arguments[2], arguments[3], function (success, txhash) {
									if (success == true) {
										msg.author.send({ content: "Your withdrawal request was successfuly executed and your funds are on the way :money_with_wings: . TxHash is https://explorer.nirmata-network.com/transaction/" + txhash });
									} else {
										msg.author.send({ content: "An error has occured :scream: , error code is: " + txhash });
									}
								});
							} else if (collected.first().content == "no") {
								msg.author.send({ content: "Your withdrawal request has been canceled at your request :confused: " });
							}
						})
						.catch(() => {
							msg.channel.send({content:'The withdrawal request was cancelled because you did not confirm :thinking: '});
						});
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
				
					// Используем guild.fetchMembers() для получения всех участников
					msg.guild.members.fetch().then(members => {
						const nirUserRole = msg.guild.roles.cache.find(role => role.name === "NiR User");
						if (!nirUserRole) {
							msg.reply({ content: "Role 'NiR User' not found on the server." });
							return;
						}
					
						const onlineMembersWithRole = members.filter(member =>
							member.roles.cache.has(nirUserRole.id) &&
							member.presence.status === 'online' &&
							!member.user.bot
						);
					
						if (onlineMembersWithRole.size === 0) {
							msg.reply({ content: "There are no online users with the 'NiR User' role on the server." });
							return;
						}
				
						const coinsPerUser = totalCoins / onlineMembersWithRole.size;
						onlineMembersWithRole.forEach(member => {
							const tiptarget = member.id;
							const myname = msg.author.username;
							backend.getBalance(msg.author.id, msg, function (data) {
								if (!data) {
									msg.reply({ content: "Failed to retrieve your balance." });
									return;
								}
				
								backend.TipSomebody(msg, msg.author.id, tiptarget, member.user.username, myname, coinsPerUser, function (success, message) {
									if (success) {
										msg.channel.send({content:`<@${tiptarget}> has been tipped ${backend.formatDisplayBalance(coinsPerUser)} ${coin_name} :moneybag: by ${msg.author}`});
										msg.author.send({content:`Current balance is ${backend.formatDisplayBalance(data.balance - coinsPerUser)} ${coin_name}!\n<@${tiptarget}> has been successfully tipped ${backend.formatDisplayBalance(coinsPerUser)} ${coin_name}!`});
										// Отправка личного сообщения пользователю о получении чаевых
										member.user.send({content:`You have received ${backend.formatDisplayBalance(coinsPerUser)} ${coin_name} in tips from ${msg.author.username}!`});
									} else {
										msg.channel.send({content:message});
									}
								});
							});
						});
						msg.channel.send({content:`Each online user with the 'NiR User' role has received ${coinsPerUser.toFixed(2)} ${coin_name} coins.`});
					}).catch(error => {
						console.error("Failed to fetch members:", error);
						msg.reply({ content: "Failed to execute the command due to an internal error." });
					});
					break;
		}
	}
}



client.on('messageCreate', msg => checkCommand(msg));
