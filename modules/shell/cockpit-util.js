/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2013 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

var cockpit = cockpit || { };

// Used for escaping things in HTML elements and attributes
function cockpit_esc(str) {
    if (str === null || str === undefined)
        return "";
    var pre = document.createElement('pre');
    var text = document.createTextNode(str);
    pre.appendChild(text);
    return pre.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Used for escaping things in HTML id attribute values
//
// http://www.w3.org/TR/html5/global-attributes.html#the-id-attribute
function cockpit_esc_id_attr(str) {
    return cockpit_esc(str).replace(/ /g, "&#20;").replace(/\x09/g, "&#09;").replace(/\x0a/g, "&#0a;").replace(/\x0c/g, "&#0c;").replace(/\x0d/g, "&#0d;");
}

function cockpit_debug(str) {
    console.debug("DEBUG: " + str);
}

/*
 * Byte formatting
 *
 * cockpit.format_bytes(number, [factor])
 * @number: a normal number
 * @factor: optional, either 1000, 1024 or a string suffix
 *
 * Formats bytes into a displayable string and suffix, such as
 * 'kB' or 'MiB'. Returns an array of the formatted number and
 * the suffix.
 *
 * If specifying 1000 or 1024 these will be used as the factors
 * to choose an appropriate suffix. By default the factor is
 * 1000.
 *
 * You can pass the suffix into the second argument in which
 * case the number will be formatted with that specific suffix.
 *
 * If the number is less than the factor or an unknown suffix
 * was passed in, then the formatted number is returned without
 * a suffix.
 *
 * Returns an array of [formatted_number, suffix], unless no
 * suffix is returned.
 *
 * Examples:
 *    cockpit.format_bytes(1000000).join(" ");
 *    cockpit.format_bytes(1000000, 1024).join(" ");
 *    cockpit.format_bytes(1000000, "kB").join(" ");
 */
(function(cockpit) {

var suffixes = {
    1000: [ null, "kB", "MB", "GB", "TB", "PB", "EB", "ZB" ],
    1024: [ null, "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB" ]
};

cockpit.format_bytes = function format_bytes(number, factor) {
    var quotient;
    var suffix = null;

    if (factor === undefined)
        factor = 1000;

    /* Find that factor string */
    if (typeof (factor) === "string") {
        for (var key in suffixes) {
            for (var x = 0; x < suffixes[key].length; x++) {
                if (factor == suffixes[key][x]) {
                    number = number / Math.pow(key, x);
                    suffix = factor;
                    break;
                }
            }
            if (suffix)
                break;
        }

    /* @factor is a number */
    } else if (factor in suffixes) {
        var divisor = 1;
        for (var i = 0; i < suffixes[factor].length; i++) {
            quotient = number / divisor;
            if (quotient < factor) {
                number = quotient;
                suffix = suffixes[factor][i];
                break;
            }
            divisor *= factor;
        }
    }

    if (!suffix)
        return [number.toString()];

    /* non-zero values should never appear zero */
    if (number > 0 && number < 0.1)
        number = 0.1;

    if (number === 0)
        return [number.toString(), suffix];
    else
        return [number.toFixed(1), suffix];
};

})(cockpit);

function cockpit_format_bytes(num_bytes) {
    return cockpit.format_bytes(num_bytes, 1000).join(" ");
}

function cockpit_format_bytes_pow2(num_bytes) {
    return cockpit.format_bytes(num_bytes, 1024).join(" ");
}


function cockpit_format_delay(d) {
    var seconds = Math.round(d/1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    seconds = seconds - minutes*60;
    minutes = minutes - hours*60;

    var s = seconds + " seconds";
    if (minutes > 0)
        s = minutes + " minutes, " + s;
    if (hours > 0)
        s = hours + " hours, " + s;
    return s;
}

function cockpit_add_thousands_separators(number)
{
    /* Translators: Thousands-separator ("," in en_US, "." in da_DK and so on) */
    var separator_char = C_("thousands-separator", ",");
    number += '';
    var x = number.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
	x1 = x1.replace(rgx, "$1" + separator_char + "$2");
    }
    return x1 + x2;
}

function cockpit_format_bytes_long(num_bytes) {
    var with_unit = cockpit_format_bytes(num_bytes);
    var with_pow2_unit = cockpit_format_bytes_pow2(num_bytes);
    var with_sep = cockpit_add_thousands_separators(num_bytes);
    /* Translators: Used in "42.5 kB (42,399 bytes)" */
    return with_unit + " (" + with_pow2_unit + ", " + with_sep + " " + C_("format-bytes", "bytes") + ")";
}

function cockpit_format_bytes_per_sec(num_bytes) {
    return cockpit_format_bytes(num_bytes) + "/s";
}

function cockpit_format_temperature(kelvin) {
    var celcius = kelvin - 273.15;
    var fahrenheit = 9.0 * celcius / 5.0 + 32.0;
    return celcius.toFixed(1) + "° C / " + fahrenheit.toFixed(1) + "° F";
}

// ----------------------------------------------------------------------------------------------------

function cockpit_array_remove(array, value)
{
    /* not exactly idiomatic */
    array.splice(array.indexOf(value), 1);
}

// ----------------------------------------------------------------------------------------------------

function cockpit_diff_sorted_lists(existing, wanted, added, removed, unchanged)
{
    var n = 0, m = 0;

    existing.sort();
    wanted.sort();

    while (n < existing.length && m < wanted.length) {
        if (existing[n] < wanted[m]) {
            if (removed)
                removed.push(existing[n]);
            n++;
        } else if (existing[n] > wanted[m]) {
            if (added)
                added.push(wanted[n]);
            m++;
        } else {
            if (unchanged)
                unchanged.push(existing[n]);
            n++;
            m++;
        }
    }

    while (n < existing.length) {
        if (removed)
            removed.push(existing[n]);
        n++;
    }

    while (m < wanted.length) {
        if (added)
            added.push(wanted[m]);
        m++;
    }
}

function cockpit_settings_get(key) {
    var ret = null;
    if (localStorage) {
        ret = localStorage.getItem(key);
    }
    return ret;
}

function cockpit_settings_set(key, value) {
    if (localStorage) {
        if (value)
            localStorage.setItem(key, value);
        else
            localStorage.removeItem(key);
    }
}

function cockpit_settings_get_json(key) {
    var val = cockpit_settings_get (key);
    if (val)
        val = JSON.parse (val);
    return val;
}

function cockpit_settings_set_json(key, val) {
    cockpit_settings_set (key, JSON.stringify (val));
}

function _is_non_blank(str) {
    return str.search(/\S/) != -1;
}

function cockpit_make_set (array) {
    var s = { };
    for (var i = 0; i < array.length; i++)
        s[array[i]] = true;
    return s;
}

function cockpit_find_in_array (array, elt) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == elt)
            return true;
    }
    return false;
}

function cockpit_action_btn (func, spec) {
    var direct_btn, indirect_btns, btn;
    var direct_action, disabled;

    direct_btn =
        $('<button>', { 'class': 'btn btn-default' }).text("");

    indirect_btns = [ ];
    disabled = [ ];
    spec.forEach (function (s, i) {
        indirect_btns[i] = $('<li>', { 'class': 'presentation' }).
            append(
                $('<a>', { 'role': 'menuitem',
                           'on': { 'click': function () {
                                              if (!disabled[i])
                                                  func (s.action);
                                            }
                                 }
                         }).append(
                             $('<span>', { 'class': s.danger? 'text-danger' : '' }).text(s.title)));
        disabled[i] = false;
    });

    btn =
        $('<div>', { 'class': 'btn-group' }).append(
            direct_btn,
            $('<button>', { 'class': 'btn btn-default dropdown-toggle',
                             'data-toggle': 'dropdown'
                          }).
                append(
                    $('<span>', { 'class': 'caret' })),
            $('<ul>', { 'class': 'dropdown-menu',
                        'style': 'right:0px;left:auto;min-width:0;text-align:left',
                        'role': 'menu'
                      }).
                append(indirect_btns));

    function select (a) {
        spec.forEach(function (s, i) {
            if (s.action == a || (a == 'default' && s.is_default)) {
                direct_action = s.action;
                direct_btn.text(s.title);
                direct_btn.toggleClass('btn-danger', s.danger);
                direct_btn.toggleClass('btn-default', !s.danger);
                direct_btn.off('click');
                direct_btn.on('click', function () { func(s.action); });
                direct_btn.prop('disabled', disabled[i]);
            }
        });
    }

    function enable (a, val) {
        if (direct_action == a)
            direct_btn.prop('disabled', !val);
        spec.forEach(function (s, i) {
            if (s.action == a) {
                disabled[i] = !val;
                indirect_btns[i].toggleClass('disabled', !val);
            }
        });
    }

    select ('default');

    $.data(btn[0], 'cockpit-action-btn-funcs', { select: select, enable: enable });
    return btn;
}

function cockpit_action_btn_select (btn, action) {
    $.data(btn[0], 'cockpit-action-btn-funcs').select(action);
}

function cockpit_action_btn_enable (btn, action, val) {
    $.data(btn[0], 'cockpit-action-btn-funcs').enable(action, val);
}

function cockpit_select_btn (func, spec) {
    var direct_btn, indirect_btns, btn;
    var selected_choice;

    direct_btn =
        $('<button>', { 'class': 'btn btn-default dropdown-toggle',
                        'data-toggle': 'dropdown'
                      }).append(
            $('<span>'),
            $('<span>', { 'style': 'margin-left:8px', 'class': 'caret' }));


    indirect_btns = [ ];
    spec.forEach (function (s, i) {
        indirect_btns[i] = $('<li>', { 'class': 'presentation' }).
            append(
                $('<a>', { 'role': 'menuitem',
                           'on': { 'click':
                                   function () {
                                       direct_btn.find(':first-child').text(s.title);
                                       selected_choice = s.choice;
                                       func (s.choice);
                                   }
                                 }
                         }).append(
                             $('<span>').text(s.title)));
    });

    btn =
        $('<div>', { 'class': 'dropdown' }).append(
            direct_btn,
            $('<ul>', { 'class': 'dropdown-menu',
                        'style': 'right:0px;left:auto;min-width:0;text-align:left',
                        'role': 'menu'
                      }).
                append(indirect_btns));

    function select (a) {
        spec.forEach(function (s, i) {
            if (s.choice == a || (a == 'default' && s.is_default)) {
                direct_btn.find(':first-child').text(s.title);
                selected_choice = s.choice;
            }
        });
    }

    function selected () {
        return selected_choice;
    }

    select ('default');

    $.data(btn[0], 'cockpit-select-btn-funcs', { select: select, selected: selected });
    return btn;
}

function cockpit_select_btn_select (btn, choice) {
    $.data(btn[0], 'cockpit-select-btn-funcs').select(choice);
}

function cockpit_select_btn_selected (btn) {
    return $.data(btn[0], 'cockpit-select-btn-funcs').selected();
}

function cockpit_parse_bytes (str, def) {
    var factor = { '': 1,
                   'k': 1024,
                   'm': 1024*1024,
                   'M': 1024*1024,
                   'g': 1024*1024*1024,
                   'G': 1024*1024*1024
                 };

    if (str.trim() === "")
        return def;

    var match = str.match('^([0-9.]+)([^0-9.]*)$');
    var val = parseFloat(str);
    var suffix;
    if (!isNaN(val) && match) {
        suffix = match[2].trim();
        if (factor[suffix])
            return val*factor[suffix];
    }
    return NaN;
}

(function (cockpit) {

cockpit.client_error_description = client_error_description;
function client_error_description (error) {
    if (error == "terminated")
        return _("Your session has been terminated.");
    else if (error == "no-session")
        return _("Your session has expired.  Please log in again.");
    else if (error == "not-authorized")
        return _("Login failed");
    else if (error == "unknown-hostkey")
        return _("Untrusted host");
    else if (error == "internal-error")
        return _("Internal error");
    else if (error == "timeout")
        return _("Connection has timed out.");
    else if (error == "no-agent")
        return _("The management agent is not installed.");
    else
        return _("Server has closed the connection.");
}

cockpit.util = cockpit.util || { };

/* The functions cockpit_quote_words and cockpit_parse_words implement
 * a simple shell-like quoting syntax.  They are used when letting the
 * user edit a sequence of words as a single string.
 *
 * When parsing, words are separated by whitespace.  Single and double
 * quotes can be used to protect a sequence of characters that
 * contains whitespace or the other quote character.  A backslash can
 * be used to protect any character.  Quotes can appear in the middle
 * of a word.
 */

cockpit.util.parse_words = parse_words;
function parse_words(text) {
    var words = [ ];
    var next;

    function is_whitespace(c) {
        return c == ' ';
    }

    function skip_whitespace() {
        while (next < text.length && is_whitespace(text[next]))
            next++;
    }

    function parse_word() {
        var word = "";
        var quote_char = null;

        while (next < text.length) {
            if (text[next] == '\\') {
                next++;
                if (next < text.length) {
                    word += text[next];
                }
            } else if (text[next] == quote_char) {
                quote_char = null;
            } else if (quote_char) {
                word += text[next];
            } else if (text[next] == '"' || text[next] == "'") {
                quote_char = text[next];
            } else if (is_whitespace(text[next])) {
                break;
            } else
                word += text[next];
            next++;
        }
        return word;
    }

    next = 0;
    skip_whitespace();
    while (next < text.length) {
        words.push(parse_word());
        skip_whitespace();
    }

    return words;
}

cockpit.util.quote_words = quote_words;
function quote_words(words) {
    var text;

    function is_whitespace(c) {
        return c == ' ';
    }

    function quote(word) {
        var text = "";
        var quote_char = "";
        var i;
        for (i = 0; i < word.length; i++) {
            if (word[i] == '\\' || word[i] == quote_char)
                text += '\\';
            else if (quote_char === "") {
                if (word[i] == "'" || is_whitespace(word[i]))
                    quote_char = '"';
                else if (word[i] == '"')
                    quote_char = "'";
            }
            text += word[i];
        }

        return quote_char + text + quote_char;
    }

    return words.map(quote).join(' ');
}

/* - cache = cockpit.util.make_resource_cache()
 * - resource = cache.get(key, create)
 * - resource.release()
 *
 * Create a cache for objects that are expensive to create.  Calling
 * 'get' will either return an existing object that matches 'key' or
 * execute 'create()' to create a new one.
 *
 * You need to call 'release' on the returned object once you are done
 * with it.  After the last user has released an object, 'close' will
 * be called on that object after a delay.
 */
cockpit.util.make_resource_cache = make_resource_cache;
function make_resource_cache() {
    var resources = { };

    function get(key, create) {
        var handle;

        handle = resources[key];

        if (!handle) {
            dbus_debug("Creating %s", key);
            handle = { refcount: 1, resource: create() };
            resources[key] = handle;

            handle.resource.release = function() {
                dbus_debug("Releasing %s", key);
                // Only really release it after a delay
                setTimeout(function () {
                    if (!handle.refcount) {
                        console.warn("Releasing unreffed resource");
                    } else {
                        handle.refcount -= 1;
                        if (handle.refcount === 0) {
                            delete resources[key];
                            dbus_debug("Closing %s", key);
                            handle.resource.close("unused");
                        }
                    }
                }, 10000);
            };
        } else {
            dbus_debug("Getting %s", key);
            handle.refcount += 1;
        }

        return handle.resource;
    }

    return { get: get };
}

})(cockpit);
