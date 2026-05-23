import styled from 'styled-components'
import type { DocumentDraft } from '../services/documentWorkbenchApi'

const CanvasShell = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px;
  background: linear-gradient(180deg, #e8eef5 0%, #dfe7ef 100%);
`

const Paper = styled.div`
  width: min(850px, 100%);
  margin: 0 auto;
  background: #fff;
  min-height: 1100px;
  padding: 90px 88px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
  border-radius: 6px;
`

const Title = styled.h1`
  margin: 0 0 40px;
  text-align: center;
  font-size: 30px;
  line-height: 1.4;
  color: #17283a;
`

const SectionBlock = styled.section<{ $active?: boolean }>`
  padding: 14px 18px;
  border-radius: 18px;
  border: 1px solid ${({ $active }) => ($active ? '#7eaee3' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(236, 245, 255, 0.82)' : 'transparent')};
  margin-bottom: 18px;
  cursor: pointer;
`

const SectionHeading = styled.h2`
  margin: 0 0 16px;
  font-size: 22px;
  color: #173f69;
`

const Paragraph = styled.p<{ $active?: boolean }>`
  margin: 0 0 16px;
  text-indent: 2em;
  line-height: 1.95;
  font-size: 16px;
  color: #28384a;
  padding: 6px 8px;
  border-radius: 10px;
  background: ${({ $active }) => ($active ? 'rgba(255, 244, 214, 0.78)' : 'transparent')};
`

const CitationList = styled.div`
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f5f8fc;
  color: #516679;
  font-size: 12px;
  line-height: 1.7;
`

const TableWrap = styled.div`
  margin: 16px 0;
`

const TableTitle = styled.div`
  margin-bottom: 8px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #2b4d69;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    border: 1px solid #bfd0e2;
    padding: 10px 12px;
    font-size: 14px;
    color: #334a60;
  }

  th {
    background: #edf4fb;
    font-weight: 800;
  }
`

interface DocumentEditorCanvasProps {
  document: DocumentDraft | null
  selectedSectionId: string | null
  selectedParagraphKey: string | null
  onSelectSection: (sectionId: string) => void
  onSelectParagraph: (sectionId: string, paragraphIndex: number) => void
}

export function DocumentEditorCanvas({
  document,
  selectedSectionId,
  selectedParagraphKey,
  onSelectSection,
  onSelectParagraph,
}: DocumentEditorCanvasProps) {
  return (
    <CanvasShell>
      <Paper>
        {document ? (
          <>
            <Title>{document.title}</Title>
            {document.sections.map((section) => {
              const paragraphs = section.content
                .split(/\n{2,}/)
                .map((item) => item.trim())
                .filter(Boolean)
              return (
                <SectionBlock
                  key={section.id}
                  $active={selectedSectionId === section.id}
                  onClick={() => onSelectSection(section.id)}
                >
                  <SectionHeading>{section.title}</SectionHeading>
                  {paragraphs.map((paragraph, index) => {
                    const paragraphKey = `${section.id}:${index}`
                    return (
                      <Paragraph
                        key={paragraphKey}
                        $active={selectedParagraphKey === paragraphKey}
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelectSection(section.id)
                          onSelectParagraph(section.id, index)
                        }}
                      >
                        {paragraph}
                      </Paragraph>
                    )
                  })}
                  {section.tables?.map((table) => (
                    <TableWrap key={table.id}>
                      {table.title ? <TableTitle>{table.title}</TableTitle> : null}
                      <Table>
                        {table.headers.length > 0 ? (
                          <thead>
                            <tr>
                              {table.headers.map((header) => <th key={header}>{header}</th>)}
                            </tr>
                          </thead>
                        ) : null}
                        <tbody>
                          {table.rows.map((row, rowIndex) => (
                            <tr key={`${table.id}-${rowIndex}`}>
                              {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </TableWrap>
                  ))}
                  {section.citations && section.citations.length > 0 ? (
                    <CitationList>
                      {section.citations.map((citation) => (
                        <div key={citation.id}>
                          依据：{citation.label}{citation.note ? `（${citation.note}）` : ''}
                        </div>
                      ))}
                    </CitationList>
                  ) : null}
                </SectionBlock>
              )
            })}
          </>
        ) : (
          <div style={{ color: '#627789', fontSize: 14, lineHeight: 1.8 }}>
            请选择模板、知识库与附件，在底部输入文稿需求后点击“生成文稿”。
          </div>
        )}
      </Paper>
    </CanvasShell>
  )
}
