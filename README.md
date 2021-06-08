# TideWallet JS

## Browser

1.  Install [browserify](https://browserify.org/)

    ```
    npm install -g browserify
    ```

2.  Build browserify js
    ```
    npm run build
    // browserify -r buffer src/index.js -o dist/bundle.js
    ```

## Node
    
    const tidewallet = require('./src/index');
    

### Account {}
- properties
    - messenger<Subject$>
    - accounts
    - currencies


### PaperWallet

- getExtendedPublicKey

  ```
    const seed = Buffer.from(hex_string, 'hex');

    const exPub = tidewallet.PaperWallet.getExtendedPublicKey(seed);
  ```

## Used Libraries
[web3](https://web3js.readthedocs.io/en/v1.3.4/)

[bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)

[bip39](https://github.com/bitcoinjs/bip39)


### How To Use (DRAFT 2021.06.07)
- Build JS Library
```shell
cd TideWalletJS
npm run build
```

- Import Library
```html
<script src="./TideWallet.js" type="text/javascript"></script>
```

- Use
```javascript
const user = { OAuthID: 'myAppleID', TideWalletID: 'myTideWalletID', InstallID: 'myInstallID' };
const api = { url: 'https://service.tidewallet.io' };
const tidewallet = new TideWallet({ user, api, database });
tidewallet.on('ready', () => { /* do something */ });
tidewallet.on('update', () => { /* do something */ });
tidewallet.on('exception', () => { /* do something */ });
let assetList = tidewallet.getAssets();
let assetDetail = tidewallet.getAssetDetail({ assetID });
let transactionDetail = tidewallet.getTransactionDetail({ transactionID });
let address = tidewallet.getReceiveAddress({ coinType });
let fee = tidewallet.getTransactionFee({ to, amount, data });
let transaction = tidewallet.prepareTransaction({ to, amount, data, speed });
tidewallet.sendTransaction(transaction);
tidewallet.sync();
const paperwallet = tidewallet.backup();
tidewallet.close();
```
