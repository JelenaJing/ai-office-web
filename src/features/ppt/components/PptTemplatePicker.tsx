import React from 'react'
import styled from 'styled-components'
import type { PptTemplateOption } from '../services/pptTemplates'

const Wrap = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

const Label = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
`

const Select = styled.select`
  height: 38px;
  min-width: 168px;
  max-width: 220px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  color: #243b53;
  font-size: 13px;
  font-weight: 700;
  outline: none;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`

interface PptTemplatePickerProps {
  value: string | null
  options: PptTemplateOption[]
  disabled?: boolean
  onChange: (templateId: string) => void
}

export default function PptTemplatePicker({
  value,
  options,
  disabled,
  onChange,
}: PptTemplatePickerProps) {
  return (
    <Wrap>
      <Label>模板</Label>
      <Select
        value={value || options[0]?.id || ''}
        disabled={disabled || options.length === 0}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </Select>
    </Wrap>
  )
}
