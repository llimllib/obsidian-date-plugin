import { App, CachedMetadata, Plugin, TFile } from "obsidian";
import { formatISO, parse } from "date-fns";

export default class IDPlugin extends Plugin {
	async onload() {
		async function addDate(
			app: App,
			f: TFile,
			metadata?: CachedMetadata
		): Promise<void> {
			// I got the setTimeout trick from
			// salmund/obsidian-date-in-metadata, it seems to avoid the
			// infinite loop I was getting though I don't understand why
			setTimeout(() => _addDate(app, f, metadata));
		}

		async function _addDate(
			app: App,
			f: TFile,
			metadata?: CachedMetadata
		): Promise<void> {
			const key = "updated";
			let contents = await app.vault.cachedRead(f);
			const meta = metadata || app.metadataCache.getFileCache(f);

			// make sure we exit out without modifying the file if it already
			// has an id so that we don't infinitely loop
			if (meta?.frontmatter?.hasOwnProperty(key)) {
				return;
			}

			const t = parse("" + f.stat.mtime, "t", new Date());

			if (meta?.frontmatter) {
				if (!meta.frontmatter.hasOwnProperty(key)) {
					contents = contents.replace(
						"\n---",
						`\n${key}: ${formatISO(t)}\n---`
					);
				}
			} else {
				contents = `---\n${key}: ${formatISO(t)}\n---\n\n${contents}`;
			}

			await app.vault.modify(f, contents);
		}

		this.app.vault.getMarkdownFiles().forEach(async (f: TFile) => {
			await addDate(this.app, f);
		});

		// Called when a file has been indexed, and its (updated) cache is now available.
		this.app.metadataCache.on(
			"changed",
			async (f: TFile, _: string, meta: CachedMetadata) => {
				await addDate(this.app, f, meta);
			}
		);
	}

	onunload() {}
}
