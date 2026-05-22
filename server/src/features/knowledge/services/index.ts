export {
  listKnowledgeBases,
  getKnowledgeBase,
  listFiles,
  getBaseInfo,
  deleteFile,
  ingestFilesFromBuffers,
  type RemoteDepartment,
  type RemoteDocumentMeta,
  type RemoteLibraryInfo,
} from './remoteKnowledgeClient'

export {
  PRESET_DEPARTMENT_PARENTS,
  applyPresetHierarchy,
  resolveRemoteKnowledgePartitionId,
} from './presetDepartments'
