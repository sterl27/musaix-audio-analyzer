import { create } from 'zustand'

type UploadStatus = 'pending' | 'uploading' | 'processing' | 'success' | 'error'

export interface UploadableFile {
  id: string // Unique ID, e.g., file.name + file.size
  file: File
  status: UploadStatus
  progress: number // 0-100
  error?: string
}

interface UploadState {
  uploads: UploadableFile[]
  addUploads: (files: File[]) => void
  updateProgress: (id: string, progress: number) => void
  setStatus: (id: string, status: UploadStatus, error?: string) => void
  clearCompleted: () => void
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: [],
  addUploads: (files) =>
    set((state) => {
      const newUploads = files.map((file) => ({
        id: `${file.name}-${file.size}`,
        file,
        status: 'pending' as UploadStatus,
        progress: 0,
      }))
      return { uploads: [...state.uploads, ...newUploads] }
    }),
  updateProgress: (id, progress) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, progress, status: 'uploading' } : u
      ),
    })),
  setStatus: (id, status, error) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, status, error, progress: status === 'success' ? 100 : u.progress } : u
      ),
    })),
  clearCompleted: () =>
    set((state) => ({
      uploads: state.uploads.filter((u) => !['success', 'error'].includes(u.status)),
    })),
}))