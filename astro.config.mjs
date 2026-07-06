/**
 * Astro 配置文件
 * 此文件用于配置 Firefly 博客主题的构建和运行参数
 * 包含集成插件、Markdown 处理、Vite 配置等核心设置
 */

// 导入 Node.js 事件模块，用于调整监听器限制
import { setMaxListeners } from "node:events";

// ==================== 第三方集成插件 ====================
// Astro 官方集成
import { unified } from "@astrojs/markdown-remark"; // Markdown 处理器
import sitemap from "@astrojs/sitemap";             // 站点地图生成
import svelte from "@astrojs/svelte";               // Svelte 组件支持
import cloudflare from "@astrojs/cloudflare";       // Cloudflare 适配器
import mdx from "@astrojs/mdx";                     // MDX 支持

// 代码高亮与展示
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections"; // 可折叠代码块
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";                 // 行号显示
import expressiveCode from "astro-expressive-code"; // 代码展示增强

// UI 与动画
import swup from "@swup/astro";           // 页面过渡动画
import icon from "astro-icon";            // 图标组件
import tailwindcss from "@tailwindcss/vite"; // Tailwind CSS

// 数学公式支持
import katex from "katex";
import rehypeKatex from "rehype-katex";
import "katex/dist/contrib/mhchem.mjs"; // 加载 mhchem 扩展（化学公式）

// ==================== Markdown 处理插件 ====================
// rehype 插件（HTML 转换阶段）
import rehypeAutolinkHeadings from "rehype-autolink-headings"; // 标题锚点
import rehypeComponents from "rehype-components";               // 自定义组件渲染
import rehypeCallouts from "rehype-callouts";                   // 提醒框
import rehypeSlug from "rehype-slug";                           // 生成标题 ID
import remarkAdmonitionToBlockquoteCallout from "remark-admonition-to-blockquote-callout"; // 兼容 admonition 语法
import remarkDirective from "remark-directive";                 // 指令处理
import remarkMath from "remark-math";                           // 数学公式标记
import remarkSectionize from "remark-sectionize";               // 自动分段

// ==================== 自定义插件导入 ====================
import { expressiveCodeConfig, fontConfig, fontsList, plantumlConfig, siteConfig } from "./src/config";
import { collectUsedFontCssVars } from "./src/utils/fontHelper";
import I18nKey from "./src/i18n/i18nKey";
import { i18n } from "./src/i18n/translation";
import { fontProviders } from "astro/config";

// 自定义 rehype/remark 插件
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import rehypeEmailProtection from "./src/plugins/rehype-email-protection.mjs";
import rehypeExternalLinks from "./src/plugins/rehype-external-links.mjs";
import rehypeFigure from "./src/plugins/rehype-figure.mjs";
import { rehypeMermaid } from "./src/plugins/rehype-mermaid.mjs";
import { rehypePlantuml } from "./src/plugins/rehype-plantuml.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkImageGrid } from "./src/plugins/remark-image-grid.js";
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";
import { remarkPlantuml } from "./src/plugins/remark-plantuml.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";

// 可折叠代码和语言徽章插件
import { pluginCollapsible } from "expressive-code-collapsible";
import { pluginLanguageBadge } from "expressive-code-language-badge";

// ==================== 开发环境配置 ====================
// 开发模式下增加事件监听器限制，避免警告
if (process.env.NODE_ENV === "development") {
	setMaxListeners(20);
}

// ==================== 部署适配器配置 ====================
// 根据环境变量选择 Cloudflare Workers 适配器或保持默认
const adapter = process.env.CF_WORKERS
	? cloudflare({
			prerenderEnvironment: "node", // 使用 Node.js 环境进行预渲染
	  })
	: undefined;

// ==================== Astro 主配置 ====================
export default defineConfig({
	// 站点基础配置
	site: siteConfig.site_url,      // 站点 URL
	base: "/",                      // 基础路径
	trailingSlash: "always",        // 始终添加尾部斜杠

	// ==================== 字体配置 ====================
	// 动态加载字体，只加载实际使用的字体以加快构建
	fonts: (() => {
		// 禁用字体功能时返回空数组
		if (!fontConfig.enable) return [];

		// 收集使用的字体 CSS 变量
		const used = collectUsedFontCssVars(fontConfig);
		return fontsList
			.filter((f) => used.has(f.cssVariable))
			.map((f) => {
				// 根据字体提供者选择对应的字体服务
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

	// ==================== 图像优化配置 ====================
	image: {
		layout: "constrained", // 全局响应式布局
	},

	// ==================== 集成插件配置 ====================
	integrations: [
		// Swup 页面过渡动画
		swup({
			theme: false,
			animationClass: "transition-swup-", // 动画类前缀，避免与 Tailwind 冲突
			containers: [                       // 需要过渡的容器
				"#banner-overlay-container",
				"#banner-dim-container",
				"#swup-container",
				"#left-sidebar-dynamic",
				"#right-sidebar-dynamic",
				"#floating-toc-wrapper",
			],
			smoothScrolling: false,   // 禁用平滑滚动（使用原生）
			cache: true,              // 启用页面缓存
			preload: true,            // 预加载页面
			accessibility: true,      // 保持无障碍支持
			updateHead: true,         // 更新 head 内容
			updateBodyClass: false,   // 不更新 body 类
			globalInstance: true,     // 全局实例
			resolveUrl: (url) => url, // URL 解析
			animateHistoryBrowsing: false, // 禁用历史浏览动画
			skipPopStateHandling: (event) => {
				// 跳过锚点链接处理，让浏览器原生处理
				return event.state?.url?.includes("#");
			},
		}),

		// 图标集成
		icon({
			include: {
				"material-symbols": ["*"], // Material Design 图标
				"fa7-brands": ["*"],       // Font Awesome 品牌图标
				"fa7-regular": ["*"],      // Font Awesome 常规图标
				"fa7-solid": ["*"],        // Font Awesome 实心图标
				"simple-icons": ["*"],     // 品牌简化图标
				mdi: ["*"],                // Material Design Icons
				mingcute: ["*"],           // 萌宠图标
			},
		}),

		// 代码展示增强
		expressiveCode({
			themes: [expressiveCodeConfig.darkTheme, expressiveCodeConfig.lightTheme],
			useDarkModeMediaQuery: false,
			themeCssSelector: (theme) => `[data-theme='${theme.name}']`,
			plugins: [
				// 语言徽章插件（根据配置决定是否启用）
				...(expressiveCodeConfig.pluginLanguageBadge?.enable === true
					? [pluginLanguageBadge()]
					: []),
				pluginCollapsibleSections(), // 可折叠代码段
				pluginLineNumbers(),        // 行号显示
				// 可折叠代码块插件
				...(expressiveCodeConfig.pluginCollapsible?.enable === true
					? [
							pluginCollapsible({
								lineThreshold: expressiveCodeConfig.pluginCollapsible.lineThreshold || 15,
								previewLines: expressiveCodeConfig.pluginCollapsible.previewLines || 8,
								defaultCollapsed: expressiveCodeConfig.pluginCollapsible.defaultCollapsed ?? true,
								expandButtonText: i18n(I18nKey.codeCollapsibleShowMore),
								collapseButtonText: i18n(I18nKey.codeCollapsibleShowLess),
								expandedAnnouncement: i18n(I18nKey.codeCollapsibleExpanded),
								collapsedAnnouncement: i18n(I18nKey.codeCollapsibleCollapsed),
							}),
					  ]
					: []),
			],
			defaultProps: {
				wrap: false, // 不换行
				overridesByLang: {
					shellsession: { showLineNumbers: false }, // shell 会话不显示行号
				},
			},
			styleOverrides: {
				borderRadius: "0.75rem",
				codeFontSize: "0.875rem",
				codeFontFamily: "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
				codeLineHeight: "1.5rem",
				frames: {},
				textMarkers: {
					delHue: 0,    // 删除线颜色
					insHue: 180,  // 插入线颜色
					markHue: 250, // 标记颜色
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
				showCopyToClipboardButton: true, // 显示复制按钮
			},
		}),

		// Svelte 组件支持
		svelte(),

		// 站点地图生成（根据配置过滤页面）
		sitemap({
			filter: (page) => {
				const url = new URL(page);
				const pathname = url.pathname;

				// 根据 siteConfig 中的页面开关过滤
				if (pathname === "/friends/" && !siteConfig.pages.friends) return false;
				if (pathname === "/sponsor/" && !siteConfig.pages.sponsor) return false;
				if (pathname === "/guestbook/" && !siteConfig.pages.guestbook) return false;
				if (pathname === "/bangumi/" && !siteConfig.pages.bangumi) return false;
				if (pathname === "/gallery/" && !siteConfig.pages.gallery) return false;
				if (pathname === "/anime/" && !siteConfig.pages.anime) return false;

				return true;
			},
		}),

		// MDX 支持
		mdx(),
	],

	// ==================== Markdown 处理配置 ====================
	markdown: {
		processor: unified({
			// Remark 插件（Markdown -> MDAST）
			remarkPlugins: [
				// 兼容 Python-Markdown 风格的 admonition 语法
				...(siteConfig.post.rehypeCallouts.enablePythonMarkdownAdmonitions !== false
					? [remarkAdmonitionToBlockquoteCallout]
					: []),
				remarkMath,          // 数学公式支持
				remarkReadingTime,   // 阅读时间计算
				remarkImageGrid,     // 图片网格布局
				remarkExcerpt,       // 提取文章摘要
				remarkDirective,     // 指令处理
				remarkSectionize,    // 自动分段
				parseDirectiveNode,  // 解析指令节点
				remarkMermaid,       // Mermaid 图表
				[remarkPlantuml, plantumlConfig], // PlantUML 图表
			],
			// Rehype 插件（MDAST -> HTML）
			rehypePlugins: [
				[rehypeKatex, { katex }],                           // KaTeX 数学公式渲染
				[rehypeCallouts, { theme: siteConfig.post.rehypeCallouts.theme }], // 提醒框
				rehypeSlug,                                         // 生成标题 ID
				rehypeMermaid,                                      // Mermaid 图表渲染
				rehypePlantuml,                                     // PlantUML 图表渲染
				rehypeFigure,                                       // 图片包裹为 figure 元素
				[rehypeExternalLinks, { siteUrl: siteConfig.site_url }], // 外部链接处理
				[rehypeEmailProtection, { method: "base64" }],      // 邮箱地址保护
				[
					rehypeComponents,
					{
						components: {
							github: GithubCardComponent, // GitHub 仓库卡片组件
						},
					},
				],
				[
					rehypeAutolinkHeadings, // 标题锚点链接
					{
						behavior: "append",
						properties: { className: ["anchor"] },
						content: {
							type: "element",
							tagName: "span",
							properties: { className: ["anchor-icon"], "data-pagefind-ignore": true },
							children: [{ type: "text", value: "#" }],
						},
					},
				],
			],
		}),
	},

	// ==================== Vite 配置 ====================
	vite: {
		plugins: [tailwindcss()], // Tailwind CSS 插件
		server: {
			watch: {
				ignored: ["**/package/**", "**/Firefly-docs/**"], // 忽略监控目录
			},
		},
		resolve: {
			alias: {
				// 动态别名：根据配置选择 rehype-callouts 主题
				"@rehype-callouts-theme": `rehype-callouts/theme/${siteConfig.post.rehypeCallouts.theme}`,
			},
		},
		build: {
			minify: "esbuild", // 使用 esbuild 压缩
			esbuildOptions: {
				minify: true,
				drop: ["debugger"],                    // 删除 debugger 语句
				pure: ["console.log", "console.debug"], // 标记为纯函数（可能被移除）
			},
			rollupOptions: {
				onwarn(warning, warn) {
					// 忽略动态导入和静态导入混合的警告
					if (
						warning.message.includes("is dynamically imported by") &&
						warning.message.includes("but also statically imported by")
					) {
						return;
					}
					warn(warning);
				},
			},
			cssCodeSplit: true,   // CSS 代码分割
			cssMinify: "esbuild", // CSS 压缩
			assetsInlineLimit: 4096, // 小于 4KB 的资源内联
		},
	},
});