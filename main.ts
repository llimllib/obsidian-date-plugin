import { differenceInMinutes, parse, parseISO } from "date-fns";
import { App, Plugin, TFile } from "obsidian";

function minutesSince(date: Date | string): number {
    if (typeof date == "string") {
        date = parseISO(date);
    }

    return Math.abs(differenceInMinutes(date, new Date()));
}

// if updated doesn't exist, use the mtime. This function differs from
// addDateUpdatedNow other in that it assumes the file has been modified just
// now
async function addDateUpdatedNow(f: TFile): Promise<void> {
    const updatedKey = "updated";
    const createdKey = "created";

    const frontmatter = app.metadataCache.getFileCache(f)?.frontmatter;

    // if there is no updated date, or it's been more than a minute, update the
    // updated date
    const updatedFM = frontmatter?.[updatedKey];
    if (!updatedFM || minutesSince(updatedFM) > 1) {
        await app.fileManager.processFrontMatter(f, (data) => {
            data[updatedKey] = new Date();
        });
    }

    // if there is no created date, use the ctime
    if (!frontmatter?.[createdKey]) {
        await app.fileManager.processFrontMatter(f, (data) => {
            data[createdKey] = parse(f.stat.ctime.toString(), "T", new Date());
        });
    }
}

// if updated doesn't exist, use the mtime. This function differs from the
// other in that it doesn't assume the file has been modified just now
async function addDateUpdatedMtime(f: TFile): Promise<void> {
    const updatedKey = "updated";
    const createdKey = "created";

    const frontmatter = app.metadataCache.getFileCache(f)?.frontmatter;

    // if there is no updated date, use the mtime
    if (!frontmatter?.[updatedKey]) {
        await app.fileManager.processFrontMatter(f, (data) => {
            data[updatedKey] = parse(f.stat.mtime.toString(), "T", new Date());
        });
    }

    // if there is no created date, use the ctime
    if (!frontmatter?.[createdKey]) {
        await app.fileManager.processFrontMatter(f, (data) => {
            data[createdKey] = parse(f.stat.ctime.toString(), "T", new Date());
        });
    }
}

function addDatesToAllNotes(app: App) {
    return () => {
        app.vault.getMarkdownFiles().forEach((f) => addDateUpdatedMtime(f));
    };
}

export default class IDPlugin extends Plugin {
    async onload() {
        // Called when a file has been indexed, and its (updated) cache is now
        // available.
        this.registerEvent(
            this.app.metadataCache.on("changed", addDateUpdatedNow)
        );

        this.addCommand({
            id: "add-dates-to-all-notes",
            name: "Add created and updated dates to all notes",
            callback: addDatesToAllNotes(this.app),
        });
    }
}
