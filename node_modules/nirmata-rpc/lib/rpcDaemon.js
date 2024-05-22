'use strict'

const http = require('./httpClient')
const { default: PQueue } = require('p-queue')
const rpcHelpers = require('./rpcHelpers')

function parseDaemonResponse (res) {
  if (res.status === 200) {
    var json
    if ('error' in res.data) {
      const error = new Error('HTTP Error!')
      error.code = res.data.error.code
      error.message = res.data.error.message
      throw error      
    }
    if ('result' in res.data) {
      json = res.data.result
    } else {
      json = res.data
    }
    if (json.status === 'OK' || json) {
      return json
    } else {
      const error = new Error('RPC Error!')
      error.code = json.error.code
      error.message = json.error.message
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
 * @module RPCDaemon
 */
/** @typedef {{ RPCDaemon}} */
var rpcDaemon = {}

/**
* @function module:RPCDaemon.createDaemonClient
* @param {Object} opts
* @param {string} opts.url
* @param {string} [opts.username='NwiZ']
* @param {string} [opts.password='Circle of Life'] 
* @return {RPCDaemon} 
*/
rpcDaemon.createDaemonClient = function (config) {
  /**
 * @async
 * @param {Object} opts
 * @param {string} opts.url
 * @param {string} [opts.username='NwiZ']
 * @param {string} [opts.password='Circle of Life']
 * @return {RPCDaemon}
 */
  const queue = new PQueue({ concurrency: 1 })
  const httpClient = http.createHttpClient(config)
  const jsonAddress = config.url + '/json_rpc'
  httpClient.defaults.headers.post['Content-Type'] = 'application/json'
  return {
    resetNonces: function () {
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
    getBlockCount: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'getblockcount')
    },
    /**
    * @async
    * @param {Object} opts
    * @param {number} opts.height 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    on_getBlockHash: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ height: 'Integer' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'on_getblockhash', [opts.height])
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.hash 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    getBlockHeaderByHash: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ hash: 'Hash' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'getblockheaderbyhash', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {number} opts.height 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    getBlockHeaderByHeight: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ height: 'Integer' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'getblockheaderbyheight', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.alias 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    get_alias_details: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ alias: 'String' }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_alias_details', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.address 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    get_alias_by_address: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ address: 'Address' }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_alias_by_address', opts.address)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.alias - alias name
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    get_alias_reward: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ alias: 'String' }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_alias_reward', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {number} opts.height_start 
    * @param {number} opts.count
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    get_blocks_details: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ height_start: 'Integer',
                                            count: 'Integer' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_blocks_details', opts)
    },
    /**

    * @async
    * @param {Object} opts
    * @param {string} opts.tx_hash 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    get_tx_details: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ tx_hash: 'String' }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_tx_details', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.id 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    search_by_id: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ id: 'String' }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'search_by_id', opts)
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string} opts.wallet_address 
    * @param {string} [opts.extra_text] 
    * @param {boolean} [opts.pos_block] 
    * @param {string} [stakeholder_address] 
    * @param {number} [pos_amount] 
    * @param {number} [pos_index] 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    getBlockTemplate: async function (opts) {
      let fields = {wallet_address: 'Address'}
      if (opts.pos_block) {
        fields['pos_block'] = 'Boolean'
        fields['stakeholder_address'] = 'String'
      }
      rpcHelpers.checkMandatoryParameters(fields, opts)

      rpcHelpers.checkOptionalParametersType({ extra_text: 'Max255Bytes'}, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'getblocktemplate', opts)
    },
    /**
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    getInfo: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'flags': 'Integer'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'getinfo')
    },
    /**
    * @async
    * @param {number} amount 
    * @param {number} i 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     get_out_info: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'amount': 'Integer',
                                           'i': 'Integer'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_out_info', opts)
    },
    /**
    * @async
    * @param {string} ms_id 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
     get_multisig_info: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'ms_id': 'String'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_multisig_info', opts)
    },
    /**
    * @async
    * @example <caption><b>Output</b></caption>
    */
     get_all_alias_details: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_all_alias_details')
    },
    /**
    * @async
    * @param {number} offset 
    * @param {number} count 
    * @example <caption><b>Output</b></caption>
    */
    get_aliases: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'offset': 'Integer',
                                           'count': 'Integer'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_aliases', opts)
    },
    /**
    * @async
    * @example <caption><b>Output</b></caption>
    */
     get_pool_txs_details: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_pool_txs_details')
    },
    /**
    * @async
    * @param {string[]} ids 
    * @example <caption><b>Output</b></caption>
    */
     get_pool_txs_brief_details: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'ids': 'ArrayOfStrings'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_pool_txs_brief_details', opts)
    },
    /**
    * @async
    * @example <caption><b>Output</b></caption>
    */
     get_all_pool_tx_list: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_all_pool_tx_list')
    },
    /**
    * @async
    * @param {string} id
    * @example <caption><b>Output</b></caption>
    */
     get_main_block_details: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'id': 'String'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_main_block_details', opts)
    },
    /**
    * @async
    * @param {string} id 
    * @example <caption><b>Output</b></caption>
    */
     get_alt_block_details: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'id': 'String'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_alt_block_details', opts)
    },
    /**
    * @async
    * @param {number} offset 
    * @param {number} count
    * @example <caption><b>Output</b></caption>
    */
     get_alt_blocks_details: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'offset': 'Integer',
                                           'count': 'Integer'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_alt_blocks_details', opts)
    },
    /**
    * @async
    * @example <caption><b>Output</b></caption>
    */
     reset_transaction_pool: async function (opts) {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'reset_transaction_pool')
    },
    /**
    * @async
    * @example <caption><b>Output</b></caption>
    */
     get_current_core_tx_expiration_median: async function (opts) {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'get_current_core_tx_expiration_median')
    },
    /**
    * @async
    * @example <caption><b>Output</b></caption>
    */
     marketplace_global_get_offers_ex: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'marketplace_global_get_offers_ex')
    },
    /**
    * @async
    * @example <caption><b>Output</b></caption>
    */
     getheight: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress.replace('json_rpc', 'getheight'), queue, parseDaemonResponse)
    },
    /**
    * @async
    * @param {string[]} txs_hashes 
    * @example <caption><b>Output</b></caption>
    */
     gettransactions: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'txs_hashes': 'ArrayOfStrings'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress.replace('json_rpc', 'gettransactions'), queue, parseDaemonResponse, null, opts)
    },
    /**
    * @async
    * @param {string} tx_as_text 
    * @example <caption><b>Output</b></caption>
    */
     sendrawtransaction: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'tx_as_text': 'String'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress.replace('json_rpc', 'sendrawtransaction'), queue, parseDaemonResponse, null, opts)
    },
    /**
    * @async
    * @param {string[]} tx_as_hex
    * @example <caption><b>Output</b></caption>
    */
     force_relay: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'tx_as_hex': 'ArrayOfStrings'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress.replace('json_rpc', 'force_relay'), queue, parseDaemonResponse, null, opts)
    },
    /**
    * @async
    * @param {string} miner_address 
    * @param {number} thread_count 
    * @example <caption><b>Output</b></caption>
    */
     start_mining: async function (opts) {
      rpcHelpers.checkMandatoryParameters({'miner_address': 'Address',
                                           'thread_count': 'Integer'}, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress.replace('json_rpc', 'start_mining'), queue, parseDaemonResponse, null, opts)
    },
    /**
    * @async
    * @example <caption><b>Output</b></caption>
    */
     stop_mining: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress.replace('json_rpc', 'stop_mining'), queue, parseDaemonResponse, null)
    },
    /**
    * @async
    * @example <caption><b>Output</b></caption>
    */
     getInfoLegacy: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress.replace('json_rpc', 'getinfo'), queue, parseDaemonResponse, null)
    },
    /**
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    getLastBlockHeader: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'getlastblockheader')
    },
    /**
    * @async
    * @param {Object} opts
    * @param {string[]} opts.blobs 
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    */
    submitBlock: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ blobs: 'ArrayOfStrings' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseDaemonResponse, 'submitblock', opts.blobs)
    }
  }
}

exports = module.exports = rpcDaemon
