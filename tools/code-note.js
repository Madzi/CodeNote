YUI.add('cn-code-cleaner', function (Y) {

    Y.namespace('CN').CodeCleaner = Y.Base.create('cn-code-cleaner', Y.Base, [], {
        extractsSourceSpans: function (node, isPreformatted) {
            var nocode = /(?:^|\s)nocode(?:\s|$)/;

            var chunks = [];
            var length = 0;
            var spans = [];
            var k = 0;

            function walk(node) {
                var type = node.nodeType;

                if (type == 1) {  // Element
                    if (nocode.test(node.className)) { return; }
                    for (var child = node.firstChild; child; child = child.nextSibling) {
                        walk(child);
                    }
                    var nodeName = node.nodeName.toLowerCase();
                    if ('br' === nodeName || 'li' === nodeName) {
                        chunks[k] = '\n';
                        spans[k << 1] = length++;
                        spans[(k++ << 1) | 1] = node;
                    }
                } else if (type == 3 || type == 4) {  // Text
                    var text = node.nodeValue;
                    if (text.length) {
                        if (!isPreformatted) {
                            text = text.replace(/[ \t\r\n]+/g, ' ');
                        } else {
                            text = text.replace(/\r\n?/g, '\n');  // Normalize newlines.
                        }
                        // TODO: handle tabs here?
                        chunks[k] = text;
                        spans[k << 1] = length;
                        length += text.length;
                        spans[(k++ << 1) | 1] = node;
                    }
                }
            }

            walk(node);

            return {
                sourceCode: chunks.join('').replace(/\n$/, ''),
                spans: spans
            };
        },

        process: function (node) { //TODO: Написать интеллектуальную чистку кода.
            var formated = this.extractsSourceSpans(node._node, true);

            node.set('text', formated.sourceCode);
        }
    }, {});

}, '1.0', {
    requires: [
        'base',
        'array-extras'
    ]
});

YUI.add('cn-string-stream', function (Y) {

    var countColumn = function(string, end, tabSize, startIndex, startValue) {
        var i, nextTab;

        if (end == null) {
            end = string.search(/[^\s\u00a0]/);
            if (end == -1) {
                end = string.length;
            }
        }
        for (i = startIndex || 0, n = startValue || 0;;) {
            nextTab = string.indexOf("\t", i);
            
            if (nextTab < 0 || nextTab >= end) {
                return n + (end - i);
            }
            n += nextTab - i;
            n += tabSize - (n % tabSize);
            i = nextTab + 1;
        }
    };


    Y.namespace('CN').StringStream = Y.Base.create('cn-string-stream', Y.Base, [], {
        eol: function () {
            var pos    = this.getPos(),
                string = this.getString();

            return pos >= string.length;
        },
        
        sol: function () {
            var pos       = this.getPos(),
                lineStart = this.getLineStart();

            return pos === lineStart;
        },

        peek: function() {
            var pos    = this.getPos(),
                string = this.getString();

            return string.charAt(pos) || undefined;
        },

        next: function() {
            var pos    = this.getPos(),
                string = this.getString();

            if (pos < string.length) {
                pos++;
                this.setPos(pos);
                return string.charAt(pos);
            }
        },

        eat: function(match) {
            var ok,
                pos    = this.getPos(),
                string = this.getString(), 
                ch     = string.charAt(pos);

            if (typeof match == "string") {
                ok = ch == match; 
            } else {
                ok = ch && (match.test ? match.test(ch) : match(ch)); 
            }
            if (ok) {
                this.setPos(pos++);
                return ch;
            }
        },

        eatWhile: function(match) {
            var start = this.getPos();

          while (this.eat(match)) { /** Do nothing */ }
          return this.getPos() > start;
        },

        eatSpace: function() {
            var pos     = this.getPos(),
                string  = this.getString(),
                start   = pos;

            while (/[\s\u00a0]/.test(string.charAt(pos))) {
                pos++;
                this.setPos(pos);
            };

          return pos > start;
        },

        skipToEnd: function() {
            var pos    = this.getPos(),
                string = this.getString();

            pos = string.length;
        },

        skipTo: function(ch) {
            var pos    = this.getPos(),
                string = this.getString(), 
                found  = string.indexOf(ch, pos);

            if (found > -1) {
                this.setPos(found);
                return true;
            }
        },

        backUp: function(n) {
            this.set('pos', this.get('pos') - n);
        },

        column: function() {
            var start           = this.getStart(),
                string          = this.getString(),
                tabSize         = this.getTabSize(),
                lineStart       = this.getLineStart(),
                lastColumnPos   = this.getLastColumnPos(),
                lastColumnValue = this.getLastColumnValue();

            if (lastColumnPos < start) {
                lastColumnValue = countColumn(string, start, tabSize, lastColumnPos, lastColumnValue);
                this.setLastColumnValue(lastColumnValue);
                lastColumnPos = start;
                this.setLastColumnPos(lastColumnPos);
            }
            return lastColumnValue - (lineStart ? countColumn(string, lineStart, tabSize) : 0);
        },

        indentation: function() {
            var string    = this.getString(),
                tabSize   = this.getTabSize(),
                lineStart = this.getLineStart();

            return countColumn(string, null, tabSize) - (lineStart ? countColumn(string, lineStart, tabSize) : 0);
        },

        match: function(pattern, consume, caseInsensitive) {
            var substr,
                match,
                pos     = this.getPos(),
                string  = this.getString(),
                cased = function (str) {
                    return caseInsensitive ? str.toLowerCase() : str;
                };

            if (typeof pattern == "string") {
                substr = string.substr(pos, pattern.length);
                if (cased(substr) == cased(pattern)) {
                    if (consume !== false) {
                        pos += pattern.length;
                        this.setPos(pos);
                    }
                    return true;
                }
            } else {
                var match = string.slice(pos).match(pattern);
                if (match && match.index > 0) {
                    return null;
                }
                if (match && consume !== false) {
                    pos += match[0].length;
                    this.setPos(pos);
                }
                return match;
            }
        },

        current: function () {
            var string = this.getString(),
                start  = this.getStart(),
                pos    = this.getPos();

            return string.slice(start, pos);
        },

        hideFirstChars: function(n, inner) {
            var lineStart = this.getLineStart() + n;

            this.setLineStart(lineStart);

            try {
                return inner();
            } finally {
                this.setLineStart(lineStart - n);
            }
        },

        getPos: function () {
            return this.get('pos');
        },

        setPos: function (pos) {
            return this.set('pos');
        },

        getStart: function () {
            return this.get('start');
        },

        setStart: function (start) {
            return this.set('start', start);
        },

        getString: function () {
            return this.get('string');
        },

        setString: function (string) {
            return this.set('string', string);
        },

        getTabSize: function () {
            return this.get('tabSize');
        },

        setTabSize: function (tabSize) {
            return this.set('tabSize', tabSize);
        },

        getLastColumnPos: function () {
            return this.get('lastColumnPos');
        },

        setLastColumnPos: function (lastColumnPos) {
            return this.set('lastColumnPos', lastColumnPos);
        },

        getLastColumnValue: function () {
            return this.get('lastColumnValue');
        },

        setLastColumnValue: function (lastColumnValue) {
            return this.set('lastColumnValue', setLastColumnValue);
        },

        getLineStart: function () {
            return this.get('lineStart');
        },

        setLineStart: function (lineStart) {
            return this.set('lineStart', lineStart);
        }
    }, {
        ATTRS: {
            pos: {
                value: 0
            },
            start: {
                value: 0
            },
            string: {
                value: null
            },
            tabSize: {
                value: 8
            },
            lastColumnPos: {
                value: 0
            },
            lastColumnValue: {
                value: 0
            },
            lineStart: {
                value: 0
            }
        }
    });

}, '1.0', {
    requires: [
        'base'
    ]
});


YUI.add('cn-languages', function (Y) {

    Y.namespace('CN.Model').Language = Y.Base.create('cn-model-language', Y.Model, [], {
        startState: function () {},

        token: function (stream, state) {},

        copyState: function (state) {},

        ident: function (state, textAfter) {},

        lineComment: function () {},
        blockCommentStart: function () {},
        blockCommentEnd: function () {},

        getName: function () {
            return this.get('name');
        },

        getAliases: function () {
            return this.get('aliases');
        },

        getKeywords: function () {
            return this.get('keywords');
        }
    }, {
        ATTRS: {
            name: {
                value       : '',
                validator   : Y.Lang.isString,
                readonly    : true
            },
            aliases: {
                value       : [],
                validator   : Y.Lang.isArray,
                readonly    : true
            },
            keywords: {
                value       : [],
                validator   : Y.Lang.isArray,
                readonly    : true
            }
        }
    });

    Y.namespace('CN.Model.List').Language = Y.Base.create('cn-model-list-language', Y.ModelList, [], {
        model: Y.CN.Model.Language,

        find: function (lang) {
            var result = null;

            return result;
        }
    });

    Y.namespace('CN').Languages = new Y.CN.Model.List.Language();

    Y.CN.Languages.add(new Y.CN.Model.Language({
        name    : 'applescript',
        aliases : ['applescript']
    }));

}, '1.0', {
    requires: [
        'model',
        'model-list'
    ]
});



YUI.add('cn-lang-detector', function (Y) {

    Y.namespace('CN').LangDetector = Y.Base.create('cn-lang-detector', Y.Base, [], {
        clean: function (text) {
            var i, ch, lst, pure = '';

            for (i = 0; i < text.length; i++) {
                ch = text.charAt(i);
                if (/[a-zA-Z0-9_]/.test(ch)) {
                    pure += ch;
                    lst = false;
                } else {
                    if (!lst) {
                        pure += ' ';
                        lst = true;
                    }
                }
            }

            return pure;
        },

        freqTable: function (text) {
            var table = {},
                pure = this.clean(text),
                words = pure.split(/[\s]+/);

            Y.Array.each(words, function (word) {
                var val = table[word] || 0;

                table[word] = val + 1;
            });

            return table;
        },

        compare: function (freqTable, keywords) {
            var obj = freqTable || {},
                sum = 0;

            Y.Object.each(freqTable, function (val, key) {
                if (keywords.indexOf(key) < 0) {
                    sum += val * 3;
                }
            });

            return sum;
        },

        guess: function (text) {
            var _sum,
                self  = this,
                _lang = 'js',
                table = this.freqTable(text),
                langs = this.getLanguages();

            Y.Array.each(langs, function (lang) {
                var sum = self.compare(table, lang.keywords);

                if (_sum) {
                    if (sum < _sum) {
                        _sum = sum;
                        _lang = lang.name;
                    }
                } else {
                    _sum = sum;
                    _lang = lang.name;
                }
            });

            return _lang;
        },

        checkLang: function (lang) {
            var _lang = null,
                languages = this.getLanguages();

            languages.each(function (language) {
                var aliases = language.getAliases();

                if (aliases.indexOf(lang) >= 0) {
                    _lang = language.getName();
                }
            });

            return _lang;
        },

        checkNode: function (node) {
            var self   = this,
                _lang  = node && node.getAttribute('lang') || null,
                _class = node && node.getAttribute('class') || null,
                aClasses,
                languages = this.getLanguages();

            if (Y.Lang.isNull(_lang)) {
                if (!Y.Lang.isNull(_class)) {
                    aClasses = _class.split(' ');
                    Y.Array.each(aClasses, function (aClass) {
                        var l = self.checkLang(aClass);
                        if (!Y.Lang.isNull(l)) {
                            _lang = l;
                        }
                    });
                }
            } else {
                _lang = this.checkLang(_lang);
            }

            return _lang;
        },

        check: function (node) {
            var item = node,
                _lang = this.checkNode(item);

            if (Y.Lang.isNull(node)) {
                return null;
            }

            if (Y.Lang.isNull(_lang)) {
                item = node.get('parent');
                if (item) {
                    _lang = this.checkNode(item);
                }
            }

            if (Y.Lang.isNull(_lang)) {
                item = node.one('code');
                if (item) {
                    _lang = this.checkNode(item);
                }
            }

            return _lang;
        },

        process: function (node) {
            var lang;

            if (Y.Lang.isNull(node)) {
                return;
            }

            lang = this.check(node);

            if (!lang) {
                lang = this.guess(node.get('text'));
            }

            node.setAttribute('lang', lang);
        },

        getLanguages: function () { return this.get('languages'); }
    }, {
        ATTRS: {
            languages: {
                valueFn: function () {
                    var langs = new Y.CN.Model.List.Language();

                    langs.add(new Y.CN.Model.Language({
                        name    : 'applescript',
                        aliases : ['applescript']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'as3',
                        aliases : ['as3', 'actionscript3']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'bash',
                        aliases : ['bash', 'shell', 'sh']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'cf',
                        aliases : ['coldfusion', 'cf']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'cpp',
                        aliases : ['cpp', 'cc', 'c++', 'c', 'h', 'hpp', 'h++']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'csharp',
                        aliases : ['c#', 'c-sharp', 'csharp']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'css',
                        aliases : ['css']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'delphi',
                        aliases : ['delphi', 'pascal', 'pas']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'diff',
                        aliases : ['diff', 'patch']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'erlang',
                        aliases : ['erl', 'erlang']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'groovy',
                        aliases : ['groovy']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'haxe',
                        aliases : ['haxe', 'hx']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name: 'java',
                        aliases: ['java'],
                        keywords: [
                            'abstract', 'assert', 'boolean', 'break', 'byte',
                            'case', 'catch', 'char', 'class', 'const',
                            'continue', 'default', 'do', 'double', 'else',
                            'enum', 'extends', 'false', 'final', 'finally',
                            'float', 'for', 'goto', 'if', 'implements',
                            'import', 'instanceof', 'int', 'interface', 'long',
                            'native', 'new', 'null', 'package', 'private',
                            'protected', 'public', 'return', 'short', 'static',
                            'strictfp', 'super', 'switch', 'synchronized', 'this',
                            'throw', 'throws', 'true', 'transient', 'try',
                            'void', 'volatile', 'while'
                        ]
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'javafx',
                        aliases : ['jfx', 'javafx']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'js',
                        aliases : ['js', 'jscript', 'javascript', 'json'],
                        keywords: [
                            'break', 'case', 'catch', 'class', 'continue',
                            'default', 'delete', 'do', 'else', 'enum',
                            'export', 'extends', 'false', 'for', 'function',
                            'if', 'implements', 'import', 'in', 'instanceof',
                            'interface', 'let', 'new', 'null', 'package',
                            'private', 'protected', 'static', 'return', 'super',
                            'switch', 'this', 'throw', 'true', 'try',
                            'typeof', 'var', 'while', 'with', 'yield'
                        ]
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'perl',
                        aliases : ['perl', 'pl']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'php',
                        aliases : ['php']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'plain',
                        aliases : ['text', 'plain']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'powershell',
                        aliases : ['powershell', 'ps', 'posh']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'python',
                        aliases : ['py', 'python']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'ruby',
                        aliases : ['ruby', 'rails', 'ror', 'rb']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'sass',
                        aliases : ['sass', 'scss']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'scala',
                        aliases : ['scala']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'sql',
                        aliases : ['sql']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'tap',
                        aliases : ['tap']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'typescript',
                        aliases : ['typescript', 'ts']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'vb',
                        aliases : ['vb', 'vbnet']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'xml',
                        aliases : ['xml', 'xhtml', 'xslt', 'html', 'plist']
                    }));

                    return langs;
                }
            }
        }
    });

}, '1.0', {
    requires: [
        'base',
        'array-extras',
        'cn-languages'
    ]
});



YUI.add('cn-code-formatter', function (Y) {

    Y.namespace('CN').CodeFormatter = Y.Base.create('cn-code-formatter', Y.Base, [], {
        process: function (node) {}
    }, {});

}, '1.0', {
    requires: [
        'base'
    ]
});



YUI.add('cn-syntax-highlighter', function (Y) {

    Y.namespace('CN').SyntaxHighlighter = Y.Base.create('cn-syntax-highlighter', Y.Base, [], {
        process: function (node) {
            var olNode   = Y.Node.create('<ol></ol>'),
                spanNode,
                token,
                language = (this.getLanguages()).find(node.getAttribute('lang') || 'js');
                text     = node.getHTML(),
                stream   = new Y.CN.StringStream({ buf: text }),
                state    = {};

            if (language) {
                language.startState(state); //todo...
                while (!stream.eol()) {
                    token = language.token(stream, state);
                    spanNode = Y.Node.create('<span></span>');
                    spanNode.setHTML(token.text);
                    spanNode.setStyle(this.getStyle(token.style));
                    olNode.appendChild(spanNode);
                }                
            };
        },

        getStyle: function (style) {
            var styles = this.getStyles();

            return styles[style];
        },

        getStyles: function () {
            return this.getS('styles');
        },

        getLanguages: function () {
            return this.get('languages');
        }
    }, {
        ATTRS: {
            styles: {
                value: {
                    comment     : 'background: #272822; color: #75715e;',
                    atom        : 'background: #272822; color: #ae81ff;',
                    number      : 'background: #272822; color: #ae81ff;',
                    property    : 'background: #272822; color: #a6e22e;',
                    attribute   : 'background: #272822; color: #a6e22e;',
                    keyword     : 'background: #272822; color: #f92672;',
                    string      : 'background: #272822; color: #e6db74;',
                    var1        : 'background: #272822; color: #a6e22e;',
                    var2        : 'background: #272822; color: #9effff;',
                    def         : 'background: #272822; color: #fd971f;',
                    delimiter   : 'background: #272822; color: #f8f8f2;',
                    tag         : 'background: #272822; color: #f92672;',
                    link        : 'background: #272822; color: #ae81ff;',
                    error       : 'background: #f92672; color: #f8f8f0;',
                    "undefined" : 'background: #272822; color: #f8f8f2;'
                },
                readOnly: true
            },
            languages: {
                valueFn: function () {
                    return Y.CN.Languages;
                }
            } 
        }
    });

}, '1.0', {
    requires: [
        'base',
        'cn-string-stream',
        'cn-languages'
    ] 
});



YUI.add('cn-code-processor', function (Y) {

    Y.namespace('CN').CodeProcessor = Y.Base.create('cn-code-processor', Y.Base, [], {
        processAll: function (nodeList) {
            var self = this;

            if (nodeList) {
                nodeList.each(function (node) {
                    self.processNode(node);
                });
            }
        },

        processNode: function (node) {
            var lang,
                cc = this.getCodeCleaner(),
                ld = this.getLangDetector(),
                cf = this.getCodeFormatter(),
                sh = this.getSyntaxHighlighter();

            if (!Y.Lang.isNull(node)) {
                if (ld) { ld.process(node); }
                if (cc) { cc.process(node); }
                if (cf) { cf.process(node); }
                if (sh) { sh.process(node); }
            }
        },

        getCodeCleaner: function () {
            return this.get('codeCleaner');
        },

        getLangDetector: function () {
            return this.get('langDetector');
        },

        getCodeFormatter: function () {
            return this.get('codeFormatter');
        },

        getSyntaxHighlighter: function () {
            return this.get('syntaxHightlighter');
        }
    }, {
        ATTRS: {
            codeCleaner: {
                valueFn: function () {
                    return new Y.CN.CodeCleaner();
                }
            },
            langDetector: {
                valueFn: function () {
                    return new Y.CN.LangDetector();
                }
            },
            codeFormatter: {
                valueFn: function () {
                    return new Y.CN.CodeFormatter();
                }
            },
            syntaxHightlighter: {
                valueFn: function () {
                    return new Y.CN.SyntaxHighlighter();
                }
            }
        }
    });

 }, '1.0', {
    requires: [
        'base',
        'cn-code-cleaner',
        'cn-lang-detector',
        'cn-code-formatter',
        'cn-syntax-highlighter'
    ]
});
