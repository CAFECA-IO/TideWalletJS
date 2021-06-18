const rlp = require("../src/helpers/rlp");
const Cryptor = require('../src/helpers/Cryptor');
const User = require("../src/cores/User");
const PaperWallet = require('../src/cores/PaperWallet');
const { jsonToWallet } = require("../src/cores/PaperWallet");

const _user = new User()
const userIdentifier = 'test2ejknkjdniednwjq'
const userId = '3fa33d09a46d4e31087a3b24dfe8dfb46750ce534641bd07fed54d2f23e97a0f'
const userSecret = '971db42d2342f5e74a764e57e2d341103565f413a64f242d64b1f7024346a2e1'
const installId = '11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249'
const timestamp = 1623129204183
const resWallet = '{"keyObject":{"metadata":{"nonce":"6eSlI0kmQ+4XgtN6dMY7XeRRqtdU0pkz","iterations":10000},"public":{},"private":"LTbAv70wSIVyoNEK5T0OOfP7oDliUBvHL9Yert/Omf2GxRrtO5+9HWHdRUPtvfAF4OHKDBnKmn3b7VULUzxgad+m9h3+jDzN0AIhgfBC3wd5Ow=="}}';
const resPassword = '637a54e862c9260697f29c631288ea5c73f3f6ce8a38259d0d27abba15c7d92e';

describe('User checkUser', () => {
    test("is find user", async () => {
        {
            const _user1 = new User()

            // mock db return
            const _DBOperator = {
                userDao: {
                    findUser: () => ({
                        user_id: 'test_id',
                        third_party_id: 'test_thirdPartyId',
                        install_id: 'test_installId',
                        timestamp: 'test_timestamp',
                        backup_status: 'test_isBackup',
                    })
                },
                prefDao: {
                    getAuthItem: () => ({
                        token: 'test_Token'
                    })
                }
            }
            _user1._DBOperator = _DBOperator;

            const checkUser = await _user1.checkUser()
            expect(checkUser).toBe(true);
            expect(_user1.id).toBe('test_id');
        }
    });

    test("not found user", async () => {
        {
            const _user2 = new User()

            // mock db return
            const _DBOperator = {
                userDao: {
                    findUser: () => null
                }
            }
            _user2._DBOperator = _DBOperator;

            const checkUser = await _user2.checkUser()
            expect(checkUser).toBe(false);
        }
    });
})

test("User createUser ", async () => {
    {
        const _user1 = new User()

        // mock api response
        _user1._HTTPAgent.post = () => ({
            success: true,
            data: {
                user_id: userId,
                user_secret: userSecret
            }
        })
        // mock db return
        const _DBOperator = {
            userDao: {
                findUser: () => null,
                entity: () => ({
                    user_id: 'test_id',
                    third_party_id: 'test_thirdPartyId',
                    install_id: 'test_installId',
                    timestamp: 'test_timestamp',
                    backup_status: 'test_isBackup',
                }),
                insertUser: () => (true)
            },
            prefDao: {
                setAuthItem: () => ({
                    token: 'test_Token'
                }),
                getAuthItem: () => ({
                    token: 'test_Token'
                })
            }
        }
        _user1._DBOperator = _DBOperator;

        expect.assertions(1);
        let success = false;
        if (!await _user1.checkUser()) {
            success = await _user1.createUser(userIdentifier, installId);
        }
        expect(success).toBeTruthy();
    }
});

test("User _registerUser", async () => {
    {
        const _user1 = new User()

        // mock api response
        _user1._HTTPAgent.post = () => ({
            success: true,
            data: {
                user_id: userId,
                user_secret: userSecret
            }
        })
        // mock db return
        const _DBOperator = {
            userDao: {
                findUser: () => null,
                entity: () => ({
                    user_id: 'test_id',
                    third_party_id: 'test_thirdPartyId',
                    install_id: 'test_installId',
                    timestamp: 'test_timestamp',
                    backup_status: 'test_isBackup',
                }),
                insertUser: () => (true)
            },
            prefDao: {
                setAuthItem: () => ({
                    token: 'test_Token'
                }),
                getAuthItem: () => ({
                    token: 'test_Token'
                })
            }
        }
        _user1._DBOperator = _DBOperator;
        
        expect.assertions(1);
        let result = false;
        if (!await _user1.checkUser()) {
            const { wallet, extendPublicKey: extPK } = await _user1._PaperWallet.createWallet({
                userIdentifier,
                userId,
                userSecret,
                installId,
                timestamp,
            });
            result = await _user1._registerUser({ extendPublicKey: extPK, installId, wallet, userId, userIdentifier, timestamp })
        }
        expect(result).toBeTruthy();
    }
})

test("User createUserWithSeed ", async () => {
    {
        const _seed = 'e48f77df468d4890f92392568451e7f73e1757c4287c02b04b8b7d9dba063a13';

        const _user1 = new User()

        // mock api response
        _user1._HTTPAgent.post = () => ({
            success: true,
            data: {
                user_id: userId,
                user_secret: userSecret
            }
        })
        // mock db return
        const _DBOperator = {
            userDao: {
                findUser: () => null,
                entity: () => ({
                    user_id: 'test_id',
                    third_party_id: 'test_thirdPartyId',
                    install_id: 'test_installId',
                    timestamp: 'test_timestamp',
                    backup_status: 'test_isBackup',
                }),
                insertUser: () => (true)
            },
            prefDao: {
                setAuthItem: () => ({
                    token: 'test_Token'
                }),
                getAuthItem: () => ({
                    token: 'test_Token'
                })
            }
        }
        _user1._DBOperator = _DBOperator;

        expect.assertions(1);
        let success = false;
        if (!await _user1.checkUser()) {
            success = await _user1.createUserWithSeed(userIdentifier, _seed, installId);
        }
        expect(success).toBeTruthy();
    }
})

test('User validPaperWallet', async () => {
    const walletJson = resWallet;
    const wallet = jsonToWallet(walletJson);
    const result1 = _user.validPaperWallet(walletJson);
    const result2 = _user.validPaperWallet(wallet);
    expect(result1).toBeTruthy();
    expect(result2).toBeTruthy();
})

test('User restorePaperWallet', async () => {
    const keystore = resWallet;
    const restoreWallet = await _user.restorePaperWallet(keystore, resPassword);
    expect(restoreWallet.keyObject).toBeDefined();
})


describe('User checkWalletBackup', () => {
    test("is find user", () => {
        {
            const _user1 = new User()

            // mock db return
            const _DBOperator = {
                userDao: {
                    findUser: () => ({
                        user_id: 'test_id',
                        third_party_id: 'test_thirdPartyId',
                        install_id: 'test_installId',
                        timestamp: 'test_timestamp',
                        backup_status: 'test_isBackup',
                    }),
                    updateUser: () => ({
                        user_id: 'test_id',
                        third_party_id: 'test_thirdPartyId',
                        install_id: 'test_installId',
                        timestamp: 'test_timestamp',
                        backup_status: 'test_isBackup',
                    })
                }
            }
            _user1._DBOperator = _DBOperator;
            
            const result = _user1.backupWallet();
            expect(result).toBeTruthy();
        }
    });


    test.skip("not found user", () => {
        const result = _user.backupWallet();
        expect(result).toBeFalsy();
    });
});

test('User _initUser', async () => {
    {
        const _user1 = new User()
        _user1._initUser({
            user_id: 'test_id',
            third_party_id: 'test_thirdPartyId',
            install_id: 'test_installId',
            timestamp: 'test_timestamp',
            backup_status: 'test_isBackup',
        })
        expect(_user1.id).toBe('test_id');
    }
})

test("User getPriKey", async () => {
    const _user1 = new User();

    // mock db return true
    const _DBOperator = {
        userDao: {
            findUser: () => ({
                keystore: '{"keyObject":{"metadata":{"nonce":"SNRY7MboqA+/VGbi9H4l14uBgbA88/ap","iterations":10000},"public":{},"private":"rpy8r9vAueKKyWODulilj9TJaO9NS1W0FB+sxKeW0UjXp4YGpU0nXEfgDACeyjf+T47gB2YIGY53f8cjLZNtrC+WR3XmLxvali/QHPC1i/OAZA=="}}'
            })
        }
    }
    _user1._DBOperator = _DBOperator;

    const result = await _user1.getPriKey('123', 0, 0);
    expect(result).toBe('24800a8f675f2b9b911e9551bf5bab69b238c531e61c566937cca4c83257730a');
})