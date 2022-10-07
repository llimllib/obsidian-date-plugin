VAULT=~/code/tmp/obsidian-plugin-testing

main.js: main.ts
	tsc -noEmit -skipLibCheck && node esbuild.config.mjs production

install: main.js
	mkdir -p $(VAULT)/.obsidian/plugins/obsidian-date-plugin/
	cp {manifest.json,main.js} $(VAULT)/.obsidian/plugins/obsidian-date-plugin/

ci:
	npm ci
	node_modules/.bin/eslint *.ts

.PHONY: install ci
