echo \"Stopping the server...\"
pm2 stop ecosystem.config.js 
echo \"Clear content of log file\"
cat /dev/null > output.log
echo \"DONE\"