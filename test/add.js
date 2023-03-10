const test = require('tape')
const ssbKeys = require('ssb-keys')
const path = require('path')
const os = require('os')
const rimraf = require('rimraf')
const SecretStack = require('secret-stack')
const caps = require('ssb-caps')
const classic = require('ssb-classic/format')
const p = require('util').promisify

const DIR = path.join(os.tmpdir(), 'ssb-memdb-add')
rimraf.sync(DIR)

test('add() classic', async (t) => {
  const ssb = SecretStack({ appKey: caps.shs })
    .use(require('../'))
    .use(require('ssb-classic'))
    .use(require('ssb-box'))
    .call(null, {
      keys: ssbKeys.generate('ed25519', 'alice'),
      path: DIR,
    })

  await ssb.db.loaded()

  const nativeMsg = classic.toNativeMsg(
    {
      previous: null,
      author: '@FCX/tsDLpubCPKKfIrw4gc+SQkHcaD17s7GI6i/ziWY=.ed25519',
      sequence: 1,
      timestamp: 1514517067954,
      hash: 'sha256',
      content: {
        type: 'post',
        text: 'This is the first post!',
      },
      signature:
        'QYOR/zU9dxE1aKBaxc3C0DJ4gRyZtlMfPLt+CGJcY73sv5abKKKxr1SqhOvnm8TY784VHE8kZHCD8RdzFl1tBA==.sig.ed25519',
    },
    'js'
  )

  const msg = await p(ssb.db.add)(nativeMsg)
  t.equal(msg.value.content.text, 'This is the first post!')

  await p(ssb.close)(true)
})
