import { differenceInMinutes, formatISO, parse, parseISO } from "date-fns";
import matter from "gray-matter";
import { App, debounce, Plugin, TAbstractFile, TFile } from "obsidian";

export default class IDPlugin extends Plugin {
    async onload() {
        async function addDate(app: App, f: TFile): Promise<void> {
            // I got the setTimeout trick from
            // salmund/obsidian-date-in-metadata, it seems to avoid the
            // infinite loop I was getting though I don't understand why
            setTimeout(() => _addDate(app, f));
        }

        function minutesSince(date: string): number {
            try {
                return Math.abs(
                    differenceInMinutes(parseISO(date), new Date())
                );
            } catch (err) {
                console.error(err);
                throw err;
            }
        }

        async function _addDate(app: App, f: TFile): Promise<void> {
            // we should only write data if we have changed something. the
            // dirty flag represents that a change has been made and therefore
            // we should write the update
            let dirty = false;

            const updatedKey = "updated";
            const createdKey = "created";

            // If you want to read the content, change it, and then write it
            // back to disk, then use read() to avoid potentially overwriting
            // the file with a stale copy.
            let contents = await app.vault.read(f);

            const { data, content } = matter(contents);

            // if there is an update key and it's been soon enough to update
            // it, update it
            if (data[updatedKey] && minutesSince(data[updatedKey]) > 1) {
                // parse the mtime, and format it as an ISO timestamp
                const t = parse(`${f.stat.mtime}`, "T", new Date());
                data[updatedKey] = formatISO(t);
                dirty = true;
            }

            // if there is no updated key, add one
            if (!data.hasOwnProperty(updatedKey)) {
                // parse the mtime, and format it as an ISO timestamp
                const t = parse(`${f.stat.mtime}`, "T", new Date());
                data[updatedKey] = formatISO(t);
                dirty = true;
            }

            if (!data.hasOwnProperty(createdKey)) {
                data[createdKey] = formatISO(new Date());
                dirty = true;
            }

            if (dirty) {
                console.log(matter.stringify(content, data));
                await app.vault.modify(f, matter.stringify(content, data));
            }
        }

        // Called when a file has been indexed, and its (updated) cache is now available.
        this.app.metadataCache.on(
            "changed",
            debounce(async (f: TAbstractFile) => {
                f instanceof TFile && (await addDate(this.app, f));
            }, 2000)
        );
    }

    onunload() {}
}
