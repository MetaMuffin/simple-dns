# simple-dns

Just a extremely simple dns-server as others are not simple enough yet (at least for me).

To add records, create configuration files in the `hosts` directory.

Each line in a file should match the regex `/(A|AAAA|CNAME)\t+\w+\t+\w+/i`, be empty or start with a `#` to make it a comment

Here's a sample configuration:
```
# A CNAME record to "forward" from blub.com to blah.org
CNAME   blub.com            blah.com

# A A record for cloudflaredns.blub
A       cloudflaredns.blub  1.1.1.1
```

If config files are changed, they will be reloaded automatically

## Installation

Install ts-node with npm if you haven't already.
Then use `ts-node index.ts` to run. (Be sure to create the `hosts` directory before that)

## To-do

- Allow forwarding servers and caching if a host could not be resolved. Just add some other dns server as a fallback.
