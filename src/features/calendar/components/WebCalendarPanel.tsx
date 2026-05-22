import { useCallback, useEffect, useState } from 'react'
import { platformApi } from '../../../platform'
import type { CalendarEvent } from '../../../platform'
import {
  MvpBtn, MvpCard, MvpError, MvpHint, MvpInput, MvpLabel, MvpPage, MvpTextArea, MvpTitle,
} from '../../../components/web/WebMvpLayout'
import styled from 'styled-components'

const EventRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #eef2f7;
`

export default function WebCalendarPanel() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    try {
      setEvents(await platformApi.calendar.listEvents())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const create = async () => {
    if (!title.trim() || !startAt || !endAt) {
      setError('请填写标题、开始与结束时间')
      return
    }
    setError(null)
    try {
      await platformApi.calendar.createEvent({
        title: title.trim(),
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        notes: notes.trim() || undefined,
      })
      setTitle('')
      setNotes('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    }
  }

  const remove = async (id: string) => {
    try {
      await platformApi.calendar.deleteEvent(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <MvpPage>
      <MvpCard style={{ maxWidth: 720, marginBottom: 16 }}>
        <MvpTitle>新建日程</MvpTitle>
        {error && <MvpError>{error}</MvpError>}
        <MvpLabel>标题</MvpLabel>
        <MvpInput value={title} onChange={e => setTitle(e.target.value)} />
        <MvpLabel>开始时间</MvpLabel>
        <MvpInput type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
        <MvpLabel>结束时间</MvpLabel>
        <MvpInput type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
        <MvpLabel>备注</MvpLabel>
        <MvpTextArea value={notes} onChange={e => setNotes(e.target.value)} />
        <MvpBtn onClick={() => void create()}>添加事件</MvpBtn>
        <MvpHint>数据保存在服务器，不接外部日历。</MvpHint>
      </MvpCard>
      <MvpCard style={{ maxWidth: 720 }}>
        <MvpTitle>我的日程</MvpTitle>
        {events.length === 0 && <MvpHint>暂无事件</MvpHint>}
        {events.map(ev => (
          <EventRow key={ev.id}>
            <div>
              <strong>{ev.title}</strong>
              <div style={{ fontSize: 12, color: '#6b84a0' }}>
                {new Date(ev.startAt).toLocaleString('zh-CN')} — {new Date(ev.endAt).toLocaleString('zh-CN')}
              </div>
              {ev.notes && <div style={{ fontSize: 12 }}>{ev.notes}</div>}
            </div>
            <MvpBtn style={{ background: '#c0392b', borderColor: '#c0392b' }} onClick={() => void remove(ev.id)}>
              删除
            </MvpBtn>
          </EventRow>
        ))}
      </MvpCard>
    </MvpPage>
  )
}
