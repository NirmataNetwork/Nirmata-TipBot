const safeJsonStringify = require('safe-json-stringify');
var crypto = require('crypto');
var Wallet = require('nirmata-rpc-js').RPCWallet;
var Daemon = require('nirmata-rpc-js').RPCDaemon
var Big = require('big.js');
var config = require('./bot_config');
var MongoClient = require('mongodb').MongoClient;
var urldb = config.mongodburl;

var Wallet = Wallet.createWalletClient({url: config.wallethostname});
Wallet.sslRejectUnauthorized(false);
var Daemon = Daemon.createDaemonClient({url: config.daemonhostname});
Daemon.sslRejectUnauthorized(false);

var coin_name = config.coin_name;
var block_maturity_requirement = config.block_maturity_requirement;
var coin_total_units = config.coin_total_units;
var coin_display_units = config.coin_display_units;
var server_wallet_address = config.server_wallet_address;
var withdraw_tx_fees = config.withdraw_tx_fees;
var log1 = config.log_1;
var log3 = config.log_3;
var db;
var tip_enabled = true;

function Initialize() {
	Wallet.getBalance().then(function (balance) {if (log1) console.log("Stats for admins - current balance: " + balance.balance + " " + coin_name);});
		MongoClient.connect(urldb, function (err, dbobj) {
		if (err) throw err;
		console.log("Database created, or already exists!");
		var dbo = dbobj.db("TipBot");
		dbo.createCollection("users", function (err, res) {
			if (err) throw err;
			if (log1) console.log("Collection users created or exists!");
		});
		dbo.createCollection("localtransactions", function (err, res) {
			if (err) throw err;
			if (log1) console.log("Collection localtransactions successfully created or exists!");
		});
		dbo.createCollection("blockchaintransactions", function (err, res) {
			if (err) throw err;
			if (log1) console.log("Collection blockchaintransactions successfully created or exists!");
		});
		dbo.createCollection("utility", function (err, res) {
			if (err) throw err;
			if (log1) console.log("Collection utility successfully created or exists!");
		});
		dbo.createCollection("generallog", function (err, res) {
			if (err) throw err;
			if (log1) console.log("Collection generallog successfully created or exists!");
		});
		dbo.createCollection("admins", function (err, res) {
			if (err) throw err;
			if (log1) console.log("Collection admins successfully created or exists!");
		});
		if (dbobj != null) {
			db = dbobj;
			if (log3) { console.log("Database connected sucessfuly. Bot started listening"); }
		}
	});
	Wallet.get_wallet_info().then(function (data) {
		if (log1) console.log("CURRENT WALLET HEIGHT: " + data.current_height);
	});
}

function getWalletInfo(callback) {
	try {
		Wallet.get_wallet_info().then(function (data) {
			Wallet.getBalance().then(function (balance) {
				callback("Current wallet height is: " + data.current_height + " . Current wallet balance is: " + getReadableFloatBalanceFromWalletFormat(balance.balance).toFixed(coin_total_units) + " . Current unlocked balance is: " + getReadableFloatBalanceFromWalletFormat(balance.unlocked_balance).toFixed(coin_total_units));
			});
		});
	} catch (error) { callback(error); }
}

function get_height(callback) {
	try {
		Daemon.getheight().then(function (data) {
			callback("Daemon height is: " + data.height + " hmm"  );
			});
	} catch (error) { callback(error); }
}

function getBlockInfo(callback) {
	try {
		Daemon.getheight().then(function (data) {
			callback("Blockchain height is: " + data.height + " :sunglasses: ");
		});
	} catch (error) { callback(error); }
}

function logBlockChainTransaction(incoming, authorId, paymentid, destination_wallet_address, blockheight, amount) {
	var dbo = db.db("TipBot");
	if (incoming == true) { // log incoming transaction
		getUserObjectFromPaymentId(paymentid, function (userdata) {
			var userid;
			if (userdata != null) { userid = userdata.userid; } else { userid = "UNKNOWN"; }
			var d = new Date(); // current date and time
			var readableDateTimeObject = d.toLocaleDateString() + " " + d.toLocaleTimeString();
			var Event = { Type: "incoming", From: userid, BlockHeight: blockheight, destination_wallet: server_wallet_address, Amount: amount, AddedDateTime: readableDateTimeObject };
			dbo.collection("blockchaintransactions").insertOne(Event, function (err, res) {
			});
		});
	} else { // log outgoing transaction
		var d = new Date(); // current date and time
		var readableDateTimeObject = d.toLocaleDateString() + " " + d.toLocaleTimeString();
		var Event = { Type: "outgoing", From: authorId, BlockHeight: "", destination_wallet: destination_wallet_address, Amount: amount, AddedDateTime: readableDateTimeObject };
		dbo.collection("blockchaintransactions").insertOne(Event, function (err, res) {
		});
	}
}

function logLocalTransaction(from, to, fromname, toname, amount) {
	var dbo = db.db("TipBot");
	var d = new Date(); // current date and time
	var readableDateTimeObject = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	var Event = { From: from, To: to, Fromname: fromname, Toname: toname, Amount: amount, DateTime: readableDateTimeObject };
	dbo.collection("localtransactions").insertOne(Event, function (err, res) {
	});
}

function convertToSystemValue(value) {
	var dbnumber = new Big(value).toFixed(coin_total_units);
	if (log3) console.log("Function convertToSystemValue() called - dbnumber:" + dbnumber + " . Original value: " + value.toString());
	return dbnumber;
}

function switchTipReceive(authorId, targetId, decision, callback) {
	var dbo = db.db("TipBot");
	var newdecision;
	if (decision == "allow") { newdecision = 1; } else if (decision == "disallow") { newdecision = 0; } else { callback("Error : Check the command syntax."); return; }
	var myquery = { userid: targetId };
	var newvalues = { $set: { canreceivetip: newdecision } };
	dbo.collection("users").updateOne(myquery, newvalues, function (err, res) {
		if (err) throw err;
		if (log3) console.log("Switched tip receiving to " + decision + " for user " + targetId);
		callback("Switched tip receiving to " + decision + " for user " + targetId);
	});
	addGeneralEvent("Tip receive " + decision + " for user " + targetId, authorId);
}

function switchTipSend(authorId, targetId, decision, callback) {
	var dbo = db.db("TipBot");
	var newdecision;
	if (decision == "allow") { newdecision = 1; } else if (decision == "disallow") { newdecision = 0; } else { callback("Error : Check the command syntax."); return; }
	var myquery = { userid: targetId };
	var newvalues = { $set: { cantip: newdecision } };
	dbo.collection("users").updateOne(myquery, newvalues, function (err, res) {
		if (err) throw err;
		if (log3) console.log("Switched tip sending to " + decision + " for user " + targetId);
		callback("Switched tip sending to " + decision + " for user " + targetId);
	});
	addGeneralEvent("Tip send " + decision + " for user " + targetId, authorId);
}

function addGeneralEvent(action_name, executed_By) {
	var dbo = db.db("TipBot");
	var d = new Date(); // current date and time
	var readableDateTimeObject = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	var Event = { action: action_name, executedBy: executed_By, DateTime: readableDateTimeObject };
	dbo.collection("generallog").insertOne(Event, function (err, res) {
	});
}

function generateNewPaymentIdForUser(authorId, targetId, callback) {
	var dbo = db.db("TipBot");
	dbo.collection("users").findOne({ userid: targetId }, function (err, result) {
		if (err) throw err;
		if (result == null) {
			callback("That user is not in the database yet!");
			return;
		}
		var previouspid = result.paymentid;
		var newpid = crypto.randomBytes(32).toString('hex');
		var query = { userid: targetId };
		var newvalues = { $set: { paymentid: newpid } };
		dbo.collection("users").updateOne(myquery, newvalues, function (err, res) {
			if (err) { callback("Error happened"); } else { // failsafe, only do callback, when successful
				callback("New payment ID for the user " + targetId + " successfuly generated");
			}
			addGeneralEvent("PaymentID update from " + previouspid + " to new for user " + targetId, authorId); // log the action
		});
	});
}

function isAdmin(authorId, callback) {
	if (authorId == owner_id_1 || authorId == owner_id_2) { callback(true); return; }
	var dbo = db.db("TipBot");
	dbo.collection("admins").findOne({ userid: authorId }, function (err, result) {
		if (err) throw err;
		if (log3) console.log("isAdmin verification called. authorid : " + authorId + " err: " + err + " result: " + result);
		if (result != null) {
			callback(true);
			return;
		} else { callback(false); }
	});
}

function showUserInfo(authorId, targetId, callback) {
	getUserObject(targetId, function (data) {
		if (data != null) {
			callback(true, data);
			addGeneralEvent("User info " + targetId + " viewed", authorId); // log the action
		} else {
			callback(false, data);
		}
	});
}

function addAdmin(authorId, targetId, callback) {
	var dbo = db.db("TipBot");
	dbo.collection("admins").findOne({ userid: targetId }, function (err, result) {
		if (err) throw err;
		if (result != null) {
			callback("Admin with that ID already exists!");
			return;
		}
		var adminObject = { userid: targetId };
		dbo.collection("admins").insertOne(adminObject, function (err, res) {
			if (err) { callback("Error happened"); } else { // failsafe, only do callback, when successful
				callback("Admin with user id " + targetId + " successfuly added!");
			}
			addGeneralEvent("addAdmin with user id " + targetId, authorId); // log the action
		});
	});
}

function removeAdmin(authorId, targetId, callback) {
	if (log3) console.log("removeAdmin function was called. Command issuer id: " + authorId + " . Target (id): " + targetId);
	var dbo = db.db("TipBot");
	var adminObject = { userid: targetId };
	dbo.collection("admins").deleteOne(adminObject, function (err, res) {
		if (err) { callback("Error happened"); } else {
			callback("Admin with user id " + targetId + " successfuly removed or didn't exist!");
		}
		addGeneralEvent("Removed admin with user id " + targetId, authorId); // log the action
	});
}

function getWalletFormatFromBigNumber(bignumber) { 
	var numberformat = bignumber.toFixed(coin_total_units).replace(".", "");
	return Number(numberformat);
}

function isBlockMatured(currentBlockHeight, paymentBlockHeight) {
	if (log3) console.log("Function isBlockMatured called. Current block height : " + currentBlockHeight + " . Payment block height: " + paymentBlockHeight);
	if (currentBlockHeight - paymentBlockHeight >= block_maturity_requirement) { return true; } else { return false; }
}

function withDraw(authorId, walletaddress, w_amount, callback) {
	if (log3) console.log("Function withdraw called. AuthorId : " + authorId + " . Wallet address for withdraw: " + walletaddress + " . Withdraw amount: " + w_amount.toString());
	checkTargetExistsIfNotCreate(authorId, function () {
		getUserObject(authorId, function (data) {
			var authorbalance = Big(data.balance);
			var wamount = Big(w_amount);
			var wamount_before_txfees = wamount;
			if (log3) console.log("Function withdraw: wamount: " + wamount.toString());
			if (log3) console.log("Function withdraw: authorbalance: " + authorbalance.toString());
			if (log3) console.log("Function withdraw: minus: " + authorbalance.minus(wamount).toString());
			var checkEnoughBalance = authorbalance.minus(wamount);
			var withdrawAmountTxFeesCheck = Big(wamount).minus(Big(withdraw_tx_fees));
			if (checkEnoughBalance.gte(Big(0)) && withdrawAmountTxFeesCheck.gt(Big(0))) {
				wamount = Number(wamount.minus(Big(withdraw_tx_fees))) * 1000000000000;
				console.log(wamount, typeof wamount)
				if (log3) console.log("Function withdraw: withdraw amount (wamount) minus tx fees" + wamount.toString());
				minusBalance(authorId, wamount_before_txfees, function () {
					if (log3) console.log("Function withdraw: wamount passed into transfer " + wamount);
					Wallet.transfer({destinations: [{amount: wamount, address: walletaddress}], mixin: config.block_maturity_requirement, fee: config.default_fee}).then(function (txh) {
						if (txh.hasOwnProperty("tx_hash") == false) {
							if (log3) console.log("Function withdraw: " + txh);
							if (txh.hasOwnProperty("code") == true) {
								console.log("Function withdraw: Transaction failed. Reason: " + txh.message + " . Code: " + txh.code);
								callback(false, txh.code);
							} else { callback(false, "Unknown error"); }
							return;
						};
						logBlockChainTransaction(false, authorId, null, walletaddress, null, wamount.toString());
						console.log(txh);
						console.log("Withdraw in process " + txh.tx_hash);
						callback(true, txh.tx_hash); // return success, and txhash
					});
				});
			} else {
				callback(false, "You have not enough balance, or you're sending amount, which after tx fees would be negative, or 0.");
			}
		});
	});
}

function minusBalance(targetId, amount, callback) {
	if (log3) console.log("Function minusBalance called. target (id) : " + targetId + " . amount: " + amount.toString());
	var dbo = db.db("TipBot");
	getUserObject(targetId, function (data) {
		var userbalance = Big(data.balance);
		var transactedamount = Big(amount);
		var newbalance = convertToSystemValue(userbalance.minus(transactedamount));
		var myquery = { userid: targetId };
		var newvalues = { $set: { balance: newbalance } };
		dbo.collection("users").updateOne(myquery, newvalues, function (err, res) {
			if (err) { throw err; } else { // failsafe, only do callback, when successful
				callback();
			}
		});
	});
}

function addBalance(targetId, amount, callback) {
	var dbo = db.db("TipBot");
	getUserObject(targetId, function (data) {
		var userbalance = Big(data.balance);
		var transactedamount = Big(amount);
		var newbalance = convertToSystemValue(userbalance.plus(transactedamount));
		var myquery = { userid: targetId };
		var newvalues = { $set: { balance: newbalance } };
		dbo.collection("users").updateOne(myquery, newvalues, function (err, res) {
			if (err) { throw err; } else { // failsafe, only do callback, when successful
				callback();
			}
		});
	});
}

function checkTargetExistsIfNotCreate(targetId, callback) {
	getUserObject(targetId, function (result) {
		if (result == null) {
			createNewUser(targetId, function () {
				callback();
			});
		} else {
			callback();
		}
	});
}

var tip_enabled = true;

function TipSomebody(msg, authorId, tipTarget, tiptargetname, tipperauthorname, transaction_amount, callback) {
    if (!tip_enabled) {
        setTimeout(() => {
            TipSomebody(msg, authorId, tipTarget, tiptargetname, tipperauthorname, transaction_amount, callback);
        }, 1000);
        return;
    }

    tip_enabled = false;

    var authorbalance;
    if (authorId == tipTarget) {
        callback(false, "Sorry folk, but you can't tip yourself");
        tip_enabled = true; 
        return;
    }

    checkTargetExistsIfNotCreate(tipTarget, function () {
        checkTargetExistsIfNotCreate(authorId, function () {
            var transactionamount = new Big(Big(transaction_amount).toFixed(coin_total_units));
            if (transactionamount <= 0) {
                callback(false, "Sorry but you can't tip negative balance");
                tip_enabled = true;
                return;
            }
            getBalance(msg.author.id, msg, function (data) {
                getUserObject(tipTarget, function (data2) {
                    if (data.cantip == 0) {
                        callback(false, "You aren't allowed to make a tip");
                        tip_enabled = true;
                        return;
                    }
                    if (data2.canreceivetip == 0) {
                        callback(false, "You can't tip that person");
                        tip_enabled = true; 
                        return;
                    }
                    authorbalance = new Big(data.balance);
                    if (authorbalance.gte(transactionamount)) {
                        var dbo = db.db("TipBot");
                        var myquery = { userid: authorId };
                        console.log("Internal transaction processing, amount : " + transactionamount);
                        var authorNewBalance = Big(authorbalance.minus(transactionamount)).toFixed(coin_total_units);
                        var newvalues = { $set: { balance: authorNewBalance } };
                        dbo.collection("users").updateOne(myquery, newvalues, function (err, res) {
                            getUserObject(tipTarget, function (tipperdata) {
                                var newtiptargetbalance = Big(tipperdata.balance).plus(transactionamount);
                                var tipperQuery = { userid: tipTarget };
                                
                                var tipperNewValue = { $set: { balance: newtiptargetbalance.toFixed(coin_total_units) } };
                                dbo.collection("users").updateOne(tipperQuery, tipperNewValue, function (err, res) {
                                    if (err) throw err;
                                    callback(true, "");
                                    logLocalTransaction(authorId, tipTarget, tipperauthorname, tiptargetname, transactionamount.toString()); /// Log this transaction
                                    tip_enabled = true; 
                                });
                            });
                            if (err) throw err;
                            console.log("1 user updated");
                        });
                    } else {
                        msg.reply({ content: "You don't have enough balance for that :( " });
                        callback(false);
                        tip_enabled = true;
                    }
                });
            });
        });
    });
}

function formatDisplayBalance(balance) {
	return (Big(balance).toFixed(coin_display_units));

}
function getReadableFloatBalanceFromWalletFormat(paymentamount) {
	paymentamount = paymentamount.toString(); // crucial, if we're using paymentamount.length, if number passed, it would be undefined, which would result in wrong computation
	var array = paymentamount.toString().split("");
	if (array.length < coin_total_units) {
		for (var i = 0; i <= coin_total_units - paymentamount.length; i++) { // how much zeroes to add, if balance in wallet format (eg. 800000) deposited < 12 characters
			array.splice(0, 0, "0");
		}
	}
	array.splice(array.length - coin_total_units, 0, ".");
	return Big((Big(array.join(""))).toFixed(coin_total_units));
}

function UpdateBalanceForUser(g_userid, callback) {
	console.log("UpdateBalanceForUser function called");
	var walletheight;
	var bPaymentFound = false;
	Wallet.get_wallet_info().then(function (data) {
		console.log(data.current_height)
		if (!data.hasOwnProperty("current_height")) {
			console.log("Cannot get current wallet blockchain height! For security reasons, skipping the balance update");
			callback();
			return;
		}
		walletheight = data.current_height;
		console.log(walletheight);
		var dbo = db.db("TipBot");
		var query = { userid: g_userid };
		dbo.collection("users").findOne(query, function (err, result) {
			if (err) throw err;
			if (result == null) { callback(); return; }
			if (log3) console.log(result.paymentid);
			Wallet.get_bulk_payments({payment_ids: [result.paymentid], min_block_height: result.lastdepositbh}).then(function (bulkdata) {
				if (bulkdata.hasOwnProperty("payments")) {
					getUserObject(g_userid, function (userobject) {
						var lastcheckheight = 0;
						var addbalance = Big("0.0");
						for (var i = bulkdata.payments.length - 1; i >= 0; i--) {
							if (isBlockMatured(walletheight, bulkdata.payments[i].block_height) == true) {
								if (log3) console.log("Block matured amount" + bulkdata.payments[i].amount);
								if (log3) console.log("Block deposit height" + bulkdata.payments[i].block_height);
								bPaymentFound = true;
								lastcheckheight = bulkdata.payments[i].block_height + 1;
								logBlockChainTransaction(true, null, result.paymentid, null, bulkdata.payments[i].block_height, bulkdata.payments[i].amount);
								if (log3) console.log(getReadableFloatBalanceFromWalletFormat(bulkdata.payments[i].amount).toString());
								if (log3) console.log(bulkdata.payments[i].amount);
								if (log3) console.log(addbalance.toString());
								addbalance = addbalance.plus(Big(Big(getReadableFloatBalanceFromWalletFormat(bulkdata.payments[i].amount)).toFixed(coin_total_units)));
							} else {}
						}
						if (log3) console.log("AddToBalance " + addbalance.toString());
						var newbalance = (Big(userobject.balance).plus(addbalance)).toFixed(coin_total_units);
						if (log3) console.log("Previous user balance: " + userobject.balance);
						if (log3) console.log("New user balance after checking deposits: " + newbalance.toString());
						if (log3) console.log("Last user deposit check height: " + lastcheckheight);
						if(bPaymentFound) {
							var myquery = { userid: g_userid };
							var newvalues = { $set: { balance: newbalance, lastdepositbh: lastcheckheight } };
							dbo.collection("users").updateOne(myquery, newvalues, function (err, res) {
								callback();
							});
						} else {
							callback();
						}
					});
				} else { callback(); }
			});
		});
	});
}

function createNewUser(targetId, callback) {
	Wallet.make_integrated_address().then(function(data, err){
		if(!data){
			console.log(err, 'error getting the integrated address');
		 } else { 
			var dbo = db.db("TipBot");
			var initial_balance = 0;
			initial_balance = initial_balance.toFixed(coin_total_units);
			var newUser = { userid: targetId, balance: initial_balance, paymentid: data.payment_id, useraddress: data.integrated_address, lastdepositbh: 0, canreceivetip: 1, cantip: 1 };
			dbo.collection("users").insertOne(newUser, function (err, res) {
				if (err) throw err;
				console.log("User " + targetId + " added into DB");
				callback();
			});
	}})
	
}

function getUserObject(targetId, callback) {
	var dbo = db.db("TipBot");
	var query = { userid: targetId };
	dbo.collection("users").findOne(query, function (err, result) {
		if (err) throw err;

		callback(result);
	});
}

function getUserObjectFromPaymentId(pid, callback) {
	var dbo = db.db("TipBot");
	var query = { paymentid: pid };
	dbo.collection("users").findOne(query, function (err, result) {
		if (err) throw err;
		callback(result);
	});
}

function getBalance(authorId, msg, callback) {
	if (log3) console.log("getBalance function called. Author (id) : " + authorId);
	UpdateBalanceForUser(authorId, function () {
		if (log3) console.log("getBalance function - UpdateBalanceForUser function passed succesfully");
		getUserObject(authorId, function (data) {
			if (log3) console.log("getBalance function - User object of " + authorId + " was got succesfully.");
			if (data == null) {
				createNewUser(authorId, function () {
					if (log3) console.log("getBalance function - New user created successfully");
					getUserObject(authorId, function (data2) {
						if (data2 == null) {
							if (msg != null) { msg.author.send({ content: "There was an error. Please try again later" }); }
						} else {
							callback(data2);
						}
					});
				});
			} else {
				callback(data);
			}
		});
	});
}

module.exports = {
    Initialize,
    getBalance,
    getUserObject,
    getUserObjectFromPaymentId,
    addBalance,
    minusBalance,
    TipSomebody,
    formatDisplayBalance,
    getReadableFloatBalanceFromWalletFormat,
    UpdateBalanceForUser,
    createNewUser,
    checkTargetExistsIfNotCreate,
    addAdmin,
    removeAdmin,
    isAdmin,
    generateNewPaymentIdForUser,
    addGeneralEvent,
    switchTipSend,
    switchTipReceive,
    convertToSystemValue,
    logLocalTransaction,
    logBlockChainTransaction,
    getBlockInfo,
    get_height,
    getWalletInfo,
    getWalletFormatFromBigNumber,
    isBlockMatured,
    withDraw
};

