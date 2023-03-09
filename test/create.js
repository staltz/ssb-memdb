const test = require('tape')
const ssbKeys = require('ssb-keys')
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const SecretStack = require('secret-stack')
const caps = require('ssb-caps')
const p = require('util').promisify

const dir = '/tmp/ssb-memdb-create'

rimraf.sync(dir)
mkdirp.sync(dir)

const keys = ssbKeys.loadOrCreateSync(path.join(dir, 'secret'))

let ssb = SecretStack({ appKey: caps.shs })
  .use(require('../'))
  .use(require('ssb-classic'))
  .use(require('ssb-box'))
  .call(null, {
    keys,
    path: dir,
  })

test('setup', async (t) => {
  await ssb.db.loaded()
})

test('create() classic', async (t) => {
  const msg1 = await p(ssb.db.create)({
    feedFormat: 'classic',
    content: { type: 'post', text: 'I am hungry' },
  })
  t.equal(msg1.value.content.text, 'I am hungry', 'msg1 text correct')

  const msg2 = await p(ssb.db.create)({
    content: { type: 'post', text: 'I am hungry 2' },
    feedFormat: 'classic',
  })
  t.equal(msg2.value.content.text, 'I am hungry 2', 'msg2 text correct')
  t.equal(msg2.value.previous, msg1.key, 'msg2 previous correct')
})

// TODO:
test.skip('create() classic box', async (t) => {
  const msgBoxed = await p(ssb.db.create)({
    feedFormat: 'classic',
    content: { type: 'post', text: 'I am chewing food', recps: [keys.id] },
    encryptionFormat: 'box',
  })
  t.equal(typeof msgBoxed.value.content, 'string')
  t.true(msgBoxed.value.content.endsWith('.box'), '.box')

  const msgVal = ssb.db.get(msgBoxed.key)
  t.equals(msgVal.content.text, 'I am chewing food')
})

test('teardown', (t) => {
  ssb.close(t.end)
})
