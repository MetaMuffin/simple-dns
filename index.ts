import { watch } from "fs";
import { readdir, readFile } from "fs/promises";

const dns = require("native-dns")
import { join } from "path";
var server = dns.createServer();

export interface Lookup {
    type: "A" | "AAAA" | "CNAME",
    value: string
    name: string
}

export var lookupTable: { [key: string]: Lookup } = {}
var reload_timeout: NodeJS.Timeout | undefined = undefined

async function parseFiles(nowatch?: boolean) {
    console.log("Parsing files...");
    lookupTable = {}
    var files = await readdir(join(__dirname, "hosts"))
    for (const fn of files) {
        var path = join(__dirname, "hosts", fn)
        var lines = (await readFile(path)).toString()
        for (const line of lines.split("\n")) {
            if (line.startsWith("#")) continue
            if (line.trim().length < 1) continue
            var [type, name, value] = line.replace(/\t+/ig, "\t").split("\t")
            if (type != "A" && type != "AAAA" && type != "CNAME" || !name || !value) {
                console.warn(`invalid line: ${line}`)
                continue
            }
            lookupTable[name] = {
                name, type, value
            }
        }
    }
    if (!nowatch) {
        watch(join(__dirname, "hosts"), (type, fn) => {
            console.log(`File changed: ${fn} -> Reparsing all files in 1000 ms...`);
            if (reload_timeout) clearTimeout(reload_timeout)
            reload_timeout = setTimeout(() => {
                parseFiles(true)
            }, 1000)
        });
    }
    console.log("\tDone");
}

const ttl = 600

server.on('request', function (request: any, response: any) {

    for (const q of request.question) {
        if (lookupTable.hasOwnProperty(q.name.toLowerCase())) {
            var l = lookupTable[q.name.toLowerCase()]
            var rec: any;
            if (l.type == "A") rec = { name: q.name, address: l.value, ttl }
            if (l.type == "AAAA") rec = { name: q.name, address: l.value, ttl }
            if (l.type == "CNAME") rec = { name: q.name, address: l.value, ttl }
            console.log(l.type, rec);
            response.answer.push(dns[l.type](rec))
        }
    }
    response.send();
});

server.on('error', function (err: any, buff: any, req: any, res: any) {
    console.log(err.stack);
});


parseFiles().then(() => {
    console.log("Starting server.");
    server.serve(53);
})
