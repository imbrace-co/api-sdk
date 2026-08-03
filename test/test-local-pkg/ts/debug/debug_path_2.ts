import { pathToFileURL } from 'url';
console.log("import.meta.url:", import.meta.url);
console.log("pathToFileURL(process.argv[1]).href:", pathToFileURL(process.argv[1]).href);
console.log("Match:", import.meta.url === pathToFileURL(process.argv[1]).href);
