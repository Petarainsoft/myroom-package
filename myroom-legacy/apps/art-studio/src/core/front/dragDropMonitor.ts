class DragDropMonitor {
    private _elementToMonitor: HTMLElement | null = null;

    private _dragEnterHandler: ((e: any) => void) | null = null;
    private _dragOverHandler: ((e: any) => void) | null = null;
    private _dropHandler: ((e: any) => void) | null = null;

    private _dropFileHandler: ((filepaths: string[]) => void);

    public constructor(dropFileHandler: ((filepaths: string[]) => void)) {
        this._dropFileHandler = dropFileHandler;
    }

    public monitorElementForDragNDrop(elementToMonitor: HTMLElement): void {
        if (elementToMonitor) {
            this._elementToMonitor = elementToMonitor;

            this._dragEnterHandler = (e) => {
                this._drag(e);
            };
            this._dragOverHandler = (e) => {
                this._drag(e);
            };
            this._dropHandler = (e) => {
                this._drop(e);
            };

            this._elementToMonitor.addEventListener("dragenter", this._dragEnterHandler, false);
            this._elementToMonitor.addEventListener("dragover", this._dragOverHandler, false);
            this._elementToMonitor.addEventListener("drop", this._dropHandler, false);
        }
    }

    public dispose() {
        if (!this._elementToMonitor) {
            return;
        }

        if (this._dragEnterHandler) {
            this._elementToMonitor.removeEventListener("dragenter", this._dragEnterHandler);
        }

        if (this._dragOverHandler) {
            this._elementToMonitor.removeEventListener("dragover", this._dragOverHandler);
        }

        if (this._dropHandler) {
            this._elementToMonitor.removeEventListener("drop", this._dropHandler);
        }
    }

    private _drag(e: DragEvent): void {
        e.stopPropagation();
        e.preventDefault();
    }

    private _drop(eventDrop: DragEvent): void {
        eventDrop.stopPropagation();
        eventDrop.preventDefault();

        this._makeFileList(eventDrop);
    }

    private _makeFileList(event: any): void {
        let files: string[] = [];
        let filesToLoad: FileList | null = null;
        // Handling data transfer via drag'n'drop
        if (event && event.dataTransfer && event.dataTransfer.files) {
            filesToLoad = event.dataTransfer.files;
        }

        // Handling files from input files
        if (event && event.target && event.target.files) {
            filesToLoad = event.target.files;
        }

        if (filesToLoad && filesToLoad.length > 0) {
            for (let ii = 0; ii < filesToLoad.length; ++ii) {
                files.push(filesToLoad[ii].path);
            }
        }

        this._dropFileHandler(files);
    }
}

export default DragDropMonitor;