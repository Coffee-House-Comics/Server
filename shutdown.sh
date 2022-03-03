echo \"Stopping the server...\"
echo \"Stopping app.js...\"
pkill --signal SIGINT myApp
echo \"Stopping server.js...\"
pkill --signal SIGINT myServer
echo \"Clear content of log file\"
cat /dev/null > output.log
echo \"DONE\"