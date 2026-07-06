/**
 * Astro 配置文件 - Firefly 博客主题
 * 文档参考: https://docs.astro.build/zh-cn/reference/configuration-reference/
 */

// 基础模块 - 调整 Node.js 事件监听器限制，防止开发环境警告
import { setMaxListeners } from "node:events";

// Astro 官方插件 - Markdown 处理器核心
import { unified } from "@astrojs/markdown-remark";
// Astro 官方插件 - 站点地图生成器
import sitemap from "@astrojs/sitemap";
// Astro 官方插件 - Svelte 组件支持
import svelte from "@astrojs/svelte";

// 代码展示插件 - 可折叠代码段
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
// 代码展示插件 - 行号显示
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";

// UI 与样式插件 - 页面过渡动画
import swup from "@swup/astro";
// UI 与样式插件 - Tailwind CSS
import tailwindcss from "@tailwindcss/vite";
// Astro 官方插件 - 配置定义函数
import { defineConfig } from "astro/config";

// 代码展示插件 - 代码展示主插件
import expressiveCode from "astro-expressive-code";
// UI 与样式插件 - 图标组件
import icon from "astro-icon";

// 数学公式支持 - KaTeX 渲染库
import katex from "katex";

// Markdown 处理插件 - 标题锚点链接
import rehypeAutolinkHeadings from "rehype-autolink-headings";
// Markdown 处理插件 - 自定义组件渲染
import rehypeComponents from "rehype-components"; /* Render the custom directive content */
// Markdown 处理插件 - KaTeX rehype 插件
import rehypeKatex from "rehype-katex";
// 数学公式支持 - mhchem 化学公式扩展
import "katex/dist/contrib/mhchem.mjs"; // 加载 mhchem 扩展

// Astro 官方插件 - Cloudflare Workers 适配器
import cloudflare from "@astrojs/cloudflare";
// Astro 官方插件 - MDX 支持
import mdx from "@astrojs/mdx";

// 代码展示插件 - 可折叠代码块
import { pluginCollapsible } from "expressive-code-collapsible"; /* Collapsible */
// 代码展示插件 - 语言徽章
import { pluginLanguageBadge } from "expressive-code-language-badge"; /* Language Badge */

// Markdown 处理插件 - 提醒框组件
import rehypeCallouts from "rehype-callouts";
// Markdown 处理插件 - 生成标题 ID
import rehypeSlug from "rehype-slug";
// Markdown 处理插件 - admonition 语法兼容
import remarkAdmonitionToBlockquoteCallout from "remark-admonition-to-blockquote-callout";
// Markdown 处理插件 - 指令处理
import remarkDirective from "remark-directive"; /* Handle directives */
// Markdown 处理插件 - 数学公式标记
import remarkMath from "remark-math";
// Markdown 处理插件 - 自动分段
import remarkSectionize from "remark-sectionize";

// 自定义配置 - 配置文件导入
import { expressiveCodeConfig, fontConfig, fontsList, plantumlConfig, siteConfig } from "./src/config";
// 自定义工具 - 字体工具函数
import { collectUsedFontCssVars } from "./src/utils/fontHelper";
// 国际化配置
import I18nKey from "./src/i18n/i18nKey";
import { i18n } from "./src/i18n/translation";
// Astro 官方插件 - 字体提供者
import { fontProviders } from "astro/config";

// 自定义 rehype 插件 - GitHub 卡片组件
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
// 自定义 rehype 插件 - 邮箱保护
import rehypeEmailProtection from "./src/plugins/rehype-email-protection.mjs";
// 自定义 rehype 插件 - 外部链接处理
import rehypeExternalLinks from "./src/plugins/rehype-external-links.mjs";
// 自定义 rehype 插件 - 图片包裹为 figure
import rehypeFigure from "./src/plugins/rehype-figure.mjs";
// 自定义 rehype 插件 - Mermaid 图表渲染
import { rehypeMermaid } from "./src/plugins/rehype-mermaid.mjs";
// 自定义 rehype 插件 - PlantUML 图表渲染
import { rehypePlantuml } from "./src/plugins/rehype-plantuml.mjs";

// 自定义 remark 插件 - 解析指令节点
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
// 自定义 remark 插件 - 提取文章摘要
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
// 自定义 remark 插件 - 图片网格布局
import { remarkImageGrid } from "./src/plugins/remark-image-grid.js";
// 自定义 remark 插件 - Mermaid 图表标记
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";
// 自定义 remark 插件 - PlantUML 图表标记
import { remarkPlantuml } from "./src/plugins/remark-plantuml.js";
// 自定义 remark 插件 - 阅读时间计算
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";

// 开发环境配置 - 开发模式下增加事件监听器限制，避免警告
if (process.env.NODE_ENV === "development") {
	setMaxListeners(20);
}

// ==================== 部署适配器配置 ====================
// 根据环境变量选择 Cloudflare Workers 适配器或默认静态部署
const adapter = process.env.CF_WORKERS
	? cloudflare({
			prerenderEnvironment: "node", // 使用 Node.js 环境预渲染
		})
	: undefined;

// ==================== Astro 主配置 ====================
// https://astro.build/config
export default defineConfig({
	// 站点基础配置
	site: siteConfig.site_url,      // 站点 URL
	base: "/",                      // 基础路径
	trailingSlash: "always",        // 始终添加尾部斜杠

	// 字体配置 - 只加载实际使用的字体，跳过未引用的以加快构建
	fonts: (() => {
		// 禁用字体功能时直接返回空数组，跳过 Astro Font API 集成
		if (!fontConfig.enable) return [];

		const used = collectUsedFontCssVars(fontConfig);
		return fontsList
			.filter((f) => used.has(f.cssVariable))
			.map((f) => {
				let provider;
				switch (f.provider) {
					case "google": provider = fontProviders.google(); break;
					case "fontsource": provider = fontProviders.fontsource(); break;
					case "local": provider = fontProviders.local(); break;
					case "bunny": provider = fontProviders.bunny(); break;
					case "fontshare": provider = fontProviders.fontshare(); break;
					case "npm": provider = fontProviders.npm(); break;
					default: provider = f.provider;
				}
				return { ...f, provider };
			});
	})(),

	// 部署适配器
	adapter,

	// 图像优化配置
	image: {
		layout: "constrained", // 全局响应式布局
	},

	// 集成插件配置
	integrations: [
		// Swup - 页面过渡动画
		swup({
			theme: false,
			animationClass: "transition-swup-", // see https://swup.js.org/options/#animationselector
			// the default value `transition-` cause transition delay
			// when the Tailwind class `transition-all` is used
			containers: [
				"#banner-overlay-container",
				"#banner-dim-container",
				"#swup-container",
				"#left-sidebar-dynamic",
				"#right-sidebar-dynamic",
				"#floating-toc-wrapper",
			],
			smoothScrolling: false,
			cache: true,
			preload: true,
			accessibility: true,
			updateHead: true,
			updateBodyClass: false,
			globalInstance: true,
			// 滚动相关配置优化
			resolveUrl: (url) => url,
			animateHistoryBrowsing: false,
			skipPopStateHandling: (event) => {
				// 跳过锚点链接的处理，让浏览器原生处理
				return event.state?.url?.includes("#");
			},
		}),
		// Iconify - 图标组件，支持多种图标库
		icon({
			include: {
				"material-symbols": ["*"], // Material Design 图标
				"fa7-brands": ["*"],      // Font Awesome 品牌图标
				"fa7-regular": ["*"],     // Font Awesome 常规图标
				"fa7-solid": ["*"],       // Font Awesome 实心图标
				"simple-icons": ["*"],    // 品牌简化图标
				mdi: ["*"],               // Material Design Icons
				mingcute: ["*"],          // 萌宠图标
			},
		}),
		// Expressive Code - 代码展示增强
		expressiveCode({
			themes: [expressiveCodeConfig.darkTheme, expressiveCodeConfig.lightTheme],
			useDarkModeMediaQuery: false,
			themeCssSelector: (theme) => `[data-theme='${theme.name}']`,
			plugins: [
				// pluginLanguageBadge 配置 - 从expressiveCodeConfig读取设置
				...(expressiveCodeConfig.pluginLanguageBadge?.enable === true
					? [pluginLanguageBadge()]
					: []),
				pluginCollapsibleSections(),
				pluginLineNumbers(),
				// pluginCollapsible 配置 - 从expressiveCodeConfig读取设置，使用i18n文本
				...(expressiveCodeConfig.pluginCollapsible?.enable === true
					? [
							pluginCollapsible({
								lineThreshold:
									expressiveCodeConfig.pluginCollapsible.lineThreshold || 15,
								previewLines:
									expressiveCodeConfig.pluginCollapsible.previewLines || 8,
								defaultCollapsed:
									expressiveCodeConfig.pluginCollapsible.defaultCollapsed ??
									true,
								expandButtonText: i18n(I18nKey.codeCollapsibleShowMore),
								collapseButtonText: i18n(I18nKey.codeCollapsibleShowLess),
								expandedAnnouncement: i18n(I18nKey.codeCollapsibleExpanded),
								collapsedAnnouncement: i18n(I18nKey.codeCollapsibleCollapsed),
							}),
						]
					: []),
			],
			defaultProps: {
				wrap: false,
				overridesByLang: {
					shellsession: {
						showLineNumbers: false,
					},
				},
			},
			styleOverrides: {
				borderRadius: "0.75rem",
				codeFontSize: "0.875rem",
				codeFontFamily:
					"var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
				codeLineHeight: "1.5rem",
				frames: {},
				textMarkers: {
					delHue: 0,
					insHue: 180,
					markHue: 250,
				},
				languageBadge: {
					fontSize: "0.75rem",
					fontWeight: "bold",
					borderRadius: "0.25rem",
					opacity: "1",
					borderWidth: "0px",
					borderColor: "transparent",
				},
			},
			frames: {
				showCopyToClipboardButton: true,
			},
		}),
		// Svelte - Svelte 组件支持
		svelte(),
		// Sitemap - 站点地图生成，根据配置过滤页面
		sitemap({
			filter: (page) => {
				// 根据页面开关配置过滤sitemap
				const url = new URL(page);
				const pathname = url.pathname;

				if (pathname === "/friends/" && !siteConfig.pages.friends) {
					return false;
				}
				if (pathname === "/sponsor/" && !siteConfig.pages.sponsor) {
					return false;
				}
				if (pathname === "/guestbook/" && !siteConfig.pages.guestbook) {
					return false;
				}
				if (pathname === "/bangumi/" && !siteConfig.pages.bangumi) {
					return false;
				}
				if (pathname === "/gallery/" && !siteConfig.pages.gallery) {
					return false;
				}
				if (pathname === "/anime/" && !siteConfig.pages.anime) {
					return false;
				}

				return true;
			},
		}),
		// MDX - MDX 支持
		mdx(),
	],

	// Markdown 处理配置
	markdown: {
		processor: unified({
			// remarkPlugins: Markdown -> MDAST 阶段处理
			remarkPlugins: [
				// 兼容 Python-Markdown admonition 语法
				...(siteConfig.post.rehypeCallouts.enablePythonMarkdownAdmonitions !== false
					? [remarkAdmonitionToBlockquoteCallout]
					: []),
				remarkMath,           // 数学公式标记
				remarkReadingTime,    // 阅读时间计算
				remarkImageGrid,      // 图片网格布局
				remarkExcerpt,        // 提取文章摘要
				remarkDirective,      // 指令处理
				remarkSectionize,     // 自动分段
				parseDirectiveNode,   // 解析指令节点
				remarkMermaid,        // Mermaid 图表标记
				[remarkPlantuml, plantumlConfig], // PlantUML 图表标记
			],
			// rehypePlugins: MDAST -> HTML 阶段处理
			rehypePlugins: [
				[rehypeKatex, { katex }],                           // KaTeX 数学公式渲染
				[rehypeCallouts, { theme: siteConfig.post.rehypeCallouts.theme }], // 提醒框组件
				rehypeSlug,                                         // 生成标题 ID
				rehypeMermaid,                                      // Mermaid 图表渲染
				rehypePlantuml,                                     // PlantUML 图表渲染
				rehypeFigure,                                       // 图片包裹为 figure
				[rehypeExternalLinks, { siteUrl: siteConfig.site_url }], // 外部链接处理
				[rehypeEmailProtection, { method: "base64" }],       // 邮箱保护（base64/rot13）
				[
					rehypeComponents,
					{
						components: {
							github: GithubCardComponent,
						},
					},
				],
				[
					rehypeAutolinkHeadings,
					{
						behavior: "append",
						properties: {
							className: ["anchor"],
						},
						content: {
							type: "element",
							tagName: "span",
							properties: {
								className: ["anchor-icon"],
								"data-pagefind-ignore": true,
							},
							children: [
								{
									type: "text",
									value: "#",
								},
							],
						},
					},
				],
			],
		}),
	},
	// Vite 构建配置
	vite: {
		plugins: [tailwindcss()], // Tailwind CSS 插件
		server: {
			watch: {
				ignored: ["**/package/**", "**/Firefly-docs/**"], // 忽略监听的目录
			},
		},
		resolve: {
			alias: {
				"@rehype-callouts-theme": `rehype-callouts/theme/${siteConfig.post.rehypeCallouts.theme}`, // 动态主题别名
			},
		},
		build: {
			minify: "esbuild",
			esbuildOptions: {
				minify: true,
				// 删除 debugger 语句；console.log / console.debug 无副作用，未使用返回值时会被 dead code elimination 移除，
				// console.warn / console.error 保留，确保生产环境出错时仍有日志可查
				drop: ["debugger"],
				pure: ["console.log", "console.debug"],
			},
			rollupOptions: {
				onwarn(warning, warn) {
					// temporarily suppress this warning
					if (
						warning.message.includes("is dynamically imported by") &&
						warning.message.includes("but also statically imported by")
					) {
						return;
					}
					warn(warning);
				},
			},
			// CSS 优化
			cssCodeSplit: true,
			cssMinify: "esbuild",
			assetsInlineLimit: 4096,
		},
	},
});