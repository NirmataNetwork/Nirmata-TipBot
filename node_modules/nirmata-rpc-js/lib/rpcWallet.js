'use strict'

const http = require('./httpClient')
const { default: PQueue } = require('p-queue')
const rpcHelpers = require('./rpcHelpers')

function parseWalletResponse (res) {
  if (res.status === 200) {
    if ('error' in res.data) {
      const error = new Error('HTTP Error!')
      error.code = res.data.error.code
      error.message = res.data.error.message
      throw error      
    }
    if ('result' in res.data) {
      return res.data.result
    } else {
      const error = new Error('RPC Error!')
      error.code = res.data.error.code
      error.message = res.data.error.message
      throw error
    }
  } else {
    const error = new Error('HTTP Error!')
    error.code = res.status
    error.message = res.data
    throw error
  }
}
/**
 * @module RPCWallet
 */
var rpcWallet = {}

/**
* @function module:RPCWallet.createWalletClient
* @param {Object} opts
* @param {string} opts.url
* @param {string} [opts.username='NwiZ']
* @param {string} [opts.password='Circle of Life'] 
* @return {RPCWallet} 
*/
rpcWallet.createWalletClient = function (config) {
  const queue = new PQueue({ concurrency: 1 })
  const httpClient = http.createHttpClient(config)
  const jsonAddress = config.url + '/json_rpc'

  httpClient.defaults.headers.post['Content-Type'] = 'application/json'

  return {
    resetNonces: async function () {
      return httpClient.resetNonces()
    },
    sslRejectUnauthorized: function (value) {
      httpClient.defaults.httpAgent.options.rejectUnauthorized = value
      httpClient.defaults.httpsAgent.options.rejectUnauthorized = value
      return value
    },
    /**
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    getAddress: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'getaddress')
    },
    /**
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     get_wallet_info: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_wallet_info')
    },
    /**
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     get_recent_txs_and_info: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_recent_txs_and_info')
    },
    /**
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    getBalance: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'getbalance')
    },
    /**
  
    * @async
    * @param {Object} opts
    * @param {string[]} opts.payment_ids 
    * @param {number} opts.min_block_height
    * @param {bool} opts.allow_locked_transactions
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     get_bulk_payments: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        payment_ids: 'ArrayOfPaymentIds',
        min_block_height: 'Integer'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_bulk_payments', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.payment_id
    * @param {bool} [opts.allow_locked_transactions]
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    get_payments: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ payment_id: 'PaymentId' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_payments', opts)
    },

    get_mining_history: async function (opts){
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_mining_history', opts)
    },
    /**
    * @async
    * @param {Object} [opts]
    * @param {string} [opts.payment_id] - Defaults to a random ID. 16 characters hex encoded.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     make_integrated_address: async function (opts) {
      rpcHelpers.checkOptionalParametersType({
        payment_id: 'PaymentId'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'make_integrated_address', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.tx_unsigned_hex
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     sign_transfer: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ tx_unsigned_hex: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'sign_transfer', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.integrated_address
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     split_integrated_address: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ integrated_address: 'Address' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'split_integrated_address', opts)
    },
    /**
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    store: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'store')
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.tx_signed_hex
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     submit_transfer: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ tx_signed_hex: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'submit_transfer', opts)
    },
     /**
    * @async
    * @param {Object} opts
    * @param {string} opts.seed_password 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * 
    */
      get_restore_info: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ seed_password: 'String' }, opts)

      let a = rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_restore_info', opts)
      return a
    },
    /**

    * @async
    * @param {Object} opts
    * @param {Object} opts.request
    * @param {string} opts.request.seed_phrase 
    * @param {string} opts.request.seed_password 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     get_seed_phrase_info: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ seed_password: 'String',
                                            seed_phrase: 'String' }, opts)

      let a = rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_seed_phrase_info', opts)
      return a
    },    
    /**
    * @async
    * @param {Object} opts
    * @param {number} opts.mixin
    * @param {string} opts.address
    * @param {number} opts.amount - 
    * @param {string} [opts.payment_id_hex]
    * @param {number} [opts.fee] - 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     sweep_below: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        mixin: 'Integer',
        address: 'Address',
        fee: 'Integer',
        amount: 'Integer'
      }, opts)

      rpcHelpers.checkOptionalParametersType({
        payment_id_hex: 'PaymentId',
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'sweep_below', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.tx_id - 
    * @param {boolean} opts.in - 
    * @param {boolean} opts.out - 
    * @param {boolean} [opts.pool] 
    * @param {boolean} [opts.filter_by_height] - 
    * @param {number} [opts.min_height] -
    * @param {number} [opts.max_height] -
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     searchForTransactions: async function (opts) {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'search_for_transactions', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string[]} opts.destinations 
    * @param {number} opts.destinations.amount 
    * @param {string} opts.destinations.address
    * @param {number} opts.fee
    * @param {number} opts.mixin
    * @param {string} [opts.payment_id]
    * @param {string} [opts.comment] 
    * @returns {Promise<object>}
    * @example <caption><b>Output</b></caption>
    */
    transfer: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        destinations: 'ArrayOfAmountAddress',
        mixin: 'Integer',
        fee: 'Integer',
      }, opts)

      rpcHelpers.checkOptionalParametersType({
        payment_id: 'PaymentId',
        comment: 'String',
        push_payer: 'Boolean',
        hide_receiver: 'Boolean',
        service_entries_permanent: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'transfer', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {Object} opts.details - 
    * @param {string} opts.details.t -
    * @param {string} opts.details.c -
    * @param {string} opts.details.a_addr -
    * @param {string} opts.details.b_addr -
    * @param {string} opts.details.to_pay -
    * @param {string} opts.details.a_pledge -
    * @param {string} opts.details.b_pledge -
    * @param {string} [opts.payment_id] - 
    * @param {number} opts.expiration_period
    * @param {number} opts.fee
    * @param {number} opts.b_fee
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     contracts_send_proposal: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        details: 'ContractPrivateDetails'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'contracts_send_proposal', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.contract_id - 
    * @param {number} opts.acceptance_fee -
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    * }
    */
     contracts_accept_proposal: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        contract_id: 'String',
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'contracts_accept_proposal', opts)
    },
    /**
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     contracts_get_all: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'contracts_get_all')
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.contract_id
    * @param {string} opts.release_type - 'REL_N' = normal || 'REL_B' = burn
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     contracts_release: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        contract_id: 'String',
        release_type: 'String'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'contracts_release', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.contract_id
    * @param {number} opts.expiration_period
    * @param {number} opts.fee
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     contracts_request_cancel: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        contract_id: 'String',
        expiration_period: 'Integer',
        fee: 'Integer'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'contracts_request_cancel', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.contract_id
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     contracts_accept_cancel: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        contract_id: 'String'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'contracts_accept_cancel', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     marketplace_get_offers_ex: async function () {

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'marketplace_get_offers_ex')
    },
    /**
    * @async
    * @param {Object} opts
    * @param {number} opts.od.fee
    * @param {string} opts.od.ot
    * @param {string} opts.od.ap
    * @param {string} opts.od.at
    * @param {string} opts.od.t
    * @param {string} opts.od.lco
    * @param {string} opts.od.lci
    * @param {string} opts.od.cnt
    * @param {string} opts.od.com
    * @param {string} opts.od.pt
    * @param {string} opts.od.do
    * @param {string} opts.od.cat
    * @param {string} opts.od.et
    * @param {string} opts.od.url
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     marketplace_push_offer: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        od: 'OfferStructure'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'marketplace_push_offer', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.tx_id
    * @param {number} opts.no
    * @param {Object} opts.od
    * @param {number} opts.od.fee
    * @param {string} opts.od.ot
    * @param {string} opts.od.ap
    * @param {string} opts.od.at
    * @param {string} opts.od.t
    * @param {string} opts.od.lco
    * @param {string} opts.od.lci
    * @param {string} opts.od.cnt
    * @param {string} opts.od.com
    * @param {string} opts.od.pt
    * @param {string} opts.od.do
    * @param {string} opts.od.cat
    * @param {string} opts.od.et
    * @param {string} opts.od.url
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     marketplace_push_update_offer: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        tx_id: 'String',
        od: 'OfferStructure'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'marketplace_push_update_offer', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.tx_id
    * @param {Object} opts.fee
    * @param {number} [opts.no]
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     marketplace_cancel_offer: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        tx_id: 'String',
        fee: 'Integer'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'marketplace_cancel_offer', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.amount
    * @param {Object} opts.counterparty_address
    * @param {string} opts.counterparty_address.spend_public_key
    * @param {string} opts.counterparty_address.view_public_key 
    * @param {number} opts.lock_blocks_count
    * @param {string} opts.htlc_hash
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     atomics_create_htlc_proposal: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        amount: 'Integer',
        counterparty_address: 'String',
        lock_blocks_count: 'Integer'
      }, opts)
      rpcHelpers.checkOptionalParametersType({
        htlc_hash: 'String'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'atomics_create_htlc_proposal', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {boolean} opts.income_redeem_only -
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     atomics_get_list_of_active_htlc: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        income_redeem_only: 'Boolean'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'atomics_get_list_of_active_htlc', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.tx_id -
    * @param {string} opts.origin_secret -
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     atomics_redeem_htlc: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        tx_id: 'String',
        origin_secret_as_hex: 'String'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'atomics_redeem_htlc', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.htlc_tx_id -
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     atomics_check_htlc_redeemed: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        htlc_tx_id: 'String'
      }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'atomics_check_htlc_redeemed', opts)
    }

  }
}
exports = module.exports = rpcWallet
