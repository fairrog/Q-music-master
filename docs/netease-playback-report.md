# 网易云歌曲播放记录同步

## 结论

网易云来源的歌曲，即使实际通过第三方音源播放，也会尝试将播放记录同步到网易云账号。上报使用原始网易云歌曲 ID，不使用第三方音源 ID。非网易云来源的歌曲不会因此被上报到网易云。

## 实现规则

- 只为原曲来源为网易云、且歌曲 ID 为数字的曲目创建网易云上报身份。
- 上报身份取自播放列表中的原曲信息，与实际解析出的播放线路分开保存。
- 上报前检查歌曲 key 与当前曲目一致，避免切歌时沿用旧线路信息。
- 原有官方 QQ 音乐和网易云线路的上报逻辑继续保留。
- 原有播放时长、账号登录和有效 ID 检查保持不变；播放时长达到 5 秒后才进入上报流程。
- 网易云上报使用原曲 `songId`；`sourceId` 当前取原曲 `albumId`，缺失或非数字时由现有上报代码回退为 `0`。

## 代码改动

- `src/renderer/core/music/playbackReport.ts`：构造原曲网易云上报身份，并根据当前曲目和线路信息生成上报数据。
- `src/renderer/store/player/state.ts`：增加 `PlaybackReportIdentity` 类型及播放线路信息的 `reportIdentity` 字段。
- `src/renderer/core/player/action.ts`：设置播放线路信息时附带原曲网易云身份。
- `src/renderer/core/useApp/usePlayer/useOfficialPlaybackReport.ts`：从当前曲目及线路信息取得上报数据，进入现有播放时长和账号上报流程。
- `test/playbackReport.test.cjs`：新增身份识别、线路选择和过期线路测试。
- `test/playbackRecovery.test.cjs`：为播放器恢复测试夹具提供新增的播放上报模块依赖。
- `package.json`：将新测试纳入 `test:feedback` 和 `test` 脚本。

## 验证状态

- `node --test test/playbackReport.test.cjs`：通过，3 项测试全部通过。
- `npm run test:feedback`：通过，48 项测试全部通过。
- `npm test`：通过，262 项测试中 261 项通过，1 项因独立桌面检出不包含 Android 源码而按既有条件跳过。
- 类型检查：裸 `tsc --noEmit` 受仓库路径别名配置影响，产生大量既有模块解析错误，未作为本次改动的有效判定依据。
- `sourceId` 取网易云歌曲原曲 `albumId`，目前尚未通过真实网易云账号验证服务端记录结果。
