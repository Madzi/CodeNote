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



YUI.add('cn-languages', function (Y) {

    Y.namespace('CN.Model').Language = Y.Base.create('cn-model-language', Y.Model, [], {
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
        model: Y.CN.Model.Language
    });

    Y.namespace('CN.Language').AS3 = new Y.CN.Model.Language({
        name: 'as3', aliases: ['as3', 'actionscript3']
    });

    Y.namespace('CN.Language').AppleScript = new Y.CN.Model.Language({
        name: 'applescript', aliases: ['applescript']
    });

    Y.namespace('CN.Language').Bash = new Y.CN.Model.Language({
        name: 'bash', aliases: ['bash', 'shell', 'sh']
    });

    Y.namespace('CN.Language').CSharp = new Y.CN.Model.Language({
        name: 'csharp', aliases: ['csharp', 'c-sharp', 'c#']
    });

    Y.namespace('CN.Language').ColdFusion = new Y.CN.Model.Language({
        name: 'cf', aliases: ['coldfusion', 'cf']
    });

    Y.namespace('CN.Language').Cpp = new Y.CN.Model.Language({
        name: 'cpp', aliases: ['cpp', 'cc', 'c++', 'c', 'h', 'hpp', 'h++']
    });

    Y.namespace('CN.Language').Css = new Y.CN.Model.Language({
        name: 'css', aliases: ['css']
    });

    Y.namespace('CN.Language').Delphi = new Y.CN.Model.Language({
        name: 'delphi', aliases: ['delphi', 'pascal', 'pas']
    });

    Y.namespace('CN.Language').Diff = new Y.CN.Model.Language({
        name: 'diff', aliases: ['diff', 'patch']
    });

    Y.namespace('CN.Language').Erlang = new Y.CN.Model.Language({
        name: 'erlang', aliases: ['erlang', 'erl']
    });

    Y.namespace('CN.Language').Groovy = new Y.CN.Model.Language({
        name: 'groovy', aliases: ['groovy']
    });

    Y.namespace('CN.Language').Haxe = new Y.CN.Model.Language({
        name: 'haxe', aliases: ['haxe', 'hx']
    });

    Y.namespace('CN.Language').JScript = new Y.CN.Model.Language({
        name: 'js', aliases: ['js', 'jscript', 'javascript', 'json'],
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
    });

    Y.namespace('CN.Language').Java = new Y.CN.Model.Language({
        name: 'java', aliases: ['java'],
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
    });

    Y.namespace('CN.Language').JavaFX = new Y.CN.Model.Language({
        name: 'javafx', aliases: ['javafx', 'jfx']
    });

    Y.namespace('CN.Language').Perl = new Y.CN.Model.Language({
        name: 'perl', aliases: ['perl', 'pl']
    });

    Y.namespace('CN.Language').Php = new Y.CN.Model.Language({
        name: 'php', aliases: ['php']
    });

    Y.namespace('CN.Language').Plain = new Y.CN.Model.Language({
        name: 'plain', aliases: ['plain', 'text']
    });

    Y.namespace('CN.Language').PowerShell = new Y.CN.Model.Language({
        name: 'powershell', aliases: ['powershell', 'ps', 'posh']
    });

    Y.namespace('CN.Language').Python = new Y.CN.Model.Language({
        name: 'python', aliases: ['py', 'python']
    });

    Y.namespace('CN.Language').Ruby = new Y.CN.Model.Language({
        name: 'ruby', aliases: ['ruby', 'rails', 'ror', 'rb'],
        keywords: [
                'alias', 'and', 'BEGIN', 'begin', 'break', 'case', 'class', 'def', 'define_method', 'defined',
                'do', 'each', 'else', 'elsif', 'END', 'end', 'ensure', 'false', 'for', 'if',
                'in', 'module', 'new', 'next', 'nil', 'not', 'or', 'raise', 'redo', 'rescue',
                'retry', 'return', 'self', 'super', 'then', 'throw', 'true', 'undef', 'unless', 'until',
                'when', 'while', 'yield';
        ],
        builtins: [
                'Array', 'Bignum', 'Binding', 'Class', 'Continuation', 'Dir', 'Exception', 'FalseClass', 'File::Stat', 'File',
                'Fixnum', 'Fload', 'Hash', 'Integer', 'IO', 'MatchData', 'Method', 'Module', 'NilClass', 'Numeric',
                'Object', 'Proc', 'Range', 'Regexp', 'String', 'Struct::TMS', 'Symbol', 'ThreadGroup', 'Thread', 'Time', 'TrueClass'
        ],
        regexs: [
            { regex: SyntaxHighlighter.regexLib.singleLinePerlComments, style: 'comments' },
            { regex: SyntaxHighlighter.regexLib.doubleQuotedString,     style: 'string' },
            { regex: SyntaxHighlighter.regexLib.singleQuotedString,     style: 'string' },
            { regex: /\b[A-Z0-9_]+\b/g,                                 style: 'constants' },
            { regex: /:[a-z][A-Za-z0-9_]*/g,                            style: 'color2' },
            { regex: /(\$|@@|@)\w+/g,                                   style: 'variable bold' },
            { regex: new RegExp(this.getKeywords(keywords), 'gm'),      style: 'keyword' },
            { regex: new RegExp(this.getKeywords(builtins), 'gm'),      style: 'color1' }
        ]
    });

    Y.namespace('CN.Language').Sass = new Y.CN.Model.Language({
        name: 'sass', aliases: ['sass', 'scss']
    });

    Y.namespace('CN.Language')Scala. = new Y.CN.Model.Language({
        name: 'scala', aliases: ['scala']
    });

    Y.namespace('CN.Language').Sql = new Y.CN.Model.Language({
        name: 'sql', aliases: ['sql']
    });

    Y.namespace('CN.Language').TAP = new Y.CN.Model.Language({
        name: 'tap', aliases: ['tap']
    });

    Y.namespace('CN.Language').TypeScript = new Y.CN.Model.Language({
        name: 'typescript', aliases: ['typescript', 'ts']
    });

    Y.namespace('CN.Language').Vb = new Y.CN.Model.Language({
        name: 'vb', aliases: ['vb', 'vbnet']
    });

    Y.namespace('CN.Language').Xml = new Y.CN.Model.Language({
        name: 'xml', aliases: ['xml', 'xhtml', 'xslt', 'html', 'plist']
    });

    var langs = = new Y.CN.Model.List.Language();

    langs.add(Y.CN.Language.AS3);
    langs.add(Y.CN.Language.AppleScript);
    langs.add(Y.CN.Language.Bash);
    langs.add(Y.CN.Language.CSharp);
    langs.add(Y.CN.Language.ColdFusion);
    langs.add(Y.CN.Language.Cpp);
    langs.add(Y.CN.Language.Css);
    langs.add(Y.CN.Language.Delphi);
    langs.add(Y.CN.Language.Diff);
    langs.add(Y.CN.Language.Erlang);
    langs.add(Y.CN.Language.Groovy);
    langs.add(Y.CN.Language.Haxe);
    langs.add(Y.CN.Language.JScript);
    langs.add(Y.CN.Language.Java);
    langs.add(Y.CN.Language.JavaFX);
    langs.add(Y.CN.Language.Perl);
    langs.add(Y.CN.Language.Php);
    langs.add(Y.CN.Language.Plain);
    langs.add(Y.CN.Language.PowerShell);
    langs.add(Y.CN.Language.Python);
    langs.add(Y.CN.Language.Ruby);
    langs.add(Y.CN.Language.Sass);
    langs.add(Y.CN.Language.Scala);
    langs.add(Y.CN.Language.Sql);
    langs.add(Y.CN.Language.TAP);
    langs.add(Y.CN.Language.TypeScript);
    langs.add(Y.CN.Language.Vb);
    langs.add(Y.CN.Language.Xml);

    Y.namespace('CN').LanguageList = langs;

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
                value: Y.CN.LanguageList
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
    }, {
        ATTRS: {
            languages: {
                value: Y.CN.LanguageList
            }
        }
    });

}, '1.0', {
    requires: [
        'base'
    ]
});



YUI.add('cn-syntax-highlighter', function (Y) {

    Y.namespace('CN').SyntaxHighlighter = Y.Base.create('cn-syntax-highlighter', Y.Base, [], {
        process: function (node) {
            var lang = node.getAttribute('lang');
        }
    }, {
        ATTRS: {
            languages: {
                value: Y.CN.LanguageList
            }
        }
    });

}, '1.0', {
    requires: [
        'base'
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
