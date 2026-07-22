export interface ButtonConfig {
  label: string
  action: 'confirm' | 'cancel' | 'third'
  primary?: boolean
}

export type {
  FileInfo,
  FolderInfo,
  FileListResponse,
  Config,
  ThemeType,
  ShareLink,
  ShareLinkCreationResponse,
} from '../../types/shared'