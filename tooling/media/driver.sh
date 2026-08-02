#!/bin/bash
# typed-demo driver: reads a .cmds file; lines starting with '# ' are narration
# (printed, not executed), every other non-empty line is typed at readable
# speed and then executed for real with bash -c. Nothing is faked: all
# command output in the recording is the live output of the command.
CMDS="$1"
WORKDIR="$2"
cd "$WORKDIR" || exit 1
export BARKPARK_MANIFEST=/tmp/bp-manifest.json
PROMPT=$'\e[1;36m\xe2\x9d\xaf\e[0m '
while IFS= read -r line; do
  if [ -z "$line" ]; then sleep 0.4; continue; fi
  case "$line" in
    "# "*)
      printf '\e[2;37m%s\e[0m\n' "$line"
      sleep 1.2
      ;;
    *)
      printf '%s' "$PROMPT"
      i=0
      while [ $i -lt ${#line} ]; do
        printf '%s' "${line:$i:1}"
        sleep 0.022
        i=$((i+1))
      done
      printf '\n'
      sleep 0.3
      bash -c "$line"
      sleep 1.0
      ;;
  esac
done < "$CMDS"
sleep 1.5
