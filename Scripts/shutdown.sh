echo \"Stopping the server...\"
echo \"Stopping index.js...\"
pkill --signal SIGINT myApp
echo \"Clear content of log file\"
cat /dev/null > output.log
echo \"DONE\"