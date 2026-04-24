import React, { useState, useRef } from 'react'
import { Upload, X, File, Image, Video, Loader } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export const FileUpload = ({ onFileUploaded, onCancel }) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setProgress(percentCompleted)
        },
      })

      onFileUploaded(response.data.data)
      toast.success('File uploaded successfully')
      setSelectedFile(null)
      setPreview(null)
    } catch (err) {
      console.error('Upload error:', err)
      toast.error(err.response?.data?.message || 'Failed to upload file')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const getFileIcon = () => {
    if (!selectedFile) return <File size={24} />
    if (selectedFile.type.startsWith('image/')) return <Image size={24} />
    if (selectedFile.type.startsWith('video/')) return <Video size={24} />
    return <File size={24} />
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <Upload size={32} className="mx-auto mb-2 text-slate-400" />
          <p className="text-slate-300 font-medium">Click to select file</p>
          <p className="text-sm text-slate-400 mt-1">Max 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-16 bg-slate-600 rounded flex items-center justify-center text-slate-400">
                {getFileIcon()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null)
                setPreview(null)
              }}
              className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Uploading...</span>
                <span className="text-blue-400">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={uploading}
              className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
