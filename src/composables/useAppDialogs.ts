import { ref } from 'vue'

export function useAppDialogs() {
  const showFindReplace = ref(false)
  const showGoToDialog = ref(false)
  const showFontDialog = ref(false)
  const showOpenDialog = ref(false)
  const showSaveDialog = ref(false)
  const showShareDialog = ref(false)
  const showRawDialog = ref(false)
  const showShareManager = ref(false)
  const showSettings = ref(false)
  const showDownloadPrompt = ref(false)
  const showAbout = ref(false)
  const showAdminLoginDialog = ref(false)

  const downloadFilename = ref('')

  function openFindReplace() {
    showFindReplace.value = true
  }

  function closeFindReplace() {
    showFindReplace.value = false
  }

  function openGoToDialog() {
    showGoToDialog.value = true
  }

  function closeGoToDialog() {
    showGoToDialog.value = false
  }

  function openFontDialog() {
    showFontDialog.value = true
  }

  function closeFontDialog() {
    showFontDialog.value = false
  }

  function openOpenDialog() {
    showOpenDialog.value = true
  }

  function closeOpenDialog() {
    showOpenDialog.value = false
  }

  function openSaveDialog() {
    showSaveDialog.value = true
  }

  function closeSaveDialog() {
    showSaveDialog.value = false
  }

  function openShareDialog() {
    showShareDialog.value = true
  }

  function closeShareDialog() {
    showShareDialog.value = false
  }

  function openRawDialog() {
    showRawDialog.value = true
  }

  function closeRawDialog() {
    showRawDialog.value = false
  }

  function openShareManager() {
    showShareManager.value = true
  }

  function closeShareManager() {
    showShareManager.value = false
  }

  function openSettings() {
    showSettings.value = true
  }

  function closeSettings() {
    showSettings.value = false
  }

  function openDownloadPrompt(filename: string) {
    downloadFilename.value = filename
    showDownloadPrompt.value = true
  }

  function closeDownloadPrompt() {
    showDownloadPrompt.value = false
  }

  function openAbout() {
    showAbout.value = true
  }

  function closeAbout() {
    showAbout.value = false
  }

  function openAdminLoginDialog() {
    showAdminLoginDialog.value = true
  }

  function closeAdminLoginDialog() {
    showAdminLoginDialog.value = false
  }

  return {
    showFindReplace,
    showGoToDialog,
    showFontDialog,
    showOpenDialog,
    showSaveDialog,
    showShareDialog,
    showRawDialog,
    showShareManager,
    showSettings,
    showDownloadPrompt,
    showAbout,
    showAdminLoginDialog,
    downloadFilename,
    openFindReplace,
    closeFindReplace,
    openGoToDialog,
    closeGoToDialog,
    openFontDialog,
    closeFontDialog,
    openOpenDialog,
    closeOpenDialog,
    openSaveDialog,
    closeSaveDialog,
    openShareDialog,
    closeShareDialog,
    openRawDialog,
    closeRawDialog,
    openShareManager,
    closeShareManager,
    openSettings,
    closeSettings,
    openDownloadPrompt,
    closeDownloadPrompt,
    openAbout,
    closeAbout,
    openAdminLoginDialog,
    closeAdminLoginDialog,
  }
}
