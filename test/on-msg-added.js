const test = require('tape')
const ssbKeys = require('ssb-keys')
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const SecretStack = require('secret-stack')
const caps = require('ssb-caps')
const p = require('util').promisify

const dir = '/tmp/ssb-memdb-on-msg-added'

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

test('onMsgAdded', async (t) => {
  await ssb.db.loaded()

  const listened = []
  var remove = ssb.db.onMsgAdded((ev) => {
    listened.push(ev)
  })

  const msg1 = await p(ssb.db.create)({
    feedFormat: 'classic',
    content: { type: 'post', text: 'I am hungry' },
  })
  t.equal(msg1.value.content.text, 'I am hungry', 'msg1 text correct')

  await p(setTimeout)(500)

  t.equal(listened.length, 1)
  t.deepEquals(Object.keys(listened[0]), ['kvt', 'nativeMsg', 'feedFormat'])
  t.deepEquals(listened[0].kvt, msg1)
  t.deepEquals(listened[0].nativeMsg, msg1.value)
  t.equals(listened[0].feedFormat, 'classic')

  remove()
  await p(ssb.close)(true)
})
