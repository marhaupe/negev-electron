#/bin/sh

if [[ $1 = "record" ]]
then
  terminalizer record -c config.yml demo
elif [[ $1 = "render" ]]
then
  terminalizer render -o demo demo
fi