Cockpit Modules
===============

Note: This is initial internal cockpit developer documentation.
Broader development information will come later.

The cockpit web UI is compromised of various components called modules.
Each module can provide one or more pieces of the UI, usually pages.

Each module is a subdirectory of cockpit in the $XDG_DATA_DIRS and
$XDG_DATA_HOME directories. That means, by default the following
directories are seacrhed for modules:

    ~/.local/share/cockpit
    /usr/local/share/cockpit
    /usr/share/cockpit

Each module directory must have a manifest.json file contained in it.
This file contains information about what the module provides.

     /usr/share/cockpit
            my-module
                manifest.json
                my-module.html
                my-module.js

The name of a module is the name of the subdirectory. Modules are also
refered to by their checksums, see below.

If multiple locations have modules with the same name, then the one
in the location toward the top of the above list comes first. That is,
$XDG_DATA_HOME modules get loaded first, and the order of directories
in $XDG_DATA_DIRS is respected.


Manifest
--------

Each module has a manifest.json file. It is a JSON object file.
Not yet documented, some notes:

 * "version": informational only, checksums are used to compare modules
 * "scripts": array of scripts to load for the module
 * "html": array of html snippets to load for the module
 ...


Development
-----------

Place modules in your ~/.local/share/cockpit directory (or appropriate
$XDG_DATA_HOME location) that you would like to modify and develop.

System installed modules should not be changed while Cockpit is running.


Checksums
---------

Modules in system directories (ie: not the user's home directory) have
all their files and filenames run through a checksum. This checksum
allows cockpit to identify when two modules are identical and enables
caching in the browser.


Loading
-------

See doc/protocol.md for how module resources are loaded.

Environment
-----------

Internally the module data is transferred to the javascript side via
a JSON block, called the environment. The environment contains
information about the login, cockpit itself, and the modules installed.

Before login the environment contains the following information, and
is included in HTML data served with the '/' request.

{
    "localhost": {
        "hostname": "host.example.com",
        "languages": { "de" : { "name": "German" } },
    }
}

Once the user logs in, the environment is expanded to the following,
and is returned from the '/login' request as JSON.

{
    "user": "scruffy",
    "name": "Scruffy the Janitor",
    "localhost": {
        "hostname": "host.example.com",
        "languages": { "de" : { "name": "German" } },
        "version": "0.10",
        "build-info": "Built at ...",
        "modules": { ... }
    }
}
