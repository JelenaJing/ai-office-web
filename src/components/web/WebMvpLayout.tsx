import styled from 'styled-components'

export const MvpPage = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
  background: #f4f7fc;
`

export const MvpCard = styled.div`
  max-width: 720px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e2e8f2;
  border-radius: 12px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const MvpTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a2f47;
`

export const MvpHint = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b84a0;
  line-height: 1.5;
`

export const MvpLabel = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: #4a5f73;
`

export const MvpInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border: 1px solid #c8d8e8;
  border-radius: 8px;
  font-size: 14px;
`

export const MvpTextArea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border: 1px solid #c8d8e8;
  border-radius: 8px;
  font-size: 13px;
  min-height: 90px;
  resize: vertical;
`

export const MvpSelect = styled.select`
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #c8d8e8;
  border-radius: 8px;
  font-size: 14px;
`

export const MvpBtn = styled.button`
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid #1a5fb4;
  background: #1a5fb4;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const MvpError = styled.div`
  padding: 10px 12px;
  background: #fff0f0;
  color: #c0392b;
  border-radius: 8px;
  font-size: 13px;
`

export const MvpSuccess = styled.div`
  padding: 10px 12px;
  background: #f0fdf4;
  color: #15803d;
  border-radius: 8px;
  font-size: 13px;
`
