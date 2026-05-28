/**
 * 检查 MarkItDown 是否可用于 AI 改写模块的 Word 解析。
 *
 * Usage: npm run check:markitdown
 *
 * 安装（需 Python 环境，不会随 npm install 自动执行）:
 *   pip install 'markitdown[docx]'
 *   或: pip install 'markitdown[all]'
 *
 * 可选环境变量: MARKITDOWN_BIN（默认 markitdown）
 */

import { checkMarkitdownAvailable } from '../src/modules/document-studio/humanizeFileExtractor'

async function main(): Promise<void> {
  const result = await checkMarkitdownAvailable()
  if (result.available) {
    console.info(`OK MarkItDown 可用: ${result.bin}${result.version ? ` (${result.version})` : ''}`)
    process.exit(0)
  }
  console.error(`FAIL MarkItDown 不可用: ${result.bin}`)
  if (result.error) console.error(`  ${result.error}`)
  console.error('\n请安装: pip install \'markitdown[docx]\'')
  console.error('或设置 MARKITDOWN_BIN 指向可执行文件')
  process.exit(1)
}

void main()
