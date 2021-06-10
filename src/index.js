const PaperWallet = require("./cores/PaperWallet");
const Account = require("./cores/Account");
const Trader = require("./cores/Trader");
const User = require("./cores/User");

const tidewallet = {
  PaperWallet,
  Account,
  Trader,
  User,
};

var isBrowser = function () {
  try {
    return this === window;
  } catch (e) {
    return false;
  }
};

if (isBrowser()) {
  window.Buffer = require("buffer").Buffer;
  window.tidewallet = tidewallet;
}

console.log(isBrowser());

/// TEST AccountCore messenger
const acc = new tidewallet.Account();
acc.setMessenger();
const i = acc.messenger.subscribe((v) => {
  console.log(v)
})

acc.init();

///

module.exports = tidewallet;
