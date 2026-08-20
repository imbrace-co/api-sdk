import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import { visit } from 'unist-util-visit'

const isProd = process.env.NODE_ENV === 'production'
const base = isProd ? '/' : '/'

// Astro does not auto-prefix the configured `base` onto root-relative links
// in markdown content (e.g. `[Auth](/sdk/authentication/)`). Sidebar entries
// and Starlight components handle base prefixing themselves, but markdown
// links would render as `/sdk/authentication/` and 404 if the site is
// served from a sub-path. This plugin prefixes the base onto
// internal anchor hrefs.
function rehypePrefixBase() {
  const trimmedBase = base.replace(/\/$/, '')
  if (!trimmedBase) return () => () => {}
  return () => (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a' || !node.properties) return
      const href = node.properties.href
      if (typeof href !== 'string') return
      if (!href.startsWith('/') || href.startsWith('//')) return
      if (href.startsWith(trimmedBase + '/') || href === trimmedBase) return
      node.properties.href = trimmedBase + href
    })
  }
}

export default defineConfig({
  site: 'https://engineer.imbrace.co',
  base,
  markdown: {
    rehypePlugins: [rehypePrefixBase()],
  },
  integrations: [
    starlight({
      favicon: '/favicon.svg',
      title: 'Imbrace SDK',
      description: 'Official documentation for the Imbrace TypeScript and Python SDKs.',
      logo: {
        src: './src/assets/imbrace_logo.svg',
        replacesTitle: true
      },
      social: {
        github: 'https://github.com/imbraceltd/api-sdk',
      },
      defaultLocale: 'root',
      locales: {
        root:    { label: 'English',   lang: 'en' },
        vi:      { label: 'Tiếng Việt', lang: 'vi' },
        'zh-cn': { label: '简体中文',   lang: 'zh-CN' },
        'zh-tw': { label: '繁體中文',   lang: 'zh-TW' },
      },
      customCss: [
        './src/styles/custom.css',
      ],
      components: {
        Sidebar: './src/components/Sidebar.astro',
      },
      sidebar: [
        {
          label: 'Getting Started',
          translations: { vi: 'Bắt Đầu', 'zh-CN': '快速开始', 'zh-TW': '快速開始' },
          items: [
            {
              label: 'Overview',
              translations: { vi: 'Tổng Quan', 'zh-CN': '概览', 'zh-TW': '概覽' },
              link: '/getting-started/overview/',
            },
            {
              label: 'Setup Guide',
              translations: { vi: 'Hướng Dẫn Cài Đặt', 'zh-CN': '安装指南', 'zh-TW': '安裝指南' },
              link: '/getting-started/setup/',
            },
          ],
        },
        {
          label: 'Install',
          translations: { vi: 'Cài Đặt', 'zh-CN': '安装', 'zh-TW': '安裝' },
          items: [
            {
              label: 'Kubernetes',
              translations: { vi: 'Kubernetes', 'zh-CN': 'Kubernetes', 'zh-TW': 'Kubernetes' },
              link: '/install/kubernetes/',
            },
          ],
        },
        {
          label: 'MCP Server',
          translations: { vi: 'MCP Server', 'zh-CN': 'MCP 服务器', 'zh-TW': 'MCP 伺服器' },
          items: [
            {
              label: 'Overview',
              translations: { vi: 'Tổng Quan', 'zh-CN': '概览', 'zh-TW': '概覽' },
              link: '/mcp/overview/',
            },
          ],
        },
        {
          label: 'CLI',
          translations: { vi: 'CLI' },
          items: [
            { label: 'Overview',        link: '/cli/overview/' },
            { label: 'Installation',    link: '/cli/installation/' },
            { label: 'Commands',        link: '/cli/commands/' },
            { label: 'API Reference',   link: '/cli/api-reference/' },
          ],
        },
        {
          label: 'SDK',
          translations: { vi: 'SDK', 'zh-CN': 'SDK', 'zh-TW': 'SDK' },
          items: [
            { label: 'Overview',        translations: { vi: 'Tổng Quan',             'zh-CN': '概览',       'zh-TW': '概覽'       }, link: '/sdk/overview/' },
            { label: 'Installation',    translations: { vi: 'Cài Đặt',               'zh-CN': '安装',       'zh-TW': '安裝'       }, link: '/sdk/installation/' },
            { label: 'Quick Start',     translations: { vi: 'Bắt Đầu Nhanh',         'zh-CN': '快速开始',   'zh-TW': '快速開始'   }, link: '/sdk/quick-start/' },
            { label: 'Authentication',  translations: { vi: 'Xác Thực',              'zh-CN': '身份验证',   'zh-TW': '身份驗證'   }, link: '/sdk/authentication/' },
            { label: 'Full Flow Guide', translations: { vi: 'Hướng Dẫn Toàn Bộ',    'zh-CN': '完整流程指南', 'zh-TW': '完整流程指南' }, link: '/sdk/full-flow-guide/' },
            { label: 'Resources',       translations: { vi: 'Tài Nguyên',            'zh-CN': '资源参考',   'zh-TW': '資源參考'   }, link: '/sdk/resources/' },
            { label: 'AI Agent',        link: '/sdk/ai-agent/' },
            { label: 'Workflows',       link: '/sdk/workflows/' },
            { label: 'DataBoards',      link: '/sdk/databoard/' },
            { label: 'Document AI',     link: '/sdk/document-ai/' },
            { label: 'Error Handling',  translations: { vi: 'Xử Lý Lỗi',            'zh-CN': '错误处理',   'zh-TW': '錯誤處理'   }, link: '/sdk/error-handling/' },
            { label: 'Integrations',    translations: { vi: 'Tích Hợp',             'zh-CN': '集成',       'zh-TW': '整合'       }, link: '/sdk/integrations/' },
            { label: 'Local Testing',   translations: { vi: 'Kiểm Thử Cục Bộ',      'zh-CN': '本地测试',   'zh-TW': '本地測試'   }, link: '/sdk/local-testing/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'AI Agent',      link: '/reference/ai-agent/' },
            { label: 'Workflow',      link: '/reference/workflow/' },
            { label: 'Board',         link: '/reference/board/' },
            { label: 'Campaign',      link: '/reference/campaign/' },
            { label: 'Communication', link: '/reference/communication/' },
            { label: 'Channel',       link: '/reference/channel/' },
            { label: 'Conversation',  link: '/reference/conversation/' },
            { label: 'Contact',       link: '/reference/contact/' },
          ],
        },
        {
          label: 'Guides',
          translations: { vi: 'Hướng Dẫn', 'zh-CN': '指南', 'zh-TW': '指南' },
          items: [
            {
              label: 'Getting an API Key',
              translations: { vi: 'Lấy API Key', 'zh-CN': '获取 API Key', 'zh-TW': '取得 API Key' },
              link: '/guides/api-key/',
            },
            {
              label: 'Vibe Coding',
              translations: { vi: 'Vibe Coding', 'zh-CN': 'Vibe Coding', 'zh-TW': 'Vibe Coding' },
              link: '/guides/vibe-coding/',
            },
            {
              label: 'Testing Guide',
              translations: { vi: 'Hướng Dẫn Test', 'zh-CN': '测试指南', 'zh-TW': '測試指南' },
              link: '/guides/testing/',
            },
            {
              label: 'Troubleshooting',
              translations: { vi: 'Lỗi Thường Gặp', 'zh-CN': '常见问题', 'zh-TW': '常見問題' },
              link: '/guides/troubleshooting/',
            },
          ],
        },
      ],
      lastUpdated: true,
      expressiveCode: {
        langs: ['env'],
      },
    }),
  ],
})
