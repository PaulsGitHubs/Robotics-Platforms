// static/js/file_manager.js

export const FileManager = {
    save(name, content) {
        localStorage.setItem(`file_${name}`, content);
        console.log(`Saved file: ${name}`);
    },

    load(name) {
        return localStorage.getItem(`file_${name}`);
    },

    listFiles() {
        const files = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("file_")) {
                files.push(key.replace("file_", ""));
            }
        }
        return files;
    },

    delete(name) {
        localStorage.removeItem(`file_${name}`);
        console.log(`Deleted file: ${name}`);
    }
};
