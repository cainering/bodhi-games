# Bodhi's Web

A small static site of learning games for Bodhi, adapted from Evan Goldberg's open-source
joyce-games project (fork of the structure; Goldberg family content removed).

* `settings.js` is the per-child file (name, age, grade, subjects, languages, quiz behavior).
* No backend: `functionsUrl` is empty, so chat, stars, Homework, and Book Club are hidden.
* Languages: English, Hebrew, Thai (`questions/thai.js`). Russian is turned off.
* Thai words must be checked by a native speaker; see `../thai-review.md`.

Tests:

```bash
node brain-break/test.js
node level-test/test.js
node questions/validate.js
node questions/no-repeat.test.js
node tests/client-safety.test.js
node tests/style-level.test.js
```

## Safety rules

Stars and prices are enforced on a server only, and this copy has no server
(`functionsUrl` is empty). Editing `settings.js` or browser storage cannot create stars.
Only a parent changes settings, by editing `settings.js`. No passwords or keys are in this project.

## Publish

Push this folder to its own GitHub repo, turn on Pages (branch main, root).
`CNAME` points at bodhi.cainhq.com; add a DNS CNAME record for that host to `<username>.github.io`.
