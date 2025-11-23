# 🎯 GUÍA DE ACTUALIZACIÓN - CLAVES SIMPLES SIN PUNTOS

## ✅ Sistema Implementado

Ahora el sistema de traducciones usa **claves simples sin puntos**.

### Antes ❌
```javascript
t('sidebar.home')
t('profile.title')
t('config.notifications.title')
```

### Ahora ✅
```javascript
t('home')          // 'Home'
t('myProfile')     // 'Mi Perfil'
t('notifications') // 'Notificaciones'
```

## 📋 Reemplazo de Claves por Componente

### **Sidebar** ✅ COMPLETADO
- `sidebar.home` → `home`
- `sidebar.mood` → `mood`
- `sidebar.playlists` → `playlists`
- `sidebar.config` → `config`
- `sidebar.profile` → `profile`
- `sidebar.demo` → `demo`
- `sidebar.toggle` → `toggle`

### **HomeTemplate**
- `home.welcomeTitle` → `welcomeTitle`
- `home.welcomeSubtitle` → `welcomeSubtitle`
- `home.personalizePlaylist` → `personalizePlaylist`
- `home.personalizePlaylistDesc` → `personalizePlaylistDesc`
- `common.user` → `user`
- `common.logout` → `logout`

### **LoginTemplate**
- `login.appSubtitle` → `appSubtitle`
- `login.welcomeTitle` → `welcome`
- `login.welcomeMessage` → `welcomeMessage`
- `login.signInWithSpotify` → `signInWithSpotify`
- `login.termsAndConditions` → `termsAndConditions`
- `login.errorConnectingSpotify` → `errorConnectingSpotify`

### **PerfilTemplate**
- `profile.title` → `myProfile`
- `profile.subtitle` → `yourInfo`
- `profile.accountInfo` → `accountInfo`
- `profile.user` → `user`
- `profile.email` → `email`
- `profile.accountType` → `accountType`
- `profile.country` → `country`
- `profile.stats` → `yourStats`
- `profile.playlistsCreated` → `playlistsCreated`
- `profile.totalPlaylists` → `totalPlaylists`
- `profile.favoriteGenre` → `favoriteGenre`
- `profile.followers` → `followers`
- `profile.inMoodBeatsHub` → `inMoodBeatsHub`
- `profile.inSpotify` → `inSpotify`
- `profile.mostListened` → `mostListened`
- `profile.spotifyConnection` → `spotifyConnection`
- `profile.connected` → `connected`
- `profile.connectedSubtitle` → `connectedSubtitle`
- `profile.dangerZone` → `dangerZone`
- `profile.deleteAccount` → `deleteAccount`
- `profile.deleteWarning` → `deleteWarning`
- `profile.deleteNote` → `deleteNote`
- `profile.deleting` → `deleting`
- `profile.myPlaylists` → `myPlaylists`
- `profile.configuration` → `configuration`
- `profile.backToHome` → `backToHome`
- `profile.loading` → `loadingProfile`
- `profile.notAvailable` → `notAvailable`
- `common.confirm` → `confirm`

### **ConfiguracionTemplate**
- `config.title` → `settings`
- `config.subtitle` → `adjustExperience`
- `config.notifications.title` → `notifications`
- `config.notifications.pushLabel` → `pushNotifications`
- `config.notifications.pushDescription` → `pushNotificationsDesc`
- `config.playback.title` → `playback`
- `config.playback.autoplayLabel` → `autoplay`
- `config.playback.autoplayDescription` → `autoplayDesc`
- `config.playback.qualityLabel` → `audioQuality`
- `config.playback.qualityDescription` → `audioQualityDesc`
- `config.playback.qualityOptions.low` → `low`
- `config.playback.qualityOptions.normal` → `normal`
- `config.playback.qualityOptions.high` → `high`
- `config.playback.qualityOptions.veryHigh` → `veryHigh`
- `config.content.title` → `content`
- `config.content.explicitLabel` → `explicitContent`
- `config.content.explicitDescription` → `explicitContentDesc`
- `config.appearance.title` → `appearance`
- `config.appearance.darkModeLabel` → `darkMode`
- `config.appearance.darkModeDescription` → `darkModeDesc`
- `config.appearance.languageLabel` → `language`
- `config.appearance.languageDescription` → `languageDesc`
- `config.quickActions.viewProfile` → `viewProfile`
- `config.quickActions.myPlaylists` → `myPlaylists`
- `config.quickActions.backHome` → `backToHome`
- `config.saveSuccess` → `saveSuccess`
- `common.saveChanges` → `saveChanges`
- `common.cancel` → `cancel`

### **PlaylistsTemplate**
- `playlists.title` → `favoritePlaylists`
- `playlists.subtitle` → `savedPlaylists`
- `playlists.createNew` → `createNew`
- `playlists.loading` → `loadingPlaylists`
- `playlists.error` → `errorLoading`
- `playlists.retry` → `retry`
- `playlists.songs` → `songs`
- `playlists.saved` → `saved`
- `playlists.play` → `play`
- `playlists.spotify` → `spotify`
- `playlists.delete` → `delete`
- `playlists.deleting` → `deleting2`
- `playlists.loadingPlayer` → `loadingPlayer`
- `playlists.empty` → `emptyPlaylists`
- `playlists.emptyDesc` → `emptyPlaylistsDesc`
- `playlists.createFirst` → `createFirst`
- `playlists.playInPlayer` → `playInPlayer`
- `playlists.openInSpotify` → `openInSpotify`
- `playlists.deletePlaylist` → `deletePlaylist`
- `playlists.playerNotAvailable` → `playerNotAvailable`
- `playlists.deleteConfirm` → `deleteConfirm`
- `playlists.deleteError` → `deleteError`
- `playlists.customPlaylist` → `customPlaylist`
- `playlists.errorUser` → `errorUser`
- `playlists.errorLoadUser` → `errorLoadUser`
- `playlists.today` → `today`
- `playlists.yesterday` → `yesterday`
- `playlists.daysAgo` → `daysAgo`
- `playlists.weeksAgo` → `weeksAgo`
- `playlists.unknown` → `unknown`

### **EstadoAnimoTemplate**
- `moodStats.title` → `emotionStats`
- `moodStats.subtitle` → `emotionStatsSubtitle`
- `moodStats.mostFrequent` → `mostFrequent`
- `moodStats.totalSelections` → `totalSelections`
- `moodStats.didYouKnow` → `didYouKnow`
- `moodStats.musicInfluence` → `musicInfluence`
- `moodStats.emotionTracking` → `emotionTracking`
- `moodStats.emotionLink` → `emotionLink`
- `moodStats.selectAnother` → `selectAnother`

### **GenPlaylistTemplate**
- `genPlaylist.back` → `back`
- `genPlaylist.state` → `state`
- `genPlaylist.enjoy` → `enjoy`
- `genPlaylist.accompanying` → `accompanying`
- `genPlaylist.letsGo` → `letsGo`
- `genPlaylist.breathe` → `breathe`
- `genPlaylist.perfectMusic` → `perfectMusic`
- `genPlaylist.connectSpotify` → `connectSpotify`
- `genPlaylist.generateTitle` → `generateTitle`
- `genPlaylist.generateDesc` → `generateDesc`
- `genPlaylist.generating` → `generating`
- `genPlaylist.generateButton` → `generateButton`
- `genPlaylist.generated` → `generated`
- `genPlaylist.regenerate` → `regenerate`
- `genPlaylist.playInPlayer` → `playInPlayer2`
- `genPlaylist.openInSpotify` → `openInSpotify2`
- `genPlaylist.addToFavorites` → `addToFavorites`
- `genPlaylist.removeFromFavorites` → `removeFromFavorites`
- `genPlaylist.saving` → `saving`
- `genPlaylist.favorite` → `favorite`
- `genPlaylist.favorites` → `favorites`
- `genPlaylist.selectMood` → `selectMood`
- `genPlaylist.completeSurvey` → `completeSurvey`
- `genPlaylist.startSurvey` → `startSurvey`
- `genPlaylist.loadingTokens` → `loadingTokens`
- `genPlaylist.loadingPlaylists` → `loadingPlaylists2`
- `genPlaylist.songs` → `songs`
- `common.user` → `user`

### **PlaylistQuizModal**
- `quiz.title` → `customizePlaylist`
- `quiz.step` → `step`
- `quiz.moodTitle` → `moodTitle`
- `quiz.moodDesc` → `moodDesc`
- `quiz.genresTitle` → `genresTitle`
- `quiz.genresDesc` → `genresDesc`
- `quiz.surpriseMe` → `surpriseMe`
- `quiz.chooseGenres` → `chooseGenres`
- `quiz.selectUpTo` → `selectUpTo`
- `quiz.artistsTitle` → `artistsTitle`
- `quiz.artistsDesc` → `artistsDesc`
- `quiz.useFavorites` → `useFavorites`
- `quiz.chooseArtists` → `chooseArtists`
- `quiz.addUpTo` → `addUpTo`
- `quiz.searchArtist` → `searchArtist`
- `quiz.searching` → `searching`
- `quiz.suggestions` → `suggestions`
- `quiz.noResults` → `noResults`
- `quiz.addManually` → `addManually`
- `quiz.add` → `add`
- `quiz.intensityTitle` → `intensityTitle`
- `quiz.intensityDesc` → `intensityDesc`
- `quiz.recommended` → `recommended`
- `quiz.nameTitle` → `nameTitle`
- `quiz.nameDesc` → `nameDesc`
- `quiz.namePlaceholder` → `namePlaceholder`
- `quiz.characters` → `characters`
- `quiz.preview` → `preview`
- `quiz.back` → `back2`
- `quiz.next` → `next`
- `quiz.generate` → `generate`
- `quiz.selectMoodError` → `selectMoodError`
- `quiz.nameRequiredError` → `nameRequiredError`

### **SpotifyPlayer**
- `player.loading` → `loadingPlayer2`
- `player.requiresPremium` → `requiresPremium`
- `player.selectPlaylist` → `selectPlaylist`
- `player.previous` → `previous`
- `player.play` → `playButton`
- `player.pause` → `pause`
- `player.next` → `nextButton`
- `player.volume` → `volume`
- `player.noTitle` → `noTitle`
- `player.unknownArtist` → `unknownArtist`
- `player.errorSeek` → `errorSeek`
- `player.errorVolume` → `errorVolume`
- `player.errorPlay` → `errorPlay`
- `player.errorNext` → `errorNext`

## 🚀 Estado Actual
- ✅ Sidebar - COMPLETADO
- ⏳ Resto de componentes - EN PROGRESO

Usa esta guía para actualizar cada componente con buscar y reemplazar.


