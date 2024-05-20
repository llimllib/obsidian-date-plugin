import {
    App,
    Plugin,
    Editor,
    MarkdownView,
    TAbstractFile,
    TFile,
} from "obsidian";

function addDatesToNewFile(app: App): (file: TAbstractFile, ctx?: any) => any {
    return (file: TAbstractFile, _ctx?: any) => {
        if (!("stat" in file)) {
            return;
        }
        app.fileManager.processFrontMatter(
            file as TFile,
            (data: Record<string, any>) => {
                data["created"] = new Date();
                data["updated"] = new Date();
            },
        );
    };
}

function addDateToOneNote(
    app: App,
): (_editor: Editor, ctx: MarkdownView) => void {
    return (_editor: Editor, ctx: MarkdownView) => {
        if (!ctx.file) {
            console.warn("unexpected missing file");
            return;
        }
        app.fileManager.processFrontMatter(
            ctx.file,
            (data: Record<string, any>) => {
                data["updated"] = new Date();
            },
        );
    };
}

export default class IDPlugin extends Plugin {
    async onload() {
        // Wait for the vault to be ready, so that we don't get called on the
        // initial load of every file:
        //
        // > If you do not wish to receive create events on vault load,
        // register your event handler inside Workspace.onLayoutReady.
        this.app.workspace.onLayoutReady(async () => {
            this.registerEvent(
                this.app.vault.on("create", addDatesToNewFile(this.app)),
            );
        });

        this.addCommand({
            id: "update-this-note",
            name: "Update the updated date for this note",
            editorCallback: addDateToOneNote(this.app),
        });
    }
}
