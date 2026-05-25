export {
  listKnowledgeBases,
  getKnowledgeBase,
  listFiles,
  getBaseInfo,
  deleteFile,
  ingestFilesFromBuffers,
  qaSearch,
  type RemoteDepartment,
  type RemoteDocumentMeta,
  type RemoteLibraryInfo,
  type RemoteRetrievalHit,
} from './remoteKnowledgeClient'

export {
  PRESET_DEPARTMENT_PARENTS,
  applyPresetHierarchy,
  resolveRemoteKnowledgePartitionId,
} from './presetDepartments'

export {
  listRemoteKnowledgeSources,
  resolveRemoteKnowledgeSource,
  searchRemoteKnowledgeChunks,
} from './remoteKnowledgeSearchClient'

export {
  listWorkspaceKnowledgeSources,
} from './knowledgeSearchService'
