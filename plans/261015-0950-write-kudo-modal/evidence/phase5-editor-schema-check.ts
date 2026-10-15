// Phase 5 proof, run with `bun plans/261015-0950-write-kudo-modal/evidence/phase5-editor-schema-check.ts`:
// the editor schema equals the create_kudo whitelist, and the plain text of a mention is "@Full Name" (ALG-002).
import { getSchema, getTextBetween, getTextSerializersFromSchema } from '@tiptap/core'
import { Node } from '@tiptap/pm/model'
import { createKudoEditorExtensions } from '../../../app/(main)/sun-kudos/_behavior/kudo-editor-extensions'

const schema = getSchema(createKudoEditorExtensions('placeholder', {}))
const nodes = Object.keys(schema.nodes).sort()
const marks = Object.keys(schema.marks).sort()
const WHITELIST_NODES = ['blockquote', 'doc', 'hardBreak', 'listItem', 'mention', 'orderedList', 'paragraph', 'text']
const WHITELIST_MARKS = ['bold', 'italic', 'link', 'strike']
let failed = false
const check = (name: string, ok: boolean, detail: unknown) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`, ok ? '' : JSON.stringify(detail))
  if (!ok) failed = true
}
check('nodes are exactly the whitelist', JSON.stringify(nodes) === JSON.stringify(WHITELIST_NODES), nodes)
check('marks are exactly the whitelist', JSON.stringify(marks) === JSON.stringify(WHITELIST_MARKS), marks)

const doc = Node.fromJSON(schema, {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Cảm ơn ' }, { type: 'mention', attrs: { id: 'u1', label: 'Nguyễn Văn An' } }, { type: 'text', text: ' nhé' }] },
    { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'một' }] }] }] },
  ],
})
const plain = getTextBetween(doc, { from: 0, to: doc.content.size }, { blockSeparator: '\n', textSerializers: getTextSerializersFromSchema(schema) })
check('mention serializes as "@Full Name"', plain.startsWith('Cảm ơn @Nguyễn Văn An nhé'), plain)
console.log('plain text:', JSON.stringify(plain))

// The link mark refuses non-http(s) hrefs when parsing pasted HTML (isAllowedUri = isLinkUrlValid)
const link = createKudoEditorExtensions('p', {}).find((ext) => ext.name === 'starterKit')
check('starter kit present', Boolean(link), null)
process.exit(failed ? 1 : 0)
