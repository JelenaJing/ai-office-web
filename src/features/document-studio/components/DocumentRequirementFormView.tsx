import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { ArrowLeft } from 'lucide-react'
import VoiceInputMicButton from '../../../components/voice/VoiceInputMicButton'
import { useMeetingSpeechInput } from '../../../hooks/useMeetingSpeechInput'
import type { DocumentTypeDef } from '../services/documentStudioApi'
import {
  FIELD_LABEL_OVERRIDES,
  FORM_FIELD_LAYOUTS,
  readCompositeValue,
  type FormFieldSpec,
} from '../services/documentTypeMeta'
import DocumentStudioStepIndicator from './DocumentStudioStepIndicator'

const Page = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
`

const Scroll = styled.div`
  flex: 1;
  overflow: auto;
`

const Inner = styled.div`
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 24px 48px;
`

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 28px 28px 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
`

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  border: none;
  background: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: #2563eb;
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
`

const Input = styled.input`
  height: 40px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
`

const TextArea = styled.textarea`
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  line-height: 1.5;
`

const Select = styled.select`
  height: 40px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
`

const VoiceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
`

const VoiceHint = styled.span`
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
`

const Actions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  padding-top: 8px;
`

const Btn = styled.button<{ $primary?: boolean }>`
  height: 42px;
  padding: 0 20px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  background: ${p => (p.$primary ? '#2563eb' : '#f1f5f9')};
  color: ${p => (p.$primary ? '#fff' : '#334155')};
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

interface Props {
  documentType: DocumentTypeDef
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  onBack: () => void
  onSubmit: () => void
  submitting?: boolean
}

function resolveLayout(documentType: DocumentTypeDef): FormFieldSpec[] {
  const custom = FORM_FIELD_LAYOUTS[documentType.id]
  if (custom) return custom
  const specs: FormFieldSpec[] = documentType.fields.map(f => ({ kind: 'field' as const, name: f.name }))
  if (!documentType.fields.some(f => f.name === 'materials')) {
    specs.push({ kind: 'materials' })
  }
  return specs
}

function fieldDef(documentType: DocumentTypeDef, name: string) {
  return documentType.fields.find(f => f.name === name)
}

export default function DocumentRequirementFormView({
  documentType,
  values,
  onChange,
  onBack,
  onSubmit,
  submitting,
}: Props) {
  const overrides = FIELD_LABEL_OVERRIDES[documentType.id] || {}
  const layout = resolveLayout(documentType)
  const [voiceStatus, setVoiceStatus] = useState('')

  const voiceTargetField = useCallback(() => {
    if (documentType.fields.some(f => f.name === 'requirements')) return 'requirements'
    if (documentType.fields.some(f => f.name === 'topic')) return 'topic'
    return 'materials'
  }, [documentType.fields])

  const voice = useMeetingSpeechInput({
    getBaseText: () => values[voiceTargetField()] || values.materials || '',
    setText: text => {
      onChange(voiceTargetField(), text)
    },
    onStatus: setVoiceStatus,
  })

  const renderField = (name: string) => {
    const field = fieldDef(documentType, name)
    if (!field) return null
    const label = overrides[name] || field.label
    return (
      <Field key={name}>
        {label}
        {field.required ? ' *' : ''}
        {field.type === 'textarea' ? (
          <TextArea
            value={values[name] || ''}
            placeholder={field.placeholder}
            onChange={e => onChange(name, e.target.value)}
          />
        ) : field.type === 'select' ? (
          <Select value={values[name] || ''} onChange={e => onChange(name, e.target.value)}>
            <option value="">请选择</option>
            {(field.options || []).map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            value={values[name] || ''}
            placeholder={field.placeholder}
            onChange={e => onChange(name, e.target.value)}
          />
        )}
      </Field>
    )
  }

  return (
    <Page>
      <DocumentStudioStepIndicator step="form" />
      <Scroll>
        <Inner>
          <BackLink type="button" onClick={onBack}>
            <ArrowLeft size={16} /> 返回选择类型
          </BackLink>
          <Card>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#0f172a' }}>{documentType.label}</h2>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
              {documentType.description || '填写以下信息后开始生成，生成完成后将进入文稿工作台。'}
            </p>
            <Form
              onSubmit={e => {
                e.preventDefault()
                if (voice.listening) void voice.stop()
                onSubmit()
              }}
            >
              <VoiceRow>
                <VoiceInputMicButton
                  listening={voice.listening}
                  supported={voice.supported}
                  disabled={submitting}
                  onClick={() => void voice.toggle()}
                />
                <VoiceHint>
                  {voiceStatus ||
                    '连接会议助手实时识别（8600）；HTTPS 下通过本站代理。识别内容写入「需求/主题」与材料区。'}
                </VoiceHint>
              </VoiceRow>
              {layout.map(spec => {
                if (spec.kind === 'field') return renderField(spec.name)
                if (spec.kind === 'composite') {
                  return (
                    <Field key={spec.valueKey}>
                      {spec.label}
                      <TextArea
                        value={readCompositeValue(spec, values)}
                        placeholder={spec.placeholder}
                        onChange={e => onChange(spec.valueKey, e.target.value)}
                      />
                    </Field>
                  )
                }
                if (spec.kind === 'materials') {
                  return (
                    <Field key="materials">
                      材料输入
                      <TextArea
                        value={values.materials || ''}
                        placeholder="可粘贴参考资料、要点、背景材料（选填）"
                        onChange={e => onChange('materials', e.target.value)}
                      />
                    </Field>
                  )
                }
                return null
              })}
              <Actions>
                <Btn type="button" onClick={onBack}>
                  返回
                </Btn>
                <Btn type="submit" $primary disabled={submitting}>
                  {submitting ? '提交中…' : '开始生成'}
                </Btn>
              </Actions>
            </Form>
          </Card>
        </Inner>
      </Scroll>
    </Page>
  )
}
