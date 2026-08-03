declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"docs": {
"cli/api-reference.mdx": {
	id: "cli/api-reference.mdx";
  slug: "cli/api-reference";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"cli/commands.mdx": {
	id: "cli/commands.mdx";
  slug: "cli/commands";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"cli/installation.mdx": {
	id: "cli/installation.mdx";
  slug: "cli/installation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"cli/overview.mdx": {
	id: "cli/overview.mdx";
  slug: "cli/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"getting-started/overview.mdx": {
	id: "getting-started/overview.mdx";
  slug: "getting-started/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"getting-started/setup.mdx": {
	id: "getting-started/setup.mdx";
  slug: "getting-started/setup";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"guides/api-key.mdx": {
	id: "guides/api-key.mdx";
  slug: "guides/api-key";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"guides/testing.mdx": {
	id: "guides/testing.mdx";
  slug: "guides/testing";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"guides/troubleshooting.mdx": {
	id: "guides/troubleshooting.mdx";
  slug: "guides/troubleshooting";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"guides/vibe-coding.mdx": {
	id: "guides/vibe-coding.mdx";
  slug: "guides/vibe-coding";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"index.mdx": {
	id: "index.mdx";
  slug: "index";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"reference/ai-agent.mdx": {
	id: "reference/ai-agent.mdx";
  slug: "reference/ai-agent";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"reference/board.mdx": {
	id: "reference/board.mdx";
  slug: "reference/board";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"reference/campaign.mdx": {
	id: "reference/campaign.mdx";
  slug: "reference/campaign";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"reference/channel.mdx": {
	id: "reference/channel.mdx";
  slug: "reference/channel";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"reference/communication.mdx": {
	id: "reference/communication.mdx";
  slug: "reference/communication";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"reference/contact.mdx": {
	id: "reference/contact.mdx";
  slug: "reference/contact";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"reference/conversation.mdx": {
	id: "reference/conversation.mdx";
  slug: "reference/conversation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"reference/workflow.mdx": {
	id: "reference/workflow.mdx";
  slug: "reference/workflow";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/ai-agent.mdx": {
	id: "sdk/ai-agent.mdx";
  slug: "sdk/ai-agent";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/authentication.mdx": {
	id: "sdk/authentication.mdx";
  slug: "sdk/authentication";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/databoard.mdx": {
	id: "sdk/databoard.mdx";
  slug: "sdk/databoard";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/document-ai.mdx": {
	id: "sdk/document-ai.mdx";
  slug: "sdk/document-ai";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/error-handling.mdx": {
	id: "sdk/error-handling.mdx";
  slug: "sdk/error-handling";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/full-flow-guide.mdx": {
	id: "sdk/full-flow-guide.mdx";
  slug: "sdk/full-flow-guide";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/installation.mdx": {
	id: "sdk/installation.mdx";
  slug: "sdk/installation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/integrations.mdx": {
	id: "sdk/integrations.mdx";
  slug: "sdk/integrations";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/local-testing.mdx": {
	id: "sdk/local-testing.mdx";
  slug: "sdk/local-testing";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/overview.mdx": {
	id: "sdk/overview.mdx";
  slug: "sdk/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/quick-start.mdx": {
	id: "sdk/quick-start.mdx";
  slug: "sdk/quick-start";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/resources.mdx": {
	id: "sdk/resources.mdx";
  slug: "sdk/resources";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"sdk/workflows.mdx": {
	id: "sdk/workflows.mdx";
  slug: "sdk/workflows";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/cli/api-reference.mdx": {
	id: "vi/cli/api-reference.mdx";
  slug: "vi/cli/api-reference";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/cli/commands.mdx": {
	id: "vi/cli/commands.mdx";
  slug: "vi/cli/commands";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/cli/installation.mdx": {
	id: "vi/cli/installation.mdx";
  slug: "vi/cli/installation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/cli/overview.mdx": {
	id: "vi/cli/overview.mdx";
  slug: "vi/cli/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/getting-started/overview.mdx": {
	id: "vi/getting-started/overview.mdx";
  slug: "vi/getting-started/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/getting-started/setup.mdx": {
	id: "vi/getting-started/setup.mdx";
  slug: "vi/getting-started/setup";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/guides/api-key.mdx": {
	id: "vi/guides/api-key.mdx";
  slug: "vi/guides/api-key";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/guides/testing.mdx": {
	id: "vi/guides/testing.mdx";
  slug: "vi/guides/testing";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/guides/troubleshooting.mdx": {
	id: "vi/guides/troubleshooting.mdx";
  slug: "vi/guides/troubleshooting";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/guides/vibe-coding.mdx": {
	id: "vi/guides/vibe-coding.mdx";
  slug: "vi/guides/vibe-coding";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/index.mdx": {
	id: "vi/index.mdx";
  slug: "vi";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/reference/ai-agent.mdx": {
	id: "vi/reference/ai-agent.mdx";
  slug: "vi/reference/ai-agent";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/reference/board.mdx": {
	id: "vi/reference/board.mdx";
  slug: "vi/reference/board";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/reference/campaign.mdx": {
	id: "vi/reference/campaign.mdx";
  slug: "vi/reference/campaign";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/reference/channel.mdx": {
	id: "vi/reference/channel.mdx";
  slug: "vi/reference/channel";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/reference/communication.mdx": {
	id: "vi/reference/communication.mdx";
  slug: "vi/reference/communication";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/reference/contact.mdx": {
	id: "vi/reference/contact.mdx";
  slug: "vi/reference/contact";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/reference/conversation.mdx": {
	id: "vi/reference/conversation.mdx";
  slug: "vi/reference/conversation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/reference/workflow.mdx": {
	id: "vi/reference/workflow.mdx";
  slug: "vi/reference/workflow";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/ai-agent.mdx": {
	id: "vi/sdk/ai-agent.mdx";
  slug: "vi/sdk/ai-agent";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/authentication.mdx": {
	id: "vi/sdk/authentication.mdx";
  slug: "vi/sdk/authentication";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/databoard.mdx": {
	id: "vi/sdk/databoard.mdx";
  slug: "vi/sdk/databoard";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/document-ai.mdx": {
	id: "vi/sdk/document-ai.mdx";
  slug: "vi/sdk/document-ai";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/error-handling.mdx": {
	id: "vi/sdk/error-handling.mdx";
  slug: "vi/sdk/error-handling";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/full-flow-guide.mdx": {
	id: "vi/sdk/full-flow-guide.mdx";
  slug: "vi/sdk/full-flow-guide";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/installation.mdx": {
	id: "vi/sdk/installation.mdx";
  slug: "vi/sdk/installation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/integrations.mdx": {
	id: "vi/sdk/integrations.mdx";
  slug: "vi/sdk/integrations";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/local-testing.mdx": {
	id: "vi/sdk/local-testing.mdx";
  slug: "vi/sdk/local-testing";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/overview.mdx": {
	id: "vi/sdk/overview.mdx";
  slug: "vi/sdk/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/quick-start.mdx": {
	id: "vi/sdk/quick-start.mdx";
  slug: "vi/sdk/quick-start";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/resources.mdx": {
	id: "vi/sdk/resources.mdx";
  slug: "vi/sdk/resources";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"vi/sdk/workflows.mdx": {
	id: "vi/sdk/workflows.mdx";
  slug: "vi/sdk/workflows";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/cli/api-reference.mdx": {
	id: "zh-cn/cli/api-reference.mdx";
  slug: "zh-cn/cli/api-reference";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/cli/commands.mdx": {
	id: "zh-cn/cli/commands.mdx";
  slug: "zh-cn/cli/commands";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/cli/installation.mdx": {
	id: "zh-cn/cli/installation.mdx";
  slug: "zh-cn/cli/installation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/cli/overview.mdx": {
	id: "zh-cn/cli/overview.mdx";
  slug: "zh-cn/cli/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/getting-started/overview.mdx": {
	id: "zh-cn/getting-started/overview.mdx";
  slug: "zh-cn/getting-started/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/getting-started/setup.mdx": {
	id: "zh-cn/getting-started/setup.mdx";
  slug: "zh-cn/getting-started/setup";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/guides/api-key.mdx": {
	id: "zh-cn/guides/api-key.mdx";
  slug: "zh-cn/guides/api-key";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/guides/testing.mdx": {
	id: "zh-cn/guides/testing.mdx";
  slug: "zh-cn/guides/testing";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/guides/troubleshooting.mdx": {
	id: "zh-cn/guides/troubleshooting.mdx";
  slug: "zh-cn/guides/troubleshooting";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/guides/vibe-coding.mdx": {
	id: "zh-cn/guides/vibe-coding.mdx";
  slug: "zh-cn/guides/vibe-coding";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/index.mdx": {
	id: "zh-cn/index.mdx";
  slug: "zh-cn";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/reference/ai-agent.mdx": {
	id: "zh-cn/reference/ai-agent.mdx";
  slug: "zh-cn/reference/ai-agent";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/reference/board.mdx": {
	id: "zh-cn/reference/board.mdx";
  slug: "zh-cn/reference/board";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/reference/campaign.mdx": {
	id: "zh-cn/reference/campaign.mdx";
  slug: "zh-cn/reference/campaign";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/reference/channel.mdx": {
	id: "zh-cn/reference/channel.mdx";
  slug: "zh-cn/reference/channel";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/reference/communication.mdx": {
	id: "zh-cn/reference/communication.mdx";
  slug: "zh-cn/reference/communication";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/reference/contact.mdx": {
	id: "zh-cn/reference/contact.mdx";
  slug: "zh-cn/reference/contact";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/reference/conversation.mdx": {
	id: "zh-cn/reference/conversation.mdx";
  slug: "zh-cn/reference/conversation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/reference/workflow.mdx": {
	id: "zh-cn/reference/workflow.mdx";
  slug: "zh-cn/reference/workflow";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/ai-agent.mdx": {
	id: "zh-cn/sdk/ai-agent.mdx";
  slug: "zh-cn/sdk/ai-agent";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/authentication.mdx": {
	id: "zh-cn/sdk/authentication.mdx";
  slug: "zh-cn/sdk/authentication";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/databoard.mdx": {
	id: "zh-cn/sdk/databoard.mdx";
  slug: "zh-cn/sdk/databoard";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/document-ai.mdx": {
	id: "zh-cn/sdk/document-ai.mdx";
  slug: "zh-cn/sdk/document-ai";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/error-handling.mdx": {
	id: "zh-cn/sdk/error-handling.mdx";
  slug: "zh-cn/sdk/error-handling";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/full-flow-guide.mdx": {
	id: "zh-cn/sdk/full-flow-guide.mdx";
  slug: "zh-cn/sdk/full-flow-guide";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/installation.mdx": {
	id: "zh-cn/sdk/installation.mdx";
  slug: "zh-cn/sdk/installation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/integrations.mdx": {
	id: "zh-cn/sdk/integrations.mdx";
  slug: "zh-cn/sdk/integrations";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/local-testing.mdx": {
	id: "zh-cn/sdk/local-testing.mdx";
  slug: "zh-cn/sdk/local-testing";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/overview.mdx": {
	id: "zh-cn/sdk/overview.mdx";
  slug: "zh-cn/sdk/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/quick-start.mdx": {
	id: "zh-cn/sdk/quick-start.mdx";
  slug: "zh-cn/sdk/quick-start";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/resources.mdx": {
	id: "zh-cn/sdk/resources.mdx";
  slug: "zh-cn/sdk/resources";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-cn/sdk/workflows.mdx": {
	id: "zh-cn/sdk/workflows.mdx";
  slug: "zh-cn/sdk/workflows";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/cli/api-reference.mdx": {
	id: "zh-tw/cli/api-reference.mdx";
  slug: "zh-tw/cli/api-reference";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/cli/commands.mdx": {
	id: "zh-tw/cli/commands.mdx";
  slug: "zh-tw/cli/commands";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/cli/installation.mdx": {
	id: "zh-tw/cli/installation.mdx";
  slug: "zh-tw/cli/installation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/cli/overview.mdx": {
	id: "zh-tw/cli/overview.mdx";
  slug: "zh-tw/cli/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/getting-started/overview.mdx": {
	id: "zh-tw/getting-started/overview.mdx";
  slug: "zh-tw/getting-started/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/getting-started/setup.mdx": {
	id: "zh-tw/getting-started/setup.mdx";
  slug: "zh-tw/getting-started/setup";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/guides/api-key.mdx": {
	id: "zh-tw/guides/api-key.mdx";
  slug: "zh-tw/guides/api-key";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/guides/testing.mdx": {
	id: "zh-tw/guides/testing.mdx";
  slug: "zh-tw/guides/testing";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/guides/troubleshooting.mdx": {
	id: "zh-tw/guides/troubleshooting.mdx";
  slug: "zh-tw/guides/troubleshooting";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/guides/vibe-coding.mdx": {
	id: "zh-tw/guides/vibe-coding.mdx";
  slug: "zh-tw/guides/vibe-coding";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/index.mdx": {
	id: "zh-tw/index.mdx";
  slug: "zh-tw";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/reference/ai-agent.mdx": {
	id: "zh-tw/reference/ai-agent.mdx";
  slug: "zh-tw/reference/ai-agent";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/reference/board.mdx": {
	id: "zh-tw/reference/board.mdx";
  slug: "zh-tw/reference/board";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/reference/campaign.mdx": {
	id: "zh-tw/reference/campaign.mdx";
  slug: "zh-tw/reference/campaign";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/reference/channel.mdx": {
	id: "zh-tw/reference/channel.mdx";
  slug: "zh-tw/reference/channel";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/reference/communication.mdx": {
	id: "zh-tw/reference/communication.mdx";
  slug: "zh-tw/reference/communication";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/reference/contact.mdx": {
	id: "zh-tw/reference/contact.mdx";
  slug: "zh-tw/reference/contact";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/reference/conversation.mdx": {
	id: "zh-tw/reference/conversation.mdx";
  slug: "zh-tw/reference/conversation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/reference/workflow.mdx": {
	id: "zh-tw/reference/workflow.mdx";
  slug: "zh-tw/reference/workflow";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/ai-agent.mdx": {
	id: "zh-tw/sdk/ai-agent.mdx";
  slug: "zh-tw/sdk/ai-agent";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/authentication.mdx": {
	id: "zh-tw/sdk/authentication.mdx";
  slug: "zh-tw/sdk/authentication";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/databoard.mdx": {
	id: "zh-tw/sdk/databoard.mdx";
  slug: "zh-tw/sdk/databoard";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/document-ai.mdx": {
	id: "zh-tw/sdk/document-ai.mdx";
  slug: "zh-tw/sdk/document-ai";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/error-handling.mdx": {
	id: "zh-tw/sdk/error-handling.mdx";
  slug: "zh-tw/sdk/error-handling";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/full-flow-guide.mdx": {
	id: "zh-tw/sdk/full-flow-guide.mdx";
  slug: "zh-tw/sdk/full-flow-guide";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/installation.mdx": {
	id: "zh-tw/sdk/installation.mdx";
  slug: "zh-tw/sdk/installation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/integrations.mdx": {
	id: "zh-tw/sdk/integrations.mdx";
  slug: "zh-tw/sdk/integrations";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/local-testing.mdx": {
	id: "zh-tw/sdk/local-testing.mdx";
  slug: "zh-tw/sdk/local-testing";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/overview.mdx": {
	id: "zh-tw/sdk/overview.mdx";
  slug: "zh-tw/sdk/overview";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/quick-start.mdx": {
	id: "zh-tw/sdk/quick-start.mdx";
  slug: "zh-tw/sdk/quick-start";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/resources.mdx": {
	id: "zh-tw/sdk/resources.mdx";
  slug: "zh-tw/sdk/resources";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"zh-tw/sdk/workflows.mdx": {
	id: "zh-tw/sdk/workflows.mdx";
  slug: "zh-tw/sdk/workflows";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
};

	};

	type DataEntryMap = {
		"i18n": {
"en": {
	id: "en";
  collection: "i18n";
  data: InferEntrySchema<"i18n">
};
"vi": {
	id: "vi";
  collection: "i18n";
  data: InferEntrySchema<"i18n">
};
"zh-cn": {
	id: "zh-cn";
  collection: "i18n";
  data: InferEntrySchema<"i18n">
};
"zh-tw": {
	id: "zh-tw";
  collection: "i18n";
  data: InferEntrySchema<"i18n">
};
};

	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("../../src/content/config.js");
}
