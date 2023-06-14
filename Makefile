VAULT=~/code/tmp/obsidian-plugin-testing
PROJECT=obsidian-date-plugin
TARGET=dist/main.js
PROJDIR=$(VAULT)/.obsidian/plugins/$(PROJECT)

.PHONY: install
install: clean $(TARGET)
	mkdir -p $(VAULT)/.obsidian/plugins/obsidian-date-plugin/
	cp {manifest.json,main.js} $(VAULT)/.obsidian/plugins/obsidian-date-plugin/

dist:
	mkdir dist

$(TARGET): dist main.ts
	tsc -noEmit -skipLibCheck && node esbuild.config.mjs production

.PHONY: clean
clean:
	rm -rf $(PROJDIR)

.PHONY: watch
watch:
	watchfiles "make" $$(fd -g --exclude node_modules --exclude dist "*.{ts,js}")

ci:
	npm ci
	node_modules/.bin/eslint *.ts

.PHONY: install ci
