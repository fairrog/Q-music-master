const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../src/renderer/core/music/playbackReport.ts'), 'utf8')
const moduleExports = {}
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: moduleExports })

const neteaseTrack = (songId, extra = {}) => ({
  source: 'wy',
  id: String(songId),
  meta: { songId, albumId: '88', ...extra },
})
const playbackSource = (extra = {}) => ({
  musicKey: 'wy:original-netease-id',
  requestedSource: 'wy',
  resolvedSource: 'kg',
  quality: '128k',
  mode: 'api',
  isFallback: true,
  resolvedSongId: 'third-party-id',
  resolvedMediaId: '',
  officialSourceId: '',
  ...extra,
})

test('网易云曲目保留原始网易云歌曲 ID，不使用第三方音源 ID 上报', () => {
  const identity = moduleExports.getMusicPlaybackReportIdentity(neteaseTrack('12345'))
  assert.deepEqual(JSON.parse(JSON.stringify(identity)), { provider: 'wy', songId: '12345', sourceId: '88' })

  const info = moduleExports.getPlaybackReportInfo(playbackSource({ reportIdentity: identity }), 'wy:original-netease-id')
  assert.deepEqual(JSON.parse(JSON.stringify(info)), { provider: 'wy', songId: '12345', sourceId: '88' })
})

test('只有原曲来源为网易云且网易云 ID 为数字时才设置网易云上报身份', () => {
  assert.equal(moduleExports.getMusicPlaybackReportIdentity({ ...neteaseTrack('abc') }), null)
  assert.equal(moduleExports.getMusicPlaybackReportIdentity({ ...neteaseTrack('123'), source: 'tx' }), null)
  assert.equal(moduleExports.getPlaybackReportInfo(playbackSource(), 'wy:original-netease-id'), null)
  assert.equal(moduleExports.getPlaybackReportInfo(playbackSource({
    reportIdentity: { provider: 'wy', songId: 'bad-id' },
  }), 'wy:original-netease-id'), null)
})

test('仍支持官方网易云/QQ 线路，并拒绝过期歌曲线路信息', () => {
  const wyInfo = moduleExports.getPlaybackReportInfo(playbackSource({
    resolvedSource: 'wy',
    mode: 'official',
    resolvedSongId: '54321',
    officialSourceId: '66',
  }), 'wy:original-netease-id')
  assert.deepEqual(JSON.parse(JSON.stringify(wyInfo)), {
    provider: 'wy', songId: '54321', sourceId: '66',
  })

  const txInfo = moduleExports.getPlaybackReportInfo(playbackSource({
    resolvedSongId: 'tx-song-id',
    resolvedMediaId: 'tx-media-id',
    musicKey: 'tx:original-qq-id',
    requestedSource: 'tx',
    resolvedSource: 'tx',
    mode: 'official',
  }), 'tx:original-qq-id')
  assert.equal(txInfo.provider, 'tx')
  assert.equal(txInfo.songId, 'tx-song-id')
  assert.equal(txInfo.mediaId, 'tx-media-id')
  assert.equal(moduleExports.getPlaybackReportInfo(playbackSource(), 'wy:another-song'), null)
})
