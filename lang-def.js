/**
 * Language definition module.
 *
 * @module language
 */
YUI.add('cn-language', function (Y) {

    /**
     * Abstract language.
     *
     * @class Base
     * @namespace CN.Lang
     */
    Y.namespace('CN.Lang').Base = Y.Base.create('cn-language-base', Y.Base, [], {}, {
        ATTRS: {
            /**
             * @attribute caseSensitive
             * @type boolean
             * @default false
             */
            caseSensitive: {
                value: false,
                validator: Y.Lang.isBoolean
            }
        }
    });

}, '1.0', {});