// editor module is used to launch an editor (text editors like notepad)
const editor = require('editor');

// Syntax: editor(filename, callback)
// filename specifies the file that will be opened with the editor
// callback is invoked after the editor is closed
editor('sample.json', code => console.log(`Finished editing with code ${code}`));
