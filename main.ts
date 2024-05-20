import { App, Plugin, Editor, MarkdownView } from "obsidian";

async function addDateToOneNote(
    app: App,
): Promise<(_editor: Editor, ctx: MarkdownView) => void> {
    return (_editor: Editor, ctx: MarkdownView) => {
        if (!ctx.file) {
            return;
        }
        app.fileManager.processFrontMatter(
            ctx.file,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data: Record<string, any>) => {
                data["updated"] = new Date();
            },
        );
    };
}

export default class IDPlugin extends Plugin {
    async onload() {
        this.addCommand({
            id: "update-this-note",
            name: "Update the updated date for this note",
            editorCallback: await addDateToOneNote(this.app),
        });
    }
}
