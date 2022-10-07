import { App, debounce, Plugin, TAbstractFile, TFile } from "obsidian";
import { formatISO, parse } from "date-fns";

async function hash(str: string): Promise<string> {
	const hashAsArrayBuffer = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(str)
	);
	const uint8ViewOfHash = new Uint8Array(hashAsArrayBuffer);
	return Array.from(uint8ViewOfHash)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export default class IDPlugin extends Plugin {
	async onload() {
		async function addDate(app: App, f: TFile): Promise<void> {
			// I got the setTimeout trick from
			// salmund/obsidian-date-in-metadata, it seems to avoid the
			// infinite loop I was getting though I don't understand why
			setTimeout(() => _addDate(app, f));
		}

		const cache: string[] = [];
		const cachelen = 512;

		async function _addDate(app: App, f: TFile): Promise<void> {
			const key = "updated";

			// If you want to read the content, change it, and then write it
			// back to disk, then use read() to avoid potentially overwriting
			// the file with a stale copy.
			let contents = await app.vault.read(f);

			const t = parse("" + f.stat.mtime, "T", new Date());
			const mtime = formatISO(t);

			// search for frontmatter in the content, if present parts[1] will
			// be the frontmatter and parts[2] everything following
			const parts = contents.match(/^---(.*?)\n---\n(.*)/ms);
			if (parts) {
				// check to see if the body is in the cache, and return if so
				const bodyhash = await hash(parts[2]);
				if (cache.indexOf(bodyhash) !== -1) {
					return;
				}

				console.log("updating: ", f);

				// otherwise, push it to the cache
				cache.push(bodyhash);

				// and pop off the cache if it's greater than cachelen
				while (cache.length > cachelen) {
					cache.shift();
				}

				const frontmatter = parts[1];
				if (frontmatter.search(/^updated:/m) !== -1) {
					contents = contents.replace(
						/^updated: .*/m,
						`updated: ${mtime}`
					);
				} else {
					contents = contents.replace(
						"\n---",
						`\n${key}: ${mtime}\n---`
					);
				}
			} else {
				contents = `---\n${key}: ${mtime}\n---\n\n${contents}`;
			}

			await app.vault.modify(f, contents);
		}

		// TODO: make this into a command, so we don't store a cache key for
		// each one and it doesn't need to be done on every startup
		// this.app.vault.getMarkdownFiles().forEach(async (f: TFile) => {
		// 	await addDate(this.app, f);
		// });

		// this.app.vault.on(
		// 	"modify",
		this.app.metadataCache.on(
			"changed",
			debounce(async (f: TAbstractFile) => {
				f instanceof TFile && (await addDate(this.app, f));
			}, 2000)
		);
	}

	onunload() {}
}
