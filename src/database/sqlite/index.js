const { isBrowser } = require("../../helpers/env");
if(isBrowser()) {
  module.exports = {};
  return;
}

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const Entity = require('../entity');

const DB_DEFAULT_DIR = "tidebitwallet";
const DB_VERSION = 1;

const TBL_ACCOUNT = "account";
const TBL_TX = "transactions";
const TBL_UTXO = "utxo";
const TBL_USER = "user";
const TBL_CURRENCY = "currency";
const TBL_NETWORK = "network";
const TBL_EXCHANGE_RATE = "exchange_rate";

const TBL_PREF = "pref";


// primary key ?
function _uuid() {
  var d = Date.now();
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    d += performance.now();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

class sqliteDB {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath);
    return this;
  }

  runDB(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.log('Error running sql ' + sql)
          console.log(err)
          reject(err)
        } else {
          // console.log('run sql id:', this.lastID)
          resolve({ id: this.lastID })
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          resolve(result)
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.log('Error running sql: ' + sql)
          console.log(err)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }
}

class Sqlite {
  constructor() {}
  db = null;
  _userDao = null;
  _accountDao = null;
  _currencyDao = null;
  _networkDao = null;
  _txDao = null;
  _utxoDao = null;
  _exchangeRateDao = null;
  _prefDao = null;

  init(dir) {
    return this._createDB(dir);
  }

  async _createDB(dbDir = DB_DEFAULT_DIR, dbVersion = DB_VERSION) {
    // const request = indexedDB.open(dbName, dbVersion);
    const DBName = `tidebitwallet.db`;
    const dbPath = path.join(dbDir, DBName);
    if (await !fs.existsSync(dbDir)) { await fs.mkdirSync(dbDir, { recursive: true }); }
    this.db = new sqliteDB(dbPath);

    this._userDao = new UserDao(this.db, TBL_USER);
    this._accountDao = new AccountDao(this.db, TBL_ACCOUNT);
    this._currencyDao = new CurrencyDao(this.db, TBL_CURRENCY);
    this._networkDao = new NetworkDao(this.db, TBL_NETWORK);
    this._txDao = new TransactionDao(this.db, TBL_TX);
    this._utxoDao = new UtxoDao(this.db, TBL_UTXO);
    this._exchangeRateDao = new ExchangeRateDao(this.db, TBL_EXCHANGE_RATE);
    this._prefDao = new PrefDao(this.db, TBL_PREF);

    await this._createTable(dbVersion);
    return this.db;
  }

  async _createTable(version) {
    const accountSQL = `CREATE TABLE IF NOT EXISTS ${TBL_ACCOUNT} (
      id TEXT PRIMARY KEY,
      userId TEXT,
      accountId TEXT,
      blockchainId TEXT,
      currencyId TEXT,
      balance TEXT,
      lastSyncTime INTEGER,
      numberOfUsedExternalKey INTEGER,
      numberOfUsedInternalKey INTEGER,
      purpose INTEGER,
      accountCoinType INTEGER,
      accountIndex TEXT,
      curveType INTEGER,
      network TEXT,
      blockchainCoinType INTEGER,
      publish BOOLEAN,
      chainId INTEGER,
      name TEXT,
      description TEXT,
      symbol TEXT,
      decimals INTEGER,
      totalSupply TEXT,
      contract TEXT,
      type TEXT,
      image TEXT,
      exchangeRate TEXT,
      inFiat TEXT
    )`;
    const txsSQL = `CREATE TABLE IF NOT EXISTS ${TBL_TX} (
      id TEXT PRIMARY KEY,
      accountId TEXT,
      txid TEXT,
      confirmations INTEGER,
      sourceAddresses TEXT,
      destinationAddresses TEXT,
      gasPrice TEXT,
      gasUsed INTEGER,
      message TEXT,
      fee TEXT,
      status TEXT,
      timestamp INTEGER,
      direction TEXT,
      amount TEXT
    )`;
    const currencySQL = `CREATE TABLE IF NOT EXISTS ${TBL_CURRENCY} (
      currencyId TEXT PRIMARY KEY,
      decimals INTEGER,
      exchangeRate TEXT,
      image TEXT,
      name TEXT,
      symbol TEXT,
      type TEXT,
      publish BOOLEAN,
      blockchainId TEXT,
      description TEXT,
      address TEXT,
      totalSupply TEXT,
      contract TEXT
    )`;
    const userSQL = `CREATE TABLE IF NOT EXISTS ${TBL_USER} (
      userId TEXT PRIMARY KEY,
      keystore TEXT,
      thirdPartyId TEXT,
      installId TEXT,
      timestamp INTEGER,
      backupStatus BOOLEAN,
      lastSyncTime INTEGER
    )`;
    const networkSQL = `CREATE TABLE IF NOT EXISTS ${TBL_NETWORK} (
      blockchainId TEXT PRIMARY KEY,
      network TEXT,
      coinType INTEGER,
      publish BOOLEAN,
      chainId INTEGER
    )`;
    const utxoSQL = `CREATE TABLE IF NOT EXISTS ${TBL_UTXO} (
      utxoId TEXT PRIMARY KEY,
      accountId TEXT,
      txid TEXT,
      vout INTEGER,
      type TEXT,
      amount TEXT,
      changeIndex INTEGER,
      keyIndex INTEGER,
      script TEXT,
      timestamp INTEGER,
      locked BOOLEAN,
      address TEXT,
      sequence INTEGER
    )`;
    const rateSQL = `CREATE TABLE IF NOT EXISTS ${TBL_EXCHANGE_RATE} (
      exchangeRateId TEXT PRIMARY KEY,
      name TEXT,
      rate TEXT,
      lastSyncTime INTEGER,
      type TEXT
    )`;
    const prefSQL = `CREATE TABLE IF NOT EXISTS ${TBL_PREF} (
      prefId TEXT PRIMARY KEY,
      value TEXT
    )`;
    try {
      await this.db.runDB(accountSQL);
      await this.db.runDB(txsSQL);
      await this.db.runDB(currencySQL);
      await this.db.runDB(userSQL);
      await this.db.runDB(networkSQL);
      await this.db.runDB(utxoSQL);
      await this.db.runDB(rateSQL);
      await this.db.runDB(prefSQL);
    } catch (error) {
      console.log('create table error:', error);
    }
    // if (version <= 1) {
    //   const accounts = this.db.createObjectStore(TBL_ACCOUNT, {
    //     keyPath: "id",
    //   });V

    //   let accountIndex = accounts.createIndex("accountId", "accountId");
    //   let blockchainIndex = accounts.createIndex(
    //     "blockchainId",
    //     "blockchainId"
    //   );

    //   const txs = this.db.createObjectStore(TBL_TX, {
    //     keyPath: "id",
    //   });V
    //   let accountIdIndex = txs.createIndex("accountId", "accountId");
    //   let txIndex = txs.createIndex("id", "id");

    //   const currency = this.db.createObjectStore(TBL_CURRENCY, {
    //     keyPath: "currencyId",
    //   });V
    //   let currencyIndex = currency.createIndex("blockchainId", "blockchainId");

    //   const utxo = this.db.createObjectStore(TBL_UTXO, {
    //     keyPath: "utxoId",
    //   });V
    //   let utxoIndex = utxo.createIndex("accountId", "accountId");
  }

  close() {
    this.db.close();
  }

  get userDao() {
    return this._userDao;
  }

  get accountDao() {
    return this._accountDao;
  }

  get currencyDao() {
    return this._currencyDao;
  }

  get networkDao() {
    return this._networkDao;
  }

  get exchangeRateDao() {
    return this._exchangeRateDao;
  }

  get transactionDao() {
    return this._txDao;
  }

  get utxoDao() {
    return this._utxoDao;
  }

  get prefDao() {
    return this._prefDao;
  }
}

class DAO {
  constructor(db, name, pk) {
    this._db = db;
    this._name = name;
    this._pk = pk
  }

  entity() {}

  /**
   *
   * @param {Object} data The entity return value
   * @param {Object} [options]
   */
  _write(data, options) {
    const sql = `
      INSERT OR REPLACE INTO ${this._name} (${Object.keys(data).join(', ')})
      VALUES (${Object.keys(data).map((k) => '?').join(', ')})
    `;
    return this._db.runDB(sql, Object.values(data));
  }

  _writeAll(entities) {
    if (entities.length > 0) {
      let sql = `INSERT OR REPLACE INTO ${this._name} (${Object.keys(entities[0]).join(', ')}) VALUES`;
      let values = [];
      for (const entity of entities) {
        sql += ` (${Object.keys(entity).map((k) => '?').join(', ')}),`;
        values = [...values, ...Object.values(entity)]
      }
      sql = sql.slice(0, -1);
      return this._db.runDB(sql, values);
    }
    return Promise.resolve(true);
  }

  _read(value = null, index) {
    const where = index ? `${index} = ?` : `${this._pk} = ?`;
    const findOne = `
      SELECT * FROM ${this._name} WHERE ${where}
    `;
    return this._db.get(findOne, value);
  }

  _readAll(value = null, index) {
    const where = index ? `${index} = ?` : `${this._pk} = ?`;
    const find = `
      SELECT * FROM ${this._name} WHERE ${where}
    `;
    return this._db.all(find, value);
  }

  _update(data) {
    const where = `${this._pk} = ?`;
    const params = Object.values(data);
    params.push(data[this._pk]);
    const sql = `UPDATE ${this._name} SET ${Object.keys(data).map((k) => `${k} = ?`).join(', ')} WHERE ${where}`;
    return this._db.runDB(sql, params);
  }

  _delete(key) {
    const where = `${this._pk} = ?`;
    const sql = `DELETE FROM ${this._name} WHERE ${where}`;
    return this._db.runDB(sql, key)
  }

  _deleteAll() {
    const sql = `DELETE FROM ${this._name}`;
    return this._db.runDB(sql)
  }
}

class UserDao extends DAO {
  constructor(db, name) {
    super(db, name, 'userId');
  }

  /**
   * @override
   */
  entity(param) {
    return Entity.UserDao(param);
  }

  findUser(userId) {
    return this._read(userId);
  }

  insertUser(userEntity) {
    return this._write(userEntity);
  }

  updateUser(userEntity) {
    return this._write(userEntity);
  }

  deleteUser(userId) {
    return this._delete(userId);
  }
}

class AccountDao extends DAO {
  constructor(db, name) {
    super(db, name, 'id');
  }

  /**
   * @override
   */
  entity(param) {
    return Entity.AccountDao(param);
  }

  findAllAccounts() {
    return this._readAll();
  }

  findAccount(id) {
    return this._read(id);
  }

  findAllByAccountId(accountId) {
    return this._readAll(accountId, "accountId");
  }

  insertAccount(accountEntiry) {
    return this._write(accountEntiry);
  }

  insertAccounts(accounts) {
    return this._writeAll(accounts);
  }
  clearAll() {
    return this._deleteAll();
  }
}

class CurrencyDao extends DAO {
  /**
   * @override
   */
  entity(param) {
    return Entity.CurrencyDao(param);
  }
  constructor(db, name) {
    super(db, name, 'currencyId');
  }

  insertCurrency(currencyEntity) {
    return this._write(currencyEntity);
  }

  insertCurrencies(currencies) {
    return this._writeAll(currencies);
  }

  findAllCurrencies() {
    return this._readAll();
  }

  findAllCurrenciesByBlockchainId(blockchainId) {
    return this._readAll(blockchainId, "blockchainId");
  }
  clearAll() {
    return this._deleteAll();
  }
}

class NetworkDao extends DAO {
  /**
   * @override
   */
  entity(param) {
    return Entity.NetworkDao(param);
  }
  constructor(db, name) {
    super(db, name, 'blockchainId');
  }

  findAllNetworks() {
    return this._readAll();
  }
  insertNetworks(networks) {
    return this._writeAll(networks);
  }
  clearAll() {
    return this._deleteAll();
  }
}

class TransactionDao extends DAO {
  constructor(db, name) {
    super(db, name, 'id');
  }

  /**
   * @override
   * @param {string} accountId ,this is the id of the account, not the accountId of the account
   */
  entity(param) {
    return Entity.TransactionDao(param);
  }

  findAllTransactionsById(accountId) {
    return this._readAll(accountId, "accountId");
  }

  findTransactionById(id) {
    return this._read(id);
  }

  insertTransaction(entity) {
    return this._write(entity);
  }

  updateTransaction(entity) {
    return this._update(entity);
  }
  insertTransactions(txs) {
    return this._writeAll(txs);
  }
  deleteById(id) {
    return this._delete();
  }
  clearAll() {
    return this._deleteAll();
  }
}
class ExchangeRateDao extends DAO {
  entity(param) {
    return Entity.ExchangeRateDao(param)
  }
  constructor(db, name) {
    super(db, name, 'exchangeRateId');
  }

  insertExchangeRates(rates) {
    return this._writeAll(rates);
  }

  findAllExchageRates() {
    return this._readAll();
  }
  clearAll() {
    return this._deleteAll();
  }
}

class UtxoDao extends DAO {
  entity(param) {
    return Entity.UtxoDao(param);
  }

  constructor(db, name) {
    super(db, name, 'utxoId');
  }

  async insertUtxos(utxos) {
    return this._writeAll(utxos);
  }

  async findAllUtxos(accountId) {
    return this._readAll(accountId, "accountId");
  }
  clearAll() {
    return this._deleteAll();
  }
}

class PrefDao extends DAO {
  static AUTH_ITEM_KEY = 1;
  static SELECTED_FIAT_KEY = 2;
  static MODE_ITEM_KEY = "debugMode";

  entity(param) {
    return Entity.PrefDao(param);
  }
  constructor(db, name) {
    super(db, name, 'prefId');
  }

  async getAuthItem(userId) {
    const result = await this._read(`${PrefDao.AUTH_ITEM_KEY}-${userId}`);

    return JSON.parse(result.value);
  }

  setAuthItem(userId, token, tokenSecret) {
    const strValue = JSON.stringify({
      prefId: `${PrefDao.AUTH_ITEM_KEY}-${userId}`,
      token,
      tokenSecret,
    });
    return this._write({
      prefId: `${PrefDao.AUTH_ITEM_KEY}-${userId}`,
      value: strValue,
    });
  }

  async getSelectedFiat() {
    const result = await this._read(PrefDao.SELECTED_FIAT_KEY);

    return JSON.parse(result.value).name;
  }

  setSelectedFiat(name) {
    const strValue = JSON.stringify({
      prefId: PrefDao.MODE_ITEM_KEY,
      name
    });
    return this._write({
      prefId: PrefDao.SELECTED_FIAT_KEY,
      value: strValue,
    });
  }

  async getDebugMode() {
    const result = await this._read(PrefDao.MODE_ITEM_KEY);
    console.log("getDebugMode", JSON.parse(result.value));
    return JSON.parse(result.value).value;
  }
  /**
   *
   * @param {Boolean} value
   * @returns
   */
  setDebugMode(value) {
    const strValue = JSON.stringify({
      prefId: PrefDao.MODE_ITEM_KEY,
      value
    });
    return this._write({
      prefId: PrefDao.MODE_ITEM_KEY,
      value: strValue,
    });
  }

  clearAll() {
    return this._deleteAll();
  }
}

module.exports = Sqlite;
