import type { PlaybackSourceInfo } from '@renderer/store/player/state'

export interface MusicPlaybackReportIdentity {
  provider: 'wy'
  songId: string
  sourceId?: string
}

/** 网易云曲目身份来自播放队列中的原曲，不从解析到的音频线路推断。 */
export const getMusicPlaybackReportIdentity = (musicInfo: LX.Music.MusicInfo): MusicPlaybackReportIdentity | null => {
  if (musicInfo.source != 'wy') return null
  const songId = String(musicInfo.meta.songId ?? '')
  if (!/^\d+$/.test(songId)) return null
  const sourceId = String(musicInfo.meta.albumId ?? '')
  return { provider: 'wy', songId, sourceId: /^\d+$/.test(sourceId) ? sourceId : undefined }
}

export const getPlaybackReportInfo = (sourceInfo: PlaybackSourceInfo | null, currentMusicKey: string) => {
  if (!sourceInfo || !currentMusicKey || sourceInfo.musicKey != currentMusicKey) return null

  const reportIdentity = sourceInfo.reportIdentity
  if (reportIdentity?.provider == 'wy' && /^\d+$/.test(reportIdentity.songId)) {
    return {
      provider: 'wy' as const,
      songId: reportIdentity.songId,
      sourceId: reportIdentity.sourceId,
    }
  }

  if (
    sourceInfo.mode != 'official' ||
    (sourceInfo.resolvedSource != 'tx' && sourceInfo.resolvedSource != 'wy') ||
    !sourceInfo.resolvedSongId ||
    (sourceInfo.resolvedSource == 'wy' && !/^\d+$/.test(sourceInfo.resolvedSongId))
  ) return null

  return {
    provider: sourceInfo.resolvedSource,
    songId: sourceInfo.resolvedSongId,
    mediaId: sourceInfo.resolvedMediaId || undefined,
    sourceId: sourceInfo.officialSourceId || undefined,
  }
}
