import styled from 'styled-components'
import type { DocumentTypeDef } from '../services/documentStudioApi'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 640px;
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #334155;
`

const Input = styled.input`
  height: 38px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
`

const TextArea = styled.textarea`
  min-height: 88px;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  resize: vertical;
`

const Select = styled.select`
  height: 38px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
`

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
`

const Btn = styled.button<{ $primary?: boolean }>`
  height: 40px;
  padding: 0 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  background: ${p => (p.$primary ? '#2563eb' : '#e2e8f0')};
  color: ${p => (p.$primary ? '#fff' : '#334155')};
`

interface Props {
  documentType: DocumentTypeDef
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  onBack: () => void
  onSubmit: () => void
  submitting?: boolean
}

export default function DocumentRequestForm({ documentType, values, onChange, onBack, onSubmit, submitting }: Props) {
  return (
    <Form
      onSubmit={e => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <h2>{documentType.label}</h2>
      <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{documentType.description}</p>
      {documentType.fields.map(field => (
        <Field key={field.name}>
          {field.label}
          {field.required ? ' *' : ''}
          {field.type === 'textarea' ? (
            <TextArea
              value={values[field.name] || ''}
              placeholder={field.placeholder}
              onChange={e => onChange(field.name, e.target.value)}
            />
          ) : field.type === 'select' ? (
            <Select value={values[field.name] || ''} onChange={e => onChange(field.name, e.target.value)}>
              <option value="">请选择</option>
              {(field.options || []).map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              value={values[field.name] || ''}
              placeholder={field.placeholder}
              onChange={e => onChange(field.name, e.target.value)}
            />
          )}
        </Field>
      ))}
      <Actions>
        <Btn type="button" onClick={onBack}>
          上一步
        </Btn>
        <Btn type="submit" $primary disabled={submitting}>
          {submitting ? '提交中…' : '开始生成'}
        </Btn>
      </Actions>
    </Form>
  )
}
