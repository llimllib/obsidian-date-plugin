import { differenceInMinutes, parse, parseISO } from "date-fns";
import matter from "gray-matter";
import { App, debounce, Plugin, TFile } from "obsidian";

export default class IDPlugin extends Plugin {
    async onload() {
        async function addDate(app: App, f: TFile): Promise<void> {
            // I got the setTimeout trick from
            // salmund/obsidian-date-in-metadata, it seems to avoid the
            // infinite loop I was getting though I don't understand why
            setTimeout(() => _addDate(app, f));
        }

        function minutesSince(date: Date | string): number {
            if (typeof date == "string") {
                date = parseISO(date);
            }

            return Math.abs(differenceInMinutes(date, new Date()));
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
            const contents = await app.vault.read(f);

            const { data, content } = matter(contents);

            // if there isn't an updated key, or there is an update key and
            // it's been soon enough to update it, update it
            if (
                !data.hasOwnProperty(updatedKey) ||
                (data.hasOwnProperty(updatedKey) &&
                    minutesSince(data[updatedKey]) > 1)
            ) {
                // parse the mtime, and format it as an ISO timestamp
                data[updatedKey] = new Date();
                dirty = true;
            }

            if (!data.hasOwnProperty(createdKey)) {
                data[createdKey] = parse(
                    f.stat.ctime.toString(),
                    "T",
                    new Date()
                );
                dirty = true;
            }

            if (dirty) {
                await app.vault.modify(f, matter.stringify(content, data));
            }
        }

        // Called when a file has been indexed, and its (updated) cache is now available.
        this.app.metadataCache.on(
            "changed",
            debounce(async (f: TFile) => {
                await addDate(this.app, f);
            }, 2000)
        );
    }
}
