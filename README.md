# Lf for VSCode


This is an extension that allows you to open [lf](https://github.com/gokcehan/lf) by gokcehan in your VSCode instance.


## Commands and Settings

```jsonc
{
  "command": "lf.open", // open the current file in lf
  "command": "lf.focus", // focus the lf window, if none exists open the current file

  "settings": {
    "lf.command": "lf",
    "lf.focusCommand": "$lf -remote \"send $id select ${file}\"",
    "lf.openInEditor": false
  }
}
```

## WSL

I have some special configurations in WSL to make it work with the windows / linux paths.

```bash
# custom select with filepath check
cmd sel ${{
    if [ "$1" ]; then
        path="$1"
        if [[ "$path" =~ ^[a-zA-Z]: ]]; then
            path=$(wslpath "$path")
        fi
        lf -remote "send $id select '$path'"
    fi
}}
```

```jsonc
// this should normally check whether a windows path is given and then converts it with wslpath
"lf.command": "p=\"${file}\"; [[ \"$p\" =~ ^[a-zA-Z]: ]] && p=$(wslpath \"$p\") && lf $p || lf $p",

// custom select with filepath check
"lf.focusCommand": ":sel \"${file}\"",
```

This is what I have as an `open` command in `lf`.

```bash
code-cli workbench.action.toggleMaximizedPanel
code-cli workbench.action.togglePanel
path="$([ "$WSL" ] && wslpath -w "$fx" || echo "$fx")"
code-cli vscode.open "\"$path\""
```

And here the `code-cli`, it uses the `Remote Control` extension by Elio Struyf.
I never have more than 3 vscode instances open so this sends to all of them basically.

```bash
#!/usr/bin/env sh

send() {
    echo "$1" | websocat ws://localhost:$2 >/dev/null 2>&1
}

main() {
    if [ -z "$2" ]; then
        cmd="{ \"command\": \"$1\" }"
    else
        cmd="{ \"command\": \"$1\", \"args\": [ $2 ] }"
    fi
    send "$cmd" 13370 &
    send "$cmd" 13371 &
    send "$cmd" 13372 &
    wait
}
main $@
```

And here the respective config in `settings.json`.

```jsonc
"remoteControl.enable": true,
"remoteControl.host": "localhost",
"remoteControl.port": 13370,
"remoteControl.fallbacks": [
    13371,
    13372,
    13373,
    13374,
    13375,
    13376,
],
"remoteControl.onlyWhenInFocus": true,
```


## Acknowledgements

This extension is a fork of the original [lazygit-for-vscode](https://github.com/Chaitanya-Shahare/lazygit-for-vscode) repository by Chaitanya Shahare.
Kudos to him for the template <3.

Also obviously thanks to gokcehan for creating lf <3 you da real MVP.
